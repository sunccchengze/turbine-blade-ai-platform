#!/usr/bin/env python3
"""Verify the public-topology claims embedded in the delivered Blender scene.

Run inside Blender Python, for example:

    blender --background blender/output/axial_gas_turbine_cutaway.blend \
      --python blender/validate_blend.py

The script only checks scene structure and naming metadata.  It does *not*
validate aerodynamics, thermodynamics, materials, dimensions, or certification.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import bpy


REQUIRED_COLLECTIONS = {
    "02 • Variable Geometry Compressor — Stages 01–06",
    "03 • High-Pressure Compressor — Stages 07–16",
    "04 • Diffuser & Annular Combustor",
    "05 • High-Pressure Turbine",
    "06 • Free Power Turbine & Exhaust",
    "07 • Shafts, Bearings & Seals",
}


def objects_with_component(component: str):
    return [obj for obj in bpy.data.objects if obj.get("component") == component]


def stations(component: str) -> set[str]:
    return {str(obj.get("station")) for obj in objects_with_component(component) if obj.get("station")}


def main() -> None:
    collection_names = {collection.name for collection in bpy.data.collections}
    nozzle_bodies = [
        obj
        for obj in bpy.data.objects
        if obj.name.startswith("Fuel nozzle ") and obj.name.endswith("— body")
    ]
    compressor_rotor_stations = stations("rotating compressor blade")
    vsv_stations = stations("variable compressor stator vane")
    hpt_rotor_stations = stations("air-cooled rotating turbine blade")
    free_power_stations = stations("free power turbine rotating blade")
    scene = bpy.context.scene
    notes = bpy.data.texts.get("MODEL NOTES — READ ME")

    report = {
        "blend": bpy.data.filepath,
        "blender": bpy.app.version_string,
        "objects": len(bpy.data.objects),
        "meshes": len(bpy.data.meshes),
        "collections_present": sorted(REQUIRED_COLLECTIONS & collection_names),
        "compressor_rotor_stage_count": len(compressor_rotor_stations),
        "vsv_stage_count": len(vsv_stations),
        "fuel_nozzle_body_count": len(nozzle_bodies),
        "hpt_rotor_stage_count": len(hpt_rotor_stations),
        "free_power_rotor_stage_count": len(free_power_stations),
        "has_model_notes": notes is not None,
        "asset_scope": scene.get("asset_scope", ""),
        "reference_basis": scene.get("reference_basis", ""),
        "checks": {},
    }
    checks = {
        "required_collections": REQUIRED_COLLECTIONS <= collection_names,
        "16_compressor_stages": compressor_rotor_stations == {f"HPC Stage {index:02d}" for index in range(1, 17)},
        "first_6_variable_stator_rows": vsv_stations == {f"HPC Stage {index:02d}" for index in range(1, 7)},
        "30_fuel_nozzles": len(nozzle_bodies) == 30,
        "2_hpt_stages": hpt_rotor_stations == {"HPT Stage 1", "HPT Stage 2"},
        "6_free_power_stages": free_power_stations == {f"Free Power Turbine Stage {index:02d}" for index in range(1, 7)},
        "scope_note_embedded": bool(notes and "NOT a complete" in notes.as_string()),
        "scope_property_present": "not OEM CAD" in str(scene.get("asset_scope", "")),
    }
    report["checks"] = checks
    print(json.dumps(report, indent=2, ensure_ascii=False))
    if not all(checks.values()):
        failed = ", ".join(name for name, passed in checks.items() if not passed)
        raise SystemExit(f"Validation failed: {failed}")


if __name__ == "__main__":
    main()
