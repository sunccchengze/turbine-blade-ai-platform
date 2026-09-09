#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Procedurally build a high-detail, cutaway axial gas-turbine scene in Blender.

This file is intentionally self-contained: it creates the materials, assembly
hierarchy, geometry, lights, cameras, and render settings without depending on
external add-ons or downloaded assets.  It targets Blender 3.6 LTS and newer.

Examples
--------
Interactive: open Blender > Scripting > Open this file > Run Script.

Headless build::

    blender --background --python blender/generate_gas_turbine.py -- \\
      --output blender/output/axial_gas_turbine_cutaway.blend

Headless build plus a hero render::

    blender --background --python blender/generate_gas_turbine.py -- \\
      --output blender/output/axial_gas_turbine_cutaway.blend \\
      --render blender/output/axial_gas_turbine_hero.png

Use ``--quick`` for a lighter scene while blocking a shot.  The default has
full blade-row density and detail suitable for a close cutaway presentation.

The assembly represents a physically informed, generic two-spool axial engine
core.  It is a visualization model, not a dimensional or manufacturing twin of
a named OEM engine.  Exact part geometry, cooling circuits, tolerances and
material schedules require the relevant engine's controlled drawings and
configuration data.
"""

from __future__ import annotations

import argparse
import math
import os
import sys
import time
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

try:
    import bpy
    from mathutils import Vector
except ImportError as exc:  # Keeps an accidental normal-Python launch clear.
    raise RuntimeError(
        "This generator must run inside Blender's Python interpreter. "
        "Use Blender's Scripting workspace or `blender --python ...`."
    ) from exc


TAU = math.tau
# The removed 120 degree sector faces the hero camera on the -Y side.
CUTAWAY_START = math.radians(250.0)
CUTAWAY_SWEEP = math.radians(240.0)

Color = Tuple[float, float, float, float]
Point = Tuple[float, float, float]


# ---------------------------------------------------------------------------
# CLI and scene hygiene
# ---------------------------------------------------------------------------

def parse_args() -> argparse.Namespace:
    """Parse only arguments placed after Blender's conventional ``--``."""
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        default=str(Path(__file__).resolve().parent / "output" / "axial_gas_turbine_cutaway.blend"),
        help="Path for the generated .blend file.",
    )
    parser.add_argument(
        "--render",
        default="",
        help="Optional PNG/EXR path for a hero still rendered after saving.",
    )
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Use lower row densities and lower sampling for fast scene blocking.",
    )
    parser.add_argument(
        "--engine",
        default="CYCLES",
        choices=("CYCLES", "BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"),
        help="Renderer to select; unsupported values fall back to Cycles.",
    )
    parser.add_argument(
        "--no-floor",
        action="store_true",
        help="Do not add the studio floor and background.",
    )
    parser.add_argument(
        "--labels",
        action="store_true",
        help="Add section labels below the model (off by default for a clean render).",
    )
    parser.add_argument(
        "--resolution-scale",
        type=int,
        default=100,
        choices=range(25, 201),
        metavar="25..200",
        help="Render resolution percentage; default is 100.",
    )

    argv = sys.argv
    return parser.parse_args(argv[argv.index("--") + 1 :] if "--" in argv else [])


def remove_existing_scene() -> None:
    """Remove all user-visible objects and stale generated datablocks."""
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)
    for mesh in list(bpy.data.meshes):
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)
    for curve in list(bpy.data.curves):
        if curve.users == 0:
            bpy.data.curves.remove(curve)
    for material in list(bpy.data.materials):
        if material.users == 0:
            bpy.data.materials.remove(material)
    # Mesh primitive operators link new objects to the active LayerCollection.
    # After deleting a pre-existing scene collection, explicitly reset it to
    # the scene root so headless and UI execution behave the same way.
    try:
        bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection
    except Exception:
        pass


def get_collection(name: str, parent: Optional[bpy.types.Collection] = None) -> bpy.types.Collection:
    """Create a collection once and link it beneath ``parent`` if requested."""
    collection = bpy.data.collections.get(name)
    if collection is None:
        collection = bpy.data.collections.new(name)
    if parent is None:
        parent = bpy.context.scene.collection
    if not any(child == collection for child in parent.children):
        parent.children.link(collection)
    return collection


def collection_tree() -> Dict[str, bpy.types.Collection]:
    root = get_collection("GAS TURBINE — CUTAWAY ASSEMBLY")
    names = (
        ("00 • Environment", root),
        ("01 • Inlet & Front Frame", root),
        ("02 • Low-Pressure Compressor", root),
        ("03 • High-Pressure Compressor", root),
        ("04 • Diffuser & Annular Combustor", root),
        ("05 • High-Pressure Turbine", root),
        ("06 • Low-Pressure Turbine & Exhaust", root),
        ("07 • Shafts, Bearings & Seals", root),
        ("08 • External Systems & Fasteners", root),
        ("09 • Cutaway Casing", root),
        ("10 • Cameras & Lights", root),
        ("11 • Optional Labels", root),
    )
    return {name: get_collection(name, parent) for name, parent in names}


def move_to_collection(obj: bpy.types.Object, collection: bpy.types.Collection) -> bpy.types.Object:
    for old_collection in list(obj.users_collection):
        old_collection.objects.unlink(obj)
    collection.objects.link(obj)
    return obj


def assign_material(obj: bpy.types.Object, material: Optional[bpy.types.Material]) -> None:
    if material is None or not hasattr(obj.data, "materials"):
        return
    obj.data.materials.clear()
    obj.data.materials.append(material)


def smooth_mesh(obj: bpy.types.Object) -> None:
    if obj.type == "MESH":
        for polygon in obj.data.polygons:
            polygon.use_smooth = True


def add_bevel(obj: bpy.types.Object, width: float, segments: int = 2) -> None:
    if width <= 0.0 or obj.type != "MESH":
        return
    modifier = obj.modifiers.new("Micro edge radius", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"


def tag(obj: bpy.types.Object, component: str, stage: str = "") -> bpy.types.Object:
    obj["component"] = component
    if stage:
        obj["station"] = stage
    return obj


# ---------------------------------------------------------------------------
# Materials
# ---------------------------------------------------------------------------

def socket(node: bpy.types.Node, *names: str):
    for name in names:
        value = node.inputs.get(name)
        if value is not None:
            return value
    return None


def principled_material(
    name: str,
    color: Color,
    metallic: float,
    roughness: float,
    *,
    noise: float = 0.0,
    emission: Optional[Color] = None,
    emission_strength: float = 0.0,
    alpha: float = 1.0,
) -> bpy.types.Material:
    """Create a PBR material with an optional subtle procedural surface grain."""
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = (color[0], color[1], color[2], alpha)
    material.metallic = metallic
    material.roughness = roughness
    # Transparency API names changed between Blender 3.x and 4.x.  Only touch
    # properties exposed by the running version so this remains LTS-friendly.
    if alpha < 1.0 and hasattr(material, "surface_render_method"):
        material.surface_render_method = "DITHERED"
    if alpha < 1.0 and hasattr(material, "blend_method"):
        material.blend_method = "BLEND"
        if hasattr(material, "use_screen_refraction"):
            material.use_screen_refraction = True
    if hasattr(material, "use_transparency_overlap"):
        material.use_transparency_overlap = False

    nodes = material.node_tree.nodes
    links = material.node_tree.links
    for node in list(nodes):
        nodes.remove(node)
    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (520, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.name = "Engine PBR"
    bsdf.label = "Engine PBR"
    bsdf.location = (260, 0)

    base = socket(bsdf, "Base Color")
    if base:
        base.default_value = color
    metal = socket(bsdf, "Metallic")
    if metal:
        metal.default_value = metallic
    rough = socket(bsdf, "Roughness")
    if rough:
        rough.default_value = roughness
    alpha_socket = socket(bsdf, "Alpha")
    if alpha_socket:
        alpha_socket.default_value = alpha
    ior = socket(bsdf, "IOR")
    if ior:
        ior.default_value = 1.45
    coat = socket(bsdf, "Coat Weight", "Clearcoat")
    if coat:
        coat.default_value = 0.12 if metallic > 0.5 else 0.04

    if emission is not None:
        emission_color = socket(bsdf, "Emission Color", "Emission")
        if emission_color:
            emission_color.default_value = emission
        emission_input = socket(bsdf, "Emission Strength")
        if emission_input:
            emission_input.default_value = emission_strength

    if noise > 0.0:
        texture = nodes.new("ShaderNodeTexNoise")
        texture.location = (-580, 0)
        texture.inputs["Scale"].default_value = 5.0 / max(noise, 0.001)
        texture.inputs["Detail"].default_value = 3.0
        texture.inputs["Roughness"].default_value = 0.62
        ramp = nodes.new("ShaderNodeValToRGB")
        ramp.location = (-340, 0)
        ramp.color_ramp.elements[0].position = 0.31
        ramp.color_ramp.elements[1].position = 0.72
        bump = nodes.new("ShaderNodeBump")
        bump.location = (40, -60)
        bump.inputs["Strength"].default_value = min(0.42, noise * 2.0)
        bump.inputs["Distance"].default_value = noise * 0.055
        links.new(texture.outputs["Fac"], ramp.inputs["Fac"])
        links.new(ramp.outputs["Color"], bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        if rough:
            links.new(ramp.outputs["Color"], rough)

    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return material


def make_materials() -> Dict[str, bpy.types.Material]:
    """Palette chosen for legibility under a neutral studio lighting rig."""
    return {
        "titanium": principled_material("Titanium compressor alloy", (0.31, 0.39, 0.45, 1), 0.86, 0.23, noise=0.045),
        "machined": principled_material("Machined steel", (0.16, 0.20, 0.22, 1), 0.92, 0.19, noise=0.025),
        "nickel": principled_material("Inconel hot section", (0.34, 0.21, 0.105, 1), 0.83, 0.27, noise=0.06),
        "coated": principled_material("Thermal-barrier coated blade", (0.50, 0.31, 0.105, 1), 0.72, 0.39, noise=0.09),
        "casing": principled_material("Cast nickel casing", (0.105, 0.125, 0.14, 1), 0.72, 0.38, noise=0.12),
        "liner": principled_material("Oxidised combustor liner", (0.22, 0.09, 0.035, 1), 0.72, 0.46, noise=0.15),
        "hot_liner": principled_material("Warm combustor liner", (0.38, 0.07, 0.012, 1), 0.60, 0.38, noise=0.13, emission=(1.0, 0.08, 0.005, 1), emission_strength=0.45),
        "ceramic": principled_material("Ceramic insulator", (0.76, 0.69, 0.56, 1), 0.04, 0.32, noise=0.03),
        "dark": principled_material("Carbon black / apertures", (0.006, 0.008, 0.010, 1), 0.12, 0.34, noise=0.02),
        "brass": principled_material("Fuel-system brass", (0.54, 0.25, 0.055, 1), 0.83, 0.25, noise=0.035),
        "copper": principled_material("Braided copper line", (0.45, 0.08, 0.018, 1), 0.82, 0.22, noise=0.05),
        "rubber": principled_material("High temperature elastomer", (0.012, 0.016, 0.019, 1), 0.05, 0.48, noise=0.05),
        "warning": principled_material("Inspection orange", (0.8, 0.07, 0.01, 1), 0.28, 0.27, noise=0.02),
        "glass": principled_material("Section window glass", (0.08, 0.26, 0.30, 1), 0.12, 0.12, alpha=0.24),
        "label": principled_material("Engraved labels", (0.72, 0.78, 0.76, 1), 0.45, 0.28),
        "floor": principled_material("Studio charcoal floor", (0.014, 0.018, 0.021, 1), 0.05, 0.27, noise=0.08),
    }


# ---------------------------------------------------------------------------
# Primitive geometry helpers
# ---------------------------------------------------------------------------

def mesh_object(
    name: str,
    vertices: Sequence[Point],
    faces: Sequence[Sequence[int]],
    collection: bpy.types.Collection,
    material: Optional[bpy.types.Material] = None,
    *,
    smooth: bool = False,
    bevel: float = 0.0,
) -> bpy.types.Object:
    mesh = bpy.data.meshes.new(name + " Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    assign_material(obj, material)
    if smooth:
        smooth_mesh(obj)
    if bevel:
        add_bevel(obj, bevel)
    return obj


def add_cylinder(
    name: str,
    radius: float,
    depth: float,
    location: Point,
    collection: bpy.types.Collection,
    material: Optional[bpy.types.Material] = None,
    *,
    vertices: int = 32,
    rotation: Point = (0.0, 0.0, 0.0),
    bevel: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=max(3, vertices),
        radius=radius,
        depth=depth,
        end_fill_type="NGON",
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    move_to_collection(obj, collection)
    assign_material(obj, material)
    smooth_mesh(obj)
    add_bevel(obj, bevel)
    return obj


def add_axial_cylinder(
    name: str,
    radius: float,
    length: float,
    x: float,
    collection: bpy.types.Collection,
    material: Optional[bpy.types.Material] = None,
    *,
    y: float = 0.0,
    z: float = 0.0,
    vertices: int = 32,
    bevel: float = 0.0,
) -> bpy.types.Object:
    return add_cylinder(
        name, radius, length, (x, y, z), collection, material,
        vertices=vertices, rotation=(0.0, math.pi / 2.0, 0.0), bevel=bevel,
    )


def add_cone(
    name: str,
    radius_left: float,
    radius_right: float,
    length: float,
    x: float,
    collection: bpy.types.Collection,
    material: Optional[bpy.types.Material] = None,
    *,
    y: float = 0.0,
    z: float = 0.0,
    vertices: int = 32,
    bevel: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cone_add(
        vertices=max(3, vertices),
        radius1=radius_left,
        radius2=radius_right,
        depth=length,
        location=(x, y, z),
        rotation=(0.0, math.pi / 2.0, 0.0),
    )
    obj = bpy.context.active_object
    obj.name = name
    move_to_collection(obj, collection)
    assign_material(obj, material)
    smooth_mesh(obj)
    add_bevel(obj, bevel)
    return obj


def add_uv_sphere(
    name: str,
    radius: float,
    location: Point,
    collection: bpy.types.Collection,
    material: Optional[bpy.types.Material] = None,
    *,
    segments: int = 24,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=max(8, segments // 2), radius=radius, location=location)
    obj = bpy.context.active_object
    obj.name = name
    move_to_collection(obj, collection)
    assign_material(obj, material)
    smooth_mesh(obj)
    return obj


def add_cube(
    name: str,
    size: Point,
    location: Point,
    collection: bpy.types.Collection,
    material: Optional[bpy.types.Material] = None,
    *,
    rotation: Point = (0.0, 0.0, 0.0),
    bevel: float = 0.0,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    obj.dimensions = size
    # Ensure dimensions are evaluated before a bevel modifier is added.  Make
    # selection explicit so an artist's previously selected object is never
    # accidentally transformed when this is run from the Scripting workspace.
    for selected in bpy.context.selected_objects:
        selected.select_set(False)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    move_to_collection(obj, collection)
    assign_material(obj, material)
    add_bevel(obj, bevel)
    return obj


def add_torus(
    name: str,
    major_radius: float,
    minor_radius: float,
    x: float,
    collection: bpy.types.Collection,
    material: Optional[bpy.types.Material] = None,
    *,
    major_segments: int = 64,
    minor_segments: int = 12,
    y: float = 0.0,
    z: float = 0.0,
    rotation: Point = (0.0, math.pi / 2.0, 0.0),
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=max(8, major_segments),
        minor_segments=max(4, minor_segments),
        location=(x, y, z),
        rotation=rotation,
    )
    obj = bpy.context.active_object
    obj.name = name
    move_to_collection(obj, collection)
    assign_material(obj, material)
    smooth_mesh(obj)
    return obj


def cylinder_between(
    name: str,
    start: Point,
    end: Point,
    radius: float,
    collection: bpy.types.Collection,
    material: Optional[bpy.types.Material] = None,
    *,
    vertices: int = 16,
    bevel: float = 0.0,
) -> bpy.types.Object:
    """Create a cylinder whose local Z axis spans ``start`` to ``end``."""
    start_v, end_v = Vector(start), Vector(end)
    delta = end_v - start_v
    length = delta.length
    if length < 1e-6:
        return add_uv_sphere(name, radius, start, collection, material, segments=vertices)
    obj = add_cylinder(name, radius, length, tuple((start_v + end_v) * 0.5), collection, material, vertices=vertices, bevel=bevel)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0.0, 0.0, 1.0)).rotation_difference(delta.normalized())
    return obj


def add_tube(
    name: str,
    points: Sequence[Point],
    radius: float,
    collection: bpy.types.Collection,
    material: Optional[bpy.types.Material] = None,
    *,
    resolution: int = 3,
) -> bpy.types.Object:
    """Make a lightweight pipe/wire using a bevelled poly spline."""
    curve = bpy.data.curves.new(name + " Curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = resolution
    curve.bevel_depth = radius
    curve.bevel_resolution = max(1, resolution)
    curve.resolution_u = max(1, resolution)
    spline = curve.splines.new("NURBS")
    spline.points.add(len(points) - 1)
    for point, co in zip(spline.points, points):
        point.co = (*co, 1.0)
    spline.order_u = min(3, len(points))
    spline.use_endpoint_u = True
    obj = bpy.data.objects.new(name, curve)
    collection.objects.link(obj)
    assign_material(obj, material)
    return obj


def add_annular_shell(
    name: str,
    x0: float,
    x1: float,
    inner0: float,
    outer0: float,
    collection: bpy.types.Collection,
    material: Optional[bpy.types.Material] = None,
    *,
    inner1: Optional[float] = None,
    outer1: Optional[float] = None,
    start: float = 0.0,
    sweep: float = TAU,
    segments: int = 64,
    bevel: float = 0.0,
) -> bpy.types.Object:
    """A solid annular frustum, optionally with a sector removed for cutaway."""
    inner1 = inner0 if inner1 is None else inner1
    outer1 = outer0 if outer1 is None else outer1
    segments = max(3, segments)
    closed = sweep >= TAU - 1e-4
    # Closed shells use wrapped faces rather than duplicated seam vertices, so
    # they remain a clean manifold if the artist later adds Solidify/Boolean.
    slice_count = segments if closed else segments + 1
    vertices: List[Point] = []
    for index in range(slice_count):
        angle = start + sweep * index / segments
        c, s = math.cos(angle), math.sin(angle)
        vertices.extend(((x0, inner0 * c, inner0 * s), (x0, outer0 * c, outer0 * s), (x1, inner1 * c, inner1 * s), (x1, outer1 * c, outer1 * s)))

    faces: List[Tuple[int, ...]] = []
    for index in range(segments):
        a = index * 4
        b = ((index + 1) % slice_count) * 4
        # Inner, outer, inlet and outlet surfaces.
        faces.extend(((a, b, b + 2, a + 2), (a + 1, a + 3, b + 3, b + 1), (a, a + 1, b + 1, b), (a + 2, b + 2, b + 3, a + 3)))
    if not closed:
        # Section faces make the metal wall read as a real cut, rather than a paper-thin shell.
        end = (slice_count - 1) * 4
        faces.extend(((0, 2, 3, 1), (end, end + 1, end + 3, end + 2)))
    return mesh_object(name, vertices, faces, collection, material, smooth=True, bevel=bevel)


def radial_point(x: float, radius: float, angle: float) -> Point:
    return (x, radius * math.cos(angle), radius * math.sin(angle))


def angle_in_cutaway_shell(index: int, count: int) -> float:
    return CUTAWAY_START + CUTAWAY_SWEEP * index / count


def instance_linked(
    source: bpy.types.Object,
    name: str,
    collection: bpy.types.Collection,
    *,
    rotation_x: float = 0.0,
) -> bpy.types.Object:
    obj = source.copy()
    obj.data = source.data
    obj.name = name
    obj.rotation_mode = "XYZ"
    obj.rotation_euler = (rotation_x, 0.0, 0.0)
    collection.objects.link(obj)
    return obj


# ---------------------------------------------------------------------------
# Blade, vane, seal, and fastener generators
# ---------------------------------------------------------------------------

def airfoil_mesh(
    name: str,
    x_center: float,
    root_radius: float,
    tip_radius: float,
    chord: float,
    stagger_deg: float,
    twist_deg: float,
    thickness: float,
    collection: bpy.types.Collection,
    material: bpy.types.Material,
    *,
    span_segments: int = 6,
    chord_segments: int = 12,
    sweep: float = 0.0,
    lean: float = 0.0,
) -> bpy.types.Object:
    """Create one closed, twisted blade at theta=0.

    The mesh is built in the X (axial) / Z (tangential) plane and extends
    radially along +Y.  Linked instances rotate it about global X to populate
    an axial blade row.  It is deliberately a manufacturable-looking blade
    volume rather than a flat card: pressure/suction surfaces, tip, root,
    leading and trailing edges are all closed.
    """
    span_segments = max(2, span_segments)
    chord_segments = max(5, chord_segments)
    vertices: List[Point] = []

    def cross_section(span_t: float, chord_t: float, side: float) -> Point:
        radius = root_radius + (tip_radius - root_radius) * span_t
        local_chord = chord * (1.0 - 0.14 * span_t)
        stagger = math.radians(stagger_deg + twist_deg * (span_t - 0.5))
        q = chord_t
        chord_axis = (q - 0.5) * local_chord
        # Mild parabolic camber gives both sides an airfoil-like reading.
        camber = local_chord * (0.042 + 0.008 * (1.0 - span_t)) * math.sin(math.pi * q)
        # Rounded leading edge and a thin but finite trailing edge.
        thickness_dist = thickness * (0.16 + 0.84 * math.sin(math.pi * q) ** 0.72) * (1.0 - 0.12 * span_t)
        base_x = x_center + chord_axis * math.cos(stagger) + sweep * (span_t - 0.5) + lean * (span_t - 0.5)
        base_t = chord_axis * math.sin(stagger) + camber
        normal_x = -math.sin(stagger)
        normal_t = math.cos(stagger)
        return (
            base_x + side * normal_x * thickness_dist * 0.5,
            radius,
            base_t + side * normal_t * thickness_dist * 0.5,
        )

    # First pressure side, then suction side.
    for side in (-1.0, 1.0):
        for j in range(span_segments + 1):
            span_t = j / span_segments
            for i in range(chord_segments + 1):
                vertices.append(cross_section(span_t, i / chord_segments, side))

    stride = (span_segments + 1) * (chord_segments + 1)
    row_stride = chord_segments + 1
    faces: List[Tuple[int, ...]] = []

    for side_index in range(2):
        offset = side_index * stride
        for j in range(span_segments):
            for i in range(chord_segments):
                a = offset + j * row_stride + i
                b = a + 1
                c = a + row_stride
                d = c + 1
                faces.append((a, c, d, b) if side_index == 0 else (a, b, d, c))

    # Join pressure and suction skins at root, tip, leading and trailing edges.
    for i in range(chord_segments):
        a = i
        b = i + 1
        c = stride + i
        d = stride + i + 1
        faces.append((a, b, d, c))
        a = span_segments * row_stride + i
        b = a + 1
        c = stride + a
        d = stride + b
        faces.append((a, c, d, b))
    for j in range(span_segments):
        a = j * row_stride
        b = (j + 1) * row_stride
        c = stride + a
        d = stride + b
        faces.append((a, c, d, b))
        a = j * row_stride + chord_segments
        b = (j + 1) * row_stride + chord_segments
        c = stride + a
        d = stride + b
        faces.append((a, b, d, c))

    # The closed airfoil mesh already has a finite leading/trailing volume.  Do
    # not add a bevel modifier here: hundreds of linked blade instances would
    # otherwise each evaluate one, which hurts interactive Blender performance.
    blade = mesh_object(name, vertices, faces, collection, material, smooth=True)
    tag(blade, "airfoil / blade mesh")
    return blade


def blade_row(
    name: str,
    x: float,
    root_radius: float,
    tip_radius: float,
    blade_count: int,
    chord: float,
    stagger_deg: float,
    twist_deg: float,
    thickness: float,
    collection: bpy.types.Collection,
    material: bpy.types.Material,
    *,
    row_kind: str,
    stage: str,
    phase: float = 0.0,
    quick: bool = False,
    sweep: float = 0.0,
    lean: float = 0.0,
) -> List[bpy.types.Object]:
    """Populate a linked, twisted rotor or stator airfoil row."""
    final_count = max(8, blade_count if not quick else int(blade_count * 0.58))
    base = airfoil_mesh(
        f"{name} — Blade master",
        x,
        root_radius,
        tip_radius,
        chord,
        stagger_deg,
        twist_deg,
        thickness,
        collection,
        material,
        span_segments=4 if quick else 7,
        chord_segments=8 if quick else 14,
        sweep=sweep,
        lean=lean,
    )
    blade_objects = [base]
    base.name = f"{name} — {row_kind} blade 001"
    base.rotation_mode = "XYZ"
    base.rotation_euler = (phase, 0.0, 0.0)
    tag(base, row_kind, stage)
    for blade_index in range(1, final_count):
        angle = phase + TAU * blade_index / final_count
        obj = instance_linked(base, f"{name} — {row_kind} blade {blade_index + 1:03d}", collection, rotation_x=angle)
        tag(obj, row_kind, stage)
        blade_objects.append(obj)
    return blade_objects


def blade_platform_ring(
    name: str,
    x: float,
    root_radius: float,
    thickness_x: float,
    collection: bpy.types.Collection,
    material: bpy.types.Material,
    *,
    inner_radius: float = 0.24,
    outer_margin: float = 0.07,
    cutaway: bool = False,
) -> bpy.types.Object:
    return add_annular_shell(
        name,
        x - thickness_x * 0.5,
        x + thickness_x * 0.5,
        inner_radius,
        root_radius + outer_margin,
        collection,
        material,
        start=CUTAWAY_START if cutaway else 0.0,
        sweep=CUTAWAY_SWEEP if cutaway else TAU,
        segments=48,
        bevel=0.003,
    )


def add_seal_teeth(
    prefix: str,
    x: float,
    root_radius: float,
    collection: bpy.types.Collection,
    material: bpy.types.Material,
    *,
    count: int = 5,
    spacing: float = 0.025,
    tooth_radius: float = 0.011,
) -> None:
    for tooth in range(count):
        add_torus(
            f"{prefix} — labyrinth tooth {tooth + 1:02d}",
            root_radius,
            tooth_radius,
            x + (tooth - (count - 1) * 0.5) * spacing,
            collection,
            material,
            major_segments=48,
            minor_segments=8,
        )


def add_turbine_tip_shrouds(
    prefix: str,
    x: float,
    tip_radius: float,
    blade_count: int,
    chord: float,
    collection: bpy.types.Collection,
    material: bpy.types.Material,
    *,
    phase: float,
    quick: bool,
) -> None:
    """Small segmented tip shrouds make the turbine rows read as a real hot section."""
    count = max(8, blade_count if not quick else int(blade_count * 0.58))
    # Put the cube vertices in world-like coordinates while keeping its object
    # origin at (0, 0, 0).  Linked copies can then rotate around the engine axis,
    # rather than merely spinning in place at the first blade location.
    base = add_cube(
        f"{prefix} — tip shroud master",
        (chord * 0.26, 0.045, 0.105),
        (x + chord * 0.07, tip_radius - 0.018, 0.0),
        collection,
        material,
        bevel=0.006,
    )
    centre = base.location.copy()
    for vertex in base.data.vertices:
        vertex.co += centre
    base.location = (0.0, 0.0, 0.0)
    base.rotation_euler = (phase, 0.0, 0.0)
    for index in range(1, count):
        item = instance_linked(base, f"{prefix} — tip shroud {index + 1:03d}", collection, rotation_x=phase + TAU * index / count)
        tag(item, "turbine blade tip shroud")


def casing_flange(
    name: str,
    x: float,
    radius: float,
    collection: bpy.types.Collection,
    materials: Dict[str, bpy.types.Material],
    *,
    bolt_count: int = 24,
    quick: bool = False,
) -> None:
    """Casing split flange with radial hex fasteners only around the retained shell."""
    add_annular_shell(
        f"{name} — bolted split flange",
        x - 0.052,
        x + 0.052,
        radius,
        radius + 0.105,
        collection,
        materials["casing"],
        start=CUTAWAY_START,
        sweep=CUTAWAY_SWEEP,
        segments=64,
        bevel=0.004,
    )
    count = max(8, bolt_count if not quick else int(bolt_count * 0.58))
    for index in range(count):
        theta = angle_in_cutaway_shell(index, count)
        outward = Vector((0.0, math.cos(theta), math.sin(theta)))
        stem_start = outward * (radius + 0.065)
        stem_end = outward * (radius + 0.145)
        bolt = cylinder_between(
            f"{name} — flange bolt {index + 1:02d}",
            (x, *stem_start[1:]),
            (x, *stem_end[1:]),
            0.028,
            collection,
            materials["machined"],
            vertices=6,
            bevel=0.002,
        )
        tag(bolt, "casing split-line fastener")


def cooling_holes(
    prefix: str,
    x_positions: Iterable[float],
    radius: float,
    hole_radius: float,
    collection: bpy.types.Collection,
    material: bpy.types.Material,
    *,
    holes_per_ring: int,
    quick: bool,
    start_offset: float = 0.0,
) -> None:
    """Dark inset sleeves communicate genuine liner film/dilution perforations."""
    count = max(8, holes_per_ring if not quick else int(holes_per_ring * 0.55))
    for ring_index, x in enumerate(x_positions):
        for hole_index in range(count):
            theta = TAU * hole_index / count + start_offset + ring_index * 0.17
            # Avoid wasting geometry inside the missing section but retain a few interior-facing holes.
            if CUTAWAY_START - 0.10 < (theta % TAU) < (CUTAWAY_START + CUTAWAY_SWEEP + 0.10) % TAU:
                # The modulo test above is ambiguous when the arc wraps; holes are cheap, so keep all.
                pass
            inner = radial_point(x, radius - 0.018, theta)
            outer = radial_point(x, radius + 0.018, theta)
            sleeve = cylinder_between(
                f"{prefix} — cooling aperture {ring_index + 1:02d}-{hole_index + 1:02d}",
                inner,
                outer,
                hole_radius,
                collection,
                material,
                vertices=12,
            )
            tag(sleeve, "film / dilution cooling aperture")


# ---------------------------------------------------------------------------
# Engine subsystem construction
# ---------------------------------------------------------------------------

def build_inlet(
    cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material], quick: bool
) -> None:
    collection = cols["01 • Inlet & Front Frame"]
    # Rounded intake lip and annular front frame.
    add_torus("Inlet lip — rolled casing", 1.91, 0.105, -5.72, collection, mats["machined"], major_segments=96, minor_segments=16)
    add_annular_shell(
        "Inlet cowl — cutaway shell", -5.69, -4.78, 1.74, 2.08, collection, mats["casing"],
        inner1=1.60, outer1=1.85, start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=96, bevel=0.008,
    )
    add_annular_shell(
        "Inlet acoustic liner", -5.34, -4.83, 1.56, 1.61, collection, mats["dark"],
        start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=80,
    )
    # A visible spinner and low-profile front bearing nose.
    spinner = add_cone("Compressor spinner", 0.025, 0.57, 0.96, -5.27, collection, mats["titanium"], vertices=64, bevel=0.006)
    tag(spinner, "spinner / rotating nose", "inlet")
    add_axial_cylinder("Front bearing nose", 0.30, 0.42, -4.70, collection, mats["machined"], vertices=48, bevel=0.004)
    add_torus("Front bearing retention ring", 0.315, 0.025, -4.90, collection, mats["nickel"], major_segments=48, minor_segments=8)

    blade_row(
        "Inlet guide vane row", -4.88, 0.58, 1.57, 30, 0.52, -39.0, 12.0, 0.065,
        collection, mats["titanium"], row_kind="fixed inlet guide vane", stage="IGV", phase=math.radians(3), quick=quick, sweep=0.04,
    )
    add_annular_shell(
        "IGV outer shroud", -5.15, -4.61, 1.57, 1.64, collection, mats["machined"],
        start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=72, bevel=0.003,
    )
    add_annular_shell(
        "IGV hub fairing", -5.16, -4.61, 0.47, 0.59, collection, mats["machined"], segments=64, bevel=0.003,
    )
    casing_flange("Inlet / LPC case joint", -4.72, 1.84, cols["08 • External Systems & Fasteners"], mats, bolt_count=26, quick=quick)


def build_compressor(
    cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material], quick: bool
) -> None:
    lpc = cols["02 • Low-Pressure Compressor"]
    hpc = cols["03 • High-Pressure Compressor"]
    casing = cols["09 • Cutaway Casing"]

    # The stage schedule follows the expected shrinking annulus from LPC to HPC.
    stages = [
        ("LPC 1", -4.28, 0.57, 1.52, 28, 0.54, 40.0, -15.0, 0.067, lpc, mats["titanium"]),
        ("LPC 2", -3.64, 0.54, 1.43, 30, 0.50, 38.0, -17.0, 0.064, lpc, mats["titanium"]),
        ("LPC 3", -3.00, 0.51, 1.34, 32, 0.46, 35.0, -18.0, 0.061, lpc, mats["titanium"]),
        ("HPC 1", -2.35, 0.47, 1.25, 34, 0.42, 33.0, -20.0, 0.056, hpc, mats["titanium"]),
        ("HPC 2", -1.76, 0.44, 1.17, 36, 0.39, 31.0, -21.0, 0.052, hpc, mats["titanium"]),
        ("HPC 3", -1.19, 0.41, 1.09, 38, 0.36, 29.0, -23.0, 0.049, hpc, mats["nickel"]),
        ("HPC 4", -0.65, 0.39, 1.02, 40, 0.33, 27.0, -24.0, 0.046, hpc, mats["nickel"]),
        ("HPC 5", -0.14, 0.37, 0.95, 42, 0.30, 25.0, -25.0, 0.043, hpc, mats["nickel"]),
    ]

    for index, (stage, x, root, tip, count, chord, stagger, twist, thickness, collection, material) in enumerate(stages):
        phase = math.radians(7.0 + index * 11.0)
        blade_platform_ring(f"{stage} rotor disk", x, root, 0.18, collection, mats["machined"], inner_radius=0.245, outer_margin=0.08)
        blade_row(
            f"{stage} rotor", x, root, tip, count, chord, stagger, twist, thickness,
            collection, material, row_kind="rotating compressor blade", stage=stage, phase=phase,
            quick=quick, sweep=0.018 + index * 0.003, lean=0.012,
        )
        # Stator follows the rotor and is mounted inside a continuous outer case.
        stator_x = x + 0.315
        blade_row(
            f"{stage} stator", stator_x, root + 0.025, tip, count + 4, chord * 0.92,
            -stagger * 0.90, -twist * 0.55, thickness * 0.90,
            collection, material, row_kind="fixed compressor stator vane", stage=stage,
            phase=phase + math.radians(4.5), quick=quick, sweep=-0.012,
        )
        add_annular_shell(
            f"{stage} stator outer shroud", stator_x - 0.10, stator_x + 0.10,
            tip, tip + 0.064, collection, mats["machined"],
            start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=64, bevel=0.002,
        )
        add_annular_shell(
            f"{stage} stator inner platform", stator_x - 0.10, stator_x + 0.10,
            max(0.245, root - 0.055), root + 0.025, collection, mats["machined"], segments=48, bevel=0.002,
        )
        if index in (1, 4, 7):
            add_seal_teeth(f"{stage} interstage seal", x + 0.18, root + 0.012, cols["07 • Shafts, Bearings & Seals"], mats["nickel"], count=4)

    # A stiffened, tapered compressor case remains around 240 degrees of the circumference.
    add_annular_shell(
        "Compressor outer case — primary cutaway", -4.78, 0.46, 1.53, 1.78, casing, mats["casing"],
        inner1=0.98, outer1=1.20, start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=160, bevel=0.008,
    )
    for ring_index, (x, radius) in enumerate(((-4.08, 1.72), (-3.42, 1.64), (-2.72, 1.54), (-2.05, 1.44), (-1.41, 1.34), (-0.80, 1.26), (-0.28, 1.20))):
        add_annular_shell(
            f"Compressor case stiffener {ring_index + 1:02d}", x - 0.032, x + 0.032, radius - 0.08, radius + 0.025,
            casing, mats["machined"], start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=64, bevel=0.003,
        )

    # Variable-stator actuation rings and three visible drive links.
    for row_index, (x, radius) in enumerate(((-3.30, 1.70), (-1.88, 1.46), (-0.59, 1.26))):
        add_torus(f"Variable stator actuation ring {row_index + 1}", radius + 0.05, 0.026, x, cols["08 • External Systems & Fasteners"], mats["brass"], major_segments=64, minor_segments=8)
        for arm_index in range(3):
            theta = math.radians(140 + arm_index * 36)
            base = radial_point(x, radius + 0.03, theta)
            top = radial_point(x + 0.09, radius + 0.23, theta + math.radians(4))
            cylinder_between(
                f"VSV actuator link {row_index + 1}-{arm_index + 1}", base, top, 0.018,
                cols["08 • External Systems & Fasteners"], mats["machined"], vertices=12,
            )

    casing_flange("LPC split case flange", -3.31, 1.68, cols["08 • External Systems & Fasteners"], mats, bolt_count=30, quick=quick)
    casing_flange("HPC split case flange", -0.88, 1.29, cols["08 • External Systems & Fasteners"], mats, bolt_count=28, quick=quick)


def build_diffuser_and_combustor(
    cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material], quick: bool
) -> None:
    collection = cols["04 • Diffuser & Annular Combustor"]
    casing = cols["09 • Cutaway Casing"]
    external = cols["08 • External Systems & Fasteners"]

    # Compressor exit diffuser, showing both the expanding outer wall and fixed deswirl vanes.
    add_annular_shell(
        "Compressor exit diffuser outer wall", 0.33, 1.23, 0.93, 1.20, collection, mats["machined"],
        inner1=1.15, outer1=1.39, start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=80, bevel=0.005,
    )
    add_annular_shell(
        "Compressor exit diffuser hub fairing", 0.33, 1.23, 0.32, 0.46, collection, mats["machined"],
        inner1=0.43, outer1=0.57, segments=64, bevel=0.003,
    )
    blade_row(
        "Diffuser deswirl vane row", 0.73, 0.54, 1.14, 28, 0.42, -45.0, 8.0, 0.05,
        collection, mats["nickel"], row_kind="fixed diffuser vane", stage="diffuser", phase=math.radians(5), quick=quick,
    )
    add_annular_shell(
        "Diffuser vane outer band", 0.57, 0.89, 1.14, 1.19, collection, mats["machined"],
        start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=64,
    )

    # The external pressure casing is thick and cut away; the flame tube remains fully inspectable.
    add_annular_shell(
        "Annular combustor pressure case — cutaway", 1.12, 3.36, 1.24, 1.48, casing, mats["casing"],
        inner1=1.17, outer1=1.40, start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=128, bevel=0.009,
    )
    add_annular_shell(
        "Combustor outer liner", 1.34, 3.18, 1.085, 1.135, collection, mats["hot_liner"],
        inner1=1.03, outer1=1.08, start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=128, bevel=0.002,
    )
    add_annular_shell(
        "Combustor inner liner", 1.34, 3.18, 0.49, 0.545, collection, mats["liner"],
        inner1=0.52, outer1=0.57, start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=112, bevel=0.002,
    )
    add_annular_shell(
        "Combustor dome plate", 1.29, 1.39, 0.54, 1.10, collection, mats["nickel"],
        start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=112, bevel=0.003,
    )
    add_annular_shell(
        "Turbine inlet transition duct", 3.16, 3.52, 0.54, 1.08, collection, mats["hot_liner"],
        inner1=0.48, outer1=1.18, start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=96, bevel=0.003,
    )

    # Fuel manifold, nozzle bodies, swirler vanes, and primary-zone hardware.
    add_torus("Annular fuel manifold", 1.22, 0.042, 1.20, external, mats["brass"], major_segments=96, minor_segments=10)
    nozzle_count = 16 if not quick else 10
    for index in range(nozzle_count):
        theta = TAU * index / nozzle_count + math.radians(4)
        y, z = 0.80 * math.cos(theta), 0.80 * math.sin(theta)
        nozzle = add_axial_cylinder(
            f"Fuel nozzle {index + 1:02d} — body", 0.055, 0.30, 1.31, collection, mats["machined"], y=y, z=z, vertices=20, bevel=0.004,
        )
        tag(nozzle, "airblast fuel injector", "combustor")
        add_cone(
            f"Fuel nozzle {index + 1:02d} — atomiser", 0.073, 0.027, 0.18, 1.51, collection, mats["brass"], y=y, z=z, vertices=20,
        )
        manifold = radial_point(1.20, 1.22, theta)
        pipe_points = [manifold, (1.24, 1.06 * math.cos(theta), 1.06 * math.sin(theta)), (1.29, y, z)]
        add_tube(f"Fuel feed pipe {index + 1:02d}", pipe_points, 0.014, external, mats["brass"], resolution=2)

    blade_row(
        "Primary-zone radial swirler", 1.57, 0.59, 1.00, 22, 0.27, 55.0, -8.0, 0.038,
        collection, mats["nickel"], row_kind="combustor swirler vane", stage="combustor", phase=math.radians(7), quick=quick,
    )
    add_annular_shell(
        "Swirler inner support", 1.45, 1.66, 0.43, 0.60, collection, mats["machined"], segments=48, bevel=0.003,
    )
    add_annular_shell(
        "Swirler outer support", 1.45, 1.66, 1.00, 1.06, collection, mats["machined"], segments=64, bevel=0.003,
    )

    # Real combustor liners have several differently sized cooling zones.
    cooling_holes("Outer liner primary-zone", (1.69, 1.84), 1.135, 0.020, collection, mats["dark"], holes_per_ring=30, quick=quick, start_offset=0.08)
    cooling_holes("Outer liner dilution-zone", (2.33, 2.55, 2.77), 1.115, 0.031, collection, mats["dark"], holes_per_ring=22, quick=quick, start_offset=0.21)
    cooling_holes("Inner liner film-zone", (1.77, 2.02, 2.42, 2.85), 0.505, 0.017, collection, mats["dark"], holes_per_ring=26, quick=quick, start_offset=0.12)
    for x in (1.72, 2.16, 2.60, 3.02):
        add_torus(f"Combustor liner cooling rail at {x:+.2f}", 1.115, 0.012, x, collection, mats["nickel"], major_segments=72, minor_segments=6)

    # Two igniters are deliberately distinct from fuel injectors: ceramic body, metal shell, and harness.
    for index, theta in enumerate((math.radians(138), math.radians(222))):
        outer = radial_point(1.94, 1.59, theta)
        inner = radial_point(1.94, 1.02, theta)
        metal_end = radial_point(1.94, 1.22, theta)
        cylinder_between(f"Igniter {index + 1} — metal boss", outer, metal_end, 0.067, external, mats["machined"], vertices=24, bevel=0.003)
        cylinder_between(f"Igniter {index + 1} — ceramic insulator", metal_end, inner, 0.042, external, mats["ceramic"], vertices=20)
        cable_start = radial_point(1.94, 1.62, theta)
        cable_end = (1.20, 1.78 * math.cos(theta), 1.78 * math.sin(theta) + 0.25)
        add_tube(f"Igniter {index + 1} — shielded lead", [cable_start, cable_end, (0.80, cable_end[1], cable_end[2] + 0.10)], 0.018, external, mats["rubber"], resolution=2)

    # Visual inspection ports and radial casing bolts retain strong external mechanical credibility.
    casing_flange("Combustor front split flange", 1.16, 1.47, external, mats, bolt_count=32, quick=quick)
    casing_flange("Combustor turbine-case flange", 3.36, 1.41, external, mats, bolt_count=32, quick=quick)
    for index, theta in enumerate((math.radians(275), math.radians(305), math.radians(335))):
        center = radial_point(2.55 + index * 0.12, 1.49, theta)
        cap = cylinder_between(
            f"Combustor borescope port {index + 1}",
            radial_point(center[0], 1.41, theta), radial_point(center[0], 1.57, theta), 0.062,
            external, mats["machined"], vertices=32, bevel=0.004,
        )
        tag(cap, "borescope inspection port", "combustor")


def build_turbine(
    cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material], quick: bool
) -> None:
    hpt = cols["05 • High-Pressure Turbine"]
    lpt = cols["06 • Low-Pressure Turbine & Exhaust"]
    seals = cols["07 • Shafts, Bearings & Seals"]
    casing = cols["09 • Cutaway Casing"]

    stages = [
        ("HPT Stage 1", 3.67, 0.43, 1.18, 34, 0.47, hpt, mats["coated"]),
        ("HPT Stage 2", 4.43, 0.40, 1.14, 38, 0.45, hpt, mats["coated"]),
        ("LPT Stage 1", 5.18, 0.38, 1.10, 42, 0.48, lpt, mats["nickel"]),
    ]
    for index, (stage, stator_x, root, tip, count, chord, collection, rotor_mat) in enumerate(stages):
        phase = math.radians(13.0 + 8.0 * index)
        # Cooled nozzle guide vane (stator), then disk-mounted rotor airfoils.
        blade_row(
            f"{stage} nozzle guide vane", stator_x, root + 0.06, tip, count - 4, chord * 0.93,
            -56.0, 12.0, 0.066, collection, mats["nickel"], row_kind="cooled nozzle guide vane", stage=stage,
            phase=phase, quick=quick, sweep=-0.018,
        )
        add_annular_shell(
            f"{stage} nozzle outer band", stator_x - 0.16, stator_x + 0.16, tip, tip + 0.075,
            collection, mats["coated"], start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=72, bevel=0.003,
        )
        add_annular_shell(
            f"{stage} nozzle inner band", stator_x - 0.16, stator_x + 0.16, root - 0.06, root + 0.07,
            collection, mats["nickel"], segments=56, bevel=0.003,
        )
        rotor_x = stator_x + 0.32
        blade_platform_ring(f"{stage} turbine disk", rotor_x, root, 0.23, collection, mats["machined"], inner_radius=0.25, outer_margin=0.095)
        blade_row(
            f"{stage} rotor", rotor_x, root, tip - 0.025, count, chord, 42.0, -30.0, 0.068,
            collection, rotor_mat, row_kind="rotating turbine blade", stage=stage, phase=phase + math.radians(4),
            quick=quick, sweep=0.025, lean=-0.010,
        )
        add_turbine_tip_shrouds(
            stage, rotor_x, tip, count, chord, collection, mats["coated"], phase=phase + math.radians(4), quick=quick,
        )
        add_seal_teeth(f"{stage} disk rim seal", rotor_x - 0.17, root + 0.06, seals, mats["nickel"], count=6, spacing=0.021, tooth_radius=0.012)
        # Ablative-looking thin heat-shield bands at each stage transition.
        add_torus(f"{stage} thermal shield forward", tip + 0.045, 0.017, stator_x - 0.20, collection, mats["coated"], major_segments=72, minor_segments=8)
        add_torus(f"{stage} thermal shield aft", tip + 0.045, 0.017, rotor_x + 0.19, collection, mats["coated"], major_segments=72, minor_segments=8)

    add_annular_shell(
        "Turbine case — cutaway hot section", 3.47, 5.72, 1.19, 1.43, casing, mats["casing"],
        inner1=1.12, outer1=1.35, start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=144, bevel=0.009,
    )
    # Shroud segments with a clearance seal just above blade tips.
    for stage_index, (_, stator_x, _, tip, _, _, collection, _) in enumerate(stages):
        for x_offset in (-0.10, 0.22):
            add_annular_shell(
                f"Turbine shroud segment band {stage_index + 1}-{x_offset:+.2f}", stator_x + x_offset - 0.024, stator_x + x_offset + 0.024,
                tip + 0.005, tip + 0.070, collection, mats["coated"], start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=72, bevel=0.002,
            )
        cooling_holes(
            f"{stages[stage_index][0]} shroud impingement", (stator_x - 0.11, stator_x + 0.10), tip + 0.055,
            0.013, collection, mats["dark"], holes_per_ring=32, quick=quick, start_offset=0.15,
        )

    casing_flange("HPT case split flange", 4.13, 1.38, cols["08 • External Systems & Fasteners"], mats, bolt_count=30, quick=quick)
    casing_flange("LPT case split flange", 5.71, 1.32, cols["08 • External Systems & Fasteners"], mats, bolt_count=28, quick=quick)


def build_shaft_bearings_and_exhaust(
    cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material], quick: bool
) -> None:
    collection = cols["07 • Shafts, Bearings & Seals"]
    exhaust = cols["06 • Low-Pressure Turbine & Exhaust"]
    casing = cols["09 • Cutaway Casing"]
    external = cols["08 • External Systems & Fasteners"]

    # Concentric shafts distinguish the compressor spool from the turbine spool at the cut section.
    add_axial_cylinder("Inner high-pressure shaft", 0.155, 9.35, 0.35, collection, mats["machined"], vertices=64, bevel=0.003)
    add_annular_shell("Outer low-pressure shaft", -4.73, 5.18, 0.16, 0.245, collection, mats["titanium"], segments=96, bevel=0.003)
    for x, name in ((-4.66, "Front"), (-2.59, "Intershaft"), (0.82, "Compressor rear"), (3.42, "Turbine front"), (5.59, "Turbine rear")):
        add_torus(f"{name} bearing race", 0.31, 0.052, x, collection, mats["machined"], major_segments=56, minor_segments=12)
        # Rolling elements are radial spheres set in a visible race.
        balls = 10 if quick else 18
        for index in range(balls):
            theta = TAU * index / balls
            add_uv_sphere(f"{name} bearing roller {index + 1:02d}", 0.036, radial_point(x, 0.31, theta), collection, mats["nickel"], segments=12)
        add_annular_shell(f"{name} bearing housing", x - 0.11, x + 0.11, 0.34, 0.48, collection, mats["casing"], segments=48, bevel=0.003)

    # Exhaust cone, struts, and nozzle body.
    add_annular_shell(
        "Exhaust transition case — cutaway", 5.68, 6.50, 1.10, 1.34, casing, mats["casing"],
        inner1=0.93, outer1=1.15, start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=96, bevel=0.008,
    )
    add_cone("Exhaust centrebody plug", 0.48, 0.075, 1.40, 6.25, exhaust, mats["nickel"], vertices=64, bevel=0.004)
    add_annular_shell(
        "Exhaust nozzle shell — cutaway", 6.37, 7.06, 0.91, 1.16, exhaust, mats["machined"],
        inner1=0.70, outer1=0.88, start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=96, bevel=0.006,
    )
    add_torus("Exhaust nozzle rolled lip", 0.79, 0.048, 7.06, exhaust, mats["machined"], major_segments=96, minor_segments=12)
    strut_count = 6 if quick else 10
    for index in range(strut_count):
        theta = TAU * index / strut_count + math.radians(9)
        start = radial_point(5.95, 0.37, theta)
        end = radial_point(6.19, 1.05, theta + math.radians(7))
        cylinder_between(f"Exhaust support strut {index + 1:02d}", start, end, 0.037, exhaust, mats["machined"], vertices=12, bevel=0.003)

    # Oil scavenge lines visible around bearing stations.
    add_tube("Front-bearing oil feed", [(-4.67, -0.38, 0.16), (-4.30, -1.25, 0.22), (-3.55, -1.46, -0.14)], 0.028, external, mats["copper"], resolution=3)
    add_tube("Rear-bearing oil scavenge", [(5.58, -0.38, 0.12), (5.88, -1.16, -0.02), (5.38, -1.47, -0.27)], 0.032, external, mats["copper"], resolution=3)


def build_external_systems(
    cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material], quick: bool
) -> None:
    collection = cols["08 • External Systems & Fasteners"]

    # A compact accessory gearbox, driven from the HP spool, gives the assembly real service hardware.
    gearbox = add_cube("Accessory gearbox housing", (0.78, 0.58, 0.66), (-0.22, -1.42, -0.12), collection, mats["casing"], bevel=0.075)
    tag(gearbox, "accessory gearbox")
    add_cylinder("Accessory gearbox drive hub", 0.23, 0.22, (-0.22, -1.10, -0.12), collection, mats["machined"], vertices=48, rotation=(math.pi / 2.0, 0.0, 0.0), bevel=0.006)
    add_cylinder("Fuel pump module", 0.19, 0.46, (-0.52, -1.70, -0.07), collection, mats["brass"], vertices=40, rotation=(math.pi / 2.0, 0.0, 0.0), bevel=0.005)
    add_cylinder("Oil filter canister", 0.13, 0.44, (0.05, -1.71, -0.13), collection, mats["machined"], vertices=40, rotation=(math.pi / 2.0, 0.0, 0.0), bevel=0.005)
    add_torus(
        "Oil filter retention band", 0.134, 0.014, 0.05, collection, mats["warning"],
        major_segments=40, minor_segments=6, y=-1.71, z=-0.13, rotation=(math.pi / 2.0, 0.0, 0.0),
    )

    # Gearbox mounting lugs and electrical junction box.
    for index, (x, z) in enumerate(((-0.48, -0.42), (0.05, -0.42), (-0.48, 0.20), (0.05, 0.20))):
        add_cylinder(
            f"Gearbox mounting bolt {index + 1}", 0.038, 0.10, (x, -1.74, z), collection, mats["machined"],
            vertices=6, rotation=(math.pi / 2.0, 0.0, 0.0), bevel=0.002,
        )
    junction = add_cube("Engine electrical junction box", (0.36, 0.20, 0.28), (0.37, -1.39, 0.40), collection, mats["casing"], bevel=0.025)
    tag(junction, "electrical junction box")
    add_tube("Junction harness — igniter A", [(0.36, -1.49, 0.43), (0.96, -1.63, 0.58), (1.34, -1.19, 0.61)], 0.014, collection, mats["rubber"], resolution=3)
    add_tube("Junction harness — igniter B", [(0.36, -1.49, 0.36), (1.03, -1.76, -0.48), (1.58, -1.07, -0.65)], 0.014, collection, mats["rubber"], resolution=3)

    # Sensor bosses and two temperature probes around the hot section.
    for index, theta in enumerate((math.radians(286), math.radians(315), math.radians(346), math.radians(262))):
        x = 3.52 + index * 0.43
        boss_start = radial_point(x, 1.36, theta)
        boss_end = radial_point(x, 1.53, theta)
        cylinder_between(f"EGT sensor boss {index + 1}", boss_start, boss_end, 0.042, collection, mats["machined"], vertices=24, bevel=0.002)
        probe_end = radial_point(x, 1.05, theta)
        cylinder_between(f"EGT thermocouple {index + 1}", boss_start, probe_end, 0.012, collection, mats["nickel"], vertices=12)
        add_tube(
            f"EGT sensor lead {index + 1}",
            [boss_end, radial_point(x - 0.22, 1.72, theta), (x - 0.52, -1.67, 0.42 - index * 0.13)],
            0.010,
            collection,
            mats["rubber"],
            resolution=2,
        )

    # Lift lugs make the casing serviceable rather than a clean concept sculpture.
    for index, x in enumerate((-3.83, 0.44, 3.94, 5.32)):
        block = add_cube(f"Service lift lug {index + 1}", (0.18, 0.15, 0.36), (x, 0.0, 1.70 if x < 1.0 else 1.48), collection, mats["machined"], bevel=0.018)
        tag(block, "lifting lug")
        add_torus(f"Service lift lug eye {index + 1}", 0.066, 0.016, x, collection, mats["machined"], major_segments=32, minor_segments=8, y=0.0, z=(1.86 if x < 1.0 else 1.64))

    # Two raised external fuel feed lines cross the casing toward the annular manifold.
    add_tube("Main fuel supply line", [(-0.58, -1.75, 0.06), (0.31, -1.82, 0.25), (0.98, -1.55, 0.77), (1.20, -1.22, 0.88)], 0.035, collection, mats["brass"], resolution=3)
    add_tube("Fuel return line", [(-0.43, -1.80, -0.18), (0.48, -1.83, -0.32), (1.06, -1.34, -0.82), (1.20, -1.17, -0.91)], 0.022, collection, mats["copper"], resolution=3)


def build_cutaway_edges(
    cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material]
) -> None:
    """Bright machined lips mark the deliberate section plane through each outer case."""
    collection = cols["09 • Cutaway Casing"]
    shells = (
        (-5.69, -4.78, 2.08, 1.85),
        (-4.78, 0.46, 1.78, 1.20),
        (1.12, 3.36, 1.48, 1.40),
        (3.47, 5.72, 1.43, 1.35),
        (5.68, 6.50, 1.34, 1.15),
        (6.37, 7.06, 1.16, 0.88),
    )
    for shell_index, (x0, x1, r0, r1) in enumerate(shells):
        for edge_index, theta in enumerate((CUTAWAY_START, CUTAWAY_START + CUTAWAY_SWEEP)):
            start = radial_point(x0, r0, theta)
            end = radial_point(x1, r1, theta)
            edge = cylinder_between(
                f"Cutaway machined edge {shell_index + 1}-{edge_index + 1}", start, end, 0.022,
                collection, mats["machined"], vertices=12, bevel=0.001,
            )
            tag(edge, "cutaway section edge")


def build_environment(
    cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material], include_floor: bool
) -> None:
    collection = cols["00 • Environment"]
    if not include_floor:
        return
    floor = add_cube("Matte studio floor", (24.0, 24.0, 0.18), (0.4, 0.0, -2.35), collection, mats["floor"], bevel=0.02)
    tag(floor, "studio floor")
    # Low plinth blocks support the engine at believable service points.
    for index, x in enumerate((-3.25, 4.75)):
        pedestal = add_cube(f"Engine support pedestal {index + 1}", (0.78, 1.10, 1.08), (x, 0.0, -1.83), collection, mats["casing"], bevel=0.06)
        tag(pedestal, "engine mounting pedestal")
        add_cube(f"Pedestal isolation pad {index + 1}", (0.94, 1.28, 0.10), (x, 0.0, -2.33), collection, mats["rubber"], bevel=0.025)

    # Place the background *behind* the -Y hero camera.  It is a broad vertical
    # panel normal to Y, so it catches rim light without crossing the camera's
    # line of sight to the exhaust end of the engine.
    backdrop = add_cube("Studio backdrop", (24.0, 0.18, 10.0), (0.5, 5.80, 2.4), collection, mats["floor"], bevel=0.08)
    tag(backdrop, "studio backdrop")


def add_text_label(
    name: str,
    text: str,
    location: Point,
    collection: bpy.types.Collection,
    material: bpy.types.Material,
    *,
    size: float = 0.24,
) -> bpy.types.Object:
    curve = bpy.data.curves.new(name + " Font", "FONT")
    curve.body = text
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.size = size
    curve.extrude = 0.006
    curve.bevel_depth = 0.0015
    obj = bpy.data.objects.new(name, curve)
    collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (math.pi / 2.0, 0.0, 0.0)
    assign_material(obj, material)
    return obj


def build_optional_labels(cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material]) -> None:
    collection = cols["11 • Optional Labels"]
    stations = (
        (-5.15, "INLET"),
        (-3.55, "LPC"),
        (-1.00, "HPC"),
        (2.20, "ANNULAR COMBUSTOR"),
        (4.03, "HPT"),
        (5.22, "LPT"),
        (6.55, "EXHAUST"),
    )
    for index, (x, text) in enumerate(stations):
        add_text_label(f"Section label {index + 1}", text, (x, -2.23, -2.16), collection, mats["label"], size=0.17 if len(text) > 5 else 0.23)
        add_tube(f"Label leader {index + 1}", [(x, -2.1, -2.10), (x, -1.54, -1.76)], 0.006, collection, mats["label"], resolution=1)


# ---------------------------------------------------------------------------
# Camera, lighting, render configuration, and build entrypoint
# ---------------------------------------------------------------------------

def look_at(obj: bpy.types.Object, target: Point) -> None:
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_area_light(
    name: str,
    location: Point,
    target: Point,
    energy: float,
    size: float,
    color: Color,
    collection: bpy.types.Collection,
) -> bpy.types.Object:
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color[:3]
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.location = location
    look_at(obj, target)
    return obj


def configure_cameras_and_lights(
    cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material]
) -> bpy.types.Object:
    collection = cols["10 • Cameras & Lights"]
    target = (0.55, 0.0, -0.10)
    target_obj = bpy.data.objects.new("Hero camera target", None)
    collection.objects.link(target_obj)
    target_obj.location = target
    target_obj.empty_display_type = "SPHERE"
    target_obj.empty_display_size = 0.28

    camera_data = bpy.data.cameras.new("Hero Cutaway Camera")
    camera_data.lens = 57
    camera_data.sensor_width = 36
    camera = bpy.data.objects.new("Hero Cutaway Camera", camera_data)
    collection.objects.link(camera)
    camera.location = (14.9, -18.4, 7.4)
    look_at(camera, target)
    bpy.context.scene.camera = camera

    detail_data = bpy.data.cameras.new("Combustor Detail Camera")
    detail_data.lens = 68
    detail = bpy.data.objects.new("Combustor Detail Camera", detail_data)
    collection.objects.link(detail)
    detail.location = (6.5, -9.2, 3.8)
    look_at(detail, (2.15, -0.15, 0.0))

    # Large soft sources mimic a premium product/engineering studio; warm key, cool rim, low fill.
    add_area_light("Key — warm overhead", (0.5, -6.0, 10.5), target, 1800.0, 7.5, (1.0, 0.61, 0.35, 1), collection)
    add_area_light("Rim — cool back", (5.7, 7.5, 6.8), (1.8, 0.0, 0.4), 1550.0, 5.0, (0.22, 0.55, 1.0, 1), collection)
    add_area_light("Fill — neutral front", (-7.5, -5.0, 3.2), (-2.5, 0.0, -0.3), 1200.0, 4.5, (0.75, 0.84, 1.0, 1), collection)
    add_area_light("Interior — combustion glow", (2.30, -0.9, 0.25), (2.30, 0.0, 0.0), 600.0, 2.2, (1.0, 0.14, 0.015, 1), collection)
    add_area_light("Long top strip", (-1.0, 1.5, 8.0), (-0.4, 0.0, 0.0), 900.0, 8.5, (0.92, 0.95, 1.0, 1), collection)

    # A small emissive engineering placard placed far below the frame is useful in viewport orientation.
    plaque = add_cube("Model information plaque", (3.25, 0.08, 0.72), (0.40, 1.88, -1.72), cols["00 • Environment"], mats["casing"], bevel=0.035)
    tag(plaque, "informational plaque")
    add_text_label("Plaque title", "AXIAL GAS TURBINE — CUTAWAY", (-0.85, 1.82, -1.73), cols["00 • Environment"], mats["label"], size=0.15)
    add_text_label("Plaque subtitle", "PROCEDURAL ENGINEERING VISUALISATION", (-0.68, 1.81, -2.00), cols["00 • Environment"], mats["label"], size=0.09)
    return camera


def configure_scene(args: argparse.Namespace) -> None:
    scene = bpy.context.scene
    try:
        scene.render.engine = args.engine
    except Exception:
        scene.render.engine = "CYCLES"
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = args.resolution_scale
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.render.film_transparent = False

    if hasattr(scene, "cycles"):
        scene.cycles.samples = 64 if args.quick else 192
        scene.cycles.use_denoising = True
        scene.cycles.preview_samples = 16 if args.quick else 48
    if hasattr(scene, "eevee"):
        try:
            scene.eevee.taa_render_samples = 32 if args.quick else 128
        except Exception:
            pass

    scene.world.use_nodes = True
    nodes = scene.world.node_tree.nodes
    background = nodes.get("Background")
    if background:
        background.inputs["Color"].default_value = (0.005, 0.009, 0.015, 1.0)
        background.inputs["Strength"].default_value = 0.22
    try:
        scene.view_settings.look = "AgX - Medium High Contrast"
    except Exception:
        pass
    try:
        scene.view_settings.view_transform = "AgX"
    except Exception:
        pass
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.length_unit = "METERS"
    scene["asset_name"] = "High-detail axial gas turbine cutaway"
    scene["asset_scope"] = "Generic physically informed visualisation; not OEM-controlled dimensional data."
    scene["cutaway_sector_degrees"] = 120
    scene["generator"] = "blender/generate_gas_turbine.py"


def attach_model_notes(args: argparse.Namespace) -> None:
    notes = bpy.data.texts.get("MODEL NOTES — READ ME") or bpy.data.texts.new("MODEL NOTES — READ ME")
    notes.clear()
    notes.write(
        "AXIAL GAS TURBINE CUTAWAY\n"
        "=========================\n\n"
        "Generated procedurally by blender/generate_gas_turbine.py.\n\n"
        "Assembly hierarchy:\n"
        "• inlet guide vanes, 8 compressor stages, diffuser, annular combustor,\n"
        "  fuel manifold/injectors/swirler/liners/igniters, 3 turbine stages,\n"
        "  concentric shafts, bearings, labyrinth seals, exhaust support frame,\n"
        "  service systems, casing flanges, bolts, instrumentation and cutaway lips.\n\n"
        "VISUALISATION SCOPE\n"
        "This is a generic, physically informed two-spool axial gas-turbine visualisation.\n"
        "It is intentionally not represented as an OEM-engine CAD model or a source of\n"
        "manufacturing dimensions. Exact internal layouts, blade profiles, cooling passages,\n"
        "clearances, materials, and inspection limits must be replaced with controlled data\n"
        "from the specific engine configuration before any engineering use.\n\n"
        f"Build mode: {'quick' if args.quick else 'full detail'}\n"
        f"Saved output requested: {os.path.abspath(args.output)}\n"
    )


def build_engine(args: argparse.Namespace) -> Path:
    started = time.perf_counter()
    remove_existing_scene()
    configure_scene(args)
    cols = collection_tree()
    mats = make_materials()

    build_environment(cols, mats, include_floor=not args.no_floor)
    build_inlet(cols, mats, args.quick)
    build_compressor(cols, mats, args.quick)
    build_diffuser_and_combustor(cols, mats, args.quick)
    build_turbine(cols, mats, args.quick)
    build_shaft_bearings_and_exhaust(cols, mats, args.quick)
    build_external_systems(cols, mats, args.quick)
    build_cutaway_edges(cols, mats)
    if args.labels:
        build_optional_labels(cols, mats)
    configure_cameras_and_lights(cols, mats)
    attach_model_notes(args)

    # Make the root collection easy to find in a busy Blender scene.
    root = bpy.data.collections.get("GAS TURBINE — CUTAWAY ASSEMBLY")
    if root:
        root["description"] = "High-detail axial gas turbine cutaway; select child collections for subsystems."
    bpy.context.view_layer.update()

    output = Path(args.output).expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(output))

    if args.render:
        render_path = Path(args.render).expanduser().resolve()
        render_path.parent.mkdir(parents=True, exist_ok=True)
        bpy.context.scene.render.filepath = str(render_path)
        bpy.ops.render.render(write_still=True)

    elapsed = time.perf_counter() - started
    print("\n" + "=" * 72)
    print("Gas turbine cutaway generation complete")
    print(f"Objects: {len(bpy.data.objects):,} | meshes: {len(bpy.data.meshes):,}")
    print(f"Saved:   {output}")
    if args.render:
        print(f"Render:  {Path(args.render).expanduser().resolve()}")
    print(f"Elapsed: {elapsed:.1f} s")
    print("=" * 72 + "\n")
    return output


def main() -> None:
    args = parse_args()
    build_engine(args)


if __name__ == "__main__":
    main()
