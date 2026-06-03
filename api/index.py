from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, HttpUrl
import requests
from bs4 import BeautifulSoup
import pandas as pd
import io

app = FastAPI(
    title="Gpykss Harvester Engine",
    description="Automated Python backend for harvesting and structuring open pre-seed investor tables.",
    version="1.0.0"
)


class HarvestRequest(BaseModel):
    target_url: HttpUrl


@app.post("/api/harvest")
def execute_matrix_harvest(payload: HarvestRequest):
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
    }

    target_string_url = str(payload.target_url)

    # ── 1. Pre-Flight HTTP Acquisition Step ───────────────────────────────────
    try:
        response = requests.get(target_string_url, headers=headers, timeout=8)
    except requests.exceptions.Timeout:
        raise HTTPException(
            status_code=400,
            detail="Target website unreachable or timed out."
        )
    except requests.RequestException:
        raise HTTPException(
            status_code=400,
            detail="Target website unreachable or timed out."
        )

    # ── 2. Gatekeeper Firewalls & Anti-Bot Detection ──────────────────────────
    if response.status_code in [401, 403]:
        raise HTTPException(
            status_code=403,
            detail="Website not scrapable: Access Denied / Bot Protection active."
        )

    if not response.ok:
        raise HTTPException(
            status_code=400,
            detail=f"Target website returned HTTP {response.status_code}."
        )

    # ── 3. DOM Parse & Structural Integrity Scan ──────────────────────────────
    soup = BeautifulSoup(response.text, "lxml")
    rows = soup.find_all("tr")

    if not rows or len(rows) < 2:
        raise HTTPException(
            status_code=422,
            detail="Website not scrapable: No valid table matrix arrays discovered in DOM."
        )

    # ── 4. Processing Phase & Token Cleansing Loop ────────────────────────────
    scraped_data_matrix = []

    for row in rows:
        cells = [
            cell.get_text(separator=" ", strip=True)
                .replace("\n", " ")
                .replace("\r", "")
                .replace("\t", " ")
            for cell in row.find_all(["td", "th"])
        ]
        if cells:
            scraped_data_matrix.append(cells)

    if not scraped_data_matrix:
        raise HTTPException(
            status_code=422,
            detail="Website not scrapable: Extracted data rows are empty."
        )

    # ── 5. Convert Array to Pandas DataFrame Engine ───────────────────────────
    df = pd.DataFrame(scraped_data_matrix)

    # ── 6. Stream Memory Buffer Compilation (Zero Local File System Overhead) ─
    stream_buffer = io.StringIO()
    df.to_csv(stream_buffer, index=False, header=False)
    stream_buffer.seek(0)

    return StreamingResponse(
        io.BytesIO(stream_buffer.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=gpykss_harvest.csv"
        }
    )
