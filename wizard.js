// ============================================================
// LAHMP Wizard — wizard.js
// All algorithm logic and UI rendering.
// index.html is presentation only; all content comes from data/.
// ============================================================

'use strict';

// ── Constants ─────────────────────────────────────────────────────────────

const SITE_COUNT_MIDPOINT = { '1': 1, '2-5': 3, '6-20': 13, '21-100': 60, '100+': 100 };

const TEAM_PROTOCOL_LEVEL = { A: 1, B: 1, C: 2, D: 2, E: 3, F: 3 };

const TEAM_LABELS = {
  A: 'Land managers / farmers',
  B: 'Extension officers',
  C: 'Field technicians / agronomists',
  D: 'Biologists / ecologists',
  E: 'Research scientists',
  F: 'External contracted specialists',
};

const EQUIPMENT_CATEGORIES = [
  'Basic field kit (tape measure, compass, stakes, clipboard)',
  'Soil sampling tools (auger, bulk density cores, trowel)',
  'Water quality meters (pH, EC, dissolved oxygen)',
  'Camera / photo-documentation (DSLR, smartphone with macro)',
  'GPS / GIS device or smartphone with mapping app',
  'Insect sampling equipment (sweep nets, pitfall traps, Malaise trap)',
  'Bioacoustic recorder (bat detector, bird / frog recorder)',
  'eDNA sampling kit (filters, sterile containers, field kit)',
  'Soil laboratory access (pH, texture, bulk density, SOC)',
  'Molecular laboratory access (PCR, sequencing, PLFA/NLFA)',
  'Microscopy (light microscope or compound microscope)',
  'Spectrophotometer or colorimeter (nutrient analysis)',
  'Access to external analytical laboratory (contract services)',
];

const PRESCREEN_LABELS = {
  q1_trees:     'Are you open to integrating trees into your farming system? (agroforestry, hedgerows, shade trees)',
  q2_livestock: 'Are you open to integrating or diversifying livestock? (mixed farming, rotational grazing)',
  q3_set_aside: 'Are you open to setting aside land for habitat creation? (wildflower margins, buffer strips, ponds)',
  q4_inputs:    'Are you open to reducing external inputs? (fertilisers, pesticides, herbicides)',
};

const PRESCREEN_ANSWERS = [
  { value: 'open',               label: 'Yes — open to this now' },
  { value: 'open_conditionally', label: 'Yes — open in the longer term / conditionally' },
  { value: 'not_currently',      label: 'Not currently possible' },
];

// Area weighting: keywords that must appear in a land_use_composition category name
// for that pressure to be relevant to that land parcel. null = landscape-wide (no weighting).
const PRESSURE_LAND_USE_KEYWORDS = {
  1:  ['cropland','agroforestry','plantation'],   // Intensive tillage
  2:  ['cropland','agroforestry','plantation'],   // Soil compaction
  3:  ['cropland','agroforestry'],                // Excessive synthetic fertilizer
  4:  ['cropland','agroforestry'],                // Excessive insecticides
  5:  ['cropland','agroforestry'],                // Excessive herbicide
  6:  ['cropland','agroforestry'],                // Excessive fungicide
  7:  ['cropland','agroforestry'],                // Excessive nematicide
  8:  ['cropland','agroforestry'],                // Excessive rodenticide
  9:  ['cropland','agroforestry'],                // Excessive molluscicide
  10: ['cropland','agroforestry'],                // Soil fumigation
  11: ['cropland','agroforestry'],                // Excessive manure
  12: ['irrigated','wetland','paddy','flooded'],  // Excessive irrigation
  13: ['cropland','agroforestry'],                // Monoculture
  14: ['cropland','agroforestry'],                // Removal of crop residues
  15: null,                                       // Unsustainable water abstraction — landscape-wide
  16: ['irrigated','wetland','paddy','flooded'],  // Drainage/irrigation modification
  17: null,                                       // Water pollution — landscape-wide
  18: ['grassland','pasture','rangeland','mixed crop-livestock'], // Overgrazing
  19: ['grassland','shrubland','forest','natural','semi-natural'],// Removal of non-crop vegetation
  20: ['forest','shrubland','plantation','woodland','grassland'], // Overextraction of wood
  21: null,                                       // Invasive species — landscape-wide
  22: null,                                       // Land-use change — landscape-wide
  23: null,                                       // Landscape fragmentation — landscape-wide
  24: null,                                       // Fire — landscape-wide
  25: null,                                       // Soil pollution — landscape-wide
  26: null,                                       // External pollution — landscape-wide
  27: null,                                       // Abandonment — landscape-wide
  28: null,                                       // Other — landscape-wide
};

const THEME_TO_CHAIN = {
  'Soil Management':                        'Soil recovery and biological function chain',
  'Crop System Diversification':            'Crop system diversity and soil health chain',
  'Integrated Pest and Disease Management': 'Natural regulation and IPM chain',
  'Water Management':                       'Water quality and hydrology chain',
  'Livestock and Pasture Management':       'Grazing management and pasture recovery chain',
  'Agroforestry and Tree Integration':      'Woody cover and landscape connectivity chain',
  'Habitat and Landscape Management':       'Above-ground habitat recovery chain',
  'Nutrient Cycling and Resource Efficiency':'Nutrient cycling and soil chemistry chain',
  'Carbon and Land Restoration':            'Land restoration chain',
  'Agrobiodiversity':                       'Agrobiodiversity and genetic resource chain',
  'System-Level':                           null,
};

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

// ── Global data ────────────────────────────────────────────────────────────

let practicesData   = [];
let indicatorsData  = [];
let abioticData     = [];
let referenceData   = {};
let currentStep     = 1;
window.demoMode     = false;  // true when a demo fixture is loaded via the demo button

// EFG map data (loaded once at init, stored globally)
window.lahmpData = { metadata: null, gridIndex: null };
let _efgMap     = null;  // Leaflet map instance for Block 1.2 EFG selector
let _efgMapRect = null;  // Current 0.5° cell highlight rectangle

// ── Assessment state ────────────────────────────────────────────────────────

window.assessment = {
  assessment_id: null,
  landscape_name: '',
  created_at: null,
  last_updated: null,

  step1: {
    landscape_name: '',
    country: '',
    admin_region: '',
    monitoring_programme_name: '',
    area_ha: null,
    ipcc_land_use_categories: [],
    soil_types: [],
    efg_codes: [],
    map_click_lng: null,   // longitude of last confirmed map click (context, not polygon)
    map_click_lat: null,   // latitude  of last confirmed map click
    description: '',
    land_uses: [],
    crops: [],
    livestock: [],
    land_use_composition: [],
    pressures: [],
    challenges: [],
    services: [],
  },

  step2: {
    prescreen: { q1_trees: null, q2_livestock: null, q3_set_aside: null, q4_inputs: null },
    selected_practices: [],
    practice_count: 0,
    theme_counts: {},
    standard_count: 0,
    transformative_count: 0,
  },

  step3: {
    team_types: [],
    willingness_recruit: null,
    willingness_recruit_roles: '',
    days_by_type: {},
    willingness_time: null,
    equipment_capabilities: [],
    willingness_equipment: null,
    willingness_equipment_categories: [],
    budget_tier: null,
    site_count_category: null,
    site_count: 1,
    site_distribution: null,
    access_calendar: MONTHS.map(m => ({ month: m, access: 'accessible', reason: '' })),
    capacity_profile: null,
  },

  step4_outputs: {
    practice_chains: [],
    selected_indicator_groups: [],
    selected_abiotic: [],
    protocol_assignments: [],
    trimmed_groups: [],
    calendar: [],
    narrative: { paragraph1: '', paragraph2: '', paragraph3: '', paragraph4: '' },
  },
};

// ── Data loading ──────────────────────────────────────────────────────────

async function loadData() {
  const [p, i, a, r, meta, grid] = await Promise.all([
    fetch('data/practices.json').then(r => r.json()),
    fetch('data/indicators.json').then(r => r.json()),
    fetch('data/abiotic.json').then(r => r.json()),
    fetch('data/reference.json').then(r => r.json()),
    fetch('data/metadata.json').then(r => r.json()),
    fetch('data/grid_index.json').then(r => r.json()),
  ]);
  practicesData  = p;
  indicatorsData = i;
  abioticData    = a;
  referenceData  = r;
  window.lahmpData.metadata  = meta;
  window.lahmpData.gridIndex = grid;
}

// ── localStorage ──────────────────────────────────────────────────────────

function saveState() {
  window.assessment.last_updated = new Date().toISOString();
  // Strip computed Step 4 outputs — they are re-derived on Step 4 load, not user input
  const { step4_outputs, ...toSave } = window.assessment;
  localStorage.setItem('lahmp_assessment', JSON.stringify(toSave));
  localStorage.setItem('lahmp_step', String(currentStep));
  const el = document.getElementById('autosave');
  if (el) { el.textContent = 'Saved'; el.classList.add('visible'); setTimeout(() => el.classList.remove('visible'), 2000); }
  // Live checklist + button update
  updateStepUI(currentStep);
}

function loadSavedState() {
  try {
    const s = localStorage.getItem('lahmp_assessment');
    const step = localStorage.getItem('lahmp_step');
    if (s) {
      const parsed = JSON.parse(s);
      // Deep merge to preserve default structure
      Object.keys(parsed).forEach(k => { window.assessment[k] = parsed[k]; });
      if (step) currentStep = Math.max(1, Math.min(4, parseInt(step) || 1));
      return true;
    }
  } catch(e) { console.warn('Could not restore saved state', e); }
  return false;
}

// ── Algorithm functions ────────────────────────────────────────────────────

function reduceConfidence(c) {
  if (c === 'high') return 'medium';
  if (c === 'medium') return 'low';
  return null;
}

function confidenceRank(c) {
  return { high: 3, medium: 2, low: 1 }[c] ?? 0;
}

function pressureAreaFraction(pressureId, landUseComposition) {
  const keywords = PRESSURE_LAND_USE_KEYWORDS[pressureId];
  if (!keywords || !landUseComposition || !landUseComposition.length) return 1; // no weighting
  const total = landUseComposition.reduce((s, e) => s + (e.area_pct || 0), 0);
  if (!total) return 1;
  const relevant = landUseComposition
    .filter(e => keywords.some(kw => (e.category || '').toLowerCase().includes(kw)))
    .reduce((s, e) => s + (e.area_pct || 0), 0);
  return relevant / total;
}

// ── Equipment keyword → category index (0-based, matches EQUIPMENT_CATEGORIES array) ──
function equipmentTextToIds(text) {
  if (!text) return [];
  const t = text.toLowerCase();
  const ids = [];
  if (/auger|soil.*sampl|bulk.density|soil.cor/.test(t)) ids.push(1);
  if (/water quality|ph meter|dissolved oxygen|conductivity/.test(t)) ids.push(2);
  if (/sweep net|pitfall|malaise|insect.*sampl/.test(t)) ids.push(5);
  if (/bat detector|bioacoustic|acoustic recorder|ultrasonic/.test(t)) ids.push(6);
  if (/\bedna\b|dna.*filter|sterile.*field.*kit/.test(t)) ids.push(7);
  if (/soil laborator|infrared.*co|toc analys|loss.on.ignition|walkley/.test(t)) ids.push(8);
  if (/molecular lab|pcr|sequencing|plfa|nlfa|freeze.dr/.test(t)) ids.push(9);
  if (/microscop/.test(t)) ids.push(10);
  if (/spectrophotometer|colorimeter/.test(t)) ids.push(11);
  if (/gc.ms|external.*analytic.*lab|contract.*lab|specialist.*lab/.test(t)) ids.push(12);
  return ids;
}

// Hard prerequisite check — true if step1 context satisfies the indicator's prerequisite.
// 'None...' always passes. Unknown text defaults to true (include by default).
function hardPrerequisiteMet(text, step1, step2) {
  if (!text || /^\s*none\b/i.test(text)) return true;
  const t = text.toLowerCase();
  const lu = (step1.land_uses || []).map(l => l.toLowerCase()).join(' ');
  const efg = (step1.efg_codes || []).join(' ').toLowerCase();
  const geo = ((step1.country || '') + ' ' + (step1.admin_region || '')).toLowerCase();
  if (/water body|pond|stream|river|wetland|ditch|paddy|aquatic/.test(t))
    return /water|wetland|paddy|rice|irrigat|aquatic|riparian|f3\.3/.test(lu + ' ' + efg);
  if (/arable crop|annual.*crop|biennial crop/.test(t))
    return /crop|arable|cereal|annual/.test(lu);
  if (/grassland|pasture|sward|meadow/.test(t))
    return /grass|pasture|meadow|rangeland|sward/.test(lu);
  if (/hedgerow|woody boundary|tree line|shelter belt/.test(t)) {
    const pcodes = (step2?.selected_practices || []).map(p => p.p_code);
    return /agroforest|hedgerow|woodland|orchard|plantation/.test(lu)
      || pcodes.some(p => ['P19','P20','P21','P22','P23'].includes(p));
  }
  if (/livestock.*dung|dung.*livestock|vertebrate.*dung/.test(t))
    return (step1.livestock || []).length > 0 || /livestock|pasture|mixed.*livestock|grazing/.test(lu);
  if (/at least one tree|individual woody plant >3m/.test(t))
    return /agroforest|orchard|plantation|woodland|tree/.test(lu);
  if (/termite presence/.test(t))
    return /t7\.4|t7\.5|t4|t5|f3/.test(efg)
      || /tropical|subtropical|sahel|africa|asia|vietnam|india/.test(geo);
  if (/permanent crop.*inter.row|inter.row.*orchard/.test(t))
    return /permanent crop|orchard|plantation/.test(lu);
  return true; // unknown prerequisite: include by default
}

// Conditionality check — true if landscape context activates this conditional indicator.
function conditionalityMet(text, step1) {
  if (!text || !text.trim()) return true;
  const t = text.toLowerCase();
  const lu = (step1.land_uses || []).map(l => l.toLowerCase()).join(' ');
  const efg = (step1.efg_codes || []).join(' ').toLowerCase();
  const geo = ((step1.country || '') + ' ' + (step1.admin_region || '')).toLowerCase();
  if (/dung beetle|livestock.*dung|vertebrate.*dung/.test(t))
    return (step1.livestock || []).length > 0 || /livestock|pasture|mixed.*livestock/.test(lu);
  if (/water body|breeding.*water|amphibian|no suitable breeding/.test(t))
    return /water|wetland|paddy|rice|irrigat|aquatic/.test(lu + ' ' + efg);
  if (/tropical.*subtropical|scarab|centipede/.test(t))
    return /t7\.4|t7\.5|t4|t5|f3/.test(efg)
      || /tropical|subtropical|sahel|africa|asia|vietnam/.test(geo);
  if (/crop pest|economic.*pest|ipm/.test(t))
    return /crop|arable|cereal|annual/.test(lu);
  return true;
}

function prepopulateChallenges(pressures, landUseComposition) {
  const mapping = referenceData.pressure_to_challenge_mapping || {};
  const challengeMap = {};
  for (const pressure of pressures) {
    if (pressure.status === 'not_relevant') continue;
    for (const m of (mapping[pressure.id] || [])) {
      let conf = m.confidence;
      if (pressure.status === 'past' || pressure.status === 'not_sure') conf = reduceConfidence(conf);
      if (!conf) continue;
      // Area weighting: if this pressure's relevant land use covers < 10% of landscape, reduce confidence
      const fraction = pressureAreaFraction(pressure.id, landUseComposition);
      if (fraction < 0.10) conf = reduceConfidence(conf);
      if (!conf) continue;
      if (!challengeMap[m.challenge_id] || confidenceRank(conf) > confidenceRank(challengeMap[m.challenge_id])) {
        challengeMap[m.challenge_id] = conf;
      }
    }
  }
  return Object.entries(challengeMap).map(([id, confidence]) => ({
    id: parseInt(id), confidence, pre_populated: true, confirmed: false,
  }));
}

function prepopulateServices(challenges) {
  const mapping = referenceData.challenge_to_service_mapping || {};
  const svcMap = {};
  for (const c of challenges) {
    if (!c.confirmed) continue;
    for (const m of (mapping[c.id] || [])) {
      let conf = m.confidence;
      if (!svcMap[m.service_id] || confidenceRank(conf) > confidenceRank(svcMap[m.service_id])) {
        svcMap[m.service_id] = conf;
      }
    }
  }
  return Object.entries(svcMap).map(([id]) => ({
    id: parseInt(id), selected: true, priority_rank: null, pre_populated: true,
  }));
}

function scorePractice(practice, step1) {
  let pressurePts = 0, challengePts = 0, servicePts = 0;
  const pressureIds = (step1.pressures || []).filter(p => p.status !== 'not_relevant').map(p => p.id);
  pressurePts += (practice.block4_pressures || []).filter(id => pressureIds.includes(id)).length;
  for (const cid of (practice.block5_challenges || [])) {
    const uc = (step1.challenges || []).find(c => c.id === cid && c.confirmed);
    if (!uc) continue;
    challengePts += uc.confidence === 'high' ? 2 : uc.confidence === 'medium' ? 1 : 0;
  }
  for (const sid of (practice.block6_services || [])) {
    const us = (step1.services || []).find(s => s.id === sid && s.selected);
    if (!us || !us.priority_rank) continue;
    servicePts += us.priority_rank === 1 ? 3 : us.priority_rank === 2 ? 2 : 1;
  }
  const total = pressurePts + challengePts + servicePts;
  return { total, pressurePts, challengePts, servicePts };
}

function getEligiblePractices() {
  const step1   = window.assessment.step1;
  const prescreen = window.assessment.step2.prescreen;
  const userLandUses = (step1.land_uses || []).map(l => l.toLowerCase());
  const userEFGs     = step1.efg_codes || [];

  const PRESCREEN_QMAP = { q1: 'q1_trees', q2: 'q2_livestock', q3: 'q3_set_aside', q4: 'q4_inputs' };

  return practicesData.map(p => {
    // EFG filter
    if (p.relevant_efgs && p.relevant_efgs.length && userEFGs.length) {
      if (!p.relevant_efgs.some(e => userEFGs.includes(e))) return null;
    }
    // Land use filter
    if (userLandUses.length) {
      const allApp = [...(p.primary_applicability || []), ...(p.transformative_applicability || [])];
      // Entries containing 'all' land use or 'none' (= universally applicable) always pass
      const isUniversal = allApp.some(a => {
        const al = a.toLowerCase();
        return al.startsWith('none') || al.startsWith('all cropland') || al.startsWith('all land use');
      });
      if (!isUniversal) {
        const overlap = allApp.some(a =>
          userLandUses.some(ul => a.toLowerCase().includes(ul) || ul.includes(a.toLowerCase().split(' ')[0]))
        );
        if (allApp.length && !overlap) return null;
      }
    }
    // Tier / pre-screen
    let tier = 'standard';
    if (p.prescreen_question) {
      const key = PRESCREEN_QMAP[p.prescreen_question.toLowerCase()];
      const answer = prescreen[key];
      if (answer === 'not_currently') return null;
      if (answer === 'open' || answer === 'open_conditionally') tier = 'transformative';
    }
    const scoreObj = scorePractice(p, step1);
    return { ...p, score: scoreObj.total, scoreBreakdown: scoreObj, tier };
  }).filter(Boolean);
}

function computeCapacityProfile(step3) {
  const types   = (step3.team_types || []);
  const levels  = types.map(t => TEAM_PROTOCOL_LEVEL[t.type] ?? 1);
  const maxLevel = levels.length ? Math.max(...levels) : 1;
  const totalDays = Object.values(step3.days_by_type || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const siteCount = SITE_COUNT_MIDPOINT[step3.site_count_category] || 1;
  return {
    max_protocol_level: maxLevel,
    available_days_total: totalDays,
    per_site_days: totalDays / siteCount,
    equipment_ids: step3.equipment_capabilities || [],
    budget_tier: step3.budget_tier ?? 0,
    willingness_profile: {
      recruit:   step3.willingness_recruit   !== 'no',
      time:      step3.willingness_time      !== 'no',
      equipment: step3.willingness_equipment !== 'no',
    },
  };
}

function selectIndicatorGroups(step1, step2) {
  const selectedPCodes  = (step2.selected_practices || []).map(p => p.p_code);
  const userEFGs        = (step1.efg_codes || []);
  const userLandUses    = (step1.land_uses || []).map(l => l.toLowerCase());
  const confirmedChallengeIds = (step1.challenges || []).filter(c => c.confirmed).map(c => c.id);

  return indicatorsData
    .filter(ind => ind.populated === true || ind.populated === 'draft' || ind.populated === 'partial')
    .map(ind => {
      // EFG filter
      if (ind.relevant_efgs?.length && userEFGs.length) {
        if (!ind.relevant_efgs.some(e => userEFGs.includes(e))) return null;
      }
      // Land use filter
      if (ind.relevant_ipcc_land_use?.length && userLandUses.length) {
        const indLU = ind.relevant_ipcc_land_use.map(l => l.toLowerCase());
        const luPass = indLU.some(il =>
          il === 'all categories' ||
          userLandUses.some(ul => ul.includes(il) || il.includes(ul.split(' ')[0]))
        );
        if (!luPass) return null;
      }
      // Hard prerequisite check
      if (ind.hard_prerequisite && !hardPrerequisiteMet(ind.hard_prerequisite, step1, step2)) return null;
      // Conditionality check (Conditional-tier indicators only)
      if (ind.tier === 'Conditional' && !conditionalityMet(ind.conditionality_criteria, step1)) return null;
      const b2 = (ind.b2_practices_primarily_verified || []).some(p => selectedPCodes.includes(p));
      const b1 = (ind.b1_practices_that_benefit || []).some(p => selectedPCodes.includes(p));
      const ch = (ind.block5_challenges || []).some(id => confirmedChallengeIds.includes(id));
      if (!b2 && !b1 && !ch) return null;
      return { ...ind, inclusion_reason: b2 ? 'B2 primary verifier' : b1 ? 'B1 supporting' : 'Challenge signal', priority: b2 ? 3 : b1 ? 2 : 1 };
    })
    .filter(Boolean);
}

function assignProtocol(group, cap) {
  const hasL1 = !!group.level1_protocol_name;
  const hasL2 = !!group.level2_protocol_name;
  const hasL3 = !!group.level3_protocol_name;
  const maxAvail = hasL3 ? 3 : hasL2 ? 2 : hasL1 ? 1 : 0;
  const minAvail = hasL1 ? 1 : hasL2 ? 2 : hasL3 ? 3 : 0;
  if (maxAvail === 0) {
    // Partial profile — linkages present but protocol content not yet authored
    if (group.populated === 'partial') {
      return { ...group, assigned_level: null, assigned_protocol: null, assigned_metric: null,
               assigned_reference: null, assigned_reference_link: null, assigned_equipment_ids: [],
               requires_upgrade: false, protocol_pending: true };
    }
    return null;  // fully empty — skip
  }
  let level = Math.min(cap.max_protocol_level, maxAvail);
  if (level < minAvail) level = minAvail;  // upgrade to lowest available level
  if (level === 3 && cap.budget_tier === 0) level = Math.max(minAvail, 2);
  // Equipment override: downgrade to highest level where required equipment is available
  {
    const availableEq = cap.equipment_ids || [];
    let equipLevel = level;
    while (equipLevel > minAvail) {
      const reqIds = equipmentTextToIds(group[`level${equipLevel}_equipment`] || '');
      if (!reqIds.length || reqIds.every(id => availableEq.includes(id))) break;
      equipLevel--;
    }
    level = equipLevel;
  }
  const proto = level === 3 ? group.level3_protocol_name : level === 2 ? group.level2_protocol_name : group.level1_protocol_name;
  const metric = level === 3 ? group.level3_output_metric : level === 2 ? group.level2_output_metric : group.level1_output_metric;
  const ref          = group[`level${level}_reference`] || group.primary_reference || null;
  const refLink      = group[`level${level}_reference_link`] || null;
  const assignedEqIds = equipmentTextToIds(group[`level${level}_equipment`] || '');
  const requires_upgrade = level > cap.max_protocol_level;
  // Draft profiles have system-proposed protocols awaiting expert validation
  const protocol_draft = (group.populated === 'draft');
  return { ...group, assigned_level: level, assigned_protocol: proto, assigned_metric: metric, assigned_reference: ref, assigned_reference_link: refLink, assigned_equipment_ids: assignedEqIds, requires_upgrade, protocol_draft };
}

// ── Operation 5 — Monitoring calendar ─────────────────────────────────────

// Seasonal preference windows (month indices, 0-based)
const SPRING_IDX  = [2,3,4,5];   // March–June
const AUTUMN_IDX  = [7,8,9,10];  // August–November
const WINTER_IDX  = [11,0,1];    // December–February
const ALL_IDX     = Array.from({length:12},(_,i)=>i);

const MONTH_NAMES_LC = ['january','february','march','april','may','june',
                        'july','august','september','october','november','december'];

// Split a sorted array of month indices into non-adjacent groups.
// Groups separated by a gap > 1 become separate windows.
function splitIntoWindows(indices) {
  if (!indices.length) return [];
  const groups = [];
  let cur = [indices[0]];
  for (let i = 1; i < indices.length; i++) {
    if (indices[i] - indices[i-1] <= 1) { cur.push(indices[i]); }
    else { groups.push(cur); cur = [indices[i]]; }
  }
  groups.push(cur);
  return groups;
}

// Parse seasonal guidance text into one or two arrays of month indices.
// Returns an array of window arrays (e.g. [[2,3,4],[8,9,10]] for spring + autumn),
// or null if the text contains no usable season information.
function parseSeasonalWindow(text) {
  if (!text || !text.trim()) return null;
  const t = text.toLowerCase();

  // Year-round
  if (/\byear.round\b/.test(t) || t.includes('any season')) return [ALL_IDX];

  const found = new Set();

  // 1. "Month1–Month2" (en-dash, em-dash, or hyphen) — highest priority
  const dashRe = new RegExp(
    `\\b(${MONTH_NAMES_LC.join('|')})[\u2013\u2014\\-](${MONTH_NAMES_LC.join('|')})\\b`, 'g'
  );
  let m;
  while ((m = dashRe.exec(t)) !== null) {
    const s = MONTH_NAMES_LC.indexOf(m[1]), e = MONTH_NAMES_LC.indexOf(m[2]);
    if (s !== -1 && e !== -1) {
      if (e >= s) { for (let i = s; i <= e; i++) found.add(i); }
      else { for (let i = s; i < 12; i++) found.add(i); for (let i = 0; i <= e; i++) found.add(i); }
    }
  }
  // 2. "Month1 to Month2"
  const toRe = new RegExp(
    `\\b(${MONTH_NAMES_LC.join('|')})\\s+to\\s+(${MONTH_NAMES_LC.join('|')})\\b`, 'g'
  );
  while ((m = toRe.exec(t)) !== null) {
    const s = MONTH_NAMES_LC.indexOf(m[1]), e = MONTH_NAMES_LC.indexOf(m[2]);
    if (s !== -1 && e !== -1) {
      if (e >= s) { for (let i = s; i <= e; i++) found.add(i); }
      else { for (let i = s; i < 12; i++) found.add(i); for (let i = 0; i <= e; i++) found.add(i); }
    }
  }
  // 3. Individual month names
  MONTH_NAMES_LC.forEach((mn, i) => {
    if (new RegExp(`\\b${mn}\\b`).test(t)) found.add(i);
  });

  if (found.size) {
    const groups = splitIntoWindows([...found].sort((a,b) => a-b));
    return groups.length ? groups : null;
  }

  // 4. Season keyword fallback
  // Catch-all patterns use negative lookbehind to avoid double-matching
  // inside "early spring", "late summer", etc.
  const seasonMap = [
    [/\bearly spring\b/,                    [1,2,3]],
    [/\blate spring\b/,                     [3,4,5]],
    [/(?<!early |late )\bspring\b/,         [2,3,4]],
    [/\bearly summer\b/,                    [4,5,6]],
    [/\bmidsummer\b|\bmid.summer\b/,        [5,6,7]],
    [/\blate summer\b/,                     [7,8]],
    [/(?<!early |late |mid)\bsummer\b/,     [5,6,7]],
    [/\bearly autumn\b|\bearly fall\b/,     [8,9]],
    [/(?<!early )\bautumn\b|(?<!early )\bfall\b/, [8,9,10]],
    [/\bwinter\b/,                          [11,0,1]],
    [/\bwet season\b/,                      [5,6,7,8]],
    [/\bdry season\b/,                      [11,0,1,2]],
    [/\bwarm season\b/,                     [4,5,6,7,8,9]],
  ];
  const seasonFound = new Set();
  for (const [re, idx] of seasonMap) {
    if (re.test(t)) idx.forEach(i => seasonFound.add(i));
  }
  if (seasonFound.size) {
    const groups = splitIntoWindows([...seasonFound].sort((a,b) => a-b));
    return groups.length ? groups : null;
  }

  return null;
}

function stageSpeed(monitoringStage) {
  const s = (monitoringStage || '').toLowerCase();
  // Compound descriptors (e.g. "Fast–medium") → take the slower/more conservative end
  if (s.startsWith('fast–medium') || s.startsWith('fast-medium')) return 'medium';
  if (s.startsWith('slow–very') || s.startsWith('slow-very')) return 'slow';
  if (s.startsWith('fast')) return 'fast';
  if (s.startsWith('medium')) return 'medium';
  if (s.startsWith('slow') || s.startsWith('very slow')) return 'slow';
  return 'medium';
}

function buildMonitoringCalendar(groups, accessCalendar) {
  // Pending-protocol groups have no seasonal window — exclude from calendar
  groups = groups.filter(g => !g.protocol_pending);

  // Build accessible month index set
  const accessByIdx = {};
  MONTHS.forEach((m, i) => {
    const entry = accessCalendar.find(e => e.month === m);
    accessByIdx[i] = entry ? entry.access : 'accessible';
  });

  const accessibleIdx = Object.entries(accessByIdx).filter(([,v]) => v === 'accessible').map(([k]) => parseInt(k));
  const constrainedIdx = Object.entries(accessByIdx).filter(([,v]) => v === 'constrained').map(([k]) => parseInt(k));

  function pickWindow(preferredIdx, fallbackIdx) {
    const hits = preferredIdx.filter(i => accessibleIdx.includes(i));
    if (hits.length) return hits;
    return fallbackIdx.filter(i => accessibleIdx.includes(i));
  }

  function idxToRange(indices) {
    if (!indices || !indices.length) return null;
    const sorted = [...indices].sort((a,b)=>a-b);
    if (sorted.length === 1) return MONTHS[sorted[0]].slice(0,3);
    if (sorted[sorted.length-1] - sorted[0] === sorted.length - 1)
      return `${MONTHS[sorted[0]].slice(0,3)}–${MONTHS[sorted[sorted.length-1]].slice(0,3)}`;
    return sorted.map(i => MONTHS[i].slice(0,3)).join(', ');
  }

  return groups.map(g => {
    const speed = stageSpeed(g.monitoring_stage);

    // Use seasonal guidance from the assigned protocol level; fall back to level1 text
    const seasonalText = g[`level${g.assigned_level}_seasonal_primary`]
      || g.level1_seasonal_primary || '';
    const seasonalSecText = g[`level${g.assigned_level}_seasonal_secondary`]
      || g.level1_seasonal_secondary || '';
    const parsed    = parseSeasonalWindow(seasonalText);
    const parsedSec = parseSeasonalWindow(seasonalSecText);

    let windows = [];
    let windowIndices = [];

    if (accessibleIdx.length === 0) {
      windows = ['No accessible months specified — define in Step 3'];
    } else if (parsed && parsed.length) {
      // Use indicator-specific windows, filtered to accessible months
      const w1 = pickWindow(parsed[0], accessibleIdx);
      // Use parsed[1] if primary text contained two windows; otherwise use secondary seasonal field
      const w2 = parsed[1]
        ? pickWindow(parsed[1], [])
        : (parsedSec?.[0] ? pickWindow(parsedSec[0], []) : null);
      windowIndices = [...new Set([...w1, ...(w2 || [])])];
      const r1 = idxToRange(w1);
      const r2 = w2 && w2.length ? idxToRange(w2) : null;
      if (r1 && r2 && r1 !== r2) windows = [r1, r2];
      else if (r1) windows = [r1];
      else windows = ['Any accessible month'];
    } else {
      // Speed-based heuristic fallback (no parseable seasonal text)
      if (speed === 'fast') {
        const sp = pickWindow(SPRING_IDX, WINTER_IDX);
        const au = pickWindow(AUTUMN_IDX, SPRING_IDX);
        windowIndices = [...new Set([...sp, ...au])];
        const spRange = idxToRange(sp), auRange = idxToRange(au);
        if (spRange && auRange && spRange !== auRange) windows = [spRange, auRange];
        else if (spRange) windows = [spRange];
        else windows = [auRange || 'Any accessible month'];
      } else if (speed === 'medium') {
        const sp = pickWindow(SPRING_IDX, [...AUTUMN_IDX, ...WINTER_IDX]);
        windowIndices = sp;
        windows = [idxToRange(sp) || 'Any accessible month'];
      } else {
        const best = pickWindow([...SPRING_IDX, ...AUTUMN_IDX], ALL_IDX);
        windowIndices = best;
        windows = [idxToRange(best) || 'Any accessible month'];
      }
    }

    const constrainedNames = constrainedIdx.map(i => MONTHS[i].slice(0,3));
    const caveat = constrainedNames.length
      ? ` (avoid: ${constrainedNames.join(', ')})`
      : '';

    return {
      profile_name: g.profile_name,
      category: g.category,
      monitoring_stage: g.monitoring_stage || '—',
      response_timescale: g.response_timescale || '—',
      suggested_window: windows.join(' and ') + caveat,
      window_month_indices: windowIndices,
      frequency: speed === 'fast' ? 'Annual (×2)' : speed === 'medium' ? 'Annual' : 'Every 2–5 years',
    };
  });
}

// ── Operation 4 — Capacity fitting ─────────────────────────────────────────

// Estimated field days per indicator per site at each protocol level
const DAYS_PER_LEVEL = { 1: 0.5, 2: 1.0, 3: 1.5 };

function priorityScore(group, step2, step1) {
  const selectedPCodes = (step2.selected_practices || []).map(p => p.p_code);
  const top3Challenges = (step1.challenges || [])
    .filter(c => c.confirmed)
    .sort((a, b) => confidenceRank(b.confidence) - confidenceRank(a.confidence))
    .slice(0, 3).map(c => c.id);
  const top3Services = (step1.services || [])
    .filter(s => s.selected && s.priority_rank)
    .sort((a, b) => a.priority_rank - b.priority_rank)
    .slice(0, 3).map(s => s.id);

  let score = 0;
  score += (group.b2_practices_primarily_verified || []).filter(p => selectedPCodes.includes(p)).length * 3;
  score += (group.block5_challenges || []).filter(id => top3Challenges.includes(id)).length * 2;
  score += (group.block6_services || []).filter(id => top3Services.includes(id)).length * 1;
  if (group.tier === 'Universal') score += 2;
  if (group.monitoring_stage?.startsWith('Fast')) score += 1;
  return score;
}

function capacityFit(assigned, cap, step2, step1) {
  // Pending-protocol groups are never counted against capacity — separate them out
  const pendingGroups = assigned.filter(g => g.protocol_pending);
  const activeGroups  = assigned.filter(g => !g.protocol_pending);

  if (!cap.available_days_total || !cap.per_site_days) return { kept: [...activeGroups, ...pendingGroups], trimmed: [] };
  const siteCount = SITE_COUNT_MIDPOINT[window.assessment.step3.site_count_category] || 1;

  // Score and sort active groups only
  const scored = activeGroups.map(g => ({
    ...g,
    _priority: priorityScore(g, step2, step1),
    _days_required: (DAYS_PER_LEVEL[g.assigned_level] || 0.5) * siteCount,
  })).sort((a, b) => b._priority - a._priority || b.assigned_level - a.assigned_level);

  const kept = [];
  const trimmed = [];
  let usedDays = 0;

  for (const g of scored) {
    if (usedDays + g._days_required <= cap.available_days_total) {
      usedDays += g._days_required;
      kept.push(g);
    } else {
      const daysShort = (g._days_required - (cap.available_days_total - usedDays)).toFixed(1);
      const unlockParts = [`+${daysShort} monitoring days/year`];
      if (!cap.willingness_profile.time)      unlockParts.push('or indicate willingness to increase monitoring time (Q2b)');
      if (!cap.willingness_profile.recruit)   unlockParts.push('or recruit additional team capacity (Q1b)');
      const groupMaxLevel = g.level3_protocol_name ? 3 : g.level2_protocol_name ? 2 : 1;
      if (groupMaxLevel > cap.max_protocol_level) {
        if (groupMaxLevel >= 3) unlockParts.push('or upgrade to a Level 3 team (Type E/F)');
        else unlockParts.push('or recruit a specialist technician (Team Type C or D)');
      }
      trimmed.push({
        ...g,
        trim_reason:   `Exceeds capacity (needs ${g._days_required.toFixed(1)} days/cycle; ${(cap.available_days_total - usedDays).toFixed(1)} remaining).`,
        unlock_hint:   unlockParts.join(', '),
      });
    }
  }
  return { kept: [...kept, ...pendingGroups], trimmed };
}

function runStep4Algorithm() {
  const { step1, step2, step3 } = window.assessment;
  const cap = computeCapacityProfile(step3);
  step3.capacity_profile = cap;

  // Op 1 – Practice chains
  const themeMap = {};
  for (const p of (step2.selected_practices || [])) {
    if (!themeMap[p.theme]) themeMap[p.theme] = [];
    themeMap[p.theme].push(p);
  }
  const practice_chains = Object.entries(themeMap).map(([theme, practices]) => ({
    theme, chain_label: THEME_TO_CHAIN[theme] || theme, practices,
  }));

  // Op 2 – Indicator group selection
  const rawGroups = selectIndicatorGroups(step1, step2);

  const selectedPCodes = (step2.selected_practices || []).map(p => p.p_code);
  const availableEq = cap.equipment_ids || [];
  const selected_abiotic = abioticData
    .filter(a => a.universal_baseline || (a.linked_practices || []).some(p => selectedPCodes.includes(p)))
    .map(a => {
      const reqEq  = a.equipment_required || [];
      const missing = reqEq.filter(id => !availableEq.includes(id));
      if (!missing.length) return a;
      return {
        ...a,
        equipment_gap: true,
        missing_equipment: missing.map(id => EQUIPMENT_CATEGORIES[id] || `Cat. ${id}`),
      };
    });

  // Op 3 – Protocol assignment
  const withProtocols = rawGroups.map(g => assignProtocol(g, cap)).filter(Boolean);

  // Op 4 – Capacity fitting
  const { kept: protocol_assignments, trimmed: trimmed_groups } = capacityFit(withProtocols, cap, step2, step1);

  // Op 5 – Calendar (uses Step 3 access calendar to suggest monitoring windows)
  const calendar = buildMonitoringCalendar(protocol_assignments, step3.access_calendar || []);

  // Narrative
  const ongoingPressures = (step1.pressures || [])
    .filter(p => p.status === 'ongoing')
    .slice(0, 3)
    .map(p => (referenceData.block4_pressures || []).find(r => r.id === p.id)?.name)
    .filter(Boolean);
  const topChallenges = (step1.challenges || []).filter(c => c.confirmed)
    .sort((a, b) => confidenceRank(b.confidence) - confidenceRank(a.confidence))
    .slice(0, 3)
    .map(c => (referenceData.block5_challenges || []).find(r => r.id === c.id)?.name).filter(Boolean);
  const topServices = (step1.services || []).filter(s => s.selected && s.priority_rank)
    .sort((a,b) => a.priority_rank - b.priority_rank).slice(0, 3)
    .map(s => (referenceData.block6_services || []).find(r => r.id === s.id)?.name).filter(Boolean);

  const levelLabel = cap.max_protocol_level === 1
    ? 'community observer level (Protocol Level 1)'
    : cap.max_protocol_level === 2
    ? 'technician level (Protocol Level 2)'
    : 'research level (Protocol Level 3)';

  const totalDaysNeeded = withProtocols.reduce((sum, g) => {
    const siteCount = SITE_COUNT_MIDPOINT[step3.site_count_category] || 1;
    return sum + (DAYS_PER_LEVEL[g.assigned_level] || 0.5) * siteCount;
  }, 0);

  // EFG context for narrative
  const efgNames = (step1.efg_codes || []).map(code => {
    const opt = (referenceData.efg_options || []).find(e => e.code === code);
    return opt ? opt.name : code;
  });
  const efgContext = efgNames.length
    ? ` — a landscape characterised by ${efgNames.slice(0, 2).join(' and ')} ecosystems`
    : '';

  window.assessment.step4_outputs = {
    practice_chains,
    selected_indicator_groups: rawGroups,
    selected_abiotic,
    protocol_assignments,
    trimmed_groups,
    calendar,
    narrative: {
      paragraph1: `Your monitoring programme has been designed specifically for ${step1.landscape_name || 'your landscape'}${step1.country ? ', ' + step1.country : ''}${efgContext}. In Step 1, you identified ${(step1.pressures||[]).filter(p=>p.status!=='not_relevant').length} pressures currently affecting your land${ongoingPressures.length ? ' — particularly ' + ongoingPressures.join(', ') : ''}. These pressures are contributing to ${(step1.challenges||[]).filter(c=>c.confirmed).length} confirmed land health challenges${topChallenges.length ? ', with ' + topChallenges.join(', ') + ' being the most significant' : ''}.`,
      paragraph2: `In Step 2, you selected ${(step2.selected_practices||[]).length} sustainable land management practice${(step2.selected_practices||[]).length!==1?'s':''} across ${practice_chains.length} theme${practice_chains.length!==1?'s':''}. The ecosystem services you most want to see recover are${topServices.length ? ': ' + topServices.join(', ') : ' as described in your profile'}.`,
      paragraph3: (function() {
        const activeCount   = protocol_assignments.filter(g => !g.protocol_pending).length;
        const pendingCount  = protocol_assignments.filter(g =>  g.protocol_pending).length;
        const pendingNote   = pendingCount > 0 ? ` An additional ${pendingCount} group${pendingCount!==1?'s are':' is'} identified but awaiting protocol specification.` : '';
        return `Your team capacity supports ${levelLabel} monitoring. ${totalDaysNeeded > cap.available_days_total ? `The full indicator set requires an estimated ${totalDaysNeeded.toFixed(0)} field days; your programme has been fitted to your ${cap.available_days_total} available days, retaining` : 'Your programme includes'} ${activeCount} biological indicator group${activeCount!==1?'s':''} and ${selected_abiotic.length} abiotic indicator${selected_abiotic.length!==1?'s':''}.${pendingNote} ${selected_abiotic.filter(a=>a.universal_baseline).length} abiotic indicators form your universal baseline package, to be established in Year 1 before biological monitoring begins.`;
      })(),
      paragraph4: `With ${cap.available_days_total} monitoring days available across your team (${cap.per_site_days.toFixed(1)} days per site), ${trimmed_groups.length > 0 ? `${trimmed_groups.length} indicator group${trimmed_groups.length!==1?'s were':' was'} deferred to the Enhancement Recommendations section below — these could be added if your team or budget grows.` : 'your full indicator set fits within your current capacity.'}`,
    },
  };
}

// ── Tag picker (reusable autocomplete multi-select) ───────────────────

function renderTagPickerHtml(id, selectedArr, placeholder) {
  const arr = selectedArr || [];
  const hasTags = arr.length > 0 ? ' has-tags' : '';
  const tags = arr.map(v =>
    `<span class="tp-tag">${esc(v)}<button type="button" class="tp-remove" data-value="${esc(v)}" aria-label="Remove ${esc(v)}">×</button></span>`
  ).join('');
  return `<div class="tag-picker${hasTags}" id="${esc(id)}-picker">
    <div class="tp-tags" id="${esc(id)}-tp-tags">${tags}</div>
    <div class="tp-control">
      <input type="text" class="tp-input" id="${esc(id)}-tp-input"
        placeholder="${esc(placeholder)}" autocomplete="off" spellcheck="false">
      <ul class="tp-dropdown is-hidden" id="${esc(id)}-tp-dropdown" role="listbox"></ul>
    </div>
  </div>`;
}

function initTagPicker({ id, items, getSelected, onAdd, onRemove, showAllIfEmpty = true, limit = 30 }) {
  const input    = document.getElementById(id + '-tp-input');
  const dropdown = document.getElementById(id + '-tp-dropdown');
  const tagsEl   = document.getElementById(id + '-tp-tags');
  const pickerEl = document.getElementById(id + '-picker');
  if (!input || !dropdown || !tagsEl || !pickerEl) return;

  function hl(text, q) {
    if (!q) return esc(text);
    const lo = text.toLowerCase(), qi = lo.indexOf(q.toLowerCase());
    if (qi < 0) return esc(text);
    return esc(text.slice(0, qi))
         + '<strong>' + esc(text.slice(qi, qi + q.length)) + '</strong>'
         + esc(text.slice(qi + q.length));
  }

  function positionDropdown() {
    const rect = input.getBoundingClientRect();
    dropdown.style.top   = (rect.bottom + 3) + 'px';
    dropdown.style.left  = rect.left + 'px';
    dropdown.style.width = rect.width + 'px';
  }

  function open(query) {
    const q   = (query || '').trim();
    const sel = getSelected();
    let pool  = items.filter(item => !sel.includes(item.value));

    if (q) {
      const ql = q.toLowerCase();
      pool = pool.filter(item =>
        item.label.toLowerCase().includes(ql) || (item.sublabel || '').toLowerCase().includes(ql)
      );
    } else if (!showAllIfEmpty) {
      dropdown.innerHTML = `<li class="tp-hint">Type to search…</li>`;
      positionDropdown();
      dropdown.classList.remove('is-hidden');
      return;
    }

    pool = pool.slice(0, limit);

    if (!pool.length) {
      dropdown.innerHTML = `<li class="tp-empty">${q ? 'No matches' : 'All options selected'}</li>`;
    } else {
      dropdown.innerHTML = pool.map(item =>
        `<li class="tp-item" data-value="${esc(item.value)}" tabindex="-1" role="option">
          <span class="tp-label">${hl(item.label, q)}</span>
          ${item.sublabel ? `<span class="tp-sublabel">${hl(item.sublabel, q)}</span>` : ''}
        </li>`
      ).join('');
      dropdown.querySelectorAll('.tp-item').forEach(li => {
        li.addEventListener('mousedown', e => { e.preventDefault(); select(li.dataset.value); });
      });
    }
    positionDropdown();
    dropdown.classList.remove('is-hidden');
  }

  function close() { dropdown.classList.add('is-hidden'); }

  function select(value) {
    if (getSelected().includes(value)) return;
    onAdd(value);
    const span = document.createElement('span');
    span.className = 'tp-tag';
    span.innerHTML = `${esc(value)}<button type="button" class="tp-remove" data-value="${esc(value)}" aria-label="Remove ${esc(value)}">×</button>`;
    tagsEl.appendChild(span);
    pickerEl.classList.add('has-tags');
    input.value = '';
    close();
    input.focus();
  }

  input.addEventListener('focus',   () => open(input.value));
  input.addEventListener('input',   () => open(input.value));
  input.addEventListener('blur',    () => setTimeout(close, 200));
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape')    { close(); input.blur(); }
    if (e.key === 'Enter')     { e.preventDefault(); }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      dropdown.querySelector('.tp-item')?.focus();
    }
  });

  dropdown.addEventListener('keydown', e => {
    const els = [...dropdown.querySelectorAll('.tp-item')];
    const idx = els.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); els[Math.min(idx + 1, els.length - 1)]?.focus(); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); idx <= 0 ? input.focus() : els[idx - 1].focus(); }
    if (e.key === 'Enter')     { e.preventDefault(); if (idx >= 0) select(els[idx].dataset.value); }
    if (e.key === 'Escape')    { close(); input.focus(); }
  });

  tagsEl.addEventListener('click', e => {
    const btn = e.target.closest('.tp-remove');
    if (!btn) return;
    onRemove(btn.dataset.value);
    btn.closest('.tp-tag').remove();
    if (!tagsEl.querySelector('.tp-tag')) {
      pickerEl.classList.remove('has-tags');
    }
  });
}

// ── Render helpers ────────────────────────────────────────────────────────

const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// Build major-approach → practice list map across all 43 practices
function buildApproachMap() {
  const map = {};
  for (const p of practicesData) {
    for (const code of (p.approach_origins || '').split(',').map(c => c.trim()).filter(Boolean)) {
      const major = code.split('.')[0];
      if (!map[major]) map[major] = [];
      if (!map[major].find(x => x.p_code === p.p_code)) map[major].push({ p_code: p.p_code, name: p.name });
    }
  }
  return map;
}

// Render approach_origins string as individual badges grouped by major approach.
// Tooltip on each badge lists other practices sharing the same major approach group.
function formatApproachCodes(approachStr, thisPCode, approachMap) {
  if (!approachStr) return '';
  const codes = approachStr.split(',').map(c => c.trim()).filter(Boolean);
  const majorGroups = {};
  for (const code of codes) {
    const major = code.split('.')[0];
    if (!majorGroups[major]) majorGroups[major] = [];
    majorGroups[major].push(code);
  }
  return Object.entries(majorGroups).map(([major, subCodes]) => {
    const peers = (approachMap[major] || []).filter(p => p.p_code !== thisPCode);
    const tooltipPeers = peers.slice(0, 6).map(p => `${p.p_code} ${p.name}`).join(' · ');
    const tooltip = `IUCN NBS Approach ${major}${tooltipPeers ? ' — also linked to: ' + tooltipPeers : ''}`;
    const groupBadges = subCodes.map(code =>
      `<span class="approach-badge" title="${esc(tooltip)}">${esc(code)}</span>`
    ).join('');
    return `<span class="approach-group">${groupBadges}</span>`;
  }).join('');
}

function badge(text, cls) {
  return `<span class="badge badge-${esc(cls)}">${esc(text)}</span>`;
}

// ── Tooltip helpers ───────────────────────────────────────────────────────

// Returns an HTML string for inline use inside template literals.
function tooltipHtml(text) {
  return `<span class="tooltip-wrap" tabindex="0"><span class="tooltip-icon" aria-hidden="true">ⓘ</span><span class="tooltip-box" role="tooltip">${esc(text)}</span></span>`;
}

// Returns a DOM element — for imperative use (spec requirement).
function createTooltip(text) {
  const wrap = document.createElement('span');
  wrap.className = 'tooltip-wrap';
  wrap.setAttribute('tabindex', '0');
  wrap.innerHTML = `<span class="tooltip-icon" aria-hidden="true">ⓘ</span><span class="tooltip-box" role="tooltip">${esc(text)}</span>`;
  return wrap;
}

function confBadge(confidence) {
  const map = { high: ['high','High'], medium: ['medium','Medium'], low: ['low','Low'] };
  const [cls, label] = map[confidence] || ['low', confidence];
  return badge(label, 'conf-' + cls);
}

function block(id, title, content, opts = {}) {
  const { subtitle = '', collapsed = false } = opts;
  return `
  <div class="block" id="${esc(id)}">
    <button class="block-header" aria-expanded="${collapsed ? 'false' : 'true'}" aria-controls="${esc(id)}-body">
      <div class="block-title-wrap">
        <h2 class="block-title">${esc(title)}</h2>
        ${subtitle ? `<p class="block-subtitle">${esc(subtitle)}</p>` : ''}
      </div>
      <svg class="chevron" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <div class="block-body" id="${esc(id)}-body" ${collapsed ? 'hidden' : ''}>${content}</div>
  </div>`;
}

function radioGroup(name, options, value, extraAttrs = '') {
  return options.map(o => `
    <label class="radio-pill${value === o.value ? ' is-checked' : ''}">
      <input type="radio" name="${esc(name)}" value="${esc(o.value)}" ${value === o.value ? 'checked' : ''} ${extraAttrs}>
      ${esc(o.label)}
    </label>`).join('');
}

function multiCheckList(items, selectedArr, nameAttr, valueAttr = 'value', labelAttr = 'label') {
  return `<div class="check-grid">${items.map(item => {
    const val  = typeof item === 'string' ? item : item[valueAttr];
    const lbl  = typeof item === 'string' ? item : item[labelAttr];
    const checked = selectedArr.includes(val);
    return `<label class="check-item${checked ? ' is-checked' : ''}">
      <input type="checkbox" name="${esc(nameAttr)}" value="${esc(val)}" ${checked ? 'checked' : ''}>
      <span>${esc(lbl)}</span>
    </label>`;
  }).join('')}</div>`;
}

// ── EFG map helpers (Block 1.2) ───────────────────────────────────────────

// Grid key formula: rows bottom-to-top (lat_min = -90), 0.5° resolution, 720 cols.
function lngLatToGridKey(lng, lat) {
  const col = Math.floor((lng + 180) / 0.5);
  const row = Math.floor((lat  +  90) / 0.5);
  return row * 720 + col;
}

// Render a pre-checked checklist of EFG codes from a map-click result.
// codes = array of EFG code strings (may be empty).
function renderEfgChecklistHtml(codes) {
  if (!codes || !codes.length) {
    return '<p class="efg-checklist-hint">Click on the map to find EFGs for your location.</p>';
  }
  const efgs  = window.lahmpData.metadata?.efgs || {};
  const items = codes.map(code => {
    const efg  = efgs[code];
    const name = efg ? efg.name : code;
    const desc = efg ? efg.description : '';
    const tip  = desc ? desc.slice(0, 400) + (desc.length > 400 ? '…' : '') : '';
    return `<label class="efg-checklist-item is-checked">
      <input type="checkbox" class="efg-map-cb" value="${esc(code)}" checked>
      <span class="efg-checklist-code">${esc(code)}</span>
      <span class="efg-checklist-name">${esc(name)}</span>
      ${tip ? `<span class="efg-info" tabindex="0" title="${esc(tip)}">ⓘ</span>` : ''}
    </label>`;
  }).join('');
  return `<div class="efg-checklist">${items}</div>`;
}

// Initialise (or re-initialise) the Leaflet map embedded in Block 1.2.
// Called from initBlock12Events() after the block HTML is in the DOM.
function initEfgMapEvents() {
  // Tear down any prior Leaflet instance (block may be re-rendered)
  if (_efgMap) { _efgMap.remove(); _efgMap = null; _efgMapRect = null; }

  const mapEl = document.getElementById('efg-map');
  if (!mapEl) return;

  const { metadata, gridIndex } = window.lahmpData;

  // Guard: data still loading (shouldn't occur in normal flow — loadData() is awaited)
  if (!metadata || !gridIndex) {
    mapEl.innerHTML = '<div class="efg-map-loading"><div class="efg-spinner"></div><p>Loading EFG grid data…</p></div>';
    return;
  }

  const s = window.assessment.step1;
  const hasClick = s.map_click_lng != null && s.map_click_lat != null;

  _efgMap = L.map(mapEl, {
    center:               hasClick ? [s.map_click_lat, s.map_click_lng] : [20, 10],
    zoom:                 hasClick ? 5 : 2,
    minZoom:              1,
    maxBounds:            [[-90, -180], [90, 180]],
    maxBoundsViscosity:   1.0,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18,
  }).addTo(_efgMap);

  // Restore previous cell rectangle (if session has a confirmed click)
  if (hasClick) _efgHighlightCell(s.map_click_lng, s.map_click_lat);

  // Map click → grid lookup → checklist update
  _efgMap.on('click', e => {
    const lng = Math.max(-180, Math.min(179.99, e.latlng.lng));
    const lat = Math.max(-90,  Math.min( 89.99, e.latlng.lat));

    _efgHighlightCell(lng, lat);

    const key     = lngLatToGridKey(lng, lat);
    const indices = gridIndex[String(key)] || [];
    const codes   = indices.map(i => metadata.efg_list[i]);

    const checklistEl = document.getElementById('efg-map-checklist');
    if (checklistEl) {
      checklistEl.innerHTML = renderEfgChecklistHtml(codes);
      checklistEl.querySelectorAll('.efg-map-cb').forEach(cb => {
        cb.addEventListener('change', () =>
          cb.closest('.efg-checklist-item').classList.toggle('is-checked', cb.checked)
        );
      });
    }

    // Clear prior confirmation message
    const statusEl = document.getElementById('efg-map-status');
    if (statusEl) { statusEl.textContent = ''; statusEl.className = 'efg-map-status'; }

    // Stash pending coords on the map instance (committed on Confirm click)
    _efgMap._pendingLng = lng;
    _efgMap._pendingLat = lat;
  });

  // Confirm button — write checked codes to assessment.step1.efg_codes
  const confirmBtn = document.getElementById('btn-efg-confirm');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const checklistEl = document.getElementById('efg-map-checklist');
      const boxes   = checklistEl ? [...checklistEl.querySelectorAll('.efg-map-cb')] : [];
      const checked = boxes.filter(cb => cb.checked).map(cb => cb.value);

      window.assessment.step1.efg_codes = checked;

      const pendingLng = _efgMap?._pendingLng ?? null;
      const pendingLat = _efgMap?._pendingLat ?? null;
      if (pendingLng !== null) {
        window.assessment.step1.map_click_lng = pendingLng;
        window.assessment.step1.map_click_lat = pendingLat;
      }

      const statusEl = document.getElementById('efg-map-status');
      if (statusEl) {
        statusEl.textContent = checked.length
          ? 'EFGs saved. You can refine your selection by clicking a different location.'
          : 'No EFGs confirmed. Click the map or use manual selection below.';
        statusEl.className = 'efg-map-status ' + (checked.length ? 'is-success' : 'is-warning');
      }

      saveState();
    });
  }
}

// Draw / update the 0.5° cell rectangle on the EFG map.
function _efgHighlightCell(lng, lat) {
  if (!_efgMap) return;
  const cellLng = Math.floor(lng / 0.5) * 0.5;
  const cellLat = Math.floor(lat / 0.5) * 0.5;
  if (_efgMapRect) _efgMap.removeLayer(_efgMapRect);
  _efgMapRect = L.rectangle(
    [[cellLat, cellLng], [cellLat + 0.5, cellLng + 0.5]],
    { color: '#FDC82F', weight: 2, fillColor: '#FDC82F', fillOpacity: 0.2 }
  ).addTo(_efgMap);
}

// ── Step 1 render functions ───────────────────────────────────────────────

function renderBlock1() {
  const s = window.assessment.step1;
  return block('b1', 'Block 1 — Location', `
    <div class="form-grid">
      <div class="form-field">
        <label for="landscape_name">Landscape name <span class="req">*</span></label>
        <input type="text" id="landscape_name" name="landscape_name" value="${esc(s.landscape_name)}" placeholder="e.g. Skoura M'Daz, Draa Valley">
      </div>
      <div class="form-field">
        <label for="country">Country <span class="req">*</span></label>
        <input type="text" id="country" name="country" value="${esc(s.country)}" placeholder="e.g. Morocco">
      </div>
      <div class="form-field">
        <label for="admin_region">Administrative region</label>
        <input type="text" id="admin_region" name="admin_region" value="${esc(s.admin_region)}" placeholder="e.g. Draa-Tafilalet">
      </div>
      <div class="form-field">
        <label for="monitoring_programme_name">Monitoring programme name</label>
        <input type="text" id="monitoring_programme_name" name="monitoring_programme_name" value="${esc(s.monitoring_programme_name)}" placeholder="e.g. Skoura Agroforestry Monitoring 2025">
      </div>
    </div>`, { subtitle: 'Name, country, and administrative region of your landscape' });
}

function renderBlock12() {
  const s = window.assessment.step1;
  const efgOpts = referenceData.efg_options || [];

  // Group EFGs by realm, then biome. Agricultural realms expanded by default.
  const AGRI_REALMS = ['Terrestrial', 'Freshwater', 'Terrestrial-Freshwater'];
  const allRealms   = [...new Set(efgOpts.map(e => e.realm))];
  const orderedRealms = [
    ...AGRI_REALMS.filter(r => allRealms.includes(r)),
    ...allRealms.filter(r => !AGRI_REALMS.includes(r))
  ];

  const efgGroupsHtml = orderedRealms.map(realm => {
    const realmEFGs  = efgOpts.filter(e => e.realm === realm);
    const biomes     = [...new Set(realmEFGs.map(e => e.biome))];
    const biomesHtml = biomes.map(biome => {
      const boxes = efgOpts
        .filter(e => e.biome === biome)
        .map(e => {
          const checked = s.efg_codes.includes(e.code);
          return `<label class="check-item${checked ? ' is-checked' : ''}">
            <input type="checkbox" name="efg_code" value="${esc(e.code)}" ${checked ? 'checked' : ''}>
            <span class="efg-code-badge">${esc(e.code)}</span> ${esc(e.name)}
          </label>`;
        }).join('');
      return `<div class="efg-biome-group">
        <div class="efg-biome-label">${esc(biome)}</div>
        <div class="check-grid">${boxes}</div>
      </div>`;
    }).join('');
    const isOpen = AGRI_REALMS.includes(realm);
    return `<details class="efg-realm-group"${isOpen ? ' open' : ''}>
      <summary class="efg-realm-summary">${esc(realm)}</summary>
      <div class="efg-realm-body">${biomesHtml}</div>
    </details>`;
  }).join('');

  const abcMapUrl = 'https://abc-map.fao.org/dashboard';

  return block('b12', 'Block 1.2 — Land System', `
    <div class="form-grid">
      <div class="form-field">
        <label for="area_ha">Total area (hectares)</label>
        <input type="number" id="area_ha" name="area_ha" value="${s.area_ha ?? ''}" min="0" placeholder="e.g. 450">
      </div>
    </div>
    <div class="form-field-full">
      <label>Global Ecosystem Functional Groups (EFGs) ${tooltipHtml('A global classification of ecosystem types defined by their ecological processes and biological characteristics. Used by IUCN to describe where different biodiversity communities live.')} <span class="req">*</span></label>
      <p class="field-hint">Click your landscape location on the map. EFGs mapped to that 0.5° grid cell will be pre-selected — uncheck any that do not apply to your specific landscape, then click <strong>Confirm EFG selection</strong>.</p>
      <div id="efg-map"></div>
      <div id="efg-map-checklist">${renderEfgChecklistHtml(s.efg_codes)}</div>
      <div class="efg-confirm-wrap">
        <button type="button" class="btn btn-primary btn-sm" id="btn-efg-confirm">Confirm EFG selection</button>
        <span class="efg-map-status${s.efg_codes.length ? ' is-success' : ''}" id="efg-map-status">${s.efg_codes.length ? 'EFGs saved. You can refine your selection by clicking a different location.' : ''}</span>
      </div>
      <details class="efg-manual-fallback" id="efg-manual-details">
        <summary class="efg-manual-summary">My location is not well represented — select manually</summary>
        <div class="efg-manual-body">
          <p class="field-hint">Select from all 109 EFGs. Changes here update your confirmed selection immediately.</p>
          <div class="efg-selector">${efgGroupsHtml}</div>
        </div>
      </details>
    </div>

    <div class="abc-bridge">
      <div class="abc-bridge-header">Next: Get your land use and soil data</div>
      <div class="abc-bridge-body">
        <p class="abc-bridge-desc">The ABC Map (FAO) can extract IPCC land use categories and soil types for your location automatically.</p>
        <a class="btn btn-abc" href="${esc(abcMapUrl)}" target="_blank" rel="noopener noreferrer">
          Open ABC Map for my location
          <svg class="ext-icon" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M1 11L11 1M11 1H5M11 1V7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
        <p class="abc-bridge-note">ABC Map is an FAO tool — opens in a new tab. No data is shared automatically.</p>
        <ol class="abc-bridge-steps">
          <li>The map will open centred near your coordinates</li>
          <li>Draw your landscape boundary on the ABC Map</li>
          <li>Note the IPCC land use categories and soil types shown</li>
          <li>Return here and enter them below</li>
        </ol>
      </div>
    </div>

    <div class="form-field-full">
      <label>IPCC Land Use Categories present ${tooltipHtml('A standardised land use classification used in climate reporting. Helps identify which agricultural practices and monitoring approaches are relevant for your landscape.')} <span class="req">*</span></label>
      <p class="field-hint">Select the land use categories present in your landscape (from ABC Map or your knowledge).</p>
      ${multiCheckList(referenceData.ipcc_land_use_categories || [], s.ipcc_land_use_categories, 'ipcc_land_use_cat')}
    </div>
    <div class="form-field-full">
      <label>Soil types present</label>
      <p class="field-hint">Select the soil types present (from ABC Map or your knowledge).</p>
      ${multiCheckList(referenceData.ipcc_soil_types || [], s.soil_types, 'soil_type')}
    </div>`, { subtitle: 'Area, land use categories, EFGs, and soil types' });
}

function renderBlock13() {
  const s = window.assessment.step1;
  return block('b13', 'Block 1.3 — Landscape Description', `
    <div class="form-field-full">
      <label for="description">Brief description of the landscape and its current condition</label>
      <textarea id="description" name="description" rows="4" placeholder="Describe the landscape, its history, current challenges, and any relevant context...">${esc(s.description)}</textarea>
    </div>`, { subtitle: 'Free-text description for context' });
}

function renderBlock2() {
  const s = window.assessment.step1;
  return block('b2', 'Block 2 — Land Uses Present', `
    <p class="block-desc">Which land uses are present in your landscape? This determines which practices are eligible for recommendation.</p>
    ${renderTagPickerHtml('land-uses', s.land_uses, 'Search and select land uses…')}`,
    { subtitle: 'Select all land uses currently present' });
}

function renderBlock3() {
  const s = window.assessment.step1;

  const usedLUs  = s.land_uses.length ? s.land_uses : [];
  const compRows = usedLUs.map(lu => {
    const existing = (s.land_use_composition || []).find(c => c.category === lu);
    return `<tr>
      <td>${esc(lu)}</td>
      <td><input type="number" class="comp-input" data-category="${esc(lu)}" value="${existing ? existing.area_pct : ''}" min="0" max="100" placeholder="0"></td>
    </tr>`;
  }).join('');

  return block('b3', 'Block 3 — Agricultural Context', `
    <div class="form-subsection">
      <h3 class="subsection-title">3.1 — Crops grown</h3>
      <p class="field-hint">Search and select from ${(referenceData.block31_crops || []).length} listed crops. Type part of the name or botanical name.</p>
      ${renderTagPickerHtml('crops', s.crops, 'Search crops…')}
    </div>
    <div class="form-subsection">
      <h3 class="subsection-title">3.2 — Livestock present</h3>
      ${renderTagPickerHtml('livestock', s.livestock, 'Search livestock categories…')}
    </div>
    <div class="form-subsection">
      <h3 class="subsection-title">3.3 — Land use composition (%)</h3>
      <p class="field-hint">Approximate percentage of total area for each land use (from Block 2). Percentages should sum to 100%.</p>
      ${usedLUs.length ? `
      <table class="comp-table">
        <thead><tr><th>Land Use</th><th>% of Total Area</th></tr></thead>
        <tbody id="comp-tbody">${compRows}</tbody>
      </table>
      <p class="comp-total">Total: <span id="comp-total-val">0</span>%</p>` : `<p class="field-hint">Select land uses in Block 2 first.</p>`}
    </div>`,
    { subtitle: 'Crops, livestock, and land use composition', collapsed: true });
}

function renderBlock4() {
  const pressures = referenceData.block4_pressures || [];
  const statuses  = window.assessment.step1.pressures;

  const STATUS_OPTS = [
    { value: 'ongoing',      label: 'Ongoing' },
    { value: 'past',         label: 'Past' },
    { value: 'not_sure',     label: 'Not sure' },
    { value: 'not_relevant', label: 'Not relevant' },
  ];

  function pressureRow(p) {
    const saved     = statuses.find(s => s.id === p.id);
    const val       = saved?.status || 'not_relevant';
    const isFlagged = val !== 'not_relevant';
    const radios = STATUS_OPTS.map(o =>
      `<label class="pressure-radio${val === o.value ? ' is-active' : ''}">
        <input type="radio" name="pressure_${p.id}" value="${esc(o.value)}" data-pressure-id="${p.id}" ${val === o.value ? 'checked' : ''}>
        ${esc(o.label)}
      </label>`
    ).join('');

    if (p.id === 28) {
      const otherText = saved?.other_text || '';
      return `<div class="pressure-row pressure-row--other${isFlagged ? ' is-flagged' : ''}" id="pressure-row-28">
        <div class="pressure-row-main">
          <div class="pressure-name">
            <span class="pressure-id">P28</span>
            ${esc(p.name)}${p.tooltip ? tooltipHtml(p.tooltip) : ''}
          </div>
          <div class="pressure-radios">${radios}</div>
        </div>
        <input type="text" class="pressure-other-text${isFlagged ? '' : ' is-hidden'}"
               id="pressure-28-text"
               data-pressure-id="28"
               placeholder="Describe the pressure briefly…"
               value="${esc(otherText)}">
      </div>`;
    }

    return `<div class="pressure-row${isFlagged ? ' is-flagged' : ''}" id="pressure-row-${p.id}">
      <div class="pressure-name">
        <span class="pressure-id">${esc('P' + String(p.id).padStart(2,'0'))}</span>
        ${esc(p.name)}${p.tooltip ? tooltipHtml(p.tooltip) : ''}
      </div>
      <div class="pressure-radios">${radios}</div>
    </div>`;
  }

  // Group by p.group, preserving order of first appearance
  const groupOrder = [], groupMap = {};
  for (const p of pressures) {
    const g = p.group || 'Other';
    if (!groupMap[g]) { groupMap[g] = []; groupOrder.push(g); }
    groupMap[g].push(p);
  }
  const grouped = groupOrder.map(g =>
    `<div class="pressure-group">
      <div class="list-group-header">${esc(g)}</div>
      ${groupMap[g].map(pressureRow).join('')}
    </div>`
  ).join('');

  return block('b4', 'Block 4 — Pressures', `
    <p class="block-desc">For each pressure, indicate whether it is currently affecting your landscape. Responses pre-populate the Challenges list in Block 5.</p>
    <div class="pressure-list" id="pressure-list">${grouped}</div>`,
    { subtitle: '28 pressures — select status for each' });
}

function renderBlock5() {
  const allChallenges = referenceData.block5_challenges || [];
  const saved = window.assessment.step1.challenges;

  function challengeRow(c) {
    const state      = saved.find(s => s.id === c.id);
    const confirmed  = state?.confirmed ?? false;
    const pre_pop    = state?.pre_populated ?? false;
    const confidence = state?.confidence ?? null;
    const isActive   = !!state;
    if (!isActive) {
      return `<div class="challenge-row is-inactive" id="challenge-row-${c.id}">
        <label class="challenge-check">
          <input type="checkbox" class="challenge-manual" data-challenge-id="${c.id}" ${confirmed ? 'checked' : ''}>
          <span class="challenge-name">${esc(c.name)}${c.tooltip ? tooltipHtml(c.tooltip) : ''}</span>
        </label>
      </div>`;
    }
    return `<div class="challenge-row is-prepopulated${confirmed ? ' is-confirmed' : ''}" id="challenge-row-${c.id}">
      <label class="challenge-check">
        <input type="checkbox" class="challenge-confirm" data-challenge-id="${c.id}" ${confirmed ? 'checked' : ''}>
        <span class="challenge-name">${esc(c.name)}${c.tooltip ? tooltipHtml(c.tooltip) : ''}</span>
      </label>
      <div class="challenge-meta">
        ${confidence ? confBadge(confidence) : ''}
        ${pre_pop ? '<span class="badge badge-prepop">Pre-filled</span>' : ''}
      </div>
    </div>`;
  }

  const groupOrder = [], groupMap = {};
  for (const c of allChallenges) {
    const g = c.group || 'Other';
    if (!groupMap[g]) { groupMap[g] = []; groupOrder.push(g); }
    groupMap[g].push(c);
  }
  const grouped = groupOrder.map(g =>
    `<div class="challenge-group">
      <div class="list-group-header">${esc(g)}</div>
      ${groupMap[g].map(challengeRow).join('')}
    </div>`
  ).join('');

  const prepopCount  = saved.filter(c => c.pre_populated).length;
  const confirmedCount = saved.filter(c => c.confirmed).length;
  const subtitle5 = prepopCount
    ? `${prepopCount} pre-filled from pressures · ${confirmedCount} confirmed`
    : '35 challenges — confirm or add';

  return block('b5', 'Block 5 — Challenges', `
    <p class="block-desc">Challenges pre-populated from Block 4. Confirm the challenges that apply to your landscape. You can also add challenges manually.</p>
    <div class="challenge-list" id="challenge-list">${grouped}</div>`,
    { subtitle: subtitle5 });
}

function renderBlock6() {
  const allServices = referenceData.block6_services || [];
  const saved = window.assessment.step1.services;

  function serviceRow(s) {
    const state    = saved.find(sv => sv.id === s.id);
    const selected = state?.selected ?? false;
    const priority = state?.priority_rank ?? null;
    const pre_pop  = state?.pre_populated ?? false;
    const prioOpts = [1,2,3].map(n =>
      `<option value="${n}" ${priority === n ? 'selected' : ''}>${n}</option>`
    ).join('');
    return `<div class="service-row${selected ? ' is-selected' : ''}" id="service-row-${s.id}">
      <label class="service-check">
        <input type="checkbox" class="service-select" data-service-id="${s.id}" ${selected ? 'checked' : ''}>
        <span class="service-name">${esc(s.name)}${s.tooltip ? tooltipHtml(s.tooltip) : ''}</span>
      </label>
      <div class="service-meta">
        ${pre_pop ? '<span class="badge badge-prepop">Pre-filled</span>' : ''}
        <label class="priority-label${!selected ? ' is-hidden' : ''}" id="prio-label-${s.id}">
          Priority
          <select class="priority-select" data-service-id="${s.id}" ${!selected ? 'disabled' : ''}>
            <option value="">—</option>${prioOpts}
          </select>
        </label>
      </div>
    </div>`;
  }

  const groupOrder = [], groupMap = {};
  for (const s of allServices) {
    const g = s.group || 'Other';
    if (!groupMap[g]) { groupMap[g] = []; groupOrder.push(g); }
    groupMap[g].push(s);
  }
  const grouped = groupOrder.map(g =>
    `<div class="service-group">
      <div class="list-group-header">${esc(g)}</div>
      ${groupMap[g].map(serviceRow).join('')}
    </div>`
  ).join('');

  const prepopSvcs   = saved.filter(s => s.pre_populated).length;
  const selectedSvcs = saved.filter(s => s.selected).length;
  const subtitle6 = prepopSvcs
    ? `${prepopSvcs} pre-filled from challenges · ${selectedSvcs} selected`
    : '37 services — select and rank up to 3';

  return block('b6', 'Block 6 — Ecosystem Services', `
    <p class="block-desc">Services pre-populated from your confirmed challenges. Select the services to track and assign a priority rank (1 = highest) to up to three.</p>
    <div class="service-list" id="service-list">${grouped}</div>`,
    { subtitle: subtitle6 });
}

function renderStep1() {
  const el = document.getElementById('step1-blocks');
  el.innerHTML = renderBlock1() + renderBlock12() + renderBlock13() + renderBlock2() + renderBlock3() + renderBlock4() + renderBlock5() + renderBlock6();
  initBlock1Events();
  initBlock12Events();
  initBlock13Events();
  initBlock2Events();
  initBlock3Events();
  initBlock4Events();
  initBlock5Events();
  initBlock6Events();
  initCollapsibles(el);
  updateCompTotal();
  // Update header and document title with landscape name if already populated (e.g. from fixture or saved state)
  const name = window.assessment.step1.landscape_name;
  const hm = document.getElementById('header-meta');
  if (hm && name) hm.textContent = name;
  updateDocTitle();
  updateStepUI(1);
}

// ── Step 1 event handlers ─────────────────────────────────────────────────

function updateDocTitle() {
  const s = window.assessment.step1;
  const name = (s.landscape_name || '').trim();
  const prog = (s.monitoring_programme_name || '').trim();
  if (name && prog) {
    document.title = `${name} — ${prog} — LAHMP Wizard`;
  } else if (name) {
    document.title = `${name} — LAHMP Wizard`;
  } else {
    document.title = 'LAHMP Wizard — Land Health Monitoring Platform';
  }
}

function initBlock1Events() {
  ['landscape_name','country','admin_region','monitoring_programme_name'].forEach(field => {
    const el = document.getElementById(field);
    if (el) el.addEventListener('input', () => {
      window.assessment.step1[field] = el.value;
      if (field === 'landscape_name') {
        window.assessment.landscape_name = el.value;
        const hm = document.getElementById('header-meta');
        if (hm) hm.textContent = el.value;
      }
      if (field === 'landscape_name' || field === 'monitoring_programme_name') {
        updateDocTitle();
      }
      saveState();
    });
  });
}

function initBlock12Events() {
  document.querySelectorAll('input[name="ipcc_land_use_cat"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const s = window.assessment.step1;
      if (cb.checked) { if (!s.ipcc_land_use_categories.includes(cb.value)) s.ipcc_land_use_categories.push(cb.value); }
      else { s.ipcc_land_use_categories = s.ipcc_land_use_categories.filter(v => v !== cb.value); }
      cb.closest('label').classList.toggle('is-checked', cb.checked);
      saveState();
    });
  });
  document.querySelectorAll('input[name="soil_type"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const s = window.assessment.step1;
      if (cb.checked) { if (!s.soil_types.includes(cb.value)) s.soil_types.push(cb.value); }
      else { s.soil_types = s.soil_types.filter(v => v !== cb.value); }
      cb.closest('label').classList.toggle('is-checked', cb.checked);
      saveState();
    });
  });
  const areaEl = document.getElementById('area_ha');
  if (areaEl) areaEl.addEventListener('change', () => {
    window.assessment.step1.area_ha = areaEl.value ? parseFloat(areaEl.value) : null;
    saveState();
  });

  // Also update efg_codes when manual fallback checkboxes change
  document.querySelectorAll('input[name="efg_code"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const s = window.assessment.step1;
      if (cb.checked) { if (!s.efg_codes.includes(cb.value)) s.efg_codes.push(cb.value); }
      else { s.efg_codes = s.efg_codes.filter(v => v !== cb.value); }
      cb.closest('label').classList.toggle('is-checked', cb.checked);
      // Mirror confirmed selection in the map checklist status
      const statusEl = document.getElementById('efg-map-status');
      if (statusEl && !statusEl.textContent.includes('map')) {
        statusEl.textContent = s.efg_codes.length
          ? `${s.efg_codes.length} EFG${s.efg_codes.length !== 1 ? 's' : ''} selected manually.`
          : '';
        statusEl.className = 'efg-map-status' + (s.efg_codes.length ? ' is-success' : '');
      }
      saveState();
    });
  });

  // Initialise the embedded Leaflet map
  initEfgMapEvents();
}

function initBlock13Events() {
  const el = document.getElementById('description');
  if (el) el.addEventListener('input', () => { window.assessment.step1.description = el.value; saveState(); });
}

function initBlock2Events() {
  const luList = referenceData.block2_land_uses || [];
  initTagPicker({
    id:             'land-uses',
    items:          luList.map(lu => ({
      value:    lu.subcategory,
      label:    lu.subcategory,
      sublabel: lu.category + (lu.description ? ' — ' + lu.description : ''),
    })),
    showAllIfEmpty: true,
    getSelected:    () => window.assessment.step1.land_uses,
    onAdd:    v => { window.assessment.step1.land_uses.push(v); saveState(); rerenderBlock3(); },
    onRemove: v => { window.assessment.step1.land_uses = window.assessment.step1.land_uses.filter(x => x !== v); saveState(); rerenderBlock3(); },
  });
}

function initBlock3Events() {
  // 3.1 Crops
  initTagPicker({
    id:             'crops',
    items:          (referenceData.block31_crops || []).map(c => ({
      value:    c.name,
      label:    c.name,
      sublabel: c.botanical_name || '',
    })),
    showAllIfEmpty: false,
    limit:          30,
    getSelected:    () => window.assessment.step1.crops,
    onAdd:  v => { window.assessment.step1.crops.push(v); saveState(); },
    onRemove: v => { window.assessment.step1.crops = window.assessment.step1.crops.filter(x => x !== v); saveState(); },
  });

  // 3.2 Livestock
  initTagPicker({
    id:             'livestock',
    items:          (referenceData.block32_livestock || []).map(lv => ({
      value: lv.name,
      label: lv.name,
    })),
    showAllIfEmpty: true,
    getSelected:    () => window.assessment.step1.livestock,
    onAdd:  v => { window.assessment.step1.livestock.push(v); saveState(); },
    onRemove: v => { window.assessment.step1.livestock = window.assessment.step1.livestock.filter(x => x !== v); saveState(); },
  });

  // 3.3 Land use composition
  document.querySelectorAll('.comp-input').forEach(inp => {
    inp.addEventListener('input', () => {
      const cat  = inp.dataset.category;
      const val  = parseFloat(inp.value) || 0;
      const comp = window.assessment.step1.land_use_composition;
      const idx  = comp.findIndex(c => c.category === cat);
      if (idx > -1) comp[idx].area_pct = val; else comp.push({ category: cat, area_pct: val });
      updateCompTotal();
      saveState();
    });
  });
}

function updateCompTotal() {
  const inputs = document.querySelectorAll('.comp-input');
  let total = 0;
  inputs.forEach(i => { total += parseFloat(i.value) || 0; });
  const el = document.getElementById('comp-total-val');
  if (el) {
    el.textContent = total.toFixed(0);
    const p = el.parentElement;
    p.classList.toggle('is-over',     total > 100);
    p.classList.toggle('is-complete', Math.round(total) === 100);
    p.classList.toggle('is-under',    total > 0 && total < 100);
    // Show hint only when under
    let hint = p.querySelector('.comp-hint');
    if (total > 0 && total < 100) {
      if (!hint) { hint = document.createElement('span'); hint.className = 'comp-hint'; p.appendChild(hint); }
      hint.textContent = ` — ${(100 - total).toFixed(0)}% unallocated`;
    } else if (hint) {
      hint.remove();
    }
  }
}

function initBlock4Events() {
  document.querySelectorAll('input[type="radio"][data-pressure-id]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      const id  = parseInt(radio.dataset.pressureId);
      const val = radio.value;
      const pressures = window.assessment.step1.pressures;
      const idx = pressures.findIndex(p => p.id === id);
      if (idx > -1) pressures[idx].status = val;
      else pressures.push({ id, status: val, confidence: 'high' });

      // Update row highlight
      const row = document.getElementById('pressure-row-' + id);
      if (row) {
        row.classList.toggle('is-flagged', val !== 'not_relevant');
        row.querySelectorAll('.pressure-radio').forEach(lbl => {
          lbl.classList.toggle('is-active', lbl.querySelector('input').value === val);
        });
      }
      // Show/hide P28 text field when its status changes
      if (id === 28) {
        const textEl = document.getElementById('pressure-28-text');
        if (textEl) textEl.classList.toggle('is-hidden', val === 'not_relevant');
      }

      // Re-compute Block 5
      const newChallenges = prepopulateChallenges(window.assessment.step1.pressures, window.assessment.step1.land_use_composition);
      // Merge: keep manually confirmed, update pre-populated
      const manual = window.assessment.step1.challenges.filter(c => !c.pre_populated && c.confirmed);
      const merged = [...newChallenges];
      for (const m of manual) {
        if (!merged.find(c => c.id === m.id)) merged.push(m);
      }
      // Keep confirmed state from previous saves
      merged.forEach(c => {
        const prev = window.assessment.step1.challenges.find(pc => pc.id === c.id);
        if (prev) c.confirmed = prev.confirmed;
      });
      window.assessment.step1.challenges = merged;
      rerenderBlock5();
      saveState();
    });
  });

  // P28 free-text save
  const p28text = document.getElementById('pressure-28-text');
  if (p28text) {
    p28text.addEventListener('input', () => {
      const pressures = window.assessment.step1.pressures;
      const idx = pressures.findIndex(p => p.id === 28);
      if (idx > -1) pressures[idx].other_text = p28text.value;
      saveState();
    });
  }
}

function rerenderBlock3() {
  const b3 = document.getElementById('b3');
  if (!b3) return;
  // Preserve expanded/collapsed state
  const wasExpanded = b3.querySelector('.block-header')?.getAttribute('aria-expanded') === 'true';
  const tmp = document.createElement('div');
  tmp.innerHTML = renderBlock3();
  const newB3 = tmp.firstElementChild;
  if (wasExpanded) {
    newB3.querySelector('.block-header')?.setAttribute('aria-expanded', 'true');
    const body = newB3.querySelector('.block-body');
    if (body) body.hidden = false;
  }
  b3.replaceWith(newB3);
  initBlock3Events();
  initCollapsibles(document.getElementById('b3'));
  updateCompTotal();
}

function rerenderBlock5() {
  const b5 = document.getElementById('b5');
  if (!b5) return;
  const wasExpanded = b5.querySelector('.block-header')?.getAttribute('aria-expanded') === 'true';
  const tmp = document.createElement('div');
  tmp.innerHTML = renderBlock5();
  const newB5 = tmp.firstElementChild;
  if (wasExpanded) {
    newB5.querySelector('.block-header')?.setAttribute('aria-expanded', 'true');
    const body = newB5.querySelector('.block-body');
    if (body) body.hidden = false;
  }
  b5.replaceWith(newB5);
  initBlock5Events();
  initCollapsibles(document.getElementById('b5'));
  // Brief flash to signal the update
  const header = document.getElementById('b5')?.querySelector('.block-header');
  if (header) { header.classList.add('just-updated'); setTimeout(() => header.classList.remove('just-updated'), 900); }
}

function initBlock5Events() {
  document.querySelectorAll('.challenge-confirm, .challenge-manual').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = parseInt(cb.dataset.challengeId);
      const challenges = window.assessment.step1.challenges;
      const idx = challenges.findIndex(c => c.id === id);
      if (cb.checked) {
        if (idx > -1) challenges[idx].confirmed = true;
        else challenges.push({ id, confidence: null, pre_populated: false, confirmed: true });
      } else {
        if (idx > -1) challenges[idx].confirmed = false;
      }
      cb.closest('.challenge-row').classList.toggle('is-confirmed', cb.checked);
      // Update Block 6
      const newServices = prepopulateServices(window.assessment.step1.challenges);
      const prevSelected = window.assessment.step1.services.filter(s => s.selected && !s.pre_populated);
      const merged = [...newServices];
      for (const m of prevSelected) {
        if (!merged.find(s => s.id === m.id)) merged.push(m);
      }
      merged.forEach(s => {
        const prev = window.assessment.step1.services.find(ps => ps.id === s.id);
        if (prev) { s.selected = prev.selected; s.priority_rank = prev.priority_rank; }
      });
      window.assessment.step1.services = merged;
      rerenderBlock6();
      saveState();
    });
  });
}

function rerenderBlock6() {
  const b6 = document.getElementById('b6');
  if (!b6) return;
  const wasExpanded = b6.querySelector('.block-header')?.getAttribute('aria-expanded') === 'true';
  const tmp = document.createElement('div');
  tmp.innerHTML = renderBlock6();
  const newB6 = tmp.firstElementChild;
  if (wasExpanded) {
    newB6.querySelector('.block-header')?.setAttribute('aria-expanded', 'true');
    const body = newB6.querySelector('.block-body');
    if (body) body.hidden = false;
  }
  b6.replaceWith(newB6);
  initBlock6Events();
  initCollapsibles(document.getElementById('b6'));
  // Brief flash to signal the update
  const header = document.getElementById('b6')?.querySelector('.block-header');
  if (header) { header.classList.add('just-updated'); setTimeout(() => header.classList.remove('just-updated'), 900); }
}

function initBlock6Events() {
  document.querySelectorAll('.service-select').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = parseInt(cb.dataset.serviceId);
      const services = window.assessment.step1.services;
      const idx = services.findIndex(s => s.id === id);
      if (idx > -1) services[idx].selected = cb.checked;
      else services.push({ id, selected: cb.checked, priority_rank: null, pre_populated: false });
      cb.closest('.service-row').classList.toggle('is-selected', cb.checked);
      const prioLabel = document.getElementById('prio-label-' + id);
      if (prioLabel) {
        prioLabel.classList.toggle('is-hidden', !cb.checked);
        prioLabel.querySelector('select').disabled = !cb.checked;
      }
      saveState();
    });
  });
  document.querySelectorAll('.priority-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const id = parseInt(sel.dataset.serviceId);
      const services = window.assessment.step1.services;
      const idx = services.findIndex(s => s.id === id);
      const val = sel.value ? parseInt(sel.value) : null;
      if (idx > -1) services[idx].priority_rank = val;
      saveState();
    });
  });
}

// ── Step 2 render ─────────────────────────────────────────────────────────

function renderStep2() {
  const el = document.getElementById('step2-blocks');
  el.innerHTML = renderPrescreen() + renderPracticeRecommendations();
  initStep2Events();
  initCollapsibles(el);
  updateStepUI(2);
}

function renderPrescreen() {
  const pre = window.assessment.step2.prescreen;
  const rows = Object.entries(PRESCREEN_LABELS).map(([key, label]) => {
    const val = pre[key];
    return `<div class="prescreen-question">
      <p class="prescreen-label">${esc(label)}</p>
      <div class="radio-group">${radioGroup('pre_' + key, PRESCREEN_ANSWERS, val, `data-prescreen-key="${esc(key)}"`)}</div>
    </div>`;
  }).join('');
  return block('b20', 'Block 2.0 — Feasibility Pre-Screen', `
    <p class="block-desc">Answer four questions about your openness to different types of system changes. This filters which practice categories are shown below.</p>
    ${rows}`, { subtitle: '4 questions about your farming system context' });
}

function renderPracticeRecommendations() {
  const eligible = getEligiblePractices();
  const step2    = window.assessment.step2;
  const selectedPCodes = (step2.selected_practices || []).map(p => p.p_code);

  // Approach code map — built once across all 43 practices
  const approachMap = buildApproachMap();

  // Group by theme, sort by score desc
  const themes = {};
  for (const p of eligible) {
    if (!themes[p.theme]) themes[p.theme] = [];
    themes[p.theme].push(p);
  }
  Object.values(themes).forEach(arr => arr.sort((a,b) => b.score - a.score || a.name.localeCompare(b.name)));

  const selectedCount = selectedPCodes.length;
  const summary = `<div class="practice-summary" id="practice-summary">
    <span class="psum-num" id="psum-num">${selectedCount}</span> practice${selectedCount !== 1 ? 's' : ''} selected
  </div>`;

  const themeHtml = Object.entries(themes).map(([theme, practices]) => {
    const chainLabel = THEME_TO_CHAIN[theme];
    const cards = practices.map(p => {
      const isSelected = selectedPCodes.includes(p.p_code);
      const hasGuidance = p.field_observation_checklist || p.evidence_correct || p.evidence_non_implementation || p.implementation_constraints || p.tape_mapping || p.approach_origins;
      const guidanceHtml = hasGuidance ? `<details class="practice-field-guidance">
        <summary class="guidance-summary">Field guidance</summary>
        <div class="guidance-body">
          ${p.implementation_constraints ? `<div class="guidance-section"><h4>Implementation constraints</h4><p>${esc(p.implementation_constraints)}</p></div>` : ''}
          ${p.field_observation_checklist ? `<div class="guidance-section"><h4>Field observation checklist</h4><p>${esc(p.field_observation_checklist)}</p></div>` : ''}
          ${p.evidence_correct        ? `<div class="guidance-section guidance-correct"><h4>Evidence of correct implementation</h4><p>${esc(p.evidence_correct)}</p></div>` : ''}
          ${p.evidence_non_implementation ? `<div class="guidance-section guidance-incorrect"><h4>Evidence of non-implementation</h4><p>${esc(p.evidence_non_implementation)}</p></div>` : ''}
          ${p.tape_mapping ? `<div class="guidance-section guidance-tape"><h4>TAPE framework alignment</h4><p>${esc(p.tape_mapping)}</p></div>` : ''}
          ${p.approach_origins ? `<div class="guidance-section guidance-approach"><h4>IUCN NBS approach codes</h4><div class="approach-badges-wrap">${formatApproachCodes(p.approach_origins, p.p_code, approachMap)}</div></div>` : ''}
        </div>
      </details>` : '';
      return `<div class="practice-card${isSelected ? ' is-selected' : ''}" id="pcard-${esc(p.p_code)}">
        <label class="practice-check">
          <input type="checkbox" class="practice-select" data-pcode="${esc(p.p_code)}" ${isSelected ? 'checked' : ''}>
          <div class="practice-card-body">
            <div class="practice-card-header">
              <span class="practice-code">${esc(p.p_code)}</span>
              <span class="practice-name">${esc(p.name)}</span>
              <div class="practice-badges">
                <span class="badge badge-${p.tier === 'transformative' ? 'transformative' : 'standard'}">${p.tier === 'transformative' ? 'Transformative' : 'Standard'}${p.tier === 'transformative' ? tooltipHtml('Practices that require a shift in your farming system. Higher impact but greater implementation effort.') : tooltipHtml('Practices that fit within your existing farming system — no fundamental system change required.')}</span>
                ${p.applicable_scale ? `<span class="badge badge-scale">${esc(p.applicable_scale)}</span>` : ''}
                ${p.score > 0 ? `<span class="practice-score">▲ ${p.score}${tooltipHtml('Calculated from how closely this practice addresses the pressures, challenges, and ecosystem services you identified in Step 1. Higher = stronger match.')}</span>` : ''}
              </div>
            </div>
            <p class="practice-rationale">${esc(p.rationale || '')}</p>
          </div>
        </label>
        ${guidanceHtml}
      </div>`;
    }).join('');
    return `<div class="theme-group">
      <div class="theme-header">
        <h3 class="theme-title">${esc(theme)}</h3>
        ${chainLabel ? `<span class="chain-label">${esc(chainLabel)}</span>` : ''}
      </div>
      <div class="practice-cards">${cards}</div>
    </div>`;
  }).join('');

  return block('b21', 'Block 2.1 — Practice Recommendations', `
    ${summary}
    <p class="block-desc">Practices are filtered by your landscape context and scored by relevance to your pressures, challenges, and ecosystem services. Select all practices you are implementing or plan to implement.</p>
    <div id="theme-groups">${themeHtml || '<p class="empty-state">No practices match the current landscape context. Complete Step 1 to see recommendations.</p>'}</div>`,
    { subtitle: `${eligible.length} eligible practices grouped by theme` });
}

function initStep2Events() {
  document.querySelectorAll('input[data-prescreen-key]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      const key = radio.dataset.prescreenKey;
      window.assessment.step2.prescreen[key] = radio.value;
      radio.closest('.radio-group').querySelectorAll('.radio-pill').forEach(lbl => {
        lbl.classList.toggle('is-checked', lbl.querySelector('input').value === radio.value);
      });
      // Re-render practice recommendations
      const b21 = document.getElementById('b21');
      if (b21) {
        const tmp = document.createElement('div');
        tmp.innerHTML = renderPracticeRecommendations();
        b21.replaceWith(tmp.firstElementChild);
        initPracticeSelectEvents();
        initCollapsibles(document.getElementById('b21'));
      }
      saveState();
    });
  });
  initPracticeSelectEvents();
}

function initPracticeSelectEvents() {
  document.querySelectorAll('.practice-select').forEach(cb => {
    cb.addEventListener('change', () => {
      const pcode = cb.dataset.pcode;
      const practice = practicesData.find(p => p.p_code === pcode);
      if (!practice) return;
      const step2 = window.assessment.step2;
      const scoreObj = scorePractice(practice, window.assessment.step1);
      const tier  = practice.prescreen_question
        ? (['open','open_conditionally'].includes(step2.prescreen[`q${practice.prescreen_question.slice(1)}_${['','trees','livestock','set_aside','inputs'][parseInt(practice.prescreen_question.slice(1))]}`])
          ? 'transformative' : 'standard')
        : 'standard';
      if (cb.checked) {
        if (!step2.selected_practices.find(p => p.p_code === pcode)) {
          step2.selected_practices.push({ p_code: pcode, name: practice.name, theme: practice.theme, tier, score: scoreObj.total });
        }
      } else {
        step2.selected_practices = step2.selected_practices.filter(p => p.p_code !== pcode);
      }
      cb.closest('.practice-card').classList.toggle('is-selected', cb.checked);
      step2.practice_count = step2.selected_practices.length;
      const numEl = document.getElementById('psum-num');
      if (numEl) numEl.textContent = step2.practice_count;
      saveState();
    });
  });
}

// ── Step 3 render ─────────────────────────────────────────────────────────

function renderStep3() {
  const el = document.getElementById('step3-blocks');
  el.innerHTML = renderCapacityQuestions();
  initStep3Events();
  initCollapsibles(el);
  updateStepUI(3);
}

function renderCapacityQuestions() {
  const s3 = window.assessment.step3;

  // Q1a – team types
  const teamRows = Object.entries(TEAM_LABELS).map(([type, label]) => {
    const existing = s3.team_types.find(t => t.type === type);
    const count    = existing?.count ?? 0;
    const active   = count > 0;
    return `<div class="team-row${active ? ' is-active' : ''}">
      <label class="team-check">
        <input type="checkbox" class="team-type-cb" data-type="${esc(type)}" ${active ? 'checked' : ''}>
        <span class="team-type-code">${esc(type)}</span>
        <span class="team-type-label">${esc(label)}</span>
      </label>
      <input type="number" class="team-count" data-type="${esc(type)}" value="${active ? count : ''}" min="1" placeholder="Count" ${active ? '' : 'disabled'}>
    </div>`;
  }).join('');

  // Q2a – days matrix
  const daysRows = Object.entries(TEAM_LABELS).map(([type, label]) => {
    const t   = s3.team_types.find(t2 => t2.type === type);
    const days = s3.days_by_type[type] ?? '';
    if (!t) return '';
    return `<tr>
      <td><span class="team-type-code">${esc(type)}</span> ${esc(label)}</td>
      <td><input type="number" class="days-input" data-type="${esc(type)}" value="${esc(String(days))}" min="0" placeholder="e.g. 20"></td>
    </tr>`;
  }).join('');

  const RECRUIT_OPTS   = [{ value: 'yes_any', label: 'Yes — any role' }, { value: 'yes_specific', label: 'Yes — specific roles' }, { value: 'no', label: 'No' }];
  const TIME_OPTS      = [{ value: 'yes_significantly', label: 'Yes, significantly' }, { value: 'yes_modestly', label: 'Yes, modestly' }, { value: 'no', label: 'No' }];
  const EQUIP_OPTS     = [{ value: 'yes_any', label: 'Yes — any equipment' }, { value: 'yes_specific', label: 'Yes — specific items' }, { value: 'no', label: 'No' }];
  const BUDGET_OPTS    = [
    { value: '0', label: 'No external budget' },
    { value: '1', label: '< €5,000 / year' },
    { value: '2', label: '€5,000 – €20,000 / year' },
    { value: '3', label: '€20,000 – €50,000 / year' },
    { value: '4', label: '> €50,000 / year' },
  ];
  const SITE_COUNT_OPTS = [
    { value: '1', label: '1 site' },
    { value: '2-5', label: '2–5 sites' },
    { value: '6-20', label: '6–20 sites' },
    { value: '21-100', label: '21–100 sites' },
    { value: '100+', label: 'More than 100 sites' },
  ];
  const SITE_DIST_OPTS  = [
    { value: 'single_landscape', label: 'All in one landscape' },
    { value: 'single_region', label: 'Across one region' },
    { value: 'multi_region', label: 'Across multiple regions' },
  ];

  const calendarGrid = MONTHS.map((m, i) => {
    const cal = s3.access_calendar[i] || { month: m, access: 'accessible', reason: '' };
    return `<div class="cal-month">
      <div class="cal-month-name">${esc(m.slice(0,3))}</div>
      <label class="cal-access cal-accessible${cal.access === 'accessible' ? ' is-active' : ''}">
        <input type="radio" name="cal_${i}" value="accessible" data-month-index="${i}" ${cal.access === 'accessible' ? 'checked' : ''}> OK
      </label>
      <label class="cal-access cal-constrained${cal.access === 'constrained' ? ' is-active' : ''}">
        <input type="radio" name="cal_${i}" value="constrained" data-month-index="${i}" ${cal.access === 'constrained' ? 'checked' : ''}> Limited
      </label>
      <label class="cal-access cal-unknown${cal.access === 'unknown' ? ' is-active' : ''}">
        <input type="radio" name="cal_${i}" value="unknown" data-month-index="${i}" ${cal.access === 'unknown' ? 'checked' : ''}> Unknown
      </label>
    </div>`;
  }).join('');

  return block('b-cap', 'Capacity Assessment', `
    <div class="cap-section">
      <h3 class="cap-q">Q1a — Who is in your monitoring team?</h3>
      <div class="team-rows">${teamRows}</div>

      <h3 class="cap-q">Q1b — Would you be willing to recruit additional capacity?</h3>
      <div class="radio-group">${radioGroup('willingness_recruit', RECRUIT_OPTS, s3.willingness_recruit ?? '', 'data-field="willingness_recruit"')}</div>
      <div id="recruit-roles-wrap" class="${s3.willingness_recruit === 'yes_specific' ? '' : 'is-hidden'}">
        <label for="recruit-roles">Which roles would you recruit?</label>
        <input type="text" id="recruit-roles" placeholder="e.g. Field technician, Soil scientist" value="${esc(s3.willingness_recruit_roles)}">
      </div>

      <h3 class="cap-q">Q2a — How many field monitoring days per year can each team type contribute?</h3>
      <table class="days-table"><thead><tr><th>Team type</th><th>Days/year</th></tr></thead>
      <tbody id="days-tbody">${daysRows || '<tr><td colspan="2" class="empty-row">Select team types above first.</td></tr>'}</tbody></table>

      <h3 class="cap-q">Q2b — Could monitoring time be increased if needed?</h3>
      <div class="radio-group">${radioGroup('willingness_time', TIME_OPTS, s3.willingness_time ?? '', 'data-field="willingness_time"')}</div>

      <h3 class="cap-q">Q3a — Which equipment or analytical capabilities do you have access to?</h3>
      <div class="cap-equip-list">
        ${EQUIPMENT_CATEGORIES.map((eq, i) => {
          const checked = s3.equipment_capabilities.includes(i);
          return `<label class="check-item${checked ? ' is-checked' : ''}">
            <input type="checkbox" name="equipment" value="${i}" ${checked ? 'checked' : ''}> <span>${esc(eq)}</span>
          </label>`;
        }).join('')}
      </div>

      <h3 class="cap-q">Q3b — Would you be willing to acquire additional equipment?</h3>
      <div class="radio-group">${radioGroup('willingness_equipment', EQUIP_OPTS, s3.willingness_equipment ?? '', 'data-field="willingness_equipment"')}</div>

      <h3 class="cap-q">Q4 — What is your annual budget for external analytical services?</h3>
      <div class="radio-group">${radioGroup('budget_tier', BUDGET_OPTS, s3.budget_tier != null ? String(s3.budget_tier) : '', 'data-field="budget_tier"')}</div>

      <h3 class="cap-q">Q5a — How many monitoring sites do you have?</h3>
      <div class="radio-group">${radioGroup('site_count_category', SITE_COUNT_OPTS, s3.site_count_category ?? '', 'data-field="site_count_category"')}</div>

      <h3 class="cap-q">Q5b — How are your sites distributed?</h3>
      <div class="radio-group">${radioGroup('site_distribution', SITE_DIST_OPTS, s3.site_distribution ?? '', 'data-field="site_distribution"')}</div>

      <h3 class="cap-q">Q6 — Seasonal access calendar</h3>
      <p class="field-hint">Indicate your field access for each month.</p>
      <div class="cal-grid">${calendarGrid}</div>
    </div>
  `, { subtitle: 'Team, time, equipment, budget, and site access' });
}

function initStep3Events() {
  const s3 = window.assessment.step3;

  // Team type checkboxes
  document.querySelectorAll('.team-type-cb').forEach(cb => {
    cb.addEventListener('change', () => {
      const type = cb.dataset.type;
      const row  = cb.closest('.team-row');
      const countEl = row.querySelector('.team-count');
      row.classList.toggle('is-active', cb.checked);
      countEl.disabled = !cb.checked;
      if (cb.checked) {
        if (!s3.team_types.find(t => t.type === type)) s3.team_types.push({ type, count: 1 });
        countEl.value = countEl.value || 1;
      } else {
        s3.team_types = s3.team_types.filter(t => t.type !== type);
        countEl.value = '';
      }
      refreshDaysTable();
      saveState();
    });
  });

  document.querySelectorAll('.team-count').forEach(inp => {
    inp.addEventListener('input', () => {
      const type = inp.dataset.type;
      const t = s3.team_types.find(t2 => t2.type === type);
      if (t) t.count = parseInt(inp.value) || 1;
      saveState();
    });
  });

  // Generic radio fields
  document.querySelectorAll('input[type="radio"][data-field]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      const field = radio.dataset.field;
      const val   = radio.value;
      s3[field] = field === 'budget_tier' ? parseInt(val) : val;
      if (field === 'site_count_category') s3.site_count = SITE_COUNT_MIDPOINT[val] || 1;
      radio.closest('.radio-group').querySelectorAll('.radio-pill').forEach(lbl => {
        lbl.classList.toggle('is-checked', lbl.querySelector('input').value === val);
      });
      if (field === 'willingness_recruit') {
        const wrap = document.getElementById('recruit-roles-wrap');
        if (wrap) wrap.classList.toggle('is-hidden', val !== 'yes_specific');
      }
      saveState();
    });
  });

  // Recruit roles
  const rr = document.getElementById('recruit-roles');
  if (rr) rr.addEventListener('input', () => { s3.willingness_recruit_roles = rr.value; saveState(); });

  // Days inputs
  document.querySelectorAll('.days-input').forEach(inp => {
    inp.addEventListener('input', () => {
      s3.days_by_type[inp.dataset.type] = parseInt(inp.value) || 0;
      saveState();
    });
  });

  // Equipment
  document.querySelectorAll('.cap-equip-list input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = parseInt(cb.value);
      if (cb.checked) { if (!s3.equipment_capabilities.includes(id)) s3.equipment_capabilities.push(id); }
      else { s3.equipment_capabilities = s3.equipment_capabilities.filter(i => i !== id); }
      cb.closest('label').classList.toggle('is-checked', cb.checked);
      saveState();
    });
  });

  // Calendar
  document.querySelectorAll('input[type="radio"][data-month-index]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      const idx = parseInt(radio.dataset.monthIndex);
      if (!s3.access_calendar[idx]) s3.access_calendar[idx] = { month: MONTHS[idx], access: 'accessible', reason: '' };
      s3.access_calendar[idx].access = radio.value;
      const cell = radio.closest('.cal-month');
      cell.querySelectorAll('.cal-access').forEach(lbl => {
        lbl.classList.toggle('is-active', lbl.querySelector('input').value === radio.value);
      });
      saveState();
    });
  });
}

function refreshDaysTable() {
  const tbody = document.getElementById('days-tbody');
  if (!tbody) return;
  const s3 = window.assessment.step3;
  tbody.innerHTML = s3.team_types.length ? s3.team_types.map(t => {
    const label = TEAM_LABELS[t.type] || t.type;
    const days  = s3.days_by_type[t.type] ?? '';
    return `<tr><td><span class="team-type-code">${esc(t.type)}</span> ${esc(label)}</td>
      <td><input type="number" class="days-input" data-type="${esc(t.type)}" value="${esc(String(days))}" min="0" placeholder="e.g. 20"></td></tr>`;
  }).join('') : '<tr><td colspan="2" class="empty-row">Select team types above first.</td></tr>';
  tbody.querySelectorAll('.days-input').forEach(inp => {
    inp.addEventListener('input', () => {
      window.assessment.step3.days_by_type[inp.dataset.type] = parseInt(inp.value) || 0;
      saveState();
    });
  });
}

// ── Step 4 render ─────────────────────────────────────────────────────────

function renderStep4() {
  runStep4Algorithm();
  const el = document.getElementById('step4-blocks');
  el.innerHTML = buildStep4HTML();
  // Print button
  document.getElementById('btn-print')?.addEventListener('click', () => window.print());
}

function buildStep4HTML() {
  const out   = window.assessment.step4_outputs;
  const step1 = window.assessment.step1;
  const step2 = window.assessment.step2;
  const step3 = window.assessment.step3;
  const n     = out.narrative;
  const cap   = step3.capacity_profile || {};

  // ── Pre-flight: fully empty state ────────────────────────────────────
  const hasLandscape  = !!(step1.landscape_name && step1.efg_codes?.length);
  const hasPractices  = (step2.selected_practices || []).length > 0;
  const hasCapacity   = (step3.team_types || []).length > 0;

  if (!hasLandscape && !hasPractices && !hasCapacity) {
    return `<div class="output-section empty-plan-state">
      <h2>Your monitoring plan will appear here</h2>
      <p>Complete Steps 1, 2, and 3 to generate your personalised land health monitoring programme.</p>
      <ul class="empty-plan-checklist">
        <li class="${step1.landscape_name ? 'done' : ''}">Step 1 — Landscape Profile: describe your landscape, pressures, and ecosystem services</li>
        <li class="${hasPractices ? 'done' : ''}">Step 2 — Practice Selection: confirm the practices you are implementing</li>
        <li class="${hasCapacity ? 'done' : ''}">Step 3 — Capacity Assessment: describe your monitoring team, time, and budget</li>
      </ul>
      <button class="btn btn-primary" onclick="showStep(1)">Start with Step 1 →</button>
    </div>`;
  }

  // ── Inline warnings for partial states ───────────────────────────────
  const warnStep1 = !hasLandscape
    ? `<div class="inline-warning">⚠ Step 1 incomplete — EFG and landscape profile not set. Indicator recommendations may be broad. <button class="btn-link" onclick="showStep(1)">Go to Step 1</button></div>`
    : '';
  const warnStep2 = !hasPractices
    ? `<div class="inline-warning">⚠ No practices selected in Step 2 — indicator selection is driven by challenges only. <button class="btn-link" onclick="showStep(2)">Go to Step 2</button></div>`
    : '';
  const warnZeroDays = hasCapacity && !cap.available_days_total
    ? `<div class="inline-warning">⚠ No monitoring days entered in Step 3 (Q2) — capacity fitting is disabled and all indicators are shown. <button class="btn-link" onclick="showStep(3)">Go to Step 3</button></div>`
    : '';
  // Build abiotic ID → name lookup for precursor links
  const abioticNameMap = {};
  abioticData.forEach(a => { abioticNameMap[a.indicator_id] = a.indicator_name; });

  // Summary panel
  const efgNames  = (step1.efg_codes || []).map(c => {
    const opt = (referenceData.efg_options || []).find(e => e.code === c);
    return opt ? `${c} ${opt.name}` : c;
  }).join(', ');
  const levelLabel = cap.max_protocol_level === 1 ? 'Level 1 — Community observer'
    : cap.max_protocol_level === 2 ? 'Level 2 — Technician'
    : cap.max_protocol_level === 3 ? 'Level 3 — Research'
    : '—';
  const activeAssignments  = out.protocol_assignments.filter(g => !g.protocol_pending);
  const pendingAssignments = out.protocol_assignments.filter(g =>  g.protocol_pending);
  const summaryHtml = `<div class="output-summary-panel">
    <div class="summary-stat"><span class="stat-num">${activeAssignments.length}</span><span class="stat-label">Biological indicators</span></div>
    <div class="summary-stat"><span class="stat-num">${out.selected_abiotic.length}</span><span class="stat-label">Abiotic indicators</span></div>
    <div class="summary-stat"><span class="stat-num">${out.practice_chains.reduce((s,c)=>s+c.practices.length,0)}</span><span class="stat-label">Practices</span></div>
    <div class="summary-stat"><span class="stat-num">${out.trimmed_groups.length}</span><span class="stat-label">Deferred indicators</span></div>
    <div class="summary-meta">
      <span>${esc(step1.landscape_name || '—')}${step1.country ? ', ' + esc(step1.country) : ''}${step1.admin_region ? ' — ' + esc(step1.admin_region) : ''}</span>
      <span>${esc(efgNames || '—')}</span>
      <span>${esc(levelLabel)}</span>
      <span>${cap.available_days_total || 0} monitoring days available</span>
      ${step1.area_ha ? `<span>${step1.area_ha.toLocaleString()} ha</span>` : ''}
    </div>
  </div>`;

  // Narrative
  const narrativeHtml = `<div class="output-section narrative-section">
    <div class="narrative-header">
      <h2>Your Land Health Monitoring Programme</h2>
      <p class="narrative-for">Prepared for: <strong>${esc(step1.landscape_name || 'Your Landscape')}</strong>${step1.country ? ', ' + esc(step1.country) : ''}${step1.monitoring_programme_name ? ` — <em>${esc(step1.monitoring_programme_name)}</em>` : ''}</p>
    </div>
    ${step1.description ? `<blockquote class="landscape-desc">${esc(step1.description)}</blockquote>` : ''}
    <div class="narrative-paras">
      <p>${esc(n.paragraph1)}</p>
      <p>${esc(n.paragraph2)}</p>
      <p>${esc(n.paragraph3)}</p>
      <p>${esc(n.paragraph4)}</p>
    </div>
  </div>`;

  // Practice chains
  const chainsHtml = `<div class="output-section">
    <h2 class="section-title">Practice Verification Chains</h2>
    ${out.practice_chains.length ? out.practice_chains.map(ch => `
      <div class="chain-group">
        <h3 class="chain-group-title">${esc(ch.chain_label || ch.theme)}</h3>
        <div class="chain-practices">
          ${ch.practices.map(p => `<div class="chain-practice">
            <span class="practice-code">${esc(p.p_code)}</span>
            <span>${esc(p.name)}</span>
            ${badge(p.tier === 'transformative' ? 'Transformative' : 'Standard', p.tier === 'transformative' ? 'transformative' : 'standard')}
          </div>`).join('')}
        </div>
      </div>`) .join('') : '<p class="empty-state">No practices selected in Step 2.</p>'}
  </div>`;

  // Biological monitoring — sectioned A/B/C/D display
  // Build profile_number → name lookup for connected group links
  const profileNameMap = {};
  indicatorsData.forEach(ind => { profileNameMap[ind.profile_number] = ind.profile_name; });

  // Helper: render one bio card
  function buildBioCard(g) {
    const precursorNames = (g.abiotic_precursor_linkages || []).map(id => abioticNameMap[id] || id);
    const precursorHtml  = precursorNames.length
      ? `<div class="abiotic-precursors">Abiotic context: ${precursorNames.map(n => `<span class="precursor-tag">${esc(n)}</span>`).join('')}</div>`
      : '';
    const connectedNames = (g.linkage_c_connected_groups || []).map(num => profileNameMap[num]).filter(Boolean);
    const connectedHtml = connectedNames.length
      ? `<div class="connected-groups">Connected with: ${connectedNames.map(cn => `<span class="connected-tag">${esc(cn)}</span>`).join('')}</div>`
      : '';
    const eqLabels = (g.assigned_equipment_ids || []).map(id => EQUIPMENT_CATEGORIES[id] || `Cat. ${id}`);
    const eqHtml   = eqLabels.length
      ? `<details class="eq-details"><summary>Equipment (${eqLabels.length})</summary><ul class="eq-list">${eqLabels.map(e => `<li>${esc(e)}</li>`).join('')}</ul></details>`
      : '';
    const refHtml = g.assigned_reference_link
      ? ` <a class="ref-link" href="${esc(g.assigned_reference_link)}" target="_blank" rel="noopener" title="${esc(g.assigned_reference || '')}">[ref]</a>`
      : g.assigned_reference ? ` <span class="ref-plain" title="${esc(g.assigned_reference)}">[ref]</span>` : '';
    const isPending = !!g.protocol_pending;
    const isDraft   = !!g.protocol_draft && !isPending;
    const cardClass = isPending ? ' bio-card-pending' : isDraft ? ' bio-card-draft' : '';
    return `<div class="bio-card${cardClass}">
      <div class="bio-card-header">
        <div class="bio-card-title-wrap">
          <span class="bio-card-name">${esc(g.profile_name)}</span>
          <span class="bio-card-category">${esc(g.category)}</span>
        </div>
        <div class="bio-card-badges">
          ${isPending
            ? `<span class="badge badge-pending">Protocol pending</span>`
            : `<span class="level-badge level-${g.assigned_level}">L${g.assigned_level}${tooltipHtml('Level 1: community observer — basic training, simple tools. Level 2: field technician — species identification skills, standard equipment. Level 3: specialist — laboratory analysis or advanced identification.')}</span>`}
          ${isDraft ? `<span class="badge badge-draft" title="${esc(g.validation_status || '')}">Protocol proposed</span>` : ''}
          ${!isPending && g.requires_upgrade ? `<span class="badge badge-warn" title="Requires higher team capacity than currently available">↑ Upgrade</span>` : ''}
          <span class="badge badge-stage">${esc((g.monitoring_stage||'').split(' ')[0])}</span>
          <span class="badge badge-inclusion">${esc(g.inclusion_reason)}${g.inclusion_reason === 'B2 primary verifier' ? tooltipHtml('This indicator group directly measures whether your selected practices are working as intended.') : g.inclusion_reason === 'B1 supporting' ? tooltipHtml('This indicator group provides useful ecological context but is not the primary measure for your practices.') : ''}</span>
        </div>
      </div>
      <div class="bio-card-body">
        ${g.primary_monitoring_role ? `<div class="monitoring-role">${esc(g.primary_monitoring_role)}</div>` : ''}
        ${isDraft ? `<div class="protocol-draft-notice">Protocol proposed — awaiting expert validation. Do not use in a formal monitoring programme without review by a qualified biodiversity expert.</div>` : ''}
        ${isPending ? `<div class="protocol-pending-notice">Protocol specification pending — group identified as relevant but field protocol not yet available.</div>` : `
        <div class="bio-field-row">
          <span class="bio-field-label">Protocol</span>
          <span class="bio-field-value">${esc(g.assigned_protocol || 'TBC')}${refHtml}${eqHtml}</span>
        </div>
        <div class="bio-field-row">
          <span class="bio-field-label">Output metric</span>
          <span class="bio-field-value">${esc(g.assigned_metric || '—')}</span>
        </div>
        ${g.b2_expected_direction_of_change ? `
        <details class="bio-signal-details">
          <summary class="bio-signal-summary">Expected signal</summary>
          <p class="bio-signal-text">${esc(g.b2_expected_direction_of_change)}</p>
        </details>` : ''}`}
        ${precursorHtml}${connectedHtml}
      </div>
    </div>`;
  }

  // Split kept groups into sections
  const bioB2Groups      = activeAssignments.filter(g => g.inclusion_reason === 'B2 primary verifier');
  const bioB1Groups      = activeAssignments.filter(g => g.inclusion_reason === 'B1 supporting');
  const bioChGroups      = activeAssignments.filter(g => g.inclusion_reason === 'Challenge signal');

  // Summary sentence
  const bioCategories = new Set(activeAssignments.map(g => g.category)).size;
  const bioSummarySentence = activeAssignments.length
    ? `<div class="bio-summary-sentence">Your monitoring programme includes <strong>${activeAssignments.length} indicator group${activeAssignments.length!==1?'s':''}</strong> across <strong>${bioCategories} biological categor${bioCategories!==1?'ies':'y'}</strong>, plus <strong>${out.selected_abiotic.length} abiotic indicator${out.selected_abiotic.length!==1?'s':''}</strong>.${pendingAssignments.length ? ` <span class="bio-pending-note">${pendingAssignments.length} further group${pendingAssignments.length!==1?'s':''} identified — protocol specification pending.</span>` : ''}</div>`
    : '';

  function buildBioSection(label, desc, groups, openByDefault) {
    if (!groups.length) return '';
    const pageBreak = groups.length > 3 ? ' section-force-break' : '';
    return `<details class="bio-section${pageBreak}"${openByDefault ? ' open' : ''}>
      <summary class="bio-section-toggle">
        <span class="bio-section-label">${esc(label)} <span class="bio-section-count">(${groups.length})</span></span>
        <span class="bio-section-desc">${esc(desc)}</span>
      </summary>
      <div class="bio-section-body">
        <div class="bio-cards">${groups.map(buildBioCard).join('')}</div>
      </div>
    </details>`;
  }

  const draftGroups = activeAssignments.filter(g => g.populated === 'draft');
  const draftNoticeHtml = draftGroups.length
    ? `<div class="advisory-notice">⚠ <strong>Protocol proposed</strong> — ${draftGroups.length} of the ${activeAssignments.length} indicator group${activeAssignments.length !== 1 ? 's' : ''} in this plan (${draftGroups.map(g => g.profile_name).join(', ')}) carr${draftGroups.length !== 1 ? 'y' : 'ies'} system-proposed protocols awaiting expert validation. Do not use these groups in a formal monitoring programme without review by a qualified biodiversity expert.</div>`
    : '';

  const bioHtml = `<div class="output-section">
    <h2 class="section-title">Biological Monitoring Programme</h2>
    ${draftNoticeHtml}
    ${out.protocol_assignments.length ? `
    ${bioSummarySentence}
    ${buildBioSection('A — Primary verifiers', 'Directly verify adoption and effectiveness of selected practices', bioB2Groups, true)}
    ${buildBioSection('B — Supporting context', 'Benefit from practices but not primary verification targets', bioB1Groups, false)}
    ${buildBioSection('C — Challenge signal indicators', 'Selected by landscape challenge linkage — broaden ecological evidence', bioChGroups, false)}
    ${pendingAssignments.length ? buildBioSection('D — Protocol pending', 'Relevant groups identified — field protocols not yet authored', pendingAssignments, false) : ''}
    ` : '<p class="empty-state">No biological indicators selected. Complete Steps 1–3 to generate recommendations.</p>'}
  </div>`;

  // Abiotic table
  const abioHtml = `<div class="output-section">
    <h2 class="section-title">Abiotic Monitoring Programme</h2>
    <p class="block-desc">Abiotic indicators marked <strong>Year 1</strong> form your universal baseline package and should be established before biological monitoring begins. Year 1+ indicators are added once the baseline is in place.</p>
    ${out.selected_abiotic.length ? `
    <div class="table-scroll"><table class="output-table">
      <thead><tr><th>Indicator</th><th>Phase</th><th>Domain</th><th>Protocol</th><th>Frequency</th><th></th></tr></thead>
      <tbody>
        ${out.selected_abiotic.map(a => `<tr>
          <td>
            <span class="practice-code">${esc(a.indicator_id)}</span>
            <strong>${esc(a.indicator_name)}</strong>
            ${a.what_it_measures ? `<div class="abiotic-measures">${esc(a.what_it_measures)}</div>` : ''}
          </td>
          <td><span class="phase-badge${a.universal_baseline ? ' phase-y1' : ' phase-ongoing'}">${a.universal_baseline ? 'Year 1' : 'Year 1+'}</span></td>
          <td>${esc(a.domain || '—')}</td>
          <td>${esc(a.protocol_name || '—')}${a.interpretation_notes ? `<details class="eq-details"><summary>Interpretation</summary><p class="interp-note">${esc(a.interpretation_notes)}</p></details>` : ''}</td>
          <td>${esc(a.monitoring_frequency || '—')}</td>
          <td>
            ${a.universal_baseline ? '<span class="badge badge-baseline">Baseline</span>' : ''}
            ${a.equipment_gap ? `<span class="badge badge-warn" title="Missing equipment: ${esc((a.missing_equipment||[]).join(', '))}">⚠ Equipment</span>` : ''}
          </td>
        </tr>`).join('')}
      </tbody>
    </table></div>` : '<p class="empty-state">No abiotic indicators selected.</p>'}
  </div>`;

  // Calendar — 12-month grid
  const accessByMonth = {};
  MONTHS.forEach((m, i) => {
    const entry = (step3.access_calendar || []).find(e => e.month === m);
    accessByMonth[i] = entry ? entry.access : 'accessible';
  });
  const MONTH_SHORT = MONTHS.map(m => m.slice(0, 3));

  const calHtml = `<div class="output-section">
    <h2 class="section-title">Monitoring Calendar</h2>
    <p class="block-desc">Suggested monitoring windows based on indicator response timescales and your Step 3 seasonal access calendar. Adjust to match local phenology.</p>
    ${out.calendar.length ? `
    <div class="cal-output-wrap">
      <table class="cal-output-table">
        <thead>
          <tr class="cal-month-header">
            <th class="cal-group-col">Indicator group</th>
            ${MONTH_SHORT.map((m, i) => `<th class="cal-month-th${accessByMonth[i] === 'constrained' ? ' cal-th-constrained' : accessByMonth[i] === 'unknown' ? ' cal-th-unknown' : ''}">${m}</th>`).join('')}
            <th class="cal-freq-col">Frequency</th>
          </tr>
        </thead>
        <tbody>
          ${out.calendar.map(c => `<tr>
            <td class="cal-group-name">
              <strong>${esc(c.profile_name)}</strong>
              <span class="cal-stage-tag">${esc((c.monitoring_stage || '').split(' ')[0])}</span>
            </td>
            ${Array.from({length: 12}, (_, i) => {
              const inWindow = (c.window_month_indices || []).includes(i);
              const access   = accessByMonth[i];
              if (!inWindow) return '<td class="cal-cell cal-cell-off"></td>';
              if (access === 'constrained') return `<td class="cal-cell cal-cell-warn" title="Constrained access">●</td>`;
              return `<td class="cal-cell cal-cell-on">●</td>`;
            }).join('')}
            <td class="cal-freq-td">${esc(c.frequency || '—')}</td>
          </tr>`).join('')}
          <tr class="cal-access-legend-row">
            <td class="cal-legend-label">Site access</td>
            ${Array.from({length: 12}, (_, i) => {
              const a = accessByMonth[i];
              if (a === 'constrained') return `<td class="cal-cell cal-legend-constrained" title="Constrained">⚠</td>`;
              if (a === 'unknown')     return `<td class="cal-cell cal-legend-unknown" title="Unknown">?</td>`;
              return `<td class="cal-cell cal-legend-ok" title="Accessible">✓</td>`;
            }).join('')}
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="cal-legend">
      <span class="cal-legend-item"><span class="cal-legend-dot cal-cell-on">●</span> Monitoring window</span>
      <span class="cal-legend-item"><span class="cal-legend-dot cal-cell-warn">●</span> Window / constrained access</span>
      <span class="cal-legend-item cal-legend-access"><span class="cal-legend-acc cal-legend-ok">✓</span> Accessible &nbsp; <span class="cal-legend-acc cal-legend-constrained">⚠</span> Constrained &nbsp; <span class="cal-legend-acc cal-legend-unknown">?</span> Unknown</span>
    </div>` : '<p class="empty-state">No indicators retained. Complete Steps 1–3 to generate a monitoring programme.</p>'}
  </div>`;

  // Enhancement recommendations (trimmed groups)
  const enhHtml = out.trimmed_groups.length ? `<div class="output-section">
    <h2 class="section-title">Enhancement Recommendations</h2>
    <p class="block-desc">The following indicator groups were identified as relevant to your landscape but were deferred due to current team capacity. They are listed in priority order — add them as your monitoring programme matures.</p>
    <div class="table-scroll"><table class="output-table">
      <thead><tr><th>Indicator Group</th><th>Category</th><th>Level</th><th>Why deferred</th><th>What would unlock this</th></tr></thead>
      <tbody>
        ${out.trimmed_groups.map(g => `<tr>
          <td><strong>${esc(g.profile_name)}</strong></td>
          <td>${esc(g.category)}</td>
          <td><span class="level-badge level-${g.assigned_level}">L${g.assigned_level}</span></td>
          <td class="trim-reason">${esc(g.trim_reason || '—')}</td>
          <td class="unlock-hint">${esc(g.unlock_hint || '—')}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>
  </div>` : '';

  // Print / actions
  const actionsHtml = `<div class="output-actions print-hide">
    <button class="btn btn-primary" id="btn-print">🖨 Print / Save as PDF</button>
    <button class="btn btn-ghost" id="btn-restart">Start New Assessment</button>
  </div>`;

  // Print-only cover header (hidden on screen)
  const printDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const printHeaderHtml = `<div class="print-header screen-hide">
    <div class="print-header-brand">IUCN · LAHMP Wizard · NBS Hub</div>
    <div class="print-header-title">${esc(step1.landscape_name || 'Land Health Monitoring Programme')}</div>
    ${step1.monitoring_programme_name ? `<div class="print-header-sub">${esc(step1.monitoring_programme_name)}</div>` : ''}
    <div class="print-header-meta">${step1.country ? esc(step1.country) + (step1.admin_region ? ', ' + esc(step1.admin_region) : '') + ' · ' : ''}Generated ${printDate}</div>
  </div>`;

  // Running header/footer — shown on every printed page (position: fixed in @media print)
  const runningHeadText = `${esc(step1.landscape_name || 'LAHMP Monitoring Plan')} — LAHMP Monitoring Plan — ${esc(printDate)}`;
  const printRunningHtml = `
    <div class="print-running-head screen-hide">
      <span>${esc(step1.landscape_name || 'LAHMP Monitoring Plan')} — LAHMP Monitoring Plan</span>
      <span>${esc(printDate)}</span>
    </div>
    <div class="print-running-foot screen-hide">
      <span>Generated by IUCN Land Health Monitoring Platform · iucn.org</span>
      <span>For field use only — not a legally binding document</span>
    </div>`;

  const warningsHtml = (warnStep1 + warnStep2 + warnZeroDays)
    ? `<div class="warnings-block">${warnStep1}${warnStep2}${warnZeroDays}</div>`
    : '';

  return printRunningHtml + actionsHtml + printHeaderHtml + summaryHtml + warningsHtml + narrativeHtml + chainsHtml + bioHtml + abioHtml + calHtml + enhHtml;
}

// ── Collapsible blocks ────────────────────────────────────────────────────

function initCollapsibles(container = document) {
  container.querySelectorAll('.block-header').forEach(header => {
    header.removeEventListener('click', toggleBlock);
    header.addEventListener('click', toggleBlock);
  });
}

function toggleBlock(e) {
  const header = e.currentTarget;
  const body   = header.nextElementSibling;
  const expanded = header.getAttribute('aria-expanded') === 'true';
  header.setAttribute('aria-expanded', !expanded);
  if (expanded) body.hidden = true; else body.hidden = false;
}

// ── Navigation ────────────────────────────────────────────────────────────

function showStep(n) {
  document.querySelectorAll('.wizard-step').forEach(s => s.classList.add('is-hidden'));
  document.getElementById('step-' + n)?.classList.remove('is-hidden');

  document.querySelectorAll('.pb-step').forEach(el => {
    const s = parseInt(el.dataset.step);
    const isActive    = s === n;
    const isDone      = window.demoMode ? s !== n : s < n;
    const isClickable = window.demoMode || s <= n;
    el.classList.toggle('is-active',    isActive);
    el.classList.toggle('is-done',      isDone);
    el.classList.toggle('is-clickable', isClickable);
    el.setAttribute('tabindex', isClickable ? '0' : '-1');
    if (isActive) el.setAttribute('aria-current', 'step');
    else el.removeAttribute('aria-current');
  });

  // Update connector lines: navy solid when the step before it is done
  document.querySelectorAll('.pb-connector').forEach(el => {
    const afterStep = parseInt(el.dataset.after);
    el.classList.toggle('is-done', window.demoMode ? true : afterStep < n);
  });

  document.getElementById('btn-back').disabled = n === 1;
  const btnNext = document.getElementById('btn-next');
  if (btnNext) btnNext.textContent = n === 4 ? 'Finish' : 'Continue →';

  window.scrollTo({ top: 0, behavior: 'smooth' });
  currentStep = n;
  saveState(); // also calls updateStepUI
}

// ── Step completion checklist ──────────────────────────────────────────────

function getStepRequirements(step) {
  const s1 = window.assessment.step1;
  const s2 = window.assessment.step2;
  const s3 = window.assessment.step3;

  if (step === 1) {
    const hasPressures  = s1.pressures.some(p => p.status === 'ongoing' || p.status === 'past');
    const hasChallenges = s1.challenges.some(c => c.confirmed);
    const hasServices   = s1.services.some(s => s.selected);
    return [
      { label: 'Landscape name',                 done: !!s1.landscape_name.trim() },
      { label: `EFGs selected${s1.efg_codes.length ? ' (' + s1.efg_codes.length + ')' : ''}`,
                                                  done: s1.efg_codes.length > 0 },
      { label: 'Land uses selected',             done: s1.land_uses.length > 0 },
      { label: 'At least one pressure confirmed', done: hasPressures },
      { label: 'At least one challenge confirmed',done: hasChallenges },
      { label: 'At least one service selected',  done: hasServices },
    ];
  }
  if (step === 2) {
    const allPrescreen = Object.values(s2.prescreen || {}).every(v => v !== null);
    return [
      { label: 'Pre-screen questions answered (4)',   done: allPrescreen },
      { label: 'At least one practice confirmed',    done: (s2.selected_practices || []).length > 0 },
    ];
  }
  if (step === 3) {
    const teamOk     = s3.team_types.length > 0;
    const daysOk     = teamOk && s3.team_types.every(t => (s3.days_by_type[t.type] || 0) > 0);
    const budgetOk   = s3.budget_tier !== null;
    const sitesOk    = !!s3.site_count_category;
    const calendarOk = (s3.access_calendar || []).length === 12 &&
                       (s3.access_calendar || []).every(m => !!m.access);
    return [
      { label: 'Team type selected',                       done: teamOk },
      { label: 'Days per year entered for all team types', done: daysOk },
      { label: 'Budget tier selected',                     done: budgetOk },
      { label: 'Number of monitoring sites selected',      done: sitesOk },
      { label: 'Seasonal access calendar complete (12 months)', done: calendarOk },
    ];
  }
  return [];
}

function isStepComplete(step) {
  return getStepRequirements(step).every(r => r.done);
}

function buildCompletionChecklistHtml(step) {
  const reqs   = getStepRequirements(step);
  if (!reqs.length) return '';
  const allDone = reqs.every(r => r.done);
  const items   = reqs.map(r => `<div class="cl-item ${r.done ? 'cl-done' : 'cl-missing'}">
    <span class="cl-icon">${r.done ? '✓' : '✗'}</span>
    <span class="cl-label">${esc(r.label)}</span>
  </div>`).join('');
  return `<div class="completion-checklist" id="completion-checklist-${step}">
    <div class="cl-items">${items}</div>
    ${!allDone ? `<p class="cl-hint">Complete the items above to continue.</p>` : ''}
  </div>`;
}

function updateStepUI(step) {
  if (step === undefined) step = currentStep;

  const btn = document.getElementById('btn-next');

  if (step === 4) {
    // On step 4 the button says "Finish" and is always active
    if (btn) { btn.disabled = false; btn.classList.remove('btn-continue-blocked'); }
    return;
  }

  // Re-render checklist
  const container = document.getElementById(`step${step}-checklist`);
  if (container) container.innerHTML = buildCompletionChecklistHtml(step);

  // Gate the Continue button
  if (!btn) return;
  const complete = isStepComplete(step);
  btn.disabled = !complete;
  btn.classList.toggle('btn-continue-blocked', !complete);
}

function validateStep(n) {
  if (n === 1) {
    const s = window.assessment.step1;
    if (!s.landscape_name.trim()) { showToast('Please enter a landscape name.'); return false; }
    if (!s.country.trim())        { showToast('Please enter a country.'); return false; }
    if (!s.efg_codes.length)      { showToast('Please select at least one EFG in Block 1.2.'); return false; }
    if (!s.land_uses.length)      { showToast('Please select at least one land use in Block 2.'); return false; }
  }
  if (n === 2) {
    const pre = window.assessment.step2.prescreen;
    if (!Object.values(pre).every(v => v !== null)) {
      showToast('Please answer all four pre-screen questions.'); return false;
    }
    if (!(window.assessment.step2.selected_practices || []).length) {
      showToast('No practices selected. The monitoring plan will use only challenge-driven indicators — consider selecting at least one practice.');
      // soft warning only — allow proceeding
    }
  }
  if (n === 3) {
    const s3 = window.assessment.step3;
    if (!s3.team_types.length)   { showToast('Please add at least one team member type.'); return false; }
    const totalDays = Object.values(s3.days_by_type || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    if (!totalDays)              { showToast('Please enter monitoring days available per year for your team (Q2).'); return false; }
    if (s3.budget_tier === null) { showToast('Please select a budget tier (Q4).'); return false; }
    if (!s3.site_count_category) { showToast('Please select the number of monitoring sites (Q5a).'); return false; }
  }
  return true;
}

function handleNext() {
  if (!validateStep(currentStep)) return;
  const next = currentStep + 1;
  if (next > 4) return;
  // Budget mismatch warning: budget tier 0 + specialist team types E/F imply lab costs
  if (currentStep === 3) {
    const s3 = window.assessment.step3;
    const hasSpecialist = (s3.team_types || []).some(t => t.type === 'E' || t.type === 'F');
    if (hasSpecialist && s3.budget_tier === 0) {
      const ok = window.confirm(
        'Your team includes research scientists or external specialists (Type E/F), ' +
        'but your budget is set to zero. These team types typically require external ' +
        'laboratory or analytical services. Consider increasing your budget tier, or ' +
        'the algorithm will downgrade Level 3 protocols to Level 2.\n\nProceed anyway?'
      );
      if (!ok) return;
    }
  }
  if (next === 2) renderStep2();
  if (next === 3) renderStep3();
  if (next === 4) renderStep4();
  showStep(next);
}

function handleBack() {
  if (currentStep > 1) showStep(currentStep - 1);
}

// ── Toast ─────────────────────────────────────────────────────────────────

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('is-visible');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('is-visible'), 4000);
}

// ── Fixture loading ────────────────────────────────────────────────────────

async function loadFixture(fixtureId) {
  const allowed = ['TEST-01', 'TEST-02', 'TEST-03'];
  if (!allowed.includes(fixtureId)) return false;
  try {
    const data = await fetch(`data/test_fixtures/${fixtureId}.json`).then(r => r.json());
    Object.keys(data).forEach(k => { window.assessment[k] = data[k]; });
    // Rehydrate step3 access_calendar if missing (ensure all 12 months present)
    if (!window.assessment.step3.access_calendar || window.assessment.step3.access_calendar.length !== 12) {
      window.assessment.step3.access_calendar = MONTHS.map(m => ({ month: m, access: 'accessible', reason: '' }));
    }
    return true;
  } catch(e) {
    console.warn('Could not load fixture', fixtureId, e);
    return false;
  }
}

function showFixtureBanner(fixtureId) {
  const names = { 'TEST-01': "Skoura M'Daz, Morocco", 'TEST-02': 'PK-17, Mauritania', 'TEST-03': 'Vietnam VSA' };
  const banner = document.createElement('div');
  banner.className = 'fixture-banner';
  banner.innerHTML = `<strong>Test fixture loaded:</strong> ${fixtureId} — ${names[fixtureId] || fixtureId}
    &nbsp;<a href="?" class="fixture-clear">Clear fixture →</a>`;
  document.body.insertBefore(banner, document.querySelector('.step-nav'));
}

function showDemoBanner() {
  const existing = document.getElementById('demo-banner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'demo-banner';
  banner.className = 'fixture-banner demo-banner';
  banner.innerHTML = `<strong>Demo mode</strong> — showing pre-filled assessment for Skoura M\'Daz, Morocco. Click any step tab to explore the inputs.
    &nbsp;<a href="?" class="fixture-clear">Exit demo →</a>`;
  document.body.insertBefore(banner, document.querySelector('.step-nav'));
}

// Progress bar step click/keyboard handlers — work in both demo and normal mode.
function _pbStepClickHandler(e) {
  const el = e.currentTarget;
  if (!el.classList.contains('is-clickable')) return;
  const targetStep = parseInt(el.dataset.step);
  if (!targetStep || targetStep === currentStep) return;
  // In normal mode prevent skipping ahead (only done steps + current are clickable)
  if (!window.demoMode && targetStep > currentStep) return;
  showStep(targetStep);
}

function _pbStepKeyHandler(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    _pbStepClickHandler({ currentTarget: e.currentTarget });
  }
}

// Enable free tab navigation across all four steps in demo mode.
// Click handlers are attached once in init(); this just triggers a visual refresh.
function enableDemoNav() {
  showStep(currentStep); // re-run to mark all steps is-clickable with demoMode=true
}

// Load the Skoura M'Daz demo fixture and jump straight to the Step 4 output view.
async function loadDemoSkoura() {
  try {
    const data = await fetch('data/test_fixtures/skoura.json').then(r => r.json());
    Object.keys(data).forEach(k => { window.assessment[k] = data[k]; });
    if (!window.assessment.step3.access_calendar || window.assessment.step3.access_calendar.length !== 12) {
      window.assessment.step3.access_calendar = MONTHS.map(m => ({ month: m, access: 'accessible', reason: '' }));
    }
  } catch(e) {
    console.warn('Could not load Skoura demo fixture', e);
    showToast('Could not load demo — serve the project via HTTP (not file://).');
    return;
  }
  window.demoMode = true;
  renderStep1();
  renderStep2();
  renderStep3();
  renderStep4();
  showDemoBanner();
  enableDemoNav();
  showStep(4);
}

// ── Init ──────────────────────────────────────────────────────────────────

async function init() {
  try {
    await loadData();
  } catch(e) {
    console.error('Failed to load data files. Make sure you are serving via HTTP (not file://).', e);
    document.getElementById('wizard-main').innerHTML = `<div class="container"><div class="error-state">
      <h2>Could not load data files</h2>
      <p>LAHMP Wizard must be served over HTTP — open it via a local web server or GitHub Pages, not directly as a file:// URL.</p>
      <p>Quick start: <code>python -m http.server 8000</code> then open <code>http://localhost:8000</code></p>
    </div></div>`;
    return;
  }

  // Check for ?fixture=TEST-01 and optional &step=N URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const fixtureParam = urlParams.get('fixture');
  const stepParam    = parseInt(urlParams.get('step')) || 1;

  if (fixtureParam) {
    const fid = fixtureParam.toUpperCase();
    if (fid === 'DEMO-SKOURA') {
      // Demo fixture — loads skoura.json and enables free tab navigation
      try {
        const data = await fetch('data/test_fixtures/skoura.json').then(r => r.json());
        Object.keys(data).forEach(k => { window.assessment[k] = data[k]; });
        if (!window.assessment.step3.access_calendar || window.assessment.step3.access_calendar.length !== 12) {
          window.assessment.step3.access_calendar = MONTHS.map(m => ({ month: m, access: 'accessible', reason: '' }));
        }
        window.demoMode = true;
        currentStep = Math.min(Math.max(stepParam, 1), 4);
      } catch(e) { console.warn('Could not load DEMO-SKOURA fixture', e); }
    } else {
      const loaded = await loadFixture(fid);
      if (loaded) {
        currentStep = Math.min(Math.max(stepParam, 1), 4);
        showFixtureBanner(fid);
      }
    }
  } else {
    const hasSaved = loadSavedState();
    if (!hasSaved) {
      window.assessment.assessment_id = crypto.randomUUID?.() ?? Date.now().toString(36);
      window.assessment.created_at    = new Date().toISOString();
    }
  }

  renderStep1();

  if (currentStep > 1) {
    for (let s = 2; s <= currentStep; s++) {
      if (s === 2) renderStep2();
      if (s === 3) renderStep3();
      if (s === 4) renderStep4();
    }
    showStep(currentStep);
  } else {
    showStep(1);
  }

  // Demo mode post-render: show banner and enable free tab navigation
  if (window.demoMode) {
    showDemoBanner();
    enableDemoNav();
  }

  document.getElementById('btn-next').addEventListener('click', handleNext);
  document.getElementById('btn-back').addEventListener('click', handleBack);

  // Progress bar step navigation — works in both normal and demo mode
  document.querySelectorAll('.pb-step').forEach(el => {
    el.addEventListener('click',   _pbStepClickHandler);
    el.addEventListener('keydown', _pbStepKeyHandler);
  });

  document.addEventListener('click', e => {
    if (e.target.id === 'btn-restart') {
      if (confirm('Start a new assessment? Your current progress will be lost.')) {
        localStorage.removeItem('lahmp_assessment');
        localStorage.removeItem('lahmp_step');
        location.reload();
      }
    }
  });

  // Tooltip tap-toggle (mobile) and global close
  document.addEventListener('click', e => {
    const icon = e.target.closest('.tooltip-icon');
    if (icon) {
      e.stopPropagation();
      const wrap = icon.closest('.tooltip-wrap');
      const wasOpen = wrap?.classList.contains('is-open');
      document.querySelectorAll('.tooltip-wrap.is-open').forEach(el => el.classList.remove('is-open'));
      if (wrap && !wasOpen) wrap.classList.add('is-open');
      return;
    }
    document.querySelectorAll('.tooltip-wrap.is-open').forEach(el => el.classList.remove('is-open'));
  });
}

document.addEventListener('DOMContentLoaded', init);
