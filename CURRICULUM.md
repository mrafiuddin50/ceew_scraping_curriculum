# CEEW Scraping Field Course: combined curriculum (v2)

Version 2, 12 October 2026. Combines an AI-first course built around IMD with an earlier code-first draft (Streamlit app, command-line script and Colab notebook). The course website is https://mrafiuddin50.github.io/ceew_scraping_curriculum/.

## Who it's for and what they need

CEEW researchers who don't code. Everyone works with:

- **Claude with a browser** (Claude in Chrome or the Cowork browser)
- **Google Colab**
- **Google Sheets and Drive** (CEEW Google accounts)

Nothing is installed or run on anyone's own computer. The earlier draft's Streamlit app, command-line script and Windows launcher are retired and not included here.

## Shape of the course

| Part | Content | Time |
|---|---|---|
| Before you start | Setup check (Claude browser, developer tools, Sheets and Colab connection), claim a state in the cohort tracker sheet | 15 min |
| Core, Modules 00–10 | Everyone. Claude does the coding; the researcher decides, checks and documents | 5–6 h |
| Track B, lessons B1–B3 | Optional. Reading and adapting Colab notebooks; PDFs; daily collection with Apps Script | about 4 h |
| Reference | Prompt library, gotcha field guide, troubleshooting, checklist, sources | – |

Difficulty uses IMD's warning colours: **green** (data on the page), **yellow** (data loads from a hidden feed), **orange** (traps: sessions, pages, forms, placeholders), **red** (logins, CAPTCHAs, personal data, forbidding terms: stop and request the data).

## Core modules

| # | Module | What researchers do | Came from |
|---|---|---|---|
| 00 | Start here | Explore the IMD page; learn the green–red scale | AI-first |
| 01 | Should you scrape? | Official route first; terms; personal data; harm. Read robots.txt and terms for two sites | Both |
| 02 | How pages carry data | Source test on a dynamic and a static IMD page; status codes 200, 301/302, 403, 404, 429 | Both |
| 03 | Recon | Ask Claude to map a site before collecting; record counts, IDs, surprises | AI-first |
| 04 | Tables you can see | Copy and paste; Claude reads the table; `IMPORTHTML` and `IMPORTXML` in Sheets (unconfirmed on IMD) | Both |
| 05 | Find the hidden data feed | Network tab, Fetch/XHR, Headers and Payload; "Copy as cURL" pasted to Claude for explanation | Both |
| 06 | Collect | Route A: Claude collects in its browser. Route B: the IMD station collector notebook in Colab | Both |
| 07 | Clean and validate | Five checks; practice files with known problems and answers | AI-first |
| 08 | Repeat, pace, document | Apps Script or Claude scheduled task; keep raw replies; scraping log | Both |
| 09 | Files, pages and forms | PDFs (Claude, or notebook B2), pages of results (CCAC lessons), search forms (Claude drives the form) | Both |
| 10 | Capstone | Own site or a CEEW-area idea; reviewed against a rubric; link in tracker | Both |

Every module has a "Done when" check and an answer under it. A cohort tracker Google Sheet, shared by the course owner, records each researcher's state, progress and capstone link. Ticks on the website are saved in the researcher's own browser.

## Track B

| Lesson | File | What it teaches |
|---|---|---|
| B1 | `notebooks/IMD_station_collector.ipynb` | Reading a real collector with Claude's help: requests, JSON, pandas, placeholders. Exercises: 3 stations, add a column, pause length |
| B2 | `notebooks/PDF_tables_to_Sheets.ipynb` + `practice/practice_bulletin_safdarjung.pdf` | Text vs scanned PDFs; extracting tables with pdfplumber; checking what breaks |
| B3 | `apps_script/IMD_daily_collector.gs` | Daily collection into a Google Sheet on a timer, with duplicate protection, batched saving and a self-imposed 5-minute stop |

From the earlier draft, these were dropped: Playwright (Claude's browser handles form-driven sites for this audience), GitHub Actions, Parquet, PostgreSQL and BigQuery (beyond scope; Sheets and Drive cover the need), browser extensions, and Excel Power Query (both run on the researcher's computer).

## Status of the code

All three code files were tested on 12 October 2026 against saved IMD replies (Delhi stations, the Safdarjung climate page) and the practice PDF. **None has yet been run from Google's servers against the live IMD site.** Each checks its connection first. Before the first cohort, the course owner should run:

1. The collector notebook, Steps 1–6, for one small state.
2. `testOnce` in the Apps Script.
3. One `IMPORTHTML` formula on a climate page (it returned `#REF!` in one test).

If Google's servers can't reach IMD, Route A (Claude's browser) still works for the whole core course.

## Facts the course relies on (observed 12 October 2026)

- Station list: `GET https://city.imd.gov.in/citywx/responsive/api/`; 35 state and UT groups, 1,729 stations.
- Station data: `POST .../api/fetchCity_static.php` with form field `ID`. A station with no data returns HTTP 200 with `{"status":404,"error":"Data will be uploaded shortly"}`.
- Placeholders seen: `NA`, empty, `99.9`, `99.0`, `999`, `()`, `0000-00-00 00:00:00`.
- `max` belongs to `max_date`, one day before the page date.
- Some stations have no climate page (`extreme_url` is null).
- Safdarjung's October 2013 "lowest minimum" of 36.3 °C is very likely an error on IMD's page.

Recheck before each cohort: government sites change without notice.
