#!/usr/bin/env python3
"""
Extract indicator profile data from LAHMP DOCX files and write to data/indicators.json.

File resolution order for each profile DOCX:
  1. indicators/  — tracked source files in the repository (normal case)
  2. indicators_dl/ — local download cache (gitignored)
  3. GitHub raw URL — downloaded on demand, cached to indicators_dl/
"""

import sys, io, os, json, re, urllib.request, time
from pathlib import Path
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import docx as python_docx

# --- Configuration ---
_REPO = Path(__file__).resolve().parent.parent
GITHUB_RAW_BASE = "https://raw.githubusercontent.com/daimpad/LAHMP/main/indicators/"
SOURCE_DIR   = _REPO / "indicators"       # tracked DOCX source files (checked first)
DOWNLOAD_DIR = str(_REPO / "indicators_dl")  # local download cache (fallback)
OUTPUT_PATH  = str(_REPO / "data" / "indicators.json")

# All 41 profile filenames
PROFILE_FILES = [
    ("01", "Soil_Bacteria"),
    ("02", "Mycorrhizal_Fungi"),
    ("03", "Nematodes"),
    ("04", "Springtails"),
    ("05", "Oribatid_Mites"),
    ("06", "Earthworms"),
    ("07", "Snails_Slugs"),
    ("08", "Ants"),
    ("09", "Dung_Beetles"),
    ("10", "Ground_Beetles"),
    ("11", "Spiders"),
    ("12", "Parasitic_Wasps"),
    ("13", "Wild_Bees"),
    ("14", "Hoverflies"),
    ("15", "Butterflies_Moths"),
    ("16", "Grasshoppers_Crickets"),
    ("17", "Aquatic_Macroinvertebrates"),
    ("18", "Fish"),
    ("19", "Bats"),
    ("20", "Farmland_Birds"),
    ("21", "Frogs_Toads"),
    ("22", "Small_Mammal_Insectivores"),
    ("23", "Lizards"),
    ("24", "Snakes"),
    ("25", "Small_Carnivores"),
    ("26", "Birds_of_Prey_Owls"),
    ("27", "Arable_Field_Vegetation"),
    ("28", "Grassland"),
    ("29", "Field_Margin"),
    ("30", "Hedgerow"),
    ("31", "Aquatic_Riparian"),
    ("32", "Soil_Surface_Communities"),
    ("33", "Scattered_Trees"),
    ("34", "Woody_Regeneration"),
    ("35", "Invasive_Plants"),
    ("36", "Orchard_Understory"),
    ("37", "Termites"),
    ("38", "Freshwater_Turtles"),
    ("39", "Salamanders_Newts"),
    ("40", "Large_Soil_Invertebrates"),
    ("41", "Crop_Pest_Invertebrates"),
]

os.makedirs(DOWNLOAD_DIR, exist_ok=True)


def resolve_file(num, name):
    """Return a local path to the DOCX file.

    Resolution order:
    1. indicators/  — tracked source files committed to the repository
    2. indicators_dl/ — local download cache
    3. GitHub raw URL — downloaded on demand, cached to indicators_dl/
    """
    filename = f"LAHMP_Profile_{num}_{name}.docx"
    # 1. Local tracked source directory
    source_path = SOURCE_DIR / filename
    if source_path.exists():
        print(f"  [local] {filename}")
        return str(source_path)
    # 2. Download cache
    cached_path = os.path.join(DOWNLOAD_DIR, filename)
    if os.path.exists(cached_path):
        print(f"  [cached] {filename}")
        return cached_path
    # 3. Download from GitHub
    url = GITHUB_RAW_BASE + filename
    print(f"  [download] {filename}")
    req = urllib.request.Request(url, headers={"User-Agent": "Python-LAHMP-Extractor"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            with open(cached_path, "wb") as f:
                f.write(r.read())
        time.sleep(0.3)  # polite rate limit
    except Exception as e:
        print(f"  [ERROR] Could not download {filename}: {e}")
        return None
    return cached_path


def cell_text(cell):
    return cell.text.strip()


def table_kv(table):
    """Parse a 2-column key-value table into a dict."""
    result = {}
    for row in table.rows:
        if len(row.cells) >= 2:
            k = cell_text(row.cells[0])
            v = cell_text(row.cells[1])
            if k:
                result[k] = v
    return result


def kv_get(kv, *keys):
    """Look up first matching key (exact) or key prefix in a kv dict."""
    for k in keys:
        # Exact match first
        if k in kv:
            return kv[k]
        # Prefix match (handles 'Output metric (including MANDATORY canopy cover)' etc)
        k_lower = k.lower()
        for actual_key, val in kv.items():
            if actual_key.lower().startswith(k_lower):
                return val
    return ""


def parse_profile(path):
    """Parse a single indicator profile DOCX and return a dict."""
    doc = python_docx.Document(path)
    tables = doc.tables

    profile = {}
    section = None  # tracks current section context

    # Map table by first-cell content after section tracking
    b1_seen = False
    level1_seen = False
    level2_seen = False

    for i, t in enumerate(tables):
        fc = cell_text(t.cell(0, 0))
        ncols = len(t.columns)
        nrows = len(t.rows)

        # -- Section header detection (1-cell tables) --
        if ncols == 1 and nrows == 1:
            # Only check the FIRST LINE of the header to avoid false matches in body text
            first_line = fc.split("\n")[0].lower()
            if "b1 —" in first_line or "b1 -" in first_line:
                section = "b1"
            elif "b2 —" in first_line or "b2 -" in first_line:
                section = "b2"
            elif "levels 2 and 3" in first_line:
                section = "level2_skip"  # no data tables follow
            elif "level 1" in first_line:
                section = "level1"
                # For conditional profiles, extract protocol name from second line
                lines = fc.split("\n")
                if len(lines) > 1:
                    profile["_pending_level1_name"] = lines[1].strip().rstrip(".")
            elif "level 2" in first_line:
                section = "level2"
            elif "level 3" in first_line:
                section = "level3"
            continue

        # -- IDENTITY BLOCK (Table 5: 'Profile number') --
        if fc == "Profile number" and ncols == 2:
            kv = table_kv(t)
            num_str = kv.get("Profile number", "").strip()
            profile["profile_number"] = int(num_str) if num_str.isdigit() else int(re.search(r'\d+', num_str).group())
            profile["profile_name"] = kv.get("Plain language name", "").rstrip(".")
            profile["category"] = kv.get("Category", "")
            profile["tier"] = kv.get("Tier", "")
            raw_cond = kv.get("Conditionality criteria", "")
            profile["conditionality_criteria"] = None if "not applicable" in raw_cond.lower() else raw_cond or None
            raw_prereq = kv.get("Hard prerequisite", "")
            profile["hard_prerequisite"] = None if raw_prereq.lower() in ("none", "not applicable", "") else raw_prereq
            profile["primary_monitoring_role"] = kv.get("Primary monitoring role", "").split(" — ")[0].split(" - ")[0].strip()
            profile["monitoring_task_type"] = kv.get("Monitoring task type (→ ILM col 28)", kv.get("Monitoring task type", ""))
            continue

        # -- STAGE / TIMESCALE (Table 8: 'Monitoring stage') --
        if fc == "Monitoring stage" and ncols == 2:
            kv = table_kv(t)
            raw_stage = kv.get("Monitoring stage", "")
            # Extract compact speed descriptor: everything before first "(" or ":"
            # e.g. "Fast–medium (Stage 2 from Year 1). ..." → "Fast–medium"
            speed_m = re.match(r'((?:Very slow|Slow[\u2013\-]very slow|Slow|Fast[\u2013\-]medium|Fast|Medium)[^(:]*)', raw_stage, re.I)
            if speed_m:
                speed_desc = speed_m.group(1).strip().rstrip('.')
                profile["monitoring_stage"] = speed_desc
            else:
                profile["monitoring_stage"] = raw_stage[:40]

            raw_ts = kv.get("Response timescale", "")
            # Extract concise timescale — first sentence after the colon
            ts_m = re.search(r'(?:Fast|Medium|Slow|Very slow)[^:]*:\s*([^.]+)', raw_ts, re.I)
            if ts_m:
                profile["response_timescale"] = ts_m.group(1).strip()[:80]
            else:
                profile["response_timescale"] = raw_ts[:80]
            continue

        # -- A1: Block 4 Pressures (first_cell='Block 4 #') --
        if fc == "Block 4 #" and ncols >= 2:
            ids = []
            for row in t.rows[1:]:
                val = cell_text(row.cells[0])
                if val and re.match(r'^\d+$', val):
                    ids.append(int(val))
            profile["block4_pressures"] = ids
            continue

        # -- A2: Block 5 Challenges (first_cell='Block 5 #') --
        if fc == "Block 5 #" and ncols >= 2:
            ids = []
            for row in t.rows[1:]:
                val = cell_text(row.cells[0])
                if val and re.match(r'^\d+$', val):
                    ids.append(int(val))
            profile["block5_challenges"] = ids
            continue

        # -- A3: Block 6 Services (first_cell='Block 6 #') --
        if fc == "Block 6 #" and ncols >= 2:
            ids = []
            for row in t.rows[1:]:
                val = cell_text(row.cells[0])
                if val and re.match(r'^\d+$', val):
                    ids.append(int(val))
            profile["block6_services"] = ids
            continue

        # -- A4: EFG codes (first_cell='EFG Code') --
        if fc == "EFG Code" and ncols >= 2:
            codes = []
            for row in t.rows[1:]:
                val = cell_text(row.cells[0])
                # Match T7.1, F2.x, TF1.x, MFT1.x, etc — any uppercase letters + digit + dot
                if val and val.lower() != "universal" and re.match(r'^[A-Z]+\d+\.', val):
                    codes.append(val)
            profile["relevant_efgs"] = codes
            continue

        # -- A5: IPCC Land Use (first_cell='IPCC Land Use Category') --
        if fc == "IPCC Land Use Category" and ncols >= 1:
            cats = []
            for row in t.rows[1:]:
                val = cell_text(row.cells[0])
                if val and val != "IPCC Land Use Category":
                    cats.append(val)
            profile["relevant_ipcc_land_use"] = cats
            continue

        # -- A6: Soil type associations (first_cell='Soil Type') --
        if fc == "Soil Type" and ncols >= 2:
            vals = []
            for row in t.rows[1:]:
                v = cell_text(row.cells[0])
                if v and v != "Soil Type":
                    note = cell_text(row.cells[1]) if ncols > 1 else ""
                    vals.append((v + (" — " + note if note else "")).strip())
            profile["soil_type_associations"] = vals
            continue

        # -- A7: Crop/Livestock associations (first_cell='Crop / Livestock Association') --
        if fc == "Crop / Livestock Association" and ncols >= 1:
            vals = []
            for row in t.rows[1:]:
                v = cell_text(row.cells[0])
                if v and v != "Crop / Livestock Association":
                    vals.append(v)
            profile["crop_livestock_associations"] = vals
            continue

        # -- A8: Abiotic linkages (first_cell='LAHMP Abiotic ID') --
        if fc == "LAHMP Abiotic ID" and ncols >= 2:
            ids = []
            for row in t.rows[1:]:
                val = cell_text(row.cells[0])
                if val and re.match(r'^A\d+$', val):
                    ids.append(val)
            profile["abiotic_precursor_linkages"] = ids
            continue

        # -- B1 / B2: P-code tables (both start with 'P-code') --
        if fc == "P-code" and ncols >= 2:
            codes = []
            for row in t.rows[1:]:
                val = cell_text(row.cells[0])
                if val and re.match(r'^P\d+$', val):
                    codes.append(val)

            if section == "b1":
                profile["b1_practices_that_benefit"] = codes
                section = None  # consumed
            elif section == "b2":
                profile["b2_practices_primarily_verified"] = codes
                # Extract expected direction from col 3 (index 3)
                if ncols >= 4:
                    directions = []
                    for row in t.rows[1:]:
                        pcode = cell_text(row.cells[0])
                        dir_text = cell_text(row.cells[3])
                        if pcode and re.match(r'^P\d+$', pcode) and dir_text:
                            directions.append(f"{pcode}: {dir_text}")
                    profile["b2_expected_direction_of_change"] = " ".join(directions)
                section = None  # consumed
            continue

        # -- C: Connected groups (first_cell='Connected Group') --
        if fc == "Connected Group" and ncols >= 2:
            groups = []
            for row in t.rows[1:]:
                val = cell_text(row.cells[0])
                # Format: "02 — Mycorrhizal fungi" or "02 - Mycorrhizal fungi" or just "02"
                m = re.match(r'^(\d+)', val)
                if m:
                    groups.append(int(m.group(1)))
            profile["linkage_c_connected_groups"] = groups
            continue

        # -- Level 1/2/3 protocol (first_cell='Protocol name') --
        if fc == "Protocol name" and ncols == 2:
            kv = table_kv(t)
            if section == "level1" or (section not in ("level1_done", "level2", "level2_done", "level3") and "level1_protocol_name" not in profile):
                profile["level1_protocol_name"] = kv.get("Protocol name", "")
                profile["level1_output_metric"] = kv_get(kv, "Output metric")
                profile["level1_seasonal_primary"] = kv.get("Seasonal window — primary", kv.get("Seasonal window", ""))
                profile["level1_seasonal_secondary"] = kv.get("Seasonal window — secondary", "")
                profile["level1_equipment"] = kv.get("Equipment required", "")
                profile["level1_reference"] = kv.get("Primary reference framework", kv.get("Primary references", kv.get("Primary reference", "")))
                profile["level1_reference_link"] = kv.get("Reference link", "")
                section = "level1_done"
            elif section == "level2" or (section == "level1_done" and "level2_protocol_name" not in profile):
                profile["level2_protocol_name"] = kv.get("Protocol name", "")
                profile["level2_output_metric"] = kv_get(kv, "Output metric")
                profile["level2_seasonal_primary"] = kv.get("Seasonal window — primary", "")
                profile["level2_seasonal_secondary"] = kv.get("Seasonal window — secondary", "")
                profile["level2_equipment"] = kv.get("Equipment required", "")
                profile["level2_reference"] = kv.get("Primary reference framework", kv.get("Primary references", kv.get("Primary reference", "")))
                profile["level2_reference_link"] = kv.get("Reference link", "")
                section = "level2_done"
            elif section == "level3":
                # Level 3 that uses "Protocol name" instead of "Protocol A name"
                profile["level3_protocol_name"] = kv.get("Protocol name", "")
                profile["level3_output_metric"] = kv_get(kv, "Output metrics", "Output metric")
                profile["level3_seasonal_primary"] = kv.get("Seasonal window — primary", "")
                profile["level3_seasonal_secondary"] = kv.get("Seasonal window — secondary", "")
                profile["level3_equipment"] = kv.get("Equipment required", "")
                profile["level3_reference"] = kv.get("Primary references", kv.get("Primary reference framework", kv.get("Primary reference", "")))
                profile["level3_reference_link"] = kv.get("Reference link", "")
                section = "level3_done"
            continue

        # -- Simplified Level 1 protocol (conditional profiles: first_cell='What it measures') --
        if fc == "What it measures" and ncols == 2 and section in ("level1", None) and "level1_protocol_name" not in profile:
            kv = table_kv(t)
            # Get protocol name from the section header text
            proto_name = profile.get("_pending_level1_name", "")
            profile["level1_protocol_name"] = proto_name
            profile["level1_output_metric"] = kv.get("What it measures", "")
            profile["level1_seasonal_primary"] = kv.get("Seasonal window", kv.get("Seasonal window — primary", ""))
            profile["level1_seasonal_secondary"] = kv.get("Seasonal window — secondary", "")
            profile["level1_equipment"] = kv.get("Equipment required", "")
            profile["level1_reference"] = ""
            section = "level1_done"
            continue

        # -- Level 3 protocol (first_cell='Protocol A name') --
        if fc == "Protocol A name" and ncols == 2:
            kv = table_kv(t)
            profile["level3_protocol_name"] = kv.get("Protocol A name", "")
            profile["level3_output_metric"] = kv_get(kv, "Output metrics", "Output metric")
            profile["level3_seasonal_primary"] = kv.get("Seasonal window — primary", "")
            profile["level3_seasonal_secondary"] = kv.get("Seasonal window — secondary", "")
            profile["level3_equipment"] = kv.get("Equipment required", "")
            profile["level3_reference"] = kv.get("Primary references", kv.get("Primary reference", ""))
            profile["level3_reference_link"] = kv.get("Reference link", "")
            profile["level3b_protocol_name"] = kv.get("Protocol B name", "")
            continue

    # -- Normalise "Not available" protocols to null so assignProtocol can skip them --
    for lk in ["level1_protocol_name", "level2_protocol_name", "level3_protocol_name"]:
        v = profile.get(lk, "")
        if v and v.lower().startswith("not available"):
            profile[lk] = None

    # -- Derive primary_reference from level2 or level3 --
    profile["primary_reference"] = (
        profile.get("level2_reference") or
        profile.get("level3_reference") or
        profile.get("level1_reference") or
        ""
    )

    # -- Validation status (always draft for now) --
    profile["validation_status"] = "DRAFT - Unvalidated"
    profile["populated"] = True

    # Clean up internal temp keys
    profile.pop("_pending_level1_name", None)

    return profile


def run():
    print("=== LAHMP Indicator Profile Extractor ===\n")

    # Step 1: Download all files
    print("Step 1: Downloading DOCX files...")
    paths = {}
    for num, name in PROFILE_FILES:
        path = resolve_file(num, name)
        if path:
            paths[int(num)] = path

    print(f"\nDownloaded/cached: {len(paths)}/41 files\n")

    # Step 2: Parse all files
    print("Step 2: Parsing DOCX files...")
    indicators = []
    errors = []

    for num, name in PROFILE_FILES:
        n = int(num)
        path = paths.get(n)
        if not path:
            print(f"  [SKIP] Profile {num} — no file")
            continue
        try:
            profile = parse_profile(path)
            indicators.append(profile)
            pname = profile.get("profile_name", "?")
            nefg = len(profile.get("relevant_efgs", []))
            nlv = sum(1 for k in ["level1_protocol_name", "level2_protocol_name", "level3_protocol_name"] if profile.get(k))
            nb4 = len(profile.get("block4_pressures", []))
            print(f"  [OK] Profile {num} — {pname} | EFGs={nefg} | B4={nb4} | Levels={nlv}")
        except Exception as e:
            import traceback
            print(f"  [ERROR] Profile {num}: {e}")
            traceback.print_exc()
            errors.append((num, name, str(e)))

    print(f"\nParsed: {len(indicators)}/41 | Errors: {len(errors)}")

    if errors:
        print("\nErrors:")
        for num, name, err in errors:
            print(f"  Profile {num} ({name}): {err}")

    # Step 3: Sort and write
    indicators.sort(key=lambda x: x.get("profile_number", 0))

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(indicators, f, indent=2, ensure_ascii=False)

    print(f"\nWritten {len(indicators)} profiles to {OUTPUT_PATH}")


if __name__ == "__main__":
    run()
