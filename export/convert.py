#!/usr/bin/env python3
"""
LAHMP Excel → JSON export script.

Reads three Excel workbooks and writes four JSON files into data/.

Usage:
    pip install pandas openpyxl
    python export/convert.py

Run from the repository root. The script is idempotent — re-running overwrites
the JSON files with freshly parsed data.

Expected workbook files (place in the repo root or set LAHMP_DATA_DIR):
    LAHMP_Practice_Matrix.xlsx
    LAHMP_Indicator_Linkage_Matrix.xlsx
    LAHMP_Abiotic_Reference_Table.xlsx

---------------------------------------------------------------------------
Sheet names expected in each workbook
---------------------------------------------------------------------------

LAHMP_Practice_Matrix.xlsx:
    "Practice Matrix"           → practices.json
    "Block 4 Pressures"         → reference.json / block4_pressures
    "Block 5 Challenges"        → reference.json / block5_challenges
    "Block 6 Services"          → reference.json / block6_services
    "IPCC Land Use"             → reference.json / ipcc_land_use_categories
    "IPCC Soil Types"           → reference.json / ipcc_soil_types
    "EFG Options"               → reference.json / efg_options
    "Pressure Challenge Map"    → reference.json / pressure_to_challenge_mapping
    "Challenge Service Map"     → reference.json / challenge_to_service_mapping

LAHMP_Indicator_Linkage_Matrix.xlsx:
    "Indicator Linkage Matrix"  → indicators.json

LAHMP_Abiotic_Reference_Table.xlsx:
    "Abiotic Reference Table"   → abiotic.json

---------------------------------------------------------------------------
Column name conventions in Excel
---------------------------------------------------------------------------
Column headers in all sheets use the exact names listed in the COLUMN_MAP
dictionaries below.  Multi-line headers in Excel appear as a single string
joined by a newline character; this script normalises them by stripping
leading/trailing whitespace and collapsing internal whitespace runs to a
single space.  If you rename a column in Excel, update the matching key in
the COLUMN_MAP here.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path
from typing import Any

try:
    import pandas as pd
except ImportError:
    sys.exit("pandas is required.  Run: pip install pandas openpyxl")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
DATA_DIR = REPO_ROOT / "data"

DATA_DIR.mkdir(exist_ok=True)

# The workbooks may live in the repo root or in a sibling directory specified
# by the LAHMP_DATA_DIR environment variable.
_xlsx_search = [
    Path(os.environ.get("LAHMP_DATA_DIR", REPO_ROOT)),
    REPO_ROOT,
]

def _find_workbook(filename: str) -> Path:
    for d in _xlsx_search:
        p = d / filename
        if p.exists():
            return p
    raise FileNotFoundError(
        f"Cannot find {filename}.  "
        f"Place it in the repo root or set LAHMP_DATA_DIR to its directory."
    )


# ---------------------------------------------------------------------------
# Helper: load a sheet into a DataFrame with normalised column names
# ---------------------------------------------------------------------------

def load_sheet(workbook_path: Path, sheet_name: str) -> pd.DataFrame:
    """Load an Excel sheet and normalise its column headers."""
    try:
        df = pd.read_excel(workbook_path, sheet_name=sheet_name, dtype=str)
    except Exception as exc:
        raise ValueError(
            f"Cannot read sheet '{sheet_name}' from {workbook_path.name}: {exc}"
        ) from exc
    df.columns = [_normalise_header(c) for c in df.columns]
    return df


def _normalise_header(raw: str) -> str:
    """Collapse whitespace and strip a column header."""
    return re.sub(r"\s+", " ", str(raw)).strip()


# ---------------------------------------------------------------------------
# Cell-value parsers
# ---------------------------------------------------------------------------

def _is_blank(val: Any) -> bool:
    if val is None:
        return True
    s = str(val).strip()
    return s == "" or s.lower() in ("nan", "none", "n/a", "na", "#n/a")


def clean_str(val: Any) -> str | None:
    """Return a stripped string or None if blank."""
    if _is_blank(val):
        return None
    return str(val).strip()


def parse_bool(val: Any) -> bool:
    """Parse common truthy Excel values to a Python bool."""
    if isinstance(val, bool):
        return val
    s = str(val).strip().lower()
    return s in ("true", "yes", "1", "y", "x", "✓", "populated")


def parse_int_list(val: Any) -> list[int] | None:
    """
    Parse a cell containing a delimited list of integers.

    Accepts formats: "1, 2, 5"  /  "1;2;5"  /  "[1, 2, 5]"  / "1|2|5"
    Returns None if the cell is blank.
    """
    if _is_blank(val):
        return None
    raw = str(val).strip().strip("[]")
    parts = re.split(r"[,;|]+", raw)
    result = []
    for p in parts:
        p = p.strip()
        if p and not _is_blank(p):
            try:
                result.append(int(float(p)))
            except ValueError:
                pass  # skip non-numeric tokens
    return result if result else None


def parse_str_list(val: Any) -> list[str] | None:
    """
    Parse a cell containing a delimited list of strings.

    Accepts formats: "T7.1, T7.3"  /  "P01; P02"  /  "A | B | C"
    Returns None if the cell is blank.
    """
    if _is_blank(val):
        return None
    raw = str(val).strip().strip("[]")
    parts = re.split(r"[,;|]+", raw)
    result = [p.strip() for p in parts if p.strip() and not _is_blank(p.strip())]
    return result if result else None


def parse_int(val: Any) -> int | None:
    if _is_blank(val):
        return None
    try:
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# practices.json
# ---------------------------------------------------------------------------
# Column names as they appear in the "Practice Matrix" sheet (after header
# normalisation).  Update the keys here if the Excel column names change.

PRACTICE_COLUMNS = {
    # JSON field name          : Excel column header
    "p_code":                    "Practice Code",
    "name":                      "Practice Name",
    "theme":                     "Theme",
    "rationale":                 "Rationale",
    "approach_origins":          "Approach Origins",
    "block4_pressures":          "Block 4 Pressure IDs",
    "block5_challenges":         "Block 5 Challenge IDs",
    "block6_services":           "Block 6 Service IDs",
    "hard_prerequisites":        "Hard Prerequisites",
    "primary_applicability":     "Primary Applicability (Land Use)",
    "transformative_applicability": "Transformative Applicability",
    "prescreen_question":        "Pre-screen Question",
    "applicable_scale":          "Applicable Scale",
    "relevant_efgs":             "Relevant EFGs",
    "implementation_constraints": "Implementation Constraints",
    "tape_mapping":              "TAPE Mapping",
    "field_observation_checklist": "Field Observation Checklist",
    "evidence_correct":          "Evidence of Correct Implementation",
    "evidence_non_implementation": "Evidence of Non-Implementation",
}


def export_practices(wb_path: Path) -> list[dict]:
    df = load_sheet(wb_path, "Practice Matrix")
    _check_columns(df, PRACTICE_COLUMNS, "Practice Matrix")

    practices = []
    for _, row in df.iterrows():
        p_code = clean_str(row.get(PRACTICE_COLUMNS["p_code"]))
        if not p_code:
            continue  # skip blank rows

        practice = {
            "p_code":                    p_code,
            "name":                      clean_str(row.get(PRACTICE_COLUMNS["name"])),
            "theme":                     clean_str(row.get(PRACTICE_COLUMNS["theme"])),
            "rationale":                 clean_str(row.get(PRACTICE_COLUMNS["rationale"])),
            "approach_origins":          clean_str(row.get(PRACTICE_COLUMNS["approach_origins"])),
            "block4_pressures":          parse_int_list(row.get(PRACTICE_COLUMNS["block4_pressures"])) or [],
            "block5_challenges":         parse_int_list(row.get(PRACTICE_COLUMNS["block5_challenges"])) or [],
            "block6_services":           parse_int_list(row.get(PRACTICE_COLUMNS["block6_services"])) or [],
            "hard_prerequisites":        clean_str(row.get(PRACTICE_COLUMNS["hard_prerequisites"])),
            "primary_applicability":     parse_str_list(row.get(PRACTICE_COLUMNS["primary_applicability"])) or [],
            "transformative_applicability": parse_str_list(row.get(PRACTICE_COLUMNS["transformative_applicability"])) or [],
            "prescreen_question":        clean_str(row.get(PRACTICE_COLUMNS["prescreen_question"])),
            "applicable_scale":          clean_str(row.get(PRACTICE_COLUMNS["applicable_scale"])),
            "relevant_efgs":             parse_str_list(row.get(PRACTICE_COLUMNS["relevant_efgs"])) or [],
            "implementation_constraints": clean_str(row.get(PRACTICE_COLUMNS["implementation_constraints"])),
            "tape_mapping":              clean_str(row.get(PRACTICE_COLUMNS["tape_mapping"])),
            "field_observation_checklist": clean_str(row.get(PRACTICE_COLUMNS["field_observation_checklist"])),
            "evidence_correct":          clean_str(row.get(PRACTICE_COLUMNS["evidence_correct"])),
            "evidence_non_implementation": clean_str(row.get(PRACTICE_COLUMNS["evidence_non_implementation"])),
        }
        practices.append(practice)

    print(f"  practices: {len(practices)} rows")
    return practices


# ---------------------------------------------------------------------------
# indicators.json
# ---------------------------------------------------------------------------
# "populated" is derived: True if level1_protocol_name is non-null.
# All content columns are null for unpopulated profiles.

INDICATOR_COLUMNS = {
    "profile_number":              "Profile Number",
    "profile_name":                "Profile Name",
    "category":                    "Category",
    "tier":                        "Tier",
    "conditionality_criteria":     "Conditionality Criteria",
    "hard_prerequisite":           "Hard Prerequisite",
    "primary_monitoring_role":     "Primary Monitoring Role",
    "monitoring_stage":            "Monitoring Stage",
    "response_timescale":          "Response Timescale",
    "block4_pressures":            "Block 4 Pressure IDs",
    "block5_challenges":           "Block 5 Challenge IDs",
    "block6_services":             "Block 6 Service IDs",
    "relevant_efgs":               "Relevant EFGs",
    "relevant_ipcc_land_use":      "Relevant IPCC Land Use Categories",
    "soil_type_associations":      "Soil Type Associations",
    "crop_livestock_associations": "Crop / Livestock Associations",
    "b1_practices_that_benefit":   "B1 Practices That Benefit",
    "b2_practices_primarily_verified": "B2 Practices Primarily Verified",
    "linkage_c_connected_groups":  "Linkage C Connected Groups",
    "level1_protocol_name":        "Level 1 Protocol Name",
    "level2_protocol_name":        "Level 2 Protocol Name",
    "level3_protocol_name":        "Level 3 Protocol Name",
    "level1_output_metric":        "Level 1 Output Metric",
    "level2_output_metric":        "Level 2 Output Metric",
    "level3_output_metric":        "Level 3 Output Metric",
    "primary_reference":           "Primary Reference",
    "monitoring_task_type":        "Monitoring Task Type",
    "b2_expected_direction_of_change": "B2 Expected Direction of Change",
    "validation_status":           "Validation Status",
}

# Content columns used to decide whether a profile is populated.
# A profile is populated if at least one of these is non-null.
_POPULATED_SENTINEL_COLS = [
    "level1_protocol_name",
    "b1_practices_that_benefit",
    "b2_practices_primarily_verified",
]


def export_indicators(wb_path: Path) -> list[dict]:
    df = load_sheet(wb_path, "Indicator Linkage Matrix")
    _check_columns(df, INDICATOR_COLUMNS, "Indicator Linkage Matrix")

    indicators = []
    for _, row in df.iterrows():
        profile_number = parse_int(row.get(INDICATOR_COLUMNS["profile_number"]))
        if profile_number is None:
            continue  # skip blank rows

        l1_name = clean_str(row.get(INDICATOR_COLUMNS["level1_protocol_name"]))
        b1      = parse_str_list(row.get(INDICATOR_COLUMNS["b1_practices_that_benefit"]))
        b2      = parse_str_list(row.get(INDICATOR_COLUMNS["b2_practices_primarily_verified"]))
        populated = any([l1_name, b1, b2])

        indicator = {
            "profile_number":              profile_number,
            "profile_name":                clean_str(row.get(INDICATOR_COLUMNS["profile_name"])),
            "category":                    clean_str(row.get(INDICATOR_COLUMNS["category"])),
            "tier":                        clean_str(row.get(INDICATOR_COLUMNS["tier"])),
            "conditionality_criteria":     clean_str(row.get(INDICATOR_COLUMNS["conditionality_criteria"])),
            "hard_prerequisite":           clean_str(row.get(INDICATOR_COLUMNS["hard_prerequisite"])),
            "primary_monitoring_role":     clean_str(row.get(INDICATOR_COLUMNS["primary_monitoring_role"])),
            "monitoring_stage":            clean_str(row.get(INDICATOR_COLUMNS["monitoring_stage"])),
            "response_timescale":          clean_str(row.get(INDICATOR_COLUMNS["response_timescale"])),
            # List fields — null when unpopulated
            "block4_pressures":            parse_int_list(row.get(INDICATOR_COLUMNS["block4_pressures"])),
            "block5_challenges":           parse_int_list(row.get(INDICATOR_COLUMNS["block5_challenges"])),
            "block6_services":             parse_int_list(row.get(INDICATOR_COLUMNS["block6_services"])),
            "relevant_efgs":               parse_str_list(row.get(INDICATOR_COLUMNS["relevant_efgs"])),
            "relevant_ipcc_land_use":      parse_str_list(row.get(INDICATOR_COLUMNS["relevant_ipcc_land_use"])),
            "soil_type_associations":      parse_str_list(row.get(INDICATOR_COLUMNS["soil_type_associations"])),
            "crop_livestock_associations": parse_str_list(row.get(INDICATOR_COLUMNS["crop_livestock_associations"])),
            "b1_practices_that_benefit":   b1,
            "b2_practices_primarily_verified": b2,
            "linkage_c_connected_groups":  parse_int_list(row.get(INDICATOR_COLUMNS["linkage_c_connected_groups"])),
            # Protocol content — null when unpopulated
            "level1_protocol_name":        l1_name,
            "level2_protocol_name":        clean_str(row.get(INDICATOR_COLUMNS["level2_protocol_name"])),
            "level3_protocol_name":        clean_str(row.get(INDICATOR_COLUMNS["level3_protocol_name"])),
            "level1_output_metric":        clean_str(row.get(INDICATOR_COLUMNS["level1_output_metric"])),
            "level2_output_metric":        clean_str(row.get(INDICATOR_COLUMNS["level2_output_metric"])),
            "level3_output_metric":        clean_str(row.get(INDICATOR_COLUMNS["level3_output_metric"])),
            "primary_reference":           clean_str(row.get(INDICATOR_COLUMNS["primary_reference"])),
            "monitoring_task_type":        clean_str(row.get(INDICATOR_COLUMNS["monitoring_task_type"])),
            "b2_expected_direction_of_change": clean_str(row.get(INDICATOR_COLUMNS["b2_expected_direction_of_change"])),
            "validation_status":           clean_str(row.get(INDICATOR_COLUMNS["validation_status"])),
            "populated":                   populated,
        }
        indicators.append(indicator)

    populated_count = sum(1 for i in indicators if i["populated"])
    print(f"  indicators: {len(indicators)} rows ({populated_count} populated)")
    return indicators


# ---------------------------------------------------------------------------
# abiotic.json
# ---------------------------------------------------------------------------

ABIOTIC_COLUMNS = {
    "indicator_id":               "Indicator ID",
    "indicator_name":             "Indicator Name",
    "block4_pressures":           "Block 4 Pressure IDs",
    "block5_challenges":          "Block 5 Challenge IDs",
    "block6_services":            "Block 6 Service IDs",
    "linked_practices":           "Linked Practice Codes",
    "hard_prerequisite_land_use": "Hard Prerequisite Land Use",
    "universal_baseline":         "Universal Baseline",
    "protocol_name":              "Protocol Name",
    "monitoring_frequency":       "Monitoring Frequency",
    "equipment_required":         "Equipment Required (IDs)",
    "protocol_level":             "Protocol Level",
    "interpretation_notes":       "Interpretation Notes",
}


def export_abiotic(wb_path: Path) -> list[dict]:
    df = load_sheet(wb_path, "Abiotic Reference Table")
    _check_columns(df, ABIOTIC_COLUMNS, "Abiotic Reference Table")

    abiotic = []
    for _, row in df.iterrows():
        ind_id = clean_str(row.get(ABIOTIC_COLUMNS["indicator_id"]))
        if not ind_id:
            continue

        abiotic.append({
            "indicator_id":               ind_id,
            "indicator_name":             clean_str(row.get(ABIOTIC_COLUMNS["indicator_name"])),
            "block4_pressures":           parse_int_list(row.get(ABIOTIC_COLUMNS["block4_pressures"])) or [],
            "block5_challenges":          parse_int_list(row.get(ABIOTIC_COLUMNS["block5_challenges"])) or [],
            "block6_services":            parse_int_list(row.get(ABIOTIC_COLUMNS["block6_services"])) or [],
            "linked_practices":           parse_str_list(row.get(ABIOTIC_COLUMNS["linked_practices"])) or [],
            "hard_prerequisite_land_use": clean_str(row.get(ABIOTIC_COLUMNS["hard_prerequisite_land_use"])),
            "universal_baseline":         parse_bool(row.get(ABIOTIC_COLUMNS["universal_baseline"])),
            "protocol_name":              clean_str(row.get(ABIOTIC_COLUMNS["protocol_name"])),
            "monitoring_frequency":       clean_str(row.get(ABIOTIC_COLUMNS["monitoring_frequency"])),
            "equipment_required":         parse_int_list(row.get(ABIOTIC_COLUMNS["equipment_required"])) or [],
            "protocol_level":             parse_int(row.get(ABIOTIC_COLUMNS["protocol_level"])),
            "interpretation_notes":       clean_str(row.get(ABIOTIC_COLUMNS["interpretation_notes"])),
        })

    print(f"  abiotic: {len(abiotic)} rows")
    return abiotic


# ---------------------------------------------------------------------------
# reference.json
# ---------------------------------------------------------------------------
# Reference lists are stored as additional sheets in LAHMP_Practice_Matrix.xlsx.
#
# Sheet: "Block 4 Pressures"
#   columns: "ID", "Name", "Tooltip"
#
# Sheet: "Block 5 Challenges"
#   columns: "ID", "Name", "Tooltip"
#
# Sheet: "Block 6 Services"
#   columns: "ID", "Name", "Tooltip"
#
# Sheet: "IPCC Land Use"
#   columns: "Category"          (one category per row)
#
# Sheet: "IPCC Soil Types"
#   columns: "Soil Type"         (one type per row)
#
# Sheet: "EFG Options"
#   columns: "Code", "Name", "Biome"
#
# Sheet: "Pressure Challenge Map"
#   columns: "Pressure ID", "Challenge ID", "Confidence"
#   (one row per pressure→challenge link; confidence: high | medium | low)
#
# Sheet: "Challenge Service Map"
#   columns: "Challenge ID", "Service ID", "Confidence"


def export_reference(wb_path: Path) -> dict:
    ref: dict[str, Any] = {}

    ref["block4_pressures"]   = _load_item_list(wb_path, "Block 4 Pressures",  "ID", "Name", "Tooltip")
    ref["block5_challenges"]  = _load_item_list(wb_path, "Block 5 Challenges", "ID", "Name", "Tooltip")
    ref["block6_services"]    = _load_item_list(wb_path, "Block 6 Services",   "ID", "Name", "Tooltip")

    ref["ipcc_land_use_categories"] = _load_single_column(wb_path, "IPCC Land Use",   "Category")
    ref["ipcc_soil_types"]          = _load_single_column(wb_path, "IPCC Soil Types", "Soil Type")

    ref["efg_options"] = _load_efg_options(wb_path)

    ref["pressure_to_challenge_mapping"] = _load_mapping(
        wb_path, "Pressure Challenge Map", "Pressure ID", "Challenge ID", "Confidence"
    )
    ref["challenge_to_service_mapping"] = _load_mapping(
        wb_path, "Challenge Service Map", "Challenge ID", "Service ID", "Confidence"
    )

    print(
        f"  reference: "
        f"{len(ref['block4_pressures'])} pressures, "
        f"{len(ref['block5_challenges'])} challenges, "
        f"{len(ref['block6_services'])} services, "
        f"{len(ref['efg_options'])} EFGs"
    )
    return ref


def _load_item_list(wb_path: Path, sheet: str, id_col: str, name_col: str, tooltip_col: str) -> list[dict]:
    df = load_sheet(wb_path, sheet)
    _check_columns_list(df, [id_col, name_col, tooltip_col], sheet)
    items = []
    for _, row in df.iterrows():
        item_id = parse_int(row.get(id_col))
        if item_id is None:
            continue
        items.append({
            "id":      item_id,
            "name":    clean_str(row.get(name_col)),
            "tooltip": clean_str(row.get(tooltip_col)),
        })
    return items


def _load_single_column(wb_path: Path, sheet: str, col: str) -> list[str]:
    df = load_sheet(wb_path, sheet)
    _check_columns_list(df, [col], sheet)
    return [
        str(v).strip()
        for v in df[col]
        if not _is_blank(v)
    ]


def _load_efg_options(wb_path: Path) -> list[dict]:
    df = load_sheet(wb_path, "EFG Options")
    _check_columns_list(df, ["Code", "Name", "Biome"], "EFG Options")
    items = []
    for _, row in df.iterrows():
        code = clean_str(row.get("Code"))
        if not code:
            continue
        items.append({
            "code":  code,
            "name":  clean_str(row.get("Name")),
            "biome": clean_str(row.get("Biome")),
        })
    return items


def _load_mapping(
    wb_path: Path,
    sheet: str,
    from_col: str,
    to_col: str,
    confidence_col: str,
) -> dict[str, list[dict]]:
    """
    Build a mapping dict: { "from_id": [ {to_field: id, confidence: ...}, ... ] }

    The keys are strings (matching JSON object key convention).
    """
    df = load_sheet(wb_path, sheet)
    _check_columns_list(df, [from_col, to_col, confidence_col], sheet)

    # Determine the JSON field name for the target id.
    # "Challenge ID" → "challenge_id", "Service ID" → "service_id"
    to_field = re.sub(r"\s+", "_", to_col.lower()).rstrip("_")
    # Normalise e.g. "challenge_id" (already correct) or "service_id"

    mapping: dict[str, list[dict]] = {}
    for _, row in df.iterrows():
        from_id = parse_int(row.get(from_col))
        to_id   = parse_int(row.get(to_col))
        conf    = clean_str(row.get(confidence_col))
        if from_id is None or to_id is None:
            continue
        key = str(from_id)
        mapping.setdefault(key, []).append({to_field: to_id, "confidence": conf})

    # Sort entries within each key by target id for deterministic output
    for key in mapping:
        mapping[key].sort(key=lambda x: list(x.values())[0])

    return mapping


# ---------------------------------------------------------------------------
# Column validation helpers
# ---------------------------------------------------------------------------

def _check_columns(df: pd.DataFrame, col_map: dict, sheet_name: str) -> None:
    """Warn about any mapped columns missing from df. Does not abort."""
    missing = [v for v in col_map.values() if v not in df.columns]
    if missing:
        _warn_missing_columns(sheet_name, missing, df.columns.tolist())


def _check_columns_list(df: pd.DataFrame, required: list[str], sheet_name: str) -> None:
    missing = [c for c in required if c not in df.columns]
    if missing:
        _warn_missing_columns(sheet_name, missing, df.columns.tolist())


def _warn_missing_columns(sheet_name: str, missing: list[str], actual: list[str]) -> None:
    print(f"  WARNING: sheet '{sheet_name}' is missing expected column(s):")
    for c in missing:
        print(f"    - '{c}'")
    print(f"  Actual columns found: {actual}")
    print("  Affected fields will be null in the JSON output.")


# ---------------------------------------------------------------------------
# JSON writer
# ---------------------------------------------------------------------------

def write_json(data: Any, path: Path) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    size_kb = path.stat().st_size / 1024
    print(f"  Wrote {path.relative_to(REPO_ROOT)}  ({size_kb:.1f} KB)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("LAHMP Excel → JSON export\n")

    # Locate workbooks
    wb_practices  = _find_workbook("LAHMP_Practice_Matrix.xlsx")
    wb_indicators = _find_workbook("LAHMP_Indicator_Linkage_Matrix.xlsx")
    wb_abiotic    = _find_workbook("LAHMP_Abiotic_Reference_Table.xlsx")

    print(f"Practice Matrix:       {wb_practices}")
    print(f"Indicator Matrix:      {wb_indicators}")
    print(f"Abiotic Reference:     {wb_abiotic}")
    print()

    # Export
    print("Exporting practices.json ...")
    practices = export_practices(wb_practices)
    write_json(practices, DATA_DIR / "practices.json")
    print()

    print("Exporting indicators.json ...")
    indicators = export_indicators(wb_indicators)
    write_json(indicators, DATA_DIR / "indicators.json")
    print()

    print("Exporting abiotic.json ...")
    abiotic = export_abiotic(wb_abiotic)
    write_json(abiotic, DATA_DIR / "abiotic.json")
    print()

    print("Exporting reference.json ...")
    reference = export_reference(wb_practices)
    write_json(reference, DATA_DIR / "reference.json")
    print()

    print("Done.")


if __name__ == "__main__":
    main()
