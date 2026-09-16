#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Build a public-data-calibrated LM2500-class gas-turbine cutaway in Blender.

This self-contained script creates editable materials, assembly hierarchy,
geometry, lights, cameras and render settings without external add-ons or
assets.  It targets Blender 3.6 LTS and newer.  Its public-topology baseline is
GE LM2500 information: 16 compressor stages, first-six VSV rows, a 30-nozzle
annular combustor, two air-cooled HPT stages and six free-power stages.

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

The assembly is a public-data-calibrated structural visualization, not a
complete physical simulation, dimensional/manufacturing twin, or OEM CAD file.
Exact part geometry, cooling circuits, clearances, materials, controls and
validated operating boundary conditions require controlled configuration data;
see REFERENCE_BASIS.md for what is and is not claimed.
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
        "--static",
        action="store_true",
        help="Do not add the default display-only reduced-speed rotor animation.",
    )
    parser.add_argument(
        "--resolution-scale",
        type=int,
        default=100,
        choices=range(25, 201),
        metavar="25..200",
        help="Render resolution percentage; default is 100.",
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=0,
        metavar="N",
        help="Cycles sample override; 0 (default) uses the quick/full preset (64/192).",
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
        ("02 • Variable Geometry Compressor — Stages 01–06", root),
        ("03 • High-Pressure Compressor — Stages 07–16", root),
        ("04 • Diffuser & Annular Combustor", root),
        ("05 • High-Pressure Turbine", root),
        ("06 • Free Power Turbine & Exhaust", root),
        ("07 • Shafts, Bearings & Seals", root),
        ("08 • External Systems & Fasteners", root),
        ("09 • Cutaway Casing", root),
        ("10 • Cameras & Lights", root),
        ("11 • Optional Labels", root),
        ("12 • Animation Controllers", root),
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
        "casing": principled_material("Cast nickel casing", (0.105, 0.125, 0.14, 1), 0.72, 0.38, noise=0.075),
        "liner": principled_material("Oxidised combustor liner", (0.22, 0.09, 0.035, 1), 0.72, 0.46, noise=0.10),
        "hot_liner": principled_material("Warm combustor liner", (0.30, 0.045, 0.008, 1), 0.60, 0.42, noise=0.085, emission=(1.0, 0.055, 0.004, 1), emission_strength=0.20),
        "ceramic": principled_material("Ceramic insulator", (0.76, 0.69, 0.56, 1), 0.04, 0.32, noise=0.03),
        "dark": principled_material("Carbon black / apertures", (0.006, 0.008, 0.010, 1), 0.12, 0.34, noise=0.02),
        "brass": principled_material("Fuel-system brass", (0.54, 0.25, 0.055, 1), 0.83, 0.25, noise=0.035),
        "copper": principled_material("Braided copper line", (0.45, 0.08, 0.018, 1), 0.82, 0.22, noise=0.05),
        "rubber": principled_material("High temperature elastomer", (0.012, 0.016, 0.019, 1), 0.05, 0.48, noise=0.05),
        "warning": principled_material("Inspection orange", (0.8, 0.07, 0.01, 1), 0.28, 0.27, noise=0.02),
        "glass": principled_material("Section window glass", (0.08, 0.26, 0.30, 1), 0.12, 0.12, alpha=0.24),
        "label": principled_material("Engraved labels", (0.72, 0.78, 0.76, 1), 0.45, 0.28),
        "floor": principled_material("Studio charcoal floor", (0.014, 0.018, 0.021, 1), 0.08, 0.30, noise=0.045),
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
    curve.resolution_u = max(1, resolution)
    curve.bevel_depth = radius
    curve.bevel_resolution = max(1, resolution)
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


def in_retained_sector(theta: float) -> bool:
    """True when ``theta`` lies on the retained shell, not in the cut void."""
    return (theta - CUTAWAY_START) % TAU <= CUTAWAY_SWEEP


def arc_tube(
    name: str,
    x: float,
    radius: float,
    tube_radius: float,
    collection: bpy.types.Collection,
    material: Optional[bpy.types.Material],
    *,
    segments: int = 96,
    resolution: int = 4,
) -> bpy.types.Object:
    """A ring that follows only the retained 240 degrees of shell.

    A full-circle torus mounted on (or just inside) a cut casing would visibly
    float across the removed 120-degree sector.  Discrete interior hardware
    (blades, disks, seals, bearings, nozzles) intentionally stays full-circle:
    a cutaway exposes the interior, it does not remove it.
    """
    points = [
        radial_point(x, radius, CUTAWAY_START + CUTAWAY_SWEEP * index / segments)
        for index in range(segments + 1)
    ]
    tube = add_tube(name, points, tube_radius, collection, material, resolution=resolution)
    tube.data.use_fill_caps = True
    return tube


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
    omit_angles: Sequence[float] = (),
    omit_tolerance: float = 0.0,
) -> List[bpy.types.Object]:
    """Populate a linked, twisted rotor or stator airfoil row.

    ``omit_angles`` reserves a narrow blade slot for an explicit cutaway/detail
    object without changing the rest of a row's linked-mesh workflow.
    """
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

    def omitted(angle: float) -> bool:
        return any(abs((angle - target + math.pi) % TAU - math.pi) <= omit_tolerance for target in omit_angles)

    # The hidden master still supplies linked mesh data to the retained blades.
    if omitted(phase):
        base.hide_render = True
        base.hide_viewport = True
        base["reserved_detail_slot"] = True
    for blade_index in range(1, final_count):
        angle = phase + TAU * blade_index / final_count
        if omitted(angle):
            continue
        obj = instance_linked(base, f"{name} — {row_kind} blade {blade_index + 1:03d}", collection, rotation_x=angle)
        obj.hide_render = False
        obj.hide_viewport = False
        tag(obj, row_kind, stage)
        blade_objects.append(obj)
    return blade_objects



def blade_footprint(chord: float, stagger_deg: float, twist_deg: float, thickness: float) -> Tuple[float, float]:
    """Return conservative axial and tangential blade-envelope widths.

    The estimates mirror the procedural airfoil's root/tip chord taper and
    are used as a build-time guard against visibly interpenetrating rows.
    They are geometric display checks, not stress or aerodynamic analysis.
    """
    axial_width = 0.0
    tangential_width = 0.0
    for span_t, chord_scale, thickness_scale in ((0.0, 1.0, 1.0), (1.0, 0.86, 0.88)):
        angle = math.radians(stagger_deg + twist_deg * (span_t - 0.5))
        local_chord = chord * chord_scale
        local_thickness = thickness * thickness_scale
        axial_width = max(axial_width, abs(local_chord * math.cos(angle)) + abs(local_thickness * math.sin(angle)))
        tangential_width = max(tangential_width, abs(local_chord * math.sin(angle)) + abs(local_thickness * math.cos(angle)))
    return axial_width, tangential_width


def validate_blade_row_schedule(
    rows: Sequence[Tuple[str, float, float, int, float, float, float, float]],
    *,
    label: str,
    minimum_clearance: float = 0.004,
) -> float:
    """Fail early if visual blade envelopes are too close or overlap.

    The small positive margin avoids z-fighting and visibly intersecting rows
    after bevels and smooth shading are evaluated.
    """
    evaluated = []
    min_clearance = float("inf")
    for name, x, root_radius, count, chord, stagger, twist, thickness in rows:
        axial_width, tangential_width = blade_footprint(chord, stagger, twist, thickness)
        circumferential_pitch = TAU * root_radius / count
        tangential_clearance = circumferential_pitch - tangential_width
        if tangential_clearance < minimum_clearance:
            raise ValueError(
                f"{label}: {name} circumferential clearance is below the "
                f"{minimum_clearance:.4f}-unit visual minimum ({tangential_clearance:+.4f})."
            )
        evaluated.append((name, x, axial_width))
        min_clearance = min(min_clearance, tangential_clearance)

    for (left_name, left_x, left_width), (right_name, right_x, right_width) in zip(evaluated, evaluated[1:]):
        axial_clearance = right_x - left_x - 0.5 * (left_width + right_width)
        if axial_clearance < minimum_clearance:
            raise ValueError(
                f"{label}: {left_name} / {right_name} axial clearance is below "
                f"the {minimum_clearance:.4f}-unit visual minimum ({axial_clearance:+.4f})."
            )
        min_clearance = min(min_clearance, axial_clearance)
    return min_clearance

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



def add_radial_hardware_instances(
    name: str,
    x: float,
    radius: float,
    count: int,
    size: Point,
    collection: bpy.types.Collection,
    material: bpy.types.Material,
    *,
    phase: float,
    component: str,
    stage: str,
    quick: bool,
    omit_angles: Sequence[float] = (),
    omit_tolerance: float = 0.0,
) -> List[bpy.types.Object]:
    """Populate linked mechanical pads around a rotor or vane row.

    These intentionally generic retention/platform blocks make the blade-to-disk
    and vane-to-case interfaces readable in a cutaway.  Their shape is not an
    assertion of a proprietary LM2500 fir-tree or hook geometry.
    """
    final_count = max(8, count if not quick else int(count * 0.58))
    master = add_cube(
        f"{name} — master", size, (x, radius, 0.0), collection, material,
        bevel=0.0,
    )
    # Bake the initial radial placement into the linked mesh.  Subsequent
    # object rotations then distribute it around the engine's X axis.
    centre = master.location.copy()
    for vertex in master.data.vertices:
        vertex.co += centre
    master.location = (0.0, 0.0, 0.0)
    master.rotation_mode = "XYZ"
    master.rotation_euler = (phase, 0.0, 0.0)
    tag(master, component, stage)

    def omitted(angle: float) -> bool:
        return any(abs((angle - target + math.pi) % TAU - math.pi) <= omit_tolerance for target in omit_angles)

    items = [master]
    if omitted(phase):
        master.hide_render = True
        master.hide_viewport = True
        master["reserved_detail_slot"] = True
    for item_index in range(1, final_count):
        angle = phase + TAU * item_index / final_count
        if omitted(angle):
            continue
        item = instance_linked(master, f"{name} — {component} {item_index + 1:03d}", collection, rotation_x=angle)
        item.hide_render = False
        item.hide_viewport = False
        tag(item, component, stage)
        items.append(item)
    return items

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
            # The liner/shroud shell is removed in the cut sector; holes there
            # would float in the void with no shell around them.
            if not in_retained_sector(theta):
                continue
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
    arc_tube("Inlet lip — rolled casing", -5.72, 1.91, 0.105, collection, mats["machined"], resolution=6)
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
    """Build the publicly documented 16-stage LM2500-class axial compressor.

    The public record specifies an IGV, first six variable stator rows, and a
    16-stage core compressor.  Airfoil coordinates, clearances, and the actual
    control law are proprietary, so this is an editable structural rendition
    with a smoothly contracting annulus rather than an OEM reproduction.
    """
    vsv_compressor = cols["02 • Variable Geometry Compressor — Stages 01–06"]
    hpc = cols["03 • High-Pressure Compressor — Stages 07–16"]
    casing = cols["09 • Cutaway Casing"]
    external = cols["08 • External Systems & Fasteners"]
    seals = cols["07 • Shafts, Bearings & Seals"]

    stage_count = 16
    first_x = -4.28
    # Sixteen pairs fit the compressor case only when their projected airfoil
    # envelopes have explicit axial clearance; do not crowd them for density.
    pitch = 0.290
    stator_offset = 0.145
    vsv_count = 6
    stage_records = []

    # Compressor annulus contracts continuously toward the diffuser.  Stage
    # count and variable rows are calibrated to GE public LM2500 material;
    # blade populations below are visual density choices, not OEM counts.
    for index in range(stage_count):
        t = index / (stage_count - 1)
        stage_number = index + 1
        x = first_x + pitch * index
        root = 0.57 - 0.205 * t
        tip = 1.52 - 0.565 * t
        # Visual populations and profiles are deliberately limited by minimum
        # circumferential pitch at the blade root, avoiding mesh intersection.
        count = int(round(25 + 8 * t))
        chord = 0.150 - 0.070 * t
        stagger = 40.0 - 14.0 * t
        twist = -14.0 - 12.0 * t
        thickness = 0.024 - 0.012 * t
        collection = vsv_compressor if stage_number <= vsv_count else hpc
        material = mats["titanium"] if stage_number <= 11 else mats["nickel"]
        stage = f"HPC Stage {stage_number:02d}"
        stage_records.append((stage, x, root, tip, count, chord, stagger, twist, thickness, collection, material))

    compressor_rows = []
    for stage, x, root, _tip, count, chord, stagger, twist, thickness, _collection, _material in stage_records:
        compressor_rows.extend((
            (f"{stage} rotor", x, root, count, chord, stagger, twist, thickness),
            (f"{stage} stator", x + stator_offset, root + 0.020, count + 4, chord * 0.90, -stagger * 0.90, -twist * 0.55, thickness * 0.88),
        ))
    compressor_clearance = validate_blade_row_schedule(compressor_rows, label="16-stage compressor")
    bpy.context.scene["compressor_visual_min_clearance"] = round(compressor_clearance, 5)

    for index, (stage, x, root, tip, count, chord, stagger, twist, thickness, collection, material) in enumerate(stage_records):
        phase = math.radians(7.0 + index * 9.0)
        blade_platform_ring(
            f"{stage} rotor disk", x, root, 0.142, collection, mats["machined"],
            inner_radius=0.245, outer_margin=0.075,
        )
        blade_row(
            f"{stage} rotor", x, root, tip, count, chord, stagger, twist, thickness,
            collection, material, row_kind="rotating compressor blade", stage=stage,
            phase=phase, quick=quick, sweep=0.015 + index * 0.0018, lean=0.010,
        )
        # Separate linked root platforms and retention lugs make the disk/airfoil
        # interface more legible than a blade emerging from a plain annulus.
        # Tangential widths scale with local pitch so late-stage hardware never
        # piles into its neighbour as the hub diameter contracts.
        root_pitch = TAU * root / count
        platform_width = max(0.026, min(0.100, root_pitch * 0.70))
        lug_width = max(0.018, min(0.068, root_pitch * 0.55))
        add_radial_hardware_instances(
            f"{stage} rotor blade-root platform", x + chord * 0.018, root + 0.044, count,
            (max(0.048, chord * 0.30), 0.050, platform_width), collection, mats["machined"],
            phase=phase, component="compressor blade root platform", stage=stage, quick=quick,
        )
        add_radial_hardware_instances(
            f"{stage} rotor retention lug", x - chord * 0.032, root - 0.020, count,
            (max(0.040, chord * 0.19), 0.064, lug_width), collection, mats["nickel"],
            phase=phase, component="illustrative compressor blade retention lug", stage=stage, quick=quick,
        )
        # Each rotor is followed by an annular stator row.  The first six are
        # tagged and mechanically linked as variable stators.
        stator_x = x + stator_offset
        stator_kind = "variable compressor stator vane" if index < vsv_count else "fixed compressor stator vane"
        blade_row(
            f"{stage} stator", stator_x, root + 0.020, tip, count + 4, chord * 0.90,
            -stagger * 0.90, -twist * 0.55, thickness * 0.88,
            collection, material, row_kind=stator_kind, stage=stage,
            phase=phase + math.radians(4.5), quick=quick, sweep=-0.010,
        )
        add_radial_hardware_instances(
            f"{stage} stator casing hook", stator_x - chord * 0.012, tip + 0.032, count + 4,
            (max(0.048, chord * 0.17), 0.042, 0.074), collection, mats["machined"],
            phase=phase + math.radians(4.5), component="compressor stator casing attachment", stage=stage, quick=quick,
        )
        add_annular_shell(
            f"{stage} stator outer shroud", stator_x - 0.056, stator_x + 0.056,
            tip, tip + 0.060, collection, mats["machined"],
            start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=48, bevel=0.002,
        )
        add_annular_shell(
            f"{stage} stator inner platform", stator_x - 0.056, stator_x + 0.056,
            max(0.245, root - 0.050), root + 0.020, collection, mats["machined"],
            segments=40, bevel=0.002,
        )
        if index in (3, 7, 11, 15):
            add_seal_teeth(
                f"{stage} interstage seal", x + 0.074, root + 0.012, seals,
                mats["nickel"], count=4,
            )

        if index < vsv_count:
            # An outside actuation collar, three levers, and one small torque
            # shaft make the six publicly reported VSV rows inspectable.
            actuation_radius = tip + 0.145
            arc_tube(
                f"VSV stage {index + 1:02d} actuation ring", stator_x, actuation_radius, 0.018,
                external, mats["brass"],
            )
            for arm_index in range(3):
                theta = math.radians(256.0 + arm_index * 34.0)
                base = radial_point(stator_x, tip + 0.045, theta)
                upper = radial_point(stator_x + 0.028, actuation_radius + 0.030, theta + math.radians(3.0))
                cylinder_between(
                    f"VSV stage {index + 1:02d} drive lever {arm_index + 1}",
                    base, upper, 0.012, external, mats["machined"], vertices=10,
                )
            shaft_a = radial_point(stator_x - 0.065, actuation_radius + 0.018, math.radians(264.0))
            shaft_b = radial_point(stator_x + 0.065, actuation_radius + 0.018, math.radians(264.0))
            cylinder_between(
                f"VSV stage {index + 1:02d} torque shaft", shaft_a, shaft_b,
                0.015, external, mats["machined"], vertices=10,
            )

    # The first six VSV rows share visible external unison-linkage rails.  The
    # public sources establish variable geometry; these rail/bellcrank shapes
    # are intentionally generic visual hardware rather than OEM kinematics.
    for rail_index, theta_deg in enumerate((56.0, 87.0, 118.0)):
        theta = math.radians(theta_deg)
        rail_points = []
        for stage_index in range(vsv_count):
            _, x, _, tip, _, _, _, _, _, _, _ = stage_records[stage_index]
            stator_x = x + stator_offset
            pivot_radius = tip + 0.225
            pivot = radial_point(stator_x, pivot_radius, theta)
            rail_points.append(pivot)
            add_uv_sphere(
                f"VSV unison rail {rail_index + 1} pivot {stage_index + 1}", 0.034,
                pivot, external, mats["machined"], segments=16,
            )
            inward = radial_point(stator_x, tip + 0.145, theta)
            bellcrank = cylinder_between(
                f"VSV bellcrank {rail_index + 1}-{stage_index + 1}", pivot, inward,
                0.013, external, mats["machined"], vertices=10,
            )
            tag(bellcrank, "illustrative VSV unison bellcrank", f"HPC Stage {stage_index + 1:02d}")
        rail = add_tube(
            f"VSV unison rail {rail_index + 1}", rail_points, 0.018,
            external, mats["machined"], resolution=2,
        )
        tag(rail, "illustrative VSV unison linkage")

    # Two visible servo cylinders and their spherical rod ends terminate the
    # unison linkage.  They expose service logic without asserting controls.
    for actuator_index, (start_x, end_x, theta_deg, radius) in enumerate(((-4.30, -3.63, 87.0, 1.86), (-3.10, -2.38, 56.0, 1.69))):
        theta = math.radians(theta_deg)
        start = radial_point(start_x, radius, theta)
        end = radial_point(end_x, radius - 0.05, theta)
        actuator = cylinder_between(
            f"VSV linear actuator {actuator_index + 1}", start, end, 0.042,
            external, mats["machined"], vertices=24, bevel=0.003,
        )
        tag(actuator, "illustrative VSV servo actuator")
        add_uv_sphere(f"VSV actuator {actuator_index + 1} rod-end forward", 0.050, start, external, mats["nickel"], segments=16)
        add_uv_sphere(f"VSV actuator {actuator_index + 1} rod-end aft", 0.045, end, external, mats["nickel"], segments=16)

    # A stiffened, split compressor case remains around 240 degrees of the
    # circumference, deliberately exposing all 16 rows through the section.
    add_annular_shell(
        "16-stage compressor outer case — primary cutaway", -4.78, 0.46, 1.53, 1.78,
        casing, mats["casing"], inner1=0.98, outer1=1.20,
        start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=176, bevel=0.008,
    )
    for ring_index in range(stage_count):
        t = ring_index / (stage_count - 1)
        x = first_x + pitch * ring_index + stator_offset
        radius = 1.72 - 0.535 * t
        add_annular_shell(
            f"Compressor case stiffener {ring_index + 1:02d}", x - 0.016, x + 0.016,
            radius - 0.064, radius + 0.020, casing, mats["machined"],
            start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=44, bevel=0.002,
        )

    # A sixth-stage bleed manifold is a visible functional departure from the
    # flowpath.  Its routed pipes are illustrative cooling-air plumbing only.
    bleed_x = first_x + pitch * 5 + 0.14
    arc_tube("Sixth-stage compressor bleed manifold", bleed_x, 1.34, 0.030, external, mats["machined"])
    for line_index, theta_deg in enumerate((254.0, 278.0, 308.0)):
        theta = math.radians(theta_deg)
        start = radial_point(bleed_x, 1.34, theta)
        mid = radial_point(0.52, 1.57, theta - math.radians(4.0))
        end = radial_point(3.45, 1.50, theta - math.radians(8.0))
        add_tube(
            f"Compressor bleed / HPT cooling line {line_index + 1}",
            [start, mid, end], 0.018, external, mats["copper"], resolution=3,
        )

    casing_flange("Compressor forward split flange", -3.31, 1.68, external, mats, bolt_count=30, quick=quick)
    casing_flange("Compressor intermediate split flange", -1.78, 1.43, external, mats, bolt_count=30, quick=quick)
    casing_flange("Compressor rear split flange", 0.10, 1.22, external, mats, bolt_count=28, quick=quick)

def build_diffuser_and_combustor(
    cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material], quick: bool
) -> None:
    collection = cols["04 • Diffuser & Annular Combustor"]
    casing = cols["09 • Cutaway Casing"]
    external = cols["08 • External Systems & Fasteners"]

    # Compressor exit diffuser and annular discharge plenum.  The diffuser is
    # deliberately exposed ahead of the straight-through annular combustor.
    add_annular_shell(
        "Compressor exit diffuser outer wall", 0.33, 1.23, 0.93, 1.20, collection, mats["machined"],
        inner1=1.15, outer1=1.39, start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=80, bevel=0.005,
    )
    add_annular_shell(
        "Compressor discharge plenum — cutaway", 0.78, 1.39, 1.13, 1.31, collection, mats["casing"],
        inner1=1.16, outer1=1.42, start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=80, bevel=0.004,
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

    # The straight-through annular combustor receives 30 nozzle bodies from a
    # continuous manifold.  This follows published topology, not proprietary
    # cup geometry or calibrated fuel-flow data.
    # The fuel manifold intentionally stays a full ring: all 30 nozzles (interior
    # parts, kept full by cutaway convention) tap into it, so arcing it would
    # orphan ten feed pipes.  Fuel-distribution readability wins here.
    add_torus("30-nozzle annular fuel manifold", 1.22, 0.042, 1.20, external, mats["brass"], major_segments=96, minor_segments=10)
    add_torus("Fuel-manifold retaining strap", 1.27, 0.011, 1.12, external, mats["machined"], major_segments=80, minor_segments=6)
    # GE public LM2500 material describes thirty fuel nozzles.
    nozzle_count = 30 if not quick else 18
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
        cup = add_cone(
            f"Fuel nozzle {index + 1:02d} — airblast swirler cup", 0.128, 0.084, 0.14, 1.70,
            collection, mats["nickel"], y=y, z=z, vertices=24, bevel=0.002,
        )
        tag(cup, "illustrative airblast fuel-nozzle swirler cup", "combustor")
        add_torus(
            f"Fuel nozzle {index + 1:02d} — mounting flange", 0.087, 0.010, 1.17,
            collection, mats["machined"], major_segments=24, minor_segments=6, y=y, z=z,
        )
        manifold = radial_point(1.20, 1.22, theta)
        pipe_points = [manifold, (1.24, 1.06 * math.cos(theta), 1.06 * math.sin(theta)), (1.29, y, z)]
        add_tube(f"Fuel feed pipe {index + 1:02d}", pipe_points, 0.014, external, mats["brass"], resolution=2)

    blade_row(
        "Thirty-cup primary-zone radial swirler", 1.57, 0.59, 1.00, 30, 0.27, 55.0, -8.0, 0.038,
        collection, mats["nickel"], row_kind="combustor swirler vane", stage="combustor", phase=math.radians(7), quick=quick,
    )
    add_annular_shell(
        "Swirler inner support", 1.45, 1.66, 0.43, 0.60, collection, mats["machined"], segments=48, bevel=0.003,
    )
    add_annular_shell(
        "Swirler outer support", 1.45, 1.66, 1.00, 1.06, collection, mats["machined"], segments=64, bevel=0.003,
    )

    # Real combustor liners have several differently sized cooling zones;
    # the visible hole pattern is qualitative and intentionally not OEM data.
    cooling_holes("Outer liner primary-zone", (1.69, 1.84), 1.135, 0.020, collection, mats["dark"], holes_per_ring=30, quick=quick, start_offset=0.08)
    cooling_holes("Outer liner dilution-zone", (2.33, 2.55, 2.77), 1.115, 0.031, collection, mats["dark"], holes_per_ring=22, quick=quick, start_offset=0.21)
    cooling_holes("Inner liner film-zone", (1.77, 2.02, 2.42, 2.85), 0.505, 0.017, collection, mats["dark"], holes_per_ring=26, quick=quick, start_offset=0.12)
    for x in (1.72, 2.16, 2.60, 3.02):
        arc_tube(f"Combustor liner cooling rail at {x:+.2f}", x, 1.115, 0.012, collection, mats["nickel"])

    # Two igniters are deliberately distinct from fuel injectors: ceramic body, metal shell, and harness.
    for index, theta in enumerate((math.radians(62), math.radians(118))):
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


def add_hpt_cooling_blade_detail(
    x: float,
    root: float,
    tip: float,
    phase: float,
    collection: bpy.types.Collection,
    mats: Dict[str, bpy.types.Material],
) -> None:
    """Expose an illustrative cooling-passage section in one first-stage blade.

    The passage arrangement is intentionally a qualitative teaching detail.
    NASA heat-transfer literature supports serpentine internal passages and
    film-cooling exits, but it does not disclose LM2500 blade geometry.
    """
    sectioned_blade = airfoil_mesh(
        "HPT Stage 1 — transparent cooling-blade section", x, root, tip - 0.025,
        0.27, 20.0, -8.0, 0.024, collection, mats["glass"],
        span_segments=9, chord_segments=16, sweep=0.025, lean=-0.010,
    )
    sectioned_blade.rotation_euler = (phase, 0.0, 0.0)
    tag(sectioned_blade, "illustrative sectioned air-cooled turbine blade", "HPT Stage 1")
    sectioned_blade["note"] = "Qualitative serpentine passage visualization; not OEM cooling geometry."

    for channel_index, angle_offset in enumerate((-0.035, 0.0, 0.035)):
        theta = phase + angle_offset
        r0, r1, r2, r3 = root + 0.11, root + 0.33, tip - 0.30, tip - 0.075
        points = (
            radial_point(x - 0.060, r0, theta),
            radial_point(x + 0.068, r1, theta),
            radial_point(x - 0.052, r2, theta),
            radial_point(x + 0.034, r3, theta),
        )
        tube = add_tube(
            f"HPT Stage 1 cooling passage {channel_index + 1}", points, 0.010,
            collection, mats["brass"], resolution=2,
        )
        tag(tube, "illustrative internal serpentine cooling passage", "HPT Stage 1")
        exit_start = radial_point(x + 0.034, r3, theta)
        exit_end = radial_point(x + 0.034, tip - 0.010, theta)
        film_exit = cylinder_between(
            f"HPT Stage 1 film-cooling exit {channel_index + 1}", exit_start, exit_end,
            0.012, collection, mats["dark"], vertices=10,
        )
        tag(film_exit, "illustrative film cooling exit", "HPT Stage 1")


def build_turbine(
    cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material], quick: bool
) -> None:
    """Build two cooled HPT stages followed by six free-power stages."""
    hpt = cols["05 • High-Pressure Turbine"]
    fpt = cols["06 • Free Power Turbine & Exhaust"]
    seals = cols["07 • Shafts, Bearings & Seals"]
    casing = cols["09 • Cutaway Casing"]
    external = cols["08 • External Systems & Fasteners"]

    # Cooling-air distribution collars make the public high-level statement
    # “air-cooled HPT” legible without asserting proprietary passage layouts.
    for collar_index, (collar_x, vane_x, radius) in enumerate(((3.55, 3.67, 1.35), (4.19, 4.33, 1.31))):
        arc_tube(
            f"HPT cooling-air distribution collar {collar_index + 1}", collar_x, radius, 0.023,
            hpt, mats["machined"],
        )
        for feed_index, theta_deg in enumerate((252.0, 276.0, 300.0, 324.0)):
            theta = math.radians(theta_deg)
            feed = cylinder_between(
                f"HPT cooling-air feed {collar_index + 1}-{feed_index + 1}",
                radial_point(collar_x, radius, theta), radial_point(vane_x, radius - 0.16, theta),
                0.017, hpt, mats["machined"], vertices=12,
            )
            tag(feed, "illustrative HPT cooling-air feed", f"HPT Stage {collar_index + 1}")

    # The GE LM2500 public configuration identifies two air-cooled HPT stages.
    hpt_stages = (
        ("HPT Stage 1", 3.67, 0.43, 1.18, 18, 0.27),
        ("HPT Stage 2", 4.33, 0.40, 1.14, 18, 0.25),
    )
    hpt_rows = []
    for stage, stator_x, root, _tip, count, chord in hpt_stages:
        hpt_rows.extend((
            (f"{stage} nozzle guide vane", stator_x, root + 0.060, count - 4, chord * 0.93, -28.0, 6.0, 0.026),
            (f"{stage} rotor", stator_x + 0.305, root, count, chord, 20.0, -8.0, 0.024),
        ))
    hpt_clearance = validate_blade_row_schedule(hpt_rows, label="two-stage HPT")
    bpy.context.scene["hpt_visual_min_clearance"] = round(hpt_clearance, 5)

    for index, (stage, stator_x, root, tip, count, chord) in enumerate(hpt_stages):
        phase = math.radians(13.0 + 9.0 * index)
        blade_row(
            f"{stage} air-cooled nozzle guide vane", stator_x, root + 0.06, tip, count - 4, chord * 0.93,
            -28.0, 6.0, 0.026, hpt, mats["nickel"], row_kind="air-cooled nozzle guide vane", stage=stage,
            phase=phase, quick=quick, sweep=-0.018,
        )
        add_radial_hardware_instances(
            f"{stage} vane outer hook", stator_x, tip + 0.035, count - 4,
            (chord * 0.18, 0.046, 0.082), hpt, mats["machined"],
            phase=phase, component="turbine nozzle-vane casing attachment", stage=stage, quick=quick,
        )
        add_annular_shell(
            f"{stage} nozzle outer band", stator_x - 0.145, stator_x + 0.145,
            tip, tip + 0.075, hpt, mats["coated"], start=CUTAWAY_START,
            sweep=CUTAWAY_SWEEP, segments=72, bevel=0.003,
        )
        add_annular_shell(
            f"{stage} nozzle inner band", stator_x - 0.145, stator_x + 0.145,
            root - 0.06, root + 0.07, hpt, mats["nickel"], segments=56, bevel=0.003,
        )
        rotor_x = stator_x + 0.305
        blade_platform_ring(
            f"{stage} turbine disk", rotor_x, root, 0.22, hpt, mats["machined"],
            inner_radius=0.25, outer_margin=0.095,
        )
        blade_row(
            f"{stage} air-cooled rotor", rotor_x, root, tip - 0.025, count, chord, 20.0, -8.0, 0.024,
            hpt, mats["coated"], row_kind="air-cooled rotating turbine blade", stage=stage,
            phase=phase + math.radians(4), quick=quick, sweep=0.025, lean=-0.010,
            omit_angles=(math.radians(158.0),) if index == 0 else (),
            omit_tolerance=math.radians(7.0) if index == 0 else 0.0,
        )
        add_radial_hardware_instances(
            f"{stage} blade-root platform", rotor_x + chord * 0.016, root + 0.045, count,
            (chord * 0.29, 0.052, 0.118), hpt, mats["machined"],
            phase=phase + math.radians(4), component="turbine blade root platform", stage=stage, quick=quick,
            omit_angles=(math.radians(158.0),) if index == 0 else (),
            omit_tolerance=math.radians(7.0) if index == 0 else 0.0,
        )
        add_radial_hardware_instances(
            f"{stage} retention lug", rotor_x - chord * 0.030, root - 0.020, count,
            (chord * 0.18, 0.067, 0.084), hpt, mats["nickel"],
            phase=phase + math.radians(4), component="illustrative turbine blade retention lug", stage=stage, quick=quick,
            omit_angles=(math.radians(158.0),) if index == 0 else (),
            omit_tolerance=math.radians(7.0) if index == 0 else 0.0,
        )
        add_turbine_tip_shrouds(
            stage, rotor_x, tip, count, chord, hpt, mats["coated"], phase=phase + math.radians(4), quick=quick,
        )
        add_seal_teeth(
            f"{stage} disk rim seal", rotor_x - 0.17, root + 0.06, seals,
            mats["nickel"], count=6, spacing=0.021, tooth_radius=0.012,
        )
        arc_tube(
            f"{stage} thermal shield forward", stator_x - 0.19, tip + 0.045, 0.017,
            hpt, mats["coated"],
        )
        arc_tube(
            f"{stage} thermal shield aft", rotor_x + 0.18, tip + 0.045, 0.017,
            hpt, mats["coated"],
        )
        cooling_holes(
            f"{stage} shroud impingement", (stator_x - 0.10, stator_x + 0.095), tip + 0.055,
            0.013, hpt, mats["dark"], holes_per_ring=32, quick=quick, start_offset=0.15 + index * 0.12,
        )
        if index == 0:
            # Camera-facing, sectioned blade makes cooling intent readable.
            add_hpt_cooling_blade_detail(rotor_x, root, tip, math.radians(158.0), hpt, mats)

    add_annular_shell(
        "Two-stage HPT case — cutaway", 3.47, 4.88, 1.19, 1.43, casing, mats["casing"],
        inner1=1.12, outer1=1.37, start=CUTAWAY_START, sweep=CUTAWAY_SWEEP,
        segments=112, bevel=0.009,
    )
    casing_flange("HPT case split flange", 4.13, 1.38, external, mats, bolt_count=30, quick=quick)

    # An annular transition separates the gas-generator turbine from the
    # mechanically independent free power turbine.
    add_annular_shell(
        "Interturbine transition duct — cutaway", 4.80, 5.14, 0.98, 1.22,
        fpt, mats["hot_liner"], inner1=0.94, outer1=1.28,
        start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=80, bevel=0.004,
    )
    add_annular_shell(
        "Free-power turbine inlet case — cutaway", 4.82, 5.20, 1.20, 1.40,
        casing, mats["casing"], inner1=1.18, outer1=1.43,
        start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=80, bevel=0.008,
    )

    # The public LM2500 topology uses six free-power turbine stages.  Stage
    # spacing, blade counts and profiles are intentionally visual proxies.
    power_stage_count = 6
    power_first_x = 5.20
    power_pitch = 0.580
    power_records = []
    for index in range(power_stage_count):
        t = index / (power_stage_count - 1)
        stage = f"Free Power Turbine Stage {index + 1:02d}"
        stator_x = power_first_x + power_pitch * index
        root = 0.365 + 0.038 * t
        tip = 1.135 + 0.205 * t
        count = 16
        chord = 0.285 + 0.006 * t
        power_records.append((stage, stator_x, root, tip, count, chord))

    free_power_rows = []
    for stage, stator_x, root, _tip, count, chord in power_records:
        free_power_rows.extend((
            (f"{stage} nozzle guide vane", stator_x, root + 0.052, count - 4, chord * 0.93, -24.0, 5.0, 0.024),
            (f"{stage} rotor", stator_x + 0.300, root, count, chord, 18.0, -6.0, 0.023),
        ))
    free_power_clearance = validate_blade_row_schedule(free_power_rows, label="six-stage free-power turbine")
    bpy.context.scene["free_power_visual_min_clearance"] = round(free_power_clearance, 5)

    for index, (stage, stator_x, root, tip, count, chord) in enumerate(power_records):
        phase = math.radians(22.0 + 7.0 * index)
        blade_row(
            f"{stage} nozzle guide vane", stator_x, root + 0.052, tip, count - 4, chord * 0.93,
            -24.0, 5.0, 0.024, fpt, mats["nickel"], row_kind="free power turbine nozzle guide vane",
            stage=stage, phase=phase, quick=quick, sweep=-0.012,
        )
        add_radial_hardware_instances(
            f"{stage} vane outer hook", stator_x, tip + 0.032, count - 4,
            (chord * 0.17, 0.042, 0.078), fpt, mats["machined"],
            phase=phase, component="free-power nozzle-vane casing attachment", stage=stage, quick=quick,
        )
        add_annular_shell(
            f"{stage} nozzle outer band", stator_x - 0.135, stator_x + 0.135,
            tip, tip + 0.068, fpt, mats["nickel"], start=CUTAWAY_START,
            sweep=CUTAWAY_SWEEP, segments=64, bevel=0.002,
        )
        add_annular_shell(
            f"{stage} nozzle inner band", stator_x - 0.135, stator_x + 0.135,
            root - 0.055, root + 0.062, fpt, mats["machined"], segments=48, bevel=0.002,
        )
        rotor_x = stator_x + 0.300
        blade_platform_ring(
            f"{stage} rotor disk", rotor_x, root, 0.205, fpt, mats["machined"],
            inner_radius=0.25, outer_margin=0.090,
        )
        blade_row(
            f"{stage} rotor", rotor_x, root, tip - 0.025, count, chord, 18.0, -6.0, 0.023,
            fpt, mats["nickel"], row_kind="free power turbine rotating blade", stage=stage,
            phase=phase + math.radians(4), quick=quick, sweep=0.020, lean=-0.008,
        )
        add_radial_hardware_instances(
            f"{stage} blade-root platform", rotor_x + chord * 0.018, root + 0.043, count,
            (chord * 0.28, 0.050, 0.112), fpt, mats["machined"],
            phase=phase + math.radians(4), component="free-power turbine blade root platform", stage=stage, quick=quick,
        )
        add_radial_hardware_instances(
            f"{stage} retention lug", rotor_x - chord * 0.030, root - 0.020, count,
            (chord * 0.17, 0.064, 0.082), fpt, mats["nickel"],
            phase=phase + math.radians(4), component="illustrative free-power blade retention lug", stage=stage, quick=quick,
        )
        add_turbine_tip_shrouds(
            stage, rotor_x, tip, count, chord, fpt, mats["nickel"], phase=phase + math.radians(4), quick=quick,
        )
        add_seal_teeth(
            f"{stage} disk rim seal", rotor_x - 0.15, root + 0.055, seals,
            mats["nickel"], count=5, spacing=0.020, tooth_radius=0.011,
        )
        if index in (1, 3, 5):
            add_torus(
                f"{stage} shroud seal carrier", tip + 0.047, 0.014, rotor_x + 0.14,
                fpt, mats["machined"], major_segments=64, minor_segments=7,
            )

    add_annular_shell(
        "Six-stage free-power turbine case — cutaway", 4.96, 8.56, 1.20, 1.43,
        casing, mats["casing"], inner1=1.18, outer1=1.63,
        start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=176, bevel=0.009,
    )
    for ring_index in range(power_stage_count):
        _, stator_x, _, tip, _, _ = power_records[ring_index]
        add_annular_shell(
            f"Free-power casing stiffener {ring_index + 1:02d}", stator_x - 0.022, stator_x + 0.022,
            tip + 0.035, tip + 0.115, casing, mats["machined"],
            start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=48, bevel=0.002,
        )
    casing_flange("Free-power turbine forward case flange", 5.03, 1.42, external, mats, bolt_count=30, quick=quick)
    casing_flange("Free-power turbine aft case flange", 6.90, 1.55, external, mats, bolt_count=32, quick=quick)
    casing_flange("Free-power turbine exhaust case flange", 8.47, 1.64, external, mats, bolt_count=32, quick=quick)


def build_shaft_bearings_and_exhaust(
    cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material], quick: bool
) -> None:
    """Build concentric gas-generator and free-power shafts, bearings and tail."""
    collection = cols["07 • Shafts, Bearings & Seals"]
    exhaust = cols["06 • Free Power Turbine & Exhaust"]
    casing = cols["09 • Cutaway Casing"]
    external = cols["08 • External Systems & Fasteners"]

    # The gas generator and free power turbine are visually separated at the
    # interturbine station to make the LM2500-style two-spool architecture clear.
    add_axial_cylinder("Gas-generator high-pressure shaft", 0.155, 9.58, 0.08, collection, mats["machined"], vertices=64, bevel=0.003)
    add_annular_shell(
        "Gas-generator shaft thermal sleeve", -0.66, 4.85, 0.158, 0.215,
        collection, mats["titanium"], segments=96, bevel=0.003,
    )
    add_annular_shell(
        "Free-power turbine hollow shaft", 4.84, 9.62, 0.080, 0.235,
        collection, mats["titanium"], segments=96, bevel=0.003,
    )
    add_axial_cylinder("Free-power output shaft core", 0.078, 5.06, 7.09, collection, mats["machined"], vertices=48, bevel=0.002)
    add_torus("Interturbine shaft separation seal", 0.245, 0.026, 4.85, collection, mats["nickel"], major_segments=56, minor_segments=8)

    bearings = (
        (-4.66, "No. 1 front"),
        (-2.35, "No. 2 compressor"),
        (0.76, "No. 3 compressor rear"),
        (3.42, "No. 4 HPT front"),
        (4.88, "No. 5 free-turbine front"),
        (7.36, "No. 6 free-turbine rear"),
    )
    for x, name in bearings:
        add_torus(f"{name} bearing race", 0.31, 0.052, x, collection, mats["machined"], major_segments=56, minor_segments=12)
        balls = 10 if quick else 18
        for index in range(balls):
            theta = TAU * index / balls
            roller = add_uv_sphere(
                f"{name} bearing roller {index + 1:02d}", 0.036,
                radial_point(x, 0.31, theta), collection, mats["nickel"], segments=12,
            )
            tag(roller, "rolling bearing element", name)
        add_annular_shell(
            f"{name} bearing housing", x - 0.11, x + 0.11, 0.34, 0.48,
            collection, mats["casing"], segments=48, bevel=0.003,
        )
        add_annular_shell(
            f"{name} bearing cage — cutaway", x - 0.074, x + 0.074, 0.266, 0.292,
            collection, mats["nickel"], start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=48, bevel=0.002,
        )
        for strut_index in range(6):
            theta = TAU * strut_index / 6 + math.radians(7)
            strut = cylinder_between(
                f"{name} bearing-support web {strut_index + 1}",
                radial_point(x, 0.47, theta), radial_point(x, 0.69, theta), 0.015,
                collection, mats["machined"], vertices=10,
            )
            tag(strut, "bearing support web", name)
    for seal_index, x in enumerate((-4.44, -0.22, 3.18, 4.69, 8.20)):
        add_seal_teeth(
            f"Shaft cavity seal {seal_index + 1}", x, 0.255,
            collection, mats["nickel"], count=5, spacing=0.017, tooth_radius=0.009,
        )

    # Exhaust frame, cone and output coupling follow the sixth free-power stage.
    add_annular_shell(
        "Power-turbine exhaust transition case — cutaway", 8.56, 9.28, 1.24, 1.64,
        casing, mats["casing"], inner1=1.02, outer1=1.31,
        start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=96, bevel=0.008,
    )
    add_cone("Exhaust centrebody plug", 0.52, 0.075, 1.52, 9.02, exhaust, mats["nickel"], vertices=64, bevel=0.004)
    add_annular_shell(
        "Exhaust nozzle shell — cutaway", 9.12, 9.92, 0.98, 1.32,
        exhaust, mats["machined"], inner1=0.76, outer1=0.96,
        start=CUTAWAY_START, sweep=CUTAWAY_SWEEP, segments=96, bevel=0.006,
    )
    arc_tube("Exhaust nozzle rolled lip", 9.92, 0.86, 0.048, exhaust, mats["machined"], resolution=6)
    strut_count = 6 if quick else 10
    for index in range(strut_count):
        theta = TAU * index / strut_count + math.radians(9)
        start = radial_point(8.72, 0.37, theta)
        end = radial_point(9.04, 1.13, theta + math.radians(7))
        cylinder_between(
            f"Exhaust frame support strut {index + 1:02d}", start, end, 0.037,
            exhaust, mats["machined"], vertices=12, bevel=0.003,
        )
    add_axial_cylinder("Free-power output coupling", 0.33, 0.30, 9.65, exhaust, mats["machined"], vertices=48, bevel=0.005)
    add_torus("Free-power output coupling flange", 0.34, 0.036, 9.79, exhaust, mats["machined"], major_segments=56, minor_segments=9)

    # Oil feed and scavenge routing make the bearing cavities serviceable.
    add_tube("Front-bearing oil feed", [(-4.67, -0.38, 0.16), (-4.30, -1.25, 0.22), (-3.55, -1.46, -0.14)], 0.028, external, mats["copper"], resolution=3)
    add_tube("HPT bearing oil scavenge", [(3.42, -0.38, 0.12), (3.74, -1.20, -0.02), (3.24, -1.51, -0.27)], 0.030, external, mats["copper"], resolution=3)
    add_tube("Free-power rear bearing scavenge", [(7.36, -0.40, 0.12), (7.70, -1.30, -0.03), (7.22, -1.58, -0.26)], 0.032, external, mats["copper"], resolution=3)

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

    # Removable service covers, recessed into the retained upper casing, add
    # believable inspection and harness interfaces without claiming OEM layouts.
    service_panels = (
        ("Forward compressor access panel", -3.72, 1.78, 76.0, 0.46, 0.24),
        ("Variable-geometry actuator cover", -2.52, 1.64, 88.0, 0.42, 0.21),
        ("Combustor instrumentation cover", 2.54, 1.50, 82.0, 0.48, 0.23),
        ("HPT instrumentation cover", 4.46, 1.46, 77.0, 0.43, 0.21),
        ("Free-power turbine inspection cover", 6.93, 1.66, 91.0, 0.56, 0.24),
    )
    for panel_index, (name, x, radius, theta_deg, length, height) in enumerate(service_panels):
        theta = math.radians(theta_deg)
        panel = add_cube(
            name, (length, 0.025, height), radial_point(x, radius + 0.025, theta),
            collection, mats["machined"], rotation=(theta, 0.0, 0.0), bevel=0.012,
        )
        tag(panel, "generic removable casing service cover")
        tangent = Vector((0.0, -math.sin(theta), math.cos(theta)))
        normal = Vector((0.0, math.cos(theta), math.sin(theta)))
        for bolt_index, (dx, dz) in enumerate(((-length * 0.39, -height * 0.34), (-length * 0.39, height * 0.34), (length * 0.39, -height * 0.34), (length * 0.39, height * 0.34))):
            centre = Vector(radial_point(x + dx, radius + 0.040, theta)) + tangent * dz
            bolt = cylinder_between(
                f"{name} — captive fastener {bolt_index + 1}", tuple(centre), tuple(centre + normal * 0.052),
                0.019, collection, mats["machined"], vertices=6, bevel=0.002,
            )
            tag(bolt, "captive service-panel fastener")

    # Lift lugs make the casing serviceable rather than a clean concept sculpture.
    for index, x in enumerate((-3.83, 0.44, 3.94, 7.36)):
        block = add_cube(f"Service lift lug {index + 1}", (0.18, 0.15, 0.36), (x, 0.0, 1.70 if x < 1.0 else 1.48), collection, mats["machined"], bevel=0.018)
        tag(block, "lifting lug")
        add_torus(f"Service lift lug eye {index + 1}", 0.066, 0.016, x, collection, mats["machined"], major_segments=32, minor_segments=8, y=0.0, z=(1.86 if x < 1.0 else 1.64))

    # Two raised external fuel feed lines cross the casing toward the annular manifold.
    add_tube("Main fuel supply line", [(-0.58, -1.75, 0.06), (0.31, -1.82, 0.25), (0.98, -1.55, 0.77), (1.20, -1.22, 0.88)], 0.035, collection, mats["brass"], resolution=3)
    add_tube("Fuel return line", [(-0.43, -1.80, -0.18), (0.48, -1.83, -0.32), (1.06, -1.34, -0.82), (1.20, -1.17, -0.91)], 0.022, collection, mats["copper"], resolution=3)

    # A few low-profile pressure, oil and electrical runs make the exterior
    # serviceable.  Routing is intentionally illustrative, not a maintenance
    # manual or a claim about the proprietary engine plumbing layout.
    service_runs = (
        ("Compressor pressure-sense line", ((-2.85, -1.43, 0.75), (-1.80, -1.66, 0.91), (-0.78, -1.60, 0.78), (0.36, -1.49, 0.52)), 0.014, "machined"),
        ("Turbine cooling-air sense line", ((1.78, -1.41, 1.06), (2.72, -1.62, 1.18), (3.42, -1.48, 0.89), (3.67, -1.25, 0.62)), 0.017, "copper"),
        ("Free-power speed-probe harness", ((5.08, -1.42, 0.74), (5.86, -1.72, 0.70), (6.64, -1.70, 0.46), (7.30, -1.43, 0.22)), 0.013, "rubber"),
        ("Oil vent return line", ((0.12, -1.55, -0.44), (1.64, -1.70, -0.58), (2.88, -1.56, -0.43), (3.35, -1.39, -0.24)), 0.018, "copper"),
    )
    for name, points, radius, material_name in service_runs:
        run = add_tube(name, points, radius, collection, mats[material_name], resolution=3)
        tag(run, "illustrative external service run")


def build_cutaway_edges(
    cols: Dict[str, bpy.types.Collection], mats: Dict[str, bpy.types.Material]
) -> None:
    """Bright machined lips mark the deliberate section plane through each outer case."""
    collection = cols["09 • Cutaway Casing"]
    shells = (
        (-5.69, -4.78, 2.08, 1.85),
        (-4.78, 0.46, 1.78, 1.20),
        (1.12, 3.36, 1.48, 1.40),
        (3.47, 4.88, 1.43, 1.37),
        (4.96, 8.56, 1.43, 1.63),
        (8.56, 9.28, 1.64, 1.31),
        (9.12, 9.92, 1.32, 0.96),
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
    for index, x in enumerate((-3.25, 7.25)):
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
        (-5.15, "INLET / IGV"),
        (-3.45, "HPC 01–06 VSV"),
        (-1.05, "HPC 07–16"),
        (2.20, "30-NOZZLE ANNULAR COMBUSTOR"),
        (4.15, "2-STAGE AIR-COOLED HPT"),
        (6.72, "6-STAGE FREE POWER TURBINE"),
        (9.46, "EXHAUST"),
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
    target = (1.72, 0.0, -0.10)
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
    camera.location = (19.4, -24.0, 8.8)
    look_at(camera, target)
    bpy.context.scene.camera = camera

    detail_data = bpy.data.cameras.new("Combustor Detail Camera")
    detail_data.lens = 68
    detail = bpy.data.objects.new("Combustor Detail Camera", detail_data)
    collection.objects.link(detail)
    detail.location = (6.5, -9.2, 3.8)
    look_at(detail, (2.15, -0.15, 0.0))

    hpt_detail_data = bpy.data.cameras.new("HPT Cooling Detail Camera")
    hpt_detail_data.lens = 76
    hpt_detail = bpy.data.objects.new("HPT Cooling Detail Camera", hpt_detail_data)
    collection.objects.link(hpt_detail)
    hpt_detail.location = (8.25, -10.4, 3.30)
    look_at(hpt_detail, (4.03, -0.04, 0.02))

    # Large soft sources mimic a premium product/engineering studio; warm key, cool rim, low fill.
    add_area_light("Key — warm overhead", (1.4, -7.6, 11.5), target, 2050.0, 8.5, (1.0, 0.61, 0.35, 1), collection)
    add_area_light("Rim — cool back", (8.5, 8.5, 7.6), (3.4, 0.0, 0.4), 1800.0, 5.5, (0.22, 0.55, 1.0, 1), collection)
    add_area_light("Fill — neutral front", (-8.5, -6.2, 3.5), (-2.5, 0.0, -0.3), 1350.0, 5.0, (0.75, 0.84, 1.0, 1), collection)
    add_area_light("Interior — combustion glow", (2.30, -0.9, 0.25), (2.30, 0.0, 0.0), 320.0, 2.2, (1.0, 0.14, 0.015, 1), collection)
    add_area_light("Long top strip", (1.0, 1.5, 8.0), (1.4, 0.0, 0.0), 1050.0, 11.5, (0.92, 0.95, 1.0, 1), collection)

    # A small emissive engineering placard placed far below the frame is useful in viewport orientation.
    plaque = add_cube("Model information plaque", (4.40, 0.08, 0.72), (1.55, 1.88, -1.72), cols["00 • Environment"], mats["casing"], bevel=0.035)
    tag(plaque, "informational plaque")
    add_text_label("Plaque title", "LM2500-CLASS TOPOLOGY — CUTAWAY", (0.85, 1.82, -1.73), cols["00 • Environment"], mats["label"], size=0.14)
    add_text_label("Plaque subtitle", "PUBLIC-DATA STRUCTURAL VISUALISATION — NOT OEM CAD OR CFD", (0.85, 1.81, -2.00), cols["00 • Environment"], mats["label"], size=0.072)
    return camera



def add_display_rotation_animation(cols: Dict[str, bpy.types.Collection]) -> None:
    """Add a lightweight, clearly non-physical rotor playback animation.

    Geometry remains separated into stationary casing/stator hardware and two
    independently rotating assemblies.  The intentionally reduced visual rate
    makes the motion legible in Blender's viewport; it is not an RPM, dynamics,
    power, bearing-load, or control-system prediction.
    """
    scene = bpy.context.scene
    controllers = cols["12 • Animation Controllers"]

    # This makes the helper idempotent when it is used to upgrade an already
    # generated .blend: detach children from old identity controllers first.
    for old_name in ("Gas Generator Rotor — visual-speed controller", "Free Power Rotor — visual-speed controller"):
        old = bpy.data.objects.get(old_name)
        if old is not None:
            for child in list(old.children):
                child.parent = None
            bpy.data.objects.remove(old, do_unlink=True)

    gas_generator = bpy.data.objects.new("Gas Generator Rotor — visual-speed controller", None)
    free_power = bpy.data.objects.new("Free Power Rotor — visual-speed controller", None)
    controllers.objects.link(gas_generator)
    controllers.objects.link(free_power)
    for controller, label in ((gas_generator, "gas-generator rotor"), (free_power, "free-power rotor")):
        controller.empty_display_type = "SINGLE_ARROW"
        controller.empty_display_size = 0.30
        controller["component"] = label + " animation controller"
        controller["animation_scope"] = "Display-only reduced-speed motion; not a physical operating speed."

    gas_components = {
        "rotating compressor blade",
        "compressor blade root platform",
        "illustrative compressor blade retention lug",
        "air-cooled rotating turbine blade",
        "turbine blade root platform",
        "illustrative turbine blade retention lug",
        "illustrative sectioned air-cooled turbine blade",
        "illustrative internal serpentine cooling passage",
        "illustrative film cooling exit",
    }
    free_components = {
        "free power turbine rotating blade",
        "free-power turbine blade root platform",
        "illustrative free-power blade retention lug",
    }

    def is_gas_generator_part(obj: bpy.types.Object) -> bool:
        if obj.get("component") in gas_components:
            return True
        if obj.name in {"Compressor spinner", "Gas-generator high-pressure shaft", "Gas-generator shaft thermal sleeve"}:
            return True
        return (
            (obj.name.startswith("HPC Stage ") and "rotor disk" in obj.name)
            or (obj.name.startswith("HPT Stage ") and ("turbine disk" in obj.name or "tip shroud" in obj.name))
        )

    def is_free_power_part(obj: bpy.types.Object) -> bool:
        if obj.get("component") in free_components:
            return True
        if obj.name in {"Free-power turbine hollow shaft", "Free-power output shaft core", "Free-power output coupling", "Free-power output coupling flange"}:
            return True
        return obj.name.startswith("Free Power Turbine Stage ") and ("rotor disk" in obj.name or "tip shroud" in obj.name)

    gas_count = 0
    free_count = 0
    for obj in list(bpy.data.objects):
        if obj == gas_generator or obj == free_power:
            continue
        if is_gas_generator_part(obj):
            obj.parent = gas_generator
            gas_count += 1
        elif is_free_power_part(obj):
            obj.parent = free_power
            free_count += 1

    scene.frame_start = 1
    scene.frame_end = 181
    scene.render.fps = 30
    scene.render.fps_base = 1.0

    def animate(controller: bpy.types.Object, turns: float, visual_rpm: int) -> None:
        controller.rotation_mode = "XYZ"
        controller.rotation_euler = (0.0, 0.0, 0.0)
        controller.keyframe_insert(data_path="rotation_euler", index=0, frame=scene.frame_start)
        controller.rotation_euler.x = TAU * turns
        controller.keyframe_insert(data_path="rotation_euler", index=0, frame=scene.frame_end)
        action = controller.animation_data.action if controller.animation_data else None
        if action:
            for curve in action.fcurves:
                for point in curve.keyframe_points:
                    point.interpolation = "LINEAR"
                curve.modifiers.new("CYCLES")
        controller["visual_turns_per_loop"] = turns
        controller["visual_equivalent_rpm"] = visual_rpm
        controller["note"] = "Display only — deliberately reduced to make rotation readable; not an LM2500 operating RPM."

    # Six seconds at 30 fps (frames 1-181 = 180 steps).  Per-frame travel stays
    # below half the smallest *rotating*-row pitch: the gas generator advances
    # 5.0 deg/frame against a minimum half-pitch of 5.45 deg (HPC stage 16, 33
    # blades); the free-power rotor advances 4.0 deg/frame against 11.25 deg
    # (16 blades).  Higher rates make repeated blade patterns strobe and can
    # falsely look stationary or reverse.  These are display-only speeds.
    animate(gas_generator, turns=2.5, visual_rpm=25)
    animate(free_power, turns=2.0, visual_rpm=20)
    scene.frame_set(scene.frame_start)
    scene["animation_scope"] = "Frame 1–181 looping display animation: independent reduced-speed gas-generator and free-power rotor motion only; not a physical simulation."
    scene["animation_controller_counts"] = f"gas-generator={gas_count}; free-power={free_count}"

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
        scene.cycles.samples = args.samples if args.samples > 0 else (64 if args.quick else 192)
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
    scene.unit_settings.scale_length = 0.51
    scene["asset_name"] = "LM2500-class public-topology axial gas turbine cutaway"
    scene["asset_scope"] = "Public-data-calibrated structural visualisation; not OEM CAD, CFD, FEA, thermal analysis, or manufacturing data."
    scene["reference_basis"] = "Public GE LM2500 architecture: 16-stage axial compressor, first six VSV rows, 30 fuel nozzles in an annular combustor, 2 air-cooled HPT stages, 6 free-power turbine stages."
    scene["detail_pass"] = "Blade-root platforms and retention lugs, stator hooks, VSV unison rails, nozzle cups, bearing cages, service covers and illustrative external runs were added for inspectable cutaway detail."
    scene["public_reference_url"] = "https://www.geaerospace.com/sites/default/files/2023-11/LM2500-Datasheet.pdf"
    scene["cutaway_sector_degrees"] = 120
    scene["generator"] = "blender/generate_gas_turbine.py"


def attach_model_notes(args: argparse.Namespace) -> None:
    """Embed provenance and scope limits inside the delivered .blend file."""
    notes = bpy.data.texts.get("MODEL NOTES — READ ME") or bpy.data.texts.new("MODEL NOTES — READ ME")
    notes.clear()
    notes.write(
        "LM2500-CLASS AXIAL GAS TURBINE CUTAWAY\n"
        "=======================================\n\n"
        "Generated procedurally by blender/generate_gas_turbine.py.\n\n"
        "PUBLIC-REFERENCE TOPOLOGY\n"
        "This editable visualisation is calibrated to published GE LM2500 architecture:\n"
        "• inlet guide vanes and a 16-stage axial compressor;\n"
        "• the first six compressor stator rows modelled as variable stator vanes;\n"
        "• a straight-through annular combustor with a 30-nozzle manifold;\n"
        "• two air-cooled high-pressure turbine stages; and\n"
        "• six mechanically independent free-power turbine stages.\n\n"
        "Primary public source: GE Aerospace LM2500 datasheet, November 2023\n"
        "https://www.geaerospace.com/sites/default/files/2023-11/LM2500-Datasheet.pdf\n"
        "Architecture / evolution context: GE Aerospace, Technological evolution\n"
        "of the LM2500 aeroderivative gas turbine.\n"
        "https://www.geaerospace.com/news/press-releases/marine-industrial-engines/technological-evolution-popular-aeroderivative-gas-turbine\n\n"
        "WHAT IS MODELLED\n"
        "Sixteen compressor rotor/stator pairs, individual visual root platforms and\n"
        "retention lugs, stator casing hooks, six VSV actuation collars, generic\n"
        "unison rails / bellcranks / servo cylinders, thirty numbered injectors with\n"
        "airblast cups and mounting flanges, annular fuel manifold, diffuser, liners,\n"
        "qualitative liner perforations, two igniters, HPT cooling passage teaching\n"
        "detail and cooling collars, six free-power rows, split casing, removable\n"
        "service covers, shaft cavities, bearing cages / webs / races, labyrinth\n"
        "seals, exhaust frame, service pipes, sensors and fasteners.\n"
        "The generator also rejects staged blade envelopes with insufficient\n"
        "visual axial or circumferential clearance before it saves the scene.\n\n"
        "VIEWPORT ANIMATION\n"
        "Default builds animate frame 1–181 at 30 fps.  The gas-generator and\n"
        "free-power assemblies are separately parented and loop at deliberately\n"
        "reduced display speeds so their rotation is visible when you press Play\n"
        "or Space in Blender.  This is motion visualization only, not an LM2500\n"
        "operating RPM, load, vibration, thermal, bearing, or controls simulation.\n"
        f"Animation enabled for this build: {'no (--static)' if args.static else 'yes'}\n\n"
        "SCOPE AND SAFETY LIMIT\n"
        "This is a public-data-calibrated structural visualisation, NOT a complete\n"
        "physical simulation, OEM CAD model, certified configuration, CFD result,\n"
        "thermal/structural FEA result, performance map, or manufacturing drawing.\n"
        "Blade profiles, blade counts, exact dimensions, nozzle flow splits, cooling\n"
        "holes/passages, materials, clearances, controls and bearing layout that are\n"
        "not publicly released are illustrative proxies. Do not use this asset for\n"
        "design, maintenance, certification, operational or safety decisions.\n\n"
        "For source notes and verification limits, see blender/REFERENCE_BASIS.md.\n"
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
    if not args.static:
        add_display_rotation_animation(cols)
    else:
        bpy.context.scene["animation_scope"] = "Static build requested with --static; no rotor motion keys were created."
    build_cutaway_edges(cols, mats)
    if args.labels:
        build_optional_labels(cols, mats)
    configure_cameras_and_lights(cols, mats)
    attach_model_notes(args)

    # Make the root collection easy to find in a busy Blender scene.
    root = bpy.data.collections.get("GAS TURBINE — CUTAWAY ASSEMBLY")
    if root:
        root["description"] = "LM2500-class public-topology cutaway; select child collections for editable subsystems. See MODEL NOTES — READ ME."
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
