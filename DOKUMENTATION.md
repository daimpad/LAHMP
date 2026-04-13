# LAHMP Wizard — Technische Dokumentation

> Leicht verständliche Erklärung: Aufbau, Datenvernetzung und Algorithmen

---

## Inhaltsverzeichnis

1. [Was ist LAHMP?](#1-was-ist-lahmp)
2. [Aufbau des Repositories](#2-aufbau-des-repositories)
3. [Die vier Datendateien und ihre Vernetzung](#3-die-vier-datendateien-und-ihre-vernetzung)
4. [Wie die vier Schritte zusammenhängen](#4-wie-die-vier-schritte-zusammenhängen)
5. [Schritt 1 — Landschaftsprofil](#5-schritt-1--landschaftsprofil)
6. [Schritt 2 — Praktiken-Empfehlung](#6-schritt-2--praktiken-empfehlung)
7. [Schritt 3 — Kapazitätsbewertung](#7-schritt-3--kapazitätsbewertung)
8. [Schritt 4 — Monitoringplan](#8-schritt-4--monitoringplan)
9. [Wo ist welche Logik in wizard.js?](#9-wo-ist-welche-logik-in-wizardjs)
10. [Gesamtdatenfluss](#10-gesamtdatenfluss)
11. [Wie Daten gespeichert werden](#11-wie-daten-gespeichert-werden)
12. [Export-Skripte (Python)](#12-export-skripte-python)

---

## 1. Was ist LAHMP?

**LAHMP** steht für *Land Health Monitoring Platform*. Es ist ein **Browser-Tool** (kein Server, keine Datenbank), das Landwirte, NGOs und Projektkoordinatoren durch vier Schritte führt:

1. Das eigene Landschaftsprofil beschreiben (Drücke, Herausforderungen, Ökosystemleistungen)
2. Passende landwirtschaftliche Praktiken empfehlen und auswählen
3. Die eigenen Monitoring-Kapazitäten einschätzen (Team, Zeit, Ausrüstung, Budget)
4. Einen personalisierten **Biodiversitäts-Monitoringplan** automatisch generieren

Das Tool läuft **vollständig im Browser**. Es gibt keine API-Aufrufe, kein Login, keine Datenbank. Alles kommt aus vier JSON-Dateien im `data/`-Ordner.

**Live-URL:** `https://daimpad.github.io/LAHMP`

---

## 2. Aufbau des Repositories

```
lahmp/
│
├── index.html          ← Einzige HTML-Seite. Nur Präsentation (Gerüst, keine Inhalte)
├── wizard.js           ← Das Herzstück: alle Algorithmen und UI-Logik
├── styles.css          ← Styling (IUCN-Farben, Wizard-Layout)
│
├── data/               ← Die vier JSON-Datendateien (aus Excel exportiert)
│   ├── reference.json  ← Referenzlisten (Drücke, Herausforderungen, Services, Mappings)
│   ├── practices.json  ← 43 landwirtschaftliche Praktiken
│   ├── indicators.json ← 41 biologische Indikatorprofile
│   └── abiotic.json    ← 16 abiotische Indikatoren (Boden, Wasser)
│
├── raw/                ← Quelldateien (Excel + CSV) — nie direkt bearbeiten
│   ├── LAHMP_Practice_Matrix.xlsx
│   ├── LAHMP_Indicator_Linkage_Matrix_Populated.xlsx
│   ├── LAHMP_Abiotic_Reference_Table.xlsx
│   └── IUCN - LHMT - *.csv
│
├── indicators/         ← DOCX-Profile (Word-Dokumente pro Indikator)
│   ├── LAHMP_Profile_01_Soil_Bacteria.docx
│   └── ... (Profile 01–41)
│
├── export/             ← Python-Skripte zum Aktualisieren der JSON-Dateien
│   ├── convert.py      ← Excel → JSON (data/practices, indicators, abiotic)
│   └── extract_indicators.py ← DOCX-Profile → indicators.json
│
└── data/test_fixtures/ ← Vorausgefüllte Test-Assessments zum Entwickeln
    ├── TEST-01.json    ← Skoura M'Daz, Marokko
    ├── TEST-02.json    ← PK-17, Mauretanien
    └── TEST-03.json    ← Vietnam VSA
```

### Grundregel

| Datei | Zweck |
|---|---|
| `index.html` | Nur HTML-Gerüst — kein Inhalt, keine Logik |
| `wizard.js` | **Alle** Algorithmen, Rendering und State-Verwaltung |
| `data/*.json` | **Alle** Inhalte — niemals in JS oder HTML hardcoden |
| `raw/*.xlsx` | Kanonische Quelle — immer zuerst Excel bearbeiten, dann exportieren |

---

## 3. Die vier Datendateien und ihre Vernetzung

Die vier JSON-Dateien verwenden **numerische IDs** als gemeinsame Sprache. Eine Drucknummer aus `reference.json` ist dieselbe in `practices.json`, `indicators.json` und `abiotic.json`.

### Übersicht der vier Dateien

```
reference.json                practices.json
──────────────────            ──────────────────
block4_pressures  ─── IDs ──► block4_pressures
block5_challenges ─── IDs ──► block5_challenges
block6_services   ─── IDs ──► block6_services
                              relevant_efgs
                              p_code (z.B. "P01")
                                    │
              ┌─────────────────────┘
              ▼
indicators.json               abiotic.json
──────────────────            ──────────────────
block4_pressures              block4_pressures
block5_challenges             block5_challenges
block6_services               block6_services
relevant_efgs                 linked_practices  ─── p_code
b1_practices_that_benefit ─── p_code
b2_practices_primarily_verified ─ p_code
```

### `reference.json` — Die Schaltzentrale

Enthält alle Referenzlisten und die **zwei Mapping-Tabellen**, die den Wizard antreiben:

| Inhalt | Beschreibung |
|---|---|
| `block4_pressures` | 28 Drücke (z.B. "Intensive tillage", ID 1) |
| `block5_challenges` | 35 Herausforderungen (z.B. "Soil structure degradation") |
| `block6_services` | 37 Ökosystemleistungen |
| `ipcc_land_use_categories` | Landnutzungstypen (z.B. "Intensive Annual Cropland") |
| `efg_options` | Ökosystem-Typologien (z.B. T7.1 Annual croplands) |
| `ipcc_soil_types` | Bodentypen |
| `pressure_to_challenge_mapping` | **Kernmapping**: Drucknummer → Liste von Herausforderungen + Konfidenz |
| `challenge_to_service_mapping` | **Kernmapping**: Herausforderungsnummer → Liste von Services |

**Beispiel** — wie das Mapping aussieht:

```json
"pressure_to_challenge_mapping": {
  "1": [
    { "challenge_id": 2, "confidence": "high" },
    { "challenge_id": 3, "confidence": "high" },
    { "challenge_id": 4, "confidence": "medium" }
  ]
}
```

→ Wenn Druck 1 ("Intensive tillage") als *ongoing* markiert wird, werden die Herausforderungen 2, 3 (mit hoher Konfidenz) und 4 (mittlere Konfidenz) automatisch vorausgewählt.

### `practices.json` — 43 Praktiken

Jede Praktik hat:
- `p_code` — eindeutige ID (P01–P43)
- `theme` — Themengruppe (z.B. "Soil Management")
- `block4_pressures`, `block5_challenges`, `block6_services` — Arrays mit IDs aus `reference.json`
- `relevant_efgs` — welche Ökosystemtypen passen
- `prescreen_question` — welche Vorab-Frage (Q1–Q4) diese Praktik steuert

### `indicators.json` — 41 Biologische Indikatorprofile

Jedes Profil hat:
- `profile_number`, `profile_name` (z.B. "Earthworms")
- `block4_pressures`, `block5_challenges`, `block6_services` — IDs aus `reference.json`
- `b1_practices_that_benefit` und `b2_practices_primarily_verified` — P-Codes aus `practices.json`
- `level1_protocol_name` / `level2_protocol_name` / `level3_protocol_name` — drei Protokollstufen
- `level1_output_metric` / `level2_output_metric` / `level3_output_metric` — was gemessen wird
- `populated: true/false` — ob das Profil vollständig ausgefüllt ist

### `abiotic.json` — 16 Abiotische Indikatoren

Für Bodenkennzahlen (z.B. Boden-Organikkohlenstoff, pH):
- `indicator_id` (AB01–AB16)
- `universal_baseline: true/false` — universell empfohlen, unabhängig von Praktiken
- `protocol_level` — immer eine feste Protokollstufe
- `linked_practices` — P-Codes aus `practices.json`

### ID-Vernetzung: Ein Beispiel

```
Druck 1 ("Intensive tillage") ist present in:
  reference.json: block4_pressures[0].id = 1
  practices.json: P01.block4_pressures enthält 1
  indicators.json: Profil 1 (Soil bacteria).block4_pressures enthält 1
  abiotic.json: AB01 (SOC).block4_pressures enthält 1

Alle vier Dateien "sprechen" über dieselbe Sache via ID=1.
```

---

## 4. Wie die vier Schritte zusammenhängen

```
╔══════════════╗     ╔══════════════╗     ╔══════════════╗     ╔══════════════╗
║   SCHRITT 1  ║────►║   SCHRITT 2  ║────►║   SCHRITT 3  ║────►║   SCHRITT 4  ║
║  Landschaft  ║     ║  Praktiken   ║     ║  Kapazität   ║     ║  Monitoring  ║
║  Profil      ║     ║  Empfehlung  ║     ║  Bewertung   ║     ║  Plan        ║
╚══════════════╝     ╚══════════════╝     ╚══════════════╝     ╚══════════════╝
      │                     │                    │                    │
      │  step1{}             │  step2{}            │  step3{}           │  step4_outputs{}
      │                     │                    │                    │
      ▼                     ▼                    ▼                    ▼
 28 Drücke            Gefilterte &          Kapazitäts-         Personalisierter
 35 Herausforder.     bewertete             Profil              Monitoring-Plan
 37 Services          Praktiken             (max_level,         (Protokolle,
 Land-uses            ausgewählt            days, budget)       Kalender,
 EFG-Codes                                                      Empfehlungen)
```

**Alles lebt in einem einzigen JavaScript-Objekt:** `window.assessment`

```javascript
window.assessment = {
  assessment_id: "...",
  step1: { pressures: [...], challenges: [...], services: [...], ... },
  step2: { prescreen: {...}, selected_practices: [...] },
  step3: { team_types: [...], budget_tier: 2, capacity_profile: {...} },
  step4_outputs: { practice_chains: [...], calendar: [...], ... }
}
```

Dieses Objekt wird bei jeder Änderung automatisch in `localStorage` gespeichert.

---

## 5. Schritt 1 — Landschaftsprofil

### Was der Nutzer ausfüllt (6 Blöcke)

| Block | Inhalt | Gespeichert in |
|---|---|---|
| Block 1 | Name, Land, Region | `step1.landscape_name`, `.country`, ... |
| Block 1.2 | Fläche, IPCC-Landnutzung, Ökosystemtypen (EFG), Bodentypen | `step1.area_ha`, `.ipcc_land_use_categories`, `.efg_codes`, `.soil_types` |
| Block 1.3 | Freitext-Beschreibung | `step1.description` |
| Block 2 | Welche Landnutzungen sind vorhanden? | `step1.land_uses` |
| Block 3 | Ackerkulturen, Vieh, Flächenzusammensetzung (% je Kategorie) | `step1.crops`, `.livestock`, `.land_use_composition` |
| Block 4 | 28 Drücke: ongoing / past / not_sure / not_relevant | `step1.pressures` |
| Block 5 | 35 Herausforderungen (auto-vorausgefüllt + manuell bestätigt) | `step1.challenges` |
| Block 6 | 37 Ökosystemleistungen (auto-vorausgefüllt, Priorität 1–3) | `step1.services` |

### Der wichtigste Algorithmus: `prepopulateChallenges()`

**Wo:** `wizard.js`, Zeile ~238

**Was es tut:** Sobald ein Druck in Block 4 gesetzt wird, werden automatisch passende Herausforderungen in Block 5 vorausgewählt.

```
Block 4: Nutzer markiert Druck 1 ("Intensive tillage") als "ongoing"
         │
         ▼
reference.json: pressure_to_challenge_mapping["1"]
         │ → Challenge 2: "high"
         │ → Challenge 3: "high"
         └ → Challenge 4: "medium"
         │
         ▼
Block 5: Challenge 2 erscheint mit grünem "HIGH"-Badge
         Challenge 3 erscheint mit grünem "HIGH"-Badge
         Challenge 4 erscheint mit gelbem "MEDIUM"-Badge
```

**Konfidenz-Regeln:**

| Druck-Status | Auswirkung auf Konfidenz |
|---|---|
| `ongoing` | Volle Konfidenz aus der Mapping-Tabelle |
| `past` oder `not_sure` | Eine Stufe reduzieren (high→medium, medium→low, low→nicht gewählt) |
| `not_relevant` | Gar nicht vorauswählen |

**Flächengewichtung** (zusätzliche Regel):
Wenn der Druck nur für eine bestimmte Landnutzung relevant ist (z.B. "Intensive tillage" nur für Ackerland), und diese Landnutzung weniger als 10% der Gesamtfläche ausmacht → Konfidenz um eine Stufe reduzieren.

**Union-Logik:** Wenn mehrere Drücke zur selben Herausforderung führen → die höchste Konfidenz gewinnt.

### `prepopulateServices()` — Schritt 5→6

**Wo:** `wizard.js`, Zeile ~261

Gleiche Logik, andere Mapping-Tabelle: `challenge_to_service_mapping`. Bestätigte Herausforderungen → Ökosystemleistungen werden vorausgewählt.

---

## 6. Schritt 2 — Praktiken-Empfehlung

### Block 2.0 — Vorab-Screening (4 Fragen)

Bevor Empfehlungen angezeigt werden, wird gefragt, ob der Nutzer offen für bestimmte Richtungen ist:

| Frage | Steuert |
|---|---|
| Q1: Bäume / Agroforstwirtschaft integrieren? | Agroforestry-Praktiken |
| Q2: Vieh integrieren oder diversifizieren? | Viehwirtschafts-Praktiken |
| Q3: Flächen für Habitat zurücksetzen? | Habitat-Praktiken |
| Q4: Externe Inputs reduzieren? | Pestizid/Dünger-Reduktion |

Antwortoptionen: `open` / `open_conditionally` / `not_currently`

→ `not_currently` = diese Praktiken werden **komplett ausgeblendet**

### Block 2.1 — Scoring-Algorithmus: `scorePractice()`

**Wo:** `wizard.js`, Zeile ~278

Jede Praktik bekommt einen Relevanz-Score basierend auf den Antworten aus Schritt 1:

```
Score-Berechnung:
  +1 Punkt  je übereinstimmender Druck (Block 4, status ≠ "not_relevant")
  +2 Punkte je bestätigter Herausforderung mit hoher Konfidenz (Block 5)
  +1 Punkt  je bestätigter Herausforderung mit mittlerer Konfidenz
  +3 Punkte je ausgewähltem Service mit Priorität 1 (Block 6)
  +2 Punkte je ausgewähltem Service mit Priorität 2
  +1 Punkt  je ausgewähltem Service mit Priorität 3
```

### Eligibility-Filter: `getEligiblePractices()`

**Wo:** `wizard.js`, Zeile ~295

Praktiken werden **vor** dem Scoring herausgefiltert, wenn:
1. **EFG-Mismatch**: Praktik ist für andere Ökosystemtypen gedacht als die des Nutzers
2. **Landnutzungs-Mismatch**: keine Überschneidung mit den Landnutzungen des Nutzers
3. **Prescreen = `not_currently`**: die zugehörige Vorab-Frage wurde negativ beantwortet

### Ergebnis

Praktiken werden **nach Theme gruppiert** und innerhalb jeder Gruppe **absteigend nach Score** sortiert. Der Nutzer kann Praktiken an- und abwählen.

---

## 7. Schritt 3 — Kapazitätsbewertung

### Die 6 Fragen

| Frage | Was wird erfasst | Gespeichert in |
|---|---|---|
| Q1a | Team-Typen und Anzahl (A–F) | `step3.team_types` |
| Q1b | Bereitschaft, zu rekrutieren? | `step3.willingness_recruit` |
| Q2a | Feldtage pro Jahr je Team-Typ | `step3.days_by_type` |
| Q2b | Könnte Monitoring-Zeit steigen? | `step3.willingness_time` |
| Q3a | Vorhandene Ausrüstung (13 Kategorien) | `step3.equipment_capabilities` |
| Q3b | Bereitschaft, Ausrüstung anzuschaffen? | `step3.willingness_equipment` |
| Q4 | Jahresbudget (0 / <5k / 5–20k / 20–50k / >50k €) | `step3.budget_tier` |
| Q5a | Anzahl Monitoringstandorte | `step3.site_count_category` |
| Q5b | Verteilung der Standorte | `step3.site_distribution` |
| Q6 | Monatliche Zugänglichkeit (12-Monats-Raster) | `step3.access_calendar` |

### Team-Typ → Protokollstufe

| Team-Typ | Personen | Max. Protokollstufe |
|---|---|---|
| A | Landwirte / Flächenmanager | Stufe 1 |
| B | Beratungskräfte | Stufe 1 |
| C | Feldtechniker / Agronomen | Stufe 2 |
| D | Biologen / Ökologen | Stufe 2 |
| E | Forschungswissenschaftler | Stufe 3 |
| F | Externe Spezialisten | Stufe 3 |

### `computeCapacityProfile()` — Kapazitätsprofil berechnen

**Wo:** `wizard.js`, Zeile ~336

```javascript
max_protocol_level = maximale Stufe aller vorhandenen Team-Typen
available_days_total = Summe aller Feldtage je Team-Typ
per_site_days = available_days_total / Anzahl Standorte
```

Beispiel: Team mit Typ A (2 Personen × 15 Tage) + Typ D (1 Person × 30 Tage) = 60 Tage gesamt bei 3 Standorten → 20 Tage/Standort, max. Protokollstufe 2.

**Budget-Warnung:** Wenn Team-Typ E oder F vorhanden + Budget = 0 → Warndialog (externe Spezialisten haben Kosten).

---

## 8. Schritt 4 — Monitoringplan

Schritt 4 läuft **vollautomatisch** nach Abschluss von Schritt 3. Keine weiteren Nutzereingaben nötig. Fünf Operationen laufen nacheinander ab.

### Operation 1 — Praktiken nach Theme gruppieren

**Wo:** `wizard.js` (in der Step-4-Render-Funktion)

Die gewählten Praktiken werden nach `theme` gruppiert und jedem Theme eine Monitoringkette zugeordnet:

| Praktiken-Theme | Monitoring-Kette |
|---|---|
| Soil Management | Soil recovery and biological function chain |
| Crop System Diversification | Crop system diversity and soil health chain |
| Water Management | Water quality and hydrology chain |
| Livestock and Pasture Management | Grazing management and pasture recovery chain |
| Agroforestry and Tree Integration | Woody cover and landscape connectivity chain |
| ... | ... |

**Wo in wizard.js:** Konstante `THEME_TO_CHAIN`, Zeile ~86

### Operation 2 — Indikatorgruppen auswählen: `selectIndicatorGroups()`

**Wo:** `wizard.js`, Zeile ~356

Für jeden der 41 Indikatoren wird geprüft:
1. **EFG-Filter**: Hat der Indikator EFG-Codes, die mit dem Nutzerprofil übereinstimmen?
2. **Landnutzungs-Filter**: Passt der Indikator zur Landnutzung des Nutzers?
3. **Einschluss-Logik** (mind. eine muss zutreffen):

| Bedingung | Priorität | Inclusion-Reason |
|---|---|---|
| Indikator ist in `b2_practices_primarily_verified` einer gewählten Praktik | 3 (höchste) | "B2 primary verifier" |
| Indikator ist in `b1_practices_that_benefit` einer gewählten Praktik | 2 | "B1 supporting" |
| Indikator-Challenges überschneiden sich mit bestätigten Challenges | 1 | "Challenge signal" |

Zusätzlich: Abiotische Indikatoren mit `universal_baseline: true` werden **immer** eingeschlossen.

### Operation 3 — Protokollstufe zuweisen: `assignProtocol()`

**Wo:** `wizard.js`, Zeile ~387

```
Zugewiesene Stufe = min(kapazitäts_max_level, höchste verfügbare Stufe im Profil)

Ausnahme: Wenn Stufe 3 gewählt würde + budget_tier = 0 → auf Stufe 2 reduzieren
```

Jeder Indikator bekommt dann:
- `assigned_level` (1, 2 oder 3)
- `assigned_protocol` (Name des Protokolls, z.B. "Earthworm presence count (mustard extraction)")
- `assigned_metric` (was gemessen wird, z.B. "Earthworms per m²")

### Operation 4 — Kapazitäts-Fitting (Kürzung)

Wenn zu viele Indikatoren für die verfügbaren Tage geplant sind, werden niedrig-priorisierte Gruppen herausgekürzt. Prioritätsscoring:

| Kriterium | Punkte |
|---|---|
| B2-Linkage zu gewählten Praktiken | +3 je Match |
| Challenge-Signal (Top 3 Challenges) | +2 je Match |
| Service-Signal (Top 3 Services) | +1 je Match |
| Universal-Tier | +2 |
| Schnelle Reaktionszeit (Fast-Stage) | +1 |

Herausgekürzte Gruppen erscheinen im Output unter "Enhancement Recommendations — was mit mehr Kapazität möglich wäre."

### Operation 5 — Monitoring-Kalender: `buildMonitoringCalendar()`

**Wo:** `wizard.js`, Zeile ~514

Für jeden Indikator wird ein optimales Monitoringfenster bestimmt:

1. **Saisonaler Text** aus dem Indikatorprofil (`level{N}_seasonal_primary`) wird geparst
2. **`parseSeasonalWindow()`** erkennt:
   - Explizite Monatsbereiche ("May–August")
   - Individuelle Monatsnamen
   - Jahreszeitbegriffe ("spring", "early autumn", etc.)
3. Ergebnis wird mit dem **Zugänglichkeitskalender** aus Schritt 3 abgeglichen
4. Einschränkungen werden im Kalender farblich markiert

---

## 9. Wo ist welche Logik in wizard.js?

```
wizard.js — Sektionsübersicht
─────────────────────────────────────────────────────────────────
Zeile   1–  8   ─ Datei-Header
Zeile   9– 98   ─ KONSTANTEN (SITE_COUNT_MIDPOINT, TEAM_PROTOCOL_LEVEL,
                  EQUIPMENT_CATEGORIES, PRESCREEN_LABELS, PRESCREEN_ANSWERS,
                  PRESSURE_LAND_USE_KEYWORDS, THEME_TO_CHAIN, MONTHS)
Zeile  99–110   ─ Globale Variablen (practicesData, indicatorsData, etc.)
Zeile 111–173   ─ window.assessment Objekt (State-Definition)
Zeile 174–188   ─ loadData() — JSON-Dateien laden
Zeile 189–213   ─ saveState() / loadSavedState() — localStorage
Zeile 214–260   ─ ALGORITHMEN SCHRITT 1
                  ├ reduceConfidence()
                  ├ confidenceRank()
                  ├ pressureAreaFraction()   ← Flächengewichtung
                  └ prepopulateChallenges()  ← Block 4→5
Zeile 261–276   ─ prepopulateServices()     ← Block 5→6
Zeile 277–293   ─ scorePractice()           ← Schritt 2 Scoring
Zeile 294–334   ─ getEligiblePractices()    ← Schritt 2 Filter
Zeile 335–354   ─ computeCapacityProfile()  ← Schritt 3
Zeile 355–401   ─ selectIndicatorGroups()   ← Schritt 4 Op. 2
                  assignProtocol()          ← Schritt 4 Op. 3
Zeile 402–501   ─ parseSeasonalWindow()     ← Kalender-Parser
                  splitIntoWindows()
Zeile 502–600+  ─ buildMonitoringCalendar() ← Schritt 4 Op. 5
     ...        ─ UI-Rendering (renderStep1, renderStep2, renderStep3, renderStep4)
     ...        ─ Event-Handler (handleNext, handleBack, handleChange)
     ...        ─ Validierungs-Funktionen
     ...        ─ Narrativ-Generierung (generateNarrative)
     ...        ─ Initialisierung (DOMContentLoaded, loadData, init)
```

### Welche Funktion macht was — Kurzreferenz

| Funktion | Schritt | Was sie tut |
|---|---|---|
| `prepopulateChallenges(pressures, landUseComposition)` | 1 | Block4→5: Herausforderungen aus Drücken ableiten |
| `prepopulateServices(challenges)` | 1 | Block5→6: Services aus Herausforderungen ableiten |
| `scorePractice(practice, step1)` | 2 | Relevanz-Score für eine Praktik berechnen |
| `getEligiblePractices()` | 2 | Nicht passende Praktiken herausfiltern |
| `computeCapacityProfile(step3)` | 3 | Kapazitätsprofil (max. Stufe, Tage, Budget) |
| `selectIndicatorGroups(step1, step2)` | 4 | Welche Indikatoren werden eingeschlossen? |
| `assignProtocol(group, cap)` | 4 | Welche Protokollstufe wird zugewiesen? |
| `buildMonitoringCalendar(groups, accessCalendar)` | 4 | 12-Monats-Kalender erstellen |
| `parseSeasonalWindow(text)` | 4 | Freitext → Monatsindizes |
| `generateNarrative(step1, step2, step3, step4)` | 4 | Personalisierter 4-Absatz-Text |

---

## 10. Gesamtdatenfluss

```
┌─────────────────────────────────────────────────────────────────────┐
│ NUTZER-EINGABEN                                                      │
│                                                                     │
│  Schritt 1: Land-Use, EFGs, 28 Drücke → bestätigt → 35 Challeng.  │
│             35 Challenges → bestätigt → 37 Services                 │
│  Schritt 2: 4 Prescreen-Antworten                                   │
│  Schritt 3: Team, Tage, Ausrüstung, Budget, Standorte, Kalender    │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ALGORITHMEN (wizard.js)                                              │
│                                                                     │
│  prepopulateChallenges()  ←── reference.json (pressure_mapping)    │
│  prepopulateServices()    ←── reference.json (challenge_mapping)   │
│                                                                     │
│  getEligiblePractices()   ←── practices.json (43 Praktiken)        │
│  scorePractice()          ←── step1.pressures/challenges/services  │
│                                                                     │
│  computeCapacityProfile() ←── step3.team_types / days / budget     │
│                                                                     │
│  selectIndicatorGroups()  ←── indicators.json (41 Profile)         │
│  assignProtocol()         ←── capacity_profile                     │
│  buildMonitoringCalendar()←── abiotic.json + access_calendar       │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│ OUTPUT (Schritt 4)                                                   │
│                                                                     │
│  • Personalisierter Narrativ (4 Absätze)                           │
│  • Praxis-Verifizierungsketten (nach Theme)                        │
│  • Biologisches Monitoring-Programm (Tabelle: Indikator/Protokoll) │
│  • Abiotisches Monitoring-Programm                                 │
│  • 12-Monats-Kalender                                               │
│  • Erweiterungs-Empfehlungen (gekürzte Gruppen)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 11. Wie Daten gespeichert werden

Das Tool hat **kein Backend**. Daten werden ausschließlich im Browser gespeichert:

### localStorage — Session-Persistenz

Bei **jeder Änderung** (`saveState()`) wird das komplette `window.assessment`-Objekt als JSON in `localStorage` gespeichert. Beim nächsten Seitenaufruf wird es automatisch wiederhergestellt.

```javascript
// Speichern
localStorage.setItem('lahmp_assessment', JSON.stringify(window.assessment));
localStorage.setItem('lahmp_step', String(currentStep));

// Wiederherstellen
const saved = localStorage.getItem('lahmp_assessment');
if (saved) { /* mergen in window.assessment */ }
```

**Achtung:** localStorage ist kein dauerhafter Datenspeicher — er kann vom Browser geleert werden. Für echte Persistenz → LAHMP v1 (Laravel-Backend, geplant).

### Test-Fixtures — Entwicklungs-Shortcuts

Vorausgefüllte Assessments können via URL-Parameter geladen werden:

```
?fixture=TEST-01           → Skoura M'Daz, Marokko (T7.2)
?fixture=TEST-02           → PK-17, Mauretanien (T7.5)
?fixture=TEST-03           → Vietnam VSA (T7.1 + F3.3)
?fixture=TEST-01&step=4    → Direkt zu Schritt 4 springen
```

Die Fixture-Dateien liegen in `data/test_fixtures/` als vollständige `assessment`-Objekte.

---

## 12. Export-Skripte (Python)

Die JSON-Dateien in `data/` werden **nie direkt bearbeitet**. Stattdessen:

1. Excel-Datei in `raw/` bearbeiten
2. Python-Skript ausführen → JSON wird regeneriert

### `export/convert.py`

```bash
pip install pandas openpyxl
python export/convert.py
```

Liest:
- `raw/LAHMP_Practice_Matrix.xlsx` → `data/practices.json`
- `raw/LAHMP_Indicator_Linkage_Matrix_Populated.xlsx` → `data/indicators.json`
- `raw/LAHMP_Abiotic_Reference_Table.xlsx` → `data/abiotic.json`

### `export/extract_indicators.py`

```bash
pip install python-docx requests
python export/extract_indicators.py
```

Liest alle `.docx`-Dateien aus `indicators/` und schreibt detaillierte Protokollinhalte in `data/indicators.json`.

**3-stufige Dateisuche:**
1. Zuerst `indicators/` (im Repository, tracked)
2. Dann `indicators_dl/` (lokaler Cache, nicht tracked)
3. Dann Download von GitHub

---

## Zusammenfassung: Was muss ich wissen, wenn ich...

### ...einen Fehler in einer Empfehlung finden will?
→ Die Logik liegt in `wizard.js`: `scorePractice()` (Zeile ~278), `getEligiblePractices()` (Zeile ~295)

### ...einen Indikator hinzufügen oder ändern will?
→ Excel-Datei `raw/LAHMP_Indicator_Linkage_Matrix_Populated.xlsx` bearbeiten → `python export/convert.py`

### ...verstehen will, warum Challenge X vorausgewählt wurde?
→ `reference.json` → `pressure_to_challenge_mapping` nachschlagen; Logik in `prepopulateChallenges()` (Zeile ~238)

### ...den Kalender debuggen will?
→ `parseSeasonalWindow()` (Zeile ~431), `buildMonitoringCalendar()` (Zeile ~514)

### ...eine neue Praktik ergänzen will?
→ `raw/LAHMP_Practice_Matrix.xlsx` bearbeiten → `python export/convert.py` → `data/practices.json` wird regeneriert

### ...das Tool lokal testen will?
→ Lokalen HTTP-Server starten (Fetch-API braucht HTTP, nicht file://):
```bash
python -m http.server 8080
# Dann: http://localhost:8080/?fixture=TEST-01
```
