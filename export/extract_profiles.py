"""
LAHMP Profile Extraction Script
Reads all 41 LAHMP_Profile_*.docx files and writes data/indicators.json
"""
import sys, io, re, json, os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from docx import Document

DOCX_DIR = os.path.join(os.path.dirname(__file__), '..', 'indicators')
OUT_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'indicators.json')


def dedup_cells(cells):
    seen = []
    for c in cells:
        if not seen or c != seen[-1]:
            seen.append(c)
    return seen


def get_table_headers(doc):
    """Return list of (index, first_cell_text, table) for all tables."""
    result = []
    for i, t in enumerate(doc.tables):
        first_cell = t.cell(0, 0).text.strip() if t.rows else ''
        result.append((i, first_cell, t))
    return result


def find_table_after_keyword(tables, keyword):
    """Find first table whose first cell contains keyword, return the next table."""
    kl = keyword.lower()
    for i, (idx, hdr, tbl) in enumerate(tables):
        if kl in hdr.lower():
            if i + 1 < len(tables):
                return tables[i + 1][2]
    return None


def is_single_cell_table(tbl):
    """Return True if every row of the table deduplicates to a single cell."""
    if not tbl.rows:
        return True
    for row in tbl.rows:
        cells = dedup_cells([c.text.strip() for c in row.cells])
        if len(cells) > 1:
            return False
    return True


def find_data_table_after_keyword(tables, keyword, max_scan=5):
    """Like find_table_after_keyword but skips single-cell intro/description tables."""
    kl = keyword.lower()
    for i, (idx, hdr, tbl) in enumerate(tables):
        if kl in hdr.lower():
            for j in range(i + 1, min(i + 1 + max_scan, len(tables))):
                candidate = tables[j][2]
                if not is_single_cell_table(candidate):
                    return candidate
    return None


def get_row_value(tbl, key):
    """Find row where first cell starts with key, return second cell."""
    kl = key.lower()
    for row in tbl.rows:
        cells = dedup_cells([c.text.strip() for c in row.cells])
        if len(cells) >= 2 and cells[0].lower().startswith(kl):
            return cells[1].strip()
    return None


def extract_int_ids(tbl, skip_header=True):
    ids = []
    rows = list(tbl.rows)
    for row in rows[1 if skip_header else 0:]:
        cells = dedup_cells([c.text.strip() for c in row.cells])
        if cells:
            m = re.match(r'^(\d+)', cells[0])
            if m:
                ids.append(int(m.group(1)))
    return ids or None


def extract_strings_col0(tbl, skip_header=True, exclude_prefixes=None):
    items = []
    rows = list(tbl.rows)
    for row in rows[1 if skip_header else 0:]:
        cells = dedup_cells([c.text.strip() for c in row.cells])
        if not cells or not cells[0]:
            continue
        val = cells[0]
        if exclude_prefixes and any(val.lower().startswith(p.lower()) for p in exclude_prefixes):
            continue
        items.append(val)
    return items or None


def extract_efg_codes(tbl, skip_header=True):
    codes = []
    rows = list(tbl.rows)
    for row in rows[1 if skip_header else 0:]:
        cells = dedup_cells([c.text.strip() for c in row.cells])
        if cells:
            m = re.match(r'^([A-Z]{1,3}\d+\.\d+)', cells[0])
            if m:
                code = m.group(1)
                # Normalise T4.x -> skip (generic); keep specific codes
                if not code.endswith('.x') and not code.endswith('.X'):
                    codes.append(code)
                else:
                    # Include T4.x as "T4.x" for algorithm
                    codes.append(code)
    return codes or None


def extract_pcodes(tbl, skip_header=True):
    codes = []
    rows = list(tbl.rows)
    for row in rows[1 if skip_header else 0:]:
        cells = dedup_cells([c.text.strip() for c in row.cells])
        if cells:
            m = re.match(r'^(P\d{2})', cells[0])
            if m:
                codes.append(m.group(1))
    return codes


def extract_b2_direction(tbl, skip_header=True):
    parts = []
    rows = list(tbl.rows)
    for row in rows[1 if skip_header else 0:]:
        cells = dedup_cells([c.text.strip() for c in row.cells])
        if not cells:
            continue
        m = re.match(r'^(P\d{2})', cells[0])
        if m and len(cells) >= 4 and cells[3]:
            parts.append(f'{m.group(1)}: {cells[3]}')
    return ' '.join(parts) if parts else None


def extract_linkage_c(tbl, skip_header=True):
    groups = []
    rows = list(tbl.rows)
    for row in rows[1 if skip_header else 0:]:
        cells = dedup_cells([c.text.strip() for c in row.cells])
        if cells:
            m = re.match(r'^(\d+)', cells[0])
            if m:
                groups.append(int(m.group(1)))
    return groups or None


def parse_monitoring_stage(text):
    if not text:
        return None
    # Extract the stage label (before parenthetical or period)
    m = re.match(r'^([^(.\n]+)', text.strip())
    label = m.group(1).strip(' \u2013-') if m else text.strip()
    return label


def parse_response_timescale(text):
    if not text:
        return None
    # Try to extract the first time range in parentheses, e.g. "(1-2 seasons)"
    m = re.search(r'\(([^)]*(?:\d+[-\u2013]\d+\s*(?:season|year)[^)]*|year\s*\d+[^)]*)?)\)', text)
    if m and m.group(1).strip():
        return m.group(1).strip()
    # Fallback: first line, trimmed
    first = text.split('\n')[0].strip()
    if len(first) > 80:
        first = first[:80].rsplit(' ', 1)[0] + '...'
    return first


def get_level_data(tables, level):
    """Extract all protocol fields for a given level."""
    kw = f'LEVEL {level}'
    # Find the LEVEL N header table, then skip any single-cell description tables
    level_data_tbl = None
    for i, (idx, hdr, tbl) in enumerate(tables):
        if kw in hdr.upper():
            for j in range(i + 1, min(i + 4, len(tables))):
                candidate = tables[j][2]
                if not is_single_cell_table(candidate):
                    level_data_tbl = candidate
                    break
            break
    if not level_data_tbl:
        return {k: None for k in ['protocol_name', 'output_metric', 'seasonal_primary',
                                   'seasonal_secondary', 'equipment', 'reference', 'reference_link']}
    return {
        'protocol_name':    get_row_value(level_data_tbl, 'Protocol name'),
        'output_metric':    get_row_value(level_data_tbl, 'Output metric'),
        'seasonal_primary': get_row_value(level_data_tbl, 'Seasonal window \u2014 primary'),
        'seasonal_secondary': get_row_value(level_data_tbl, 'Seasonal window \u2014 secondary'),
        'equipment':        get_row_value(level_data_tbl, 'Equipment required'),
        'reference':        get_row_value(level_data_tbl, 'Primary reference framework'),
        'reference_link':   get_row_value(level_data_tbl, 'Reference link'),
    }


def is_placeholder(text):
    if not text:
        return True
    return '[to be populated]' in text.lower() or '[placeholder]' in text.lower()


def parse_profile(filepath):
    doc = Document(filepath)
    tables = get_table_headers(doc)
    p = {}

    # ── Identity block ─────────────────────────────────────────────────
    # Flora variant profiles have an extra intro table after the IDENTITY BLOCK header;
    # scan forward to find the table that actually contains a "Profile number" row.
    id_tbl = None
    for i, (idx, hdr, tbl) in enumerate(tables):
        if 'identity block' in hdr.lower():
            for j in range(i + 1, min(i + 6, len(tables))):
                candidate = tables[j][2]
                if get_row_value(candidate, 'Profile number') is not None:
                    id_tbl = candidate
                    break
            break
    if id_tbl:
        p['profile_number'] = int(get_row_value(id_tbl, 'Profile number') or 0)
        p['profile_name']   = get_row_value(id_tbl, 'Plain language name') or ''
        p['category']       = get_row_value(id_tbl, 'Category') or ''

        tier_raw = get_row_value(id_tbl, 'Tier') or 'Universal'
        p['tier'] = 'Universal' if 'universal' in tier_raw.lower() else 'Conditional'

        cond_raw = get_row_value(id_tbl, 'Conditionality criteria') or ''
        p['conditionality_criteria'] = (
            None if ('not applicable' in cond_raw.lower() or not cond_raw)
            else cond_raw
        )

        prereq_raw = get_row_value(id_tbl, 'Hard prerequisite') or ''
        p['hard_prerequisite'] = (
            None if prereq_raw.lower().startswith('none')
            else (prereq_raw or None)
        )

        role_raw = get_row_value(id_tbl, 'Primary monitoring role') or ''
        # Short form: up to first em-dash or period
        role_short = re.split(r' \u2014 |\.(?= [A-Z])', role_raw)[0].strip()
        p['primary_monitoring_role'] = role_short or role_raw

        task_raw = get_row_value(id_tbl, 'Monitoring task type') or ''
        # Strip the "(-> ILM col 28)" suffix and description
        task_clean = re.sub(r'\s*\(\u2192.*?\)', '', task_raw)
        task_clean = task_clean.split(' \u2014 ')[0].split('. See ')[0].strip()
        p['monitoring_task_type'] = task_clean
    else:
        p.update({'profile_number': 0, 'profile_name': '', 'category': '',
                  'tier': 'Universal', 'conditionality_criteria': None,
                  'hard_prerequisite': None, 'primary_monitoring_role': '',
                  'monitoring_task_type': ''})

    # ── Monitoring stage / timescale ────────────────────────────────────
    eco_tbl = find_table_after_keyword(tables, 'ECOLOGICAL RATIONALE')
    if eco_tbl:
        # The eco table itself has 1 cell; the NEXT table has stage/timescale
        # Actually the stage/timescale table is find_table_after 'ECOLOGICAL RATIONALE'
        # but we also need to skip the 'Static content' table if present
        stage_raw = get_row_value(eco_tbl, 'Monitoring stage')
        timescale_raw = get_row_value(eco_tbl, 'Response timescale')
        if not stage_raw:
            # Try next table
            for i, (idx, hdr, tbl) in enumerate(tables):
                if 'ECOLOGICAL RATIONALE' in hdr.upper():
                    # Look at tables i+1, i+2
                    for j in range(i+1, min(i+5, len(tables))):
                        candidate = tables[j][2]
                        sr = get_row_value(candidate, 'Monitoring stage')
                        if sr:
                            stage_raw = sr
                            timescale_raw = get_row_value(candidate, 'Response timescale')
                            break
                    break
        p['monitoring_stage'] = parse_monitoring_stage(stage_raw)
        p['response_timescale'] = parse_response_timescale(timescale_raw)
    else:
        p['monitoring_stage'] = None
        p['response_timescale'] = None

    # ── Linkage A ───────────────────────────────────────────────────────
    # Use find_data_table_after_keyword for A1 — profile 35 has a note table between
    # the 'A1 —' header and the actual pressure data table.
    a1_tbl = find_data_table_after_keyword(tables, 'A1 \u2014')
    p['block4_pressures'] = extract_int_ids(a1_tbl) if a1_tbl else None

    a2_tbl = find_table_after_keyword(tables, 'A2 \u2014')
    p['block5_challenges'] = extract_int_ids(a2_tbl) if a2_tbl else None

    a3_tbl = find_table_after_keyword(tables, 'A3 \u2014')
    p['block6_services'] = extract_int_ids(a3_tbl) if a3_tbl else None

    a4_tbl = find_table_after_keyword(tables, 'A4 \u2014')
    p['relevant_efgs'] = extract_efg_codes(a4_tbl) if a4_tbl else None

    a5_tbl = find_table_after_keyword(tables, 'A5 \u2014')
    p['relevant_ipcc_land_use'] = extract_strings_col0(
        a5_tbl, skip_header=True,
        exclude_prefixes=['IPCC Land', 'All categories']
    ) if a5_tbl else None

    a6_tbl = find_table_after_keyword(tables, 'A6 \u2014')
    p['soil_type_associations'] = extract_strings_col0(
        a6_tbl, skip_header=True,
        exclude_prefixes=['Soil Type', '[geo]']
    ) if a6_tbl else None

    a7_tbl = find_table_after_keyword(tables, 'A7 \u2014')
    p['crop_livestock_associations'] = extract_strings_col0(
        a7_tbl, skip_header=True,
        exclude_prefixes=['Association', 'Crop', 'Livestock']
    ) if a7_tbl else None

    # Abiotic precursor linkages (A8) — extract A-codes
    abiotic_ids = []
    for _, hdr, tbl in tables:
        for row in tbl.rows:
            cells = dedup_cells([c.text.strip() for c in row.cells])
            if cells and re.match(r'^A\d{2}$', cells[0]):
                if cells[0] not in abiotic_ids:
                    abiotic_ids.append(cells[0])
    p['abiotic_precursor_linkages'] = abiotic_ids or None

    # ── Linkage B ───────────────────────────────────────────────────────
    b1_tbl = find_table_after_keyword(tables, 'B1 \u2014')
    p['b1_practices_that_benefit'] = extract_pcodes(b1_tbl) if b1_tbl else []

    b2_tbl = find_table_after_keyword(tables, 'B2 \u2014')
    p['b2_practices_primarily_verified'] = extract_pcodes(b2_tbl) if b2_tbl else []
    p['b2_expected_direction_of_change'] = extract_b2_direction(b2_tbl) if b2_tbl else None

    # ── Linkage C ───────────────────────────────────────────────────────
    c_tbl = find_table_after_keyword(tables, 'LINKAGE C \u2014')
    if not c_tbl:
        c_tbl = find_table_after_keyword(tables, 'LINKAGE C')
    # C data table should have "Connected Group" header
    c_data_tbl = None
    if c_tbl:
        row0 = dedup_cells([c.text.strip() for c in c_tbl.rows[0].cells]) if c_tbl.rows else []
        if row0 and 'connected group' in row0[0].lower():
            c_data_tbl = c_tbl
        else:
            # next table
            for i, (idx, hdr, tbl) in enumerate(tables):
                if 'LINKAGE C' in hdr.upper():
                    for j in range(i+1, min(i+5, len(tables))):
                        candidate = tables[j][2]
                        if candidate.rows:
                            r0 = dedup_cells([c.text.strip() for c in candidate.rows[0].cells])
                            if r0 and 'connected group' in r0[0].lower():
                                c_data_tbl = candidate
                                break
                    break
    p['linkage_c_connected_groups'] = extract_linkage_c(c_data_tbl) if c_data_tbl else None

    # ── Level protocols ─────────────────────────────────────────────────
    for lv in [1, 2, 3]:
        ld = get_level_data(tables, lv)
        p[f'level{lv}_protocol_name']      = ld['protocol_name']
        p[f'level{lv}_output_metric']      = ld['output_metric']
        p[f'level{lv}_seasonal_primary']   = ld['seasonal_primary']
        p[f'level{lv}_seasonal_secondary'] = ld['seasonal_secondary']
        p[f'level{lv}_equipment']          = ld['equipment']
        p[f'level{lv}_reference']          = ld['reference']
        p[f'level{lv}_reference_link']     = ld['reference_link']

    p['primary_reference'] = (
        p.get('level1_reference') or p.get('level2_reference') or None
    )

    # ── Validation status ───────────────────────────────────────────────
    vstat_tbl = find_table_after_keyword(tables, 'VALIDATION STATUS')
    if vstat_tbl:
        raw = get_row_value(vstat_tbl, 'Status') or 'DRAFT - Unvalidated'
        p['validation_status'] = raw
    else:
        p['validation_status'] = 'DRAFT - Unvalidated'

    # ── Populated flag ──────────────────────────────────────────────────
    # True    = linkages present AND protocol content present
    # "partial" = linkages present BUT no protocol content yet
    # False   = neither (profile not yet authored at all)
    has_protocol = bool(
        p.get('level1_protocol_name')
        and not is_placeholder(p.get('level1_protocol_name'))
    )
    has_linkages = bool(p.get('block4_pressures'))
    if has_protocol and has_linkages:
        p['populated'] = True
    elif has_linkages and not has_protocol:
        p['populated'] = 'partial'
    else:
        p['populated'] = False

    return p


# ── Main ────────────────────────────────────────────────────────────────────
docx_files = sorted([
    f for f in os.listdir(DOCX_DIR)
    if f.startswith('LAHMP_Profile_') and f.endswith('.docx')
])

profiles = []
errors = []
for fname in docx_files:
    path = os.path.join(DOCX_DIR, fname)
    try:
        pr = parse_profile(path)
        profiles.append(pr)
        pop = '\u2713' if pr.get('populated') else '\u2717'
        b2 = pr.get('b2_practices_primarily_verified', [])
        print(f'[{pop}] #{pr.get("profile_number",0):02d} {pr.get("profile_name","?")[:40]:40s} '
              f'b4={len(pr.get("block4_pressures") or [])} '
              f'b2={b2}')
    except Exception as e:
        import traceback
        errors.append((fname, str(e)))
        print(f'[E] {fname}: {e}')

# Sort by profile number
profiles.sort(key=lambda x: x.get('profile_number', 0))

print(f'\n--- Summary ---')
print(f'Total: {len(profiles)}')
print(f'Populated: {sum(1 for p in profiles if p.get("populated"))}')
print(f'Not populated: {sum(1 for p in profiles if not p.get("populated"))}')
if errors:
    print(f'Errors: {len(errors)}')
    for fname, err in errors:
        print(f'  {fname}: {err}')

# Write output
with open(OUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(profiles, f, ensure_ascii=False, indent=2)
print(f'\nWrote {len(profiles)} profiles to {OUT_FILE}')
