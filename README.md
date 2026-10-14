# CEEW Scraping Field Course

A self-paced course that teaches CEEW researchers who don't code to collect data from websites, with Claude doing the coding. The main worked example is IMD's [Local Weather Report & Forecast](https://city.imd.gov.in/citywx/responsive/) site; the charts module uses IITM's [Air Quality Early Warning System for Delhi](https://ews.tropmet.res.in/). Every module also shows how the same step works on other sites.

**Course website:** https://mrafiuddin50.github.io/ceew_scraping_curriculum/

## What's in the course

- **Setup check** and a cohort tracker (Google Sheet, shared by the course owner)
- **12 core modules (00–11):** should you scrape, how pages carry data, recon, visible tables, hidden data feeds, collecting with Claude or Colab, cleaning and validation, repeating and documenting, data behind charts, PDFs, pages and forms, and a capstone
- **Track B (optional):** reading the collector notebook, extracting tables from PDFs, daily collection with Apps Script, reading data behind charts
- **Reference:** prompt library, gotcha field guide, troubleshooting, checklist, sources

Researchers need Claude with a browser, Google Colab and Google Sheets. Nothing is installed on their own computers.

## Files

| Path | What it is | Open |
|---|---|---|
| `index.html` | The course website | [Website](https://mrafiuddin50.github.io/ceew_scraping_curriculum/) |
| `notebooks/IMD_station_collector.ipynb` | Collects observations, 7-day forecast, 14-day temperature table and climate pages for one state; saves to Google Sheets or Drive | [Open in Colab](https://colab.research.google.com/github/mrafiuddin50/ceew_scraping_curriculum/blob/main/notebooks/IMD_station_collector.ipynb) |
| `notebooks/Charts_to_Sheets.ipynb` | Opens a page in a hidden browser, reads the data behind every Chart.js or Highcharts chart, and saves it to Google Sheets (worked example: IITM's Air Quality Early Warning System for Delhi) | [Open in Colab](https://colab.research.google.com/github/mrafiuddin50/ceew_scraping_curriculum/blob/main/notebooks/Charts_to_Sheets.ipynb) |
| `notebooks/PDF_tables_to_Sheets.ipynb` | Extracts tables from text PDFs into a Google Sheet | [Open in Colab](https://colab.research.google.com/github/mrafiuddin50/ceew_scraping_curriculum/blob/main/notebooks/PDF_tables_to_Sheets.ipynb) |
| `apps_script/IMD_daily_collector.gs` | Apps Script that adds one state's observations to a Google Sheet every day | Paste into Extensions › Apps Script |
| `practice/practice_bulletin_safdarjung.pdf` | Two-page practice PDF with known answers | [Download](https://mrafiuddin50.github.io/ceew_scraping_curriculum/practice/practice_bulletin_safdarjung.pdf) |
| `CURRICULUM.md` | The syllabus, what changed from the earlier draft, and the facts the course relies on | |

## Status

IMD site behaviour was observed on 12 October 2026 and the IITM site on 14 October 2026. The notebooks and the Apps Script were tested against saved replies, a test page and the practice PDF, not yet from Google's servers against the live sites; each checks its connection first. The chart-reading code was also run on the live IITM page in a browser. Government sites change without notice, so recheck before each cohort.

The data used in examples comes from IMD's and IITM's public pages. It is not an official dataset: verify against the live sites before using any figure, and request data from IMD or IITM for publication-grade work.

## Hosting

GitHub Pages serves this repository from the `main` branch, root folder. The `.nojekyll` file tells Pages to serve the files as they are.

Prepared for CEEW researchers. Claude drafted the material; the course owner reviews and owns it.
