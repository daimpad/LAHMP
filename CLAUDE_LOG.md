# CLAUDE_LOG — 2026-04-13

## Was wurde heute erreicht

### Algorithmus-Verbesserungen (`wizard.js`)
- **THEME_TO_CHAIN-Fix**: Schlüssel stimmen jetzt mit den tatsächlichen Theme-Strings aus `practices.json` überein (waren vorher Spec-Dokument-Namen wie "Livestock Management" statt "Livestock and Pasture Management")
- **Budget-Warnmeldung**: Nicht-blockierender `confirm()`-Dialog, wenn Team-Typen E/F + `budget_tier === 0`
- **Flächengewichtung** in `prepopulateChallenges()`: `PRESSURE_LAND_USE_KEYWORDS` (28 Einträge) + `pressureAreaFraction()` — reduziert Challenge-Konfidenz um eine Stufe, wenn die relevante Landnutzung < 10 % der Landschaft abdeckt
- **Saisonale Monitoringfenster**: `parseSeasonalWindow()` extrahiert Monatsindizes aus `level{N}_seasonal_primary`-Freitext; `splitIntoWindows()` trennt nicht-benachbarte Gruppen; `buildMonitoringCalendar()` nutzt indikatorspezifische Fenster statt generischer Frühling/Herbst-Heuristik
- Negative-Lookbehind-Guards (`(?<!early |late )\bspring\b`) verhindern Doppelmatches bei "early spring" / "late spring" — funktioniert in JS V8, nicht in Python `re`

### Dokumentation
- **`README.md`** vollständig neu erstellt: Badges, Architektur-Diagramm (Mermaid), Installation, Nutzung, Konfiguration, Entwicklung, Tests, Deployment, Contributing, Referenzen

### Repository-Reorganisation
- **`raw/`-Verzeichnis** angelegt: 7 CSV + 4 XLSX Quelldateien per `git mv` verschoben
- **`export/convert.py`**: `RAW = BASE / "raw"` hinzugefügt, alle 5 `openpyxl.load_workbook()`-Aufrufe auf `RAW / "..."` umgestellt
- **`export/extract_indicators.py`**: Hardcodierte absolute Windows-Pfade entfernt; 3-stufige `resolve_file()`-Funktion (`indicators/` → `indicators_dl/` Cache → GitHub-Download); `os.makedirs` in die Download-Stufe verschoben (statt Modul-Ebene)
- **`.gitignore`**: `*.xlsx`/`*.xls`-Regel entfernt (widersprach committeten Dateien in `raw/`); `indicators_dl/` hinzugefügt
- **`CLAUDE.md`** und **`README.md`**: XLSX-Pfadverweise auf `raw/...` aktualisiert
- Leere Placeholder-Dateien entfernt: `data/abc-map/geojson/.md`, `indicators/.md`

---

## Geänderte Dateien

| Datei | Art der Änderung |
|---|---|
| `wizard.js` | THEME_TO_CHAIN, Budget-Warnung, Flächengewichtung, Saisonparser |
| `README.md` | Neu erstellt; Struktur-Tree + KB-Abschnitt aktualisiert |
| `.gitignore` | `*.xlsx` entfernt; `indicators_dl/` hinzugefügt |
| `export/convert.py` | `RAW`-Pfadvariable; 5 `load_workbook`-Aufrufe |
| `export/extract_indicators.py` | Pfade; `resolve_file()`; `makedirs` verschoben |
| `CLAUDE.md` | 4 XLSX-Pfadverweise auf `raw/` |
| `raw/` (11 Dateien) | Verschoben aus Repo-Root |
| `data/abc-map/geojson/.md` | Gelöscht |
| `indicators/.md` | Gelöscht |

---

## Git-Commits heute

| Hash | Beschreibung |
|---|---|
| `3f3439d` | Fix THEME_TO_CHAIN keys to match practices.json theme strings |
| `a2015ad` | Add budget warning + pressure area-weighting in prepopulateChallenges |
| `5220019` | Add seasonal window parser (parseSeasonalWindow / splitIntoWindows) |
| `8dab25a` | Add production README |
| `12711b5` | Move raw CSV/XLSX source files to raw/ |
| `f3db832` | Update all paths after raw/ reorganisation |
| `26341f2` | Fix extract_indicators.py absolute paths; update .gitignore |
| `c1295b6` | Repo cleanup: remove empty placeholders, fix makedirs scope, update README tree |

---

## Nächste offene Schritte (für morgen)

1. **Dieses Log committen und pushen** (`git add CLAUDE_LOG.md && git commit && git push`)
2. **Conditionality-Check** für bedingte Indikatoren in `selectIndicatorGroups()` (laut Spec vorhanden, im Prototyp noch nicht umgesetzt — niedrige Priorität)
3. **Hard-Prerequisite-Check** für Indikatorprofile (ebenfalls niedrige Priorität für Prototyp)
4. **Wizard-UI-Tests** — manuelle Durchläufe durch alle 4 Schritte mit realen `data/*.json`-Dateien, insbesondere:
   - Block 4 → 5 Prepopulation mit Flächengewichtung
   - Schritt 2 Scoring mit verschiedenen Druckkombinationen
   - Schritt 4 Output-Generierung (Kalender, Protokolltabellen)
5. **Produktionsplattform LAHMP v1** — Laravel + Vue.js-Anwendung auf Basis dieser Prototyp-Logik (separates Projekt, noch nicht begonnen)
6. **Automatisierte Tests** — Jest-Unit-Tests für Kernalgorithmen (`scorePractice`, `prepopulateChallenges`, `computeCapacityProfile`, `parseSeasonalWindow`) — für v1 geplant
