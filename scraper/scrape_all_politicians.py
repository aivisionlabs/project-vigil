"""
Scrape all elected politicians (winners) from myneta.info.
Covers Lok Sabha 2024 + latest state assembly elections for all states/UTs.
Outputs a JSON file: politician_index.json
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import sys
import os

# ─── Election pages: most recent election per state + Lok Sabha ───────────────

ELECTIONS = [
    # (slug, state_name, election_type)
    ("LokSabha2024", "India", "Lok Sabha"),
    # State assemblies — latest election per state
    ("AndhraPradesh2024", "Andhra Pradesh", "State Assembly"),
    ("ArunachalPradesh2024", "Arunachal Pradesh", "State Assembly"),
    ("Assam2021", "Assam", "State Assembly"),
    ("Bihar2025", "Bihar", "State Assembly"),
    ("Chhattisgarh2023", "Chhattisgarh", "State Assembly"),
    ("Delhi2025", "Delhi", "State Assembly"),
    ("goa2022", "Goa", "State Assembly"),
    ("Gujarat2022", "Gujarat", "State Assembly"),
    ("Haryana2024", "Haryana", "State Assembly"),
    ("HimachalPradesh2022", "Himachal Pradesh", "State Assembly"),
    ("JammuKashmir2024", "Jammu & Kashmir", "State Assembly"),
    ("Jharkhand2024", "Jharkhand", "State Assembly"),
    ("Karnataka2023", "Karnataka", "State Assembly"),
    ("Kerala2021", "Kerala", "State Assembly"),
    ("MadhyaPradesh2023", "Madhya Pradesh", "State Assembly"),
    ("Maharashtra2024", "Maharashtra", "State Assembly"),
    ("manipur2022", "Manipur", "State Assembly"),
    ("Meghalaya2023", "Meghalaya", "State Assembly"),
    ("Mizoram2023", "Mizoram", "State Assembly"),
    ("Nagaland2023", "Nagaland", "State Assembly"),
    ("Odisha2024", "Odisha", "State Assembly"),
    ("Puducherry2021", "Puducherry", "State Assembly"),
    ("punjab2022", "Punjab", "State Assembly"),
    ("Rajasthan2023", "Rajasthan", "State Assembly"),
    ("Sikkim2024", "Sikkim", "State Assembly"),
    ("TamilNadu2021", "Tamil Nadu", "State Assembly"),
    ("Telangana2023", "Telangana", "State Assembly"),
    ("Tripura2023", "Tripura", "State Assembly"),
    ("uttarakhand2022", "Uttarakhand", "State Assembly"),
    ("uttarpradesh2022", "Uttar Pradesh", "State Assembly"),
    ("WestBengal2021", "West Bengal", "State Assembly"),
]

BASE_URL = "https://www.myneta.info"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ProjectVigil/1.0 (governance-transparency-tool)"
}

REQUEST_DELAY = 2  # seconds between requests


def scrape_winners(slug: str, state: str, election_type: str) -> list[dict]:
    """Scrape the winners page for a given election."""
    url = f"{BASE_URL}/{slug}/index.php?action=show_winners&sort=default"
    politicians = []

    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"  ERROR fetching {slug}: {e}")
        # Try without sort parameter
        try:
            url = f"{BASE_URL}/{slug}/index.php?action=show_winners"
            resp = requests.get(url, headers=HEADERS, timeout=30)
            resp.raise_for_status()
        except requests.RequestException as e2:
            print(f"  ERROR retry also failed for {slug}: {e2}")
            return []

    soup = BeautifulSoup(resp.text, "html.parser")

    # myneta.info uses tables for listing winners
    # Look for the main data table
    tables = soup.find_all("table")

    for table in tables:
        rows = table.find_all("tr")
        if len(rows) < 2:
            continue

        # Check if this looks like a winners table (has header with Name, Party, etc.)
        header = rows[0].get_text().lower()
        if "candidate" not in header and "name" not in header:
            continue

        for row in rows[1:]:
            cols = row.find_all("td")
            if len(cols) < 4:
                continue

            # Extract profile link
            link_tag = row.find("a", href=True)
            if not link_tag:
                continue

            href = link_tag["href"]
            if "candidate" not in href.lower():
                continue

            # Build full profile URL — always prefix with election slug
            # myneta uses /candidate.php?candidate_id=X but same IDs across elections
            # so we need the election-specific path like /LokSabha2024/candidate.php?candidate_id=X
            if href.startswith("http"):
                profile_url = href
            elif href.startswith(f"/{slug}/"):
                profile_url = f"{BASE_URL}{href}"
            elif href.startswith("/"):
                # Bare /candidate.php — prepend election slug
                profile_url = f"{BASE_URL}/{slug}{href}"
            else:
                profile_url = f"{BASE_URL}/{slug}/{href}"

            name = link_tag.get_text(strip=True)
            if not name or len(name) < 2:
                continue

            # Columns: Sno | Candidate | Constituency | Party | Criminal Cases | Education | Total Assets | Liabilities
            col_texts = [c.get_text(strip=True) for c in cols]

            constituency = ""
            party = ""
            criminal_cases = None
            total_assets = ""
            education = ""

            # Column indices (0-based): 0=Sno, 1=Candidate, 2=Constituency, 3=Party, 4=CriminalCases, 5=Education, 6=Assets, 7=Liabilities
            if len(col_texts) >= 4:
                constituency = col_texts[2] if len(col_texts) > 2 else ""
                party = col_texts[3] if len(col_texts) > 3 else ""

            if len(col_texts) >= 5:
                try:
                    criminal_cases = int(col_texts[4])
                except (ValueError, IndexError):
                    pass

            if len(col_texts) >= 6:
                education = col_texts[5] if len(col_texts) > 5 else ""

            if len(col_texts) >= 7:
                total_assets = col_texts[6] if len(col_texts) > 6 else ""

            # Extract election year from slug
            election_year = ""
            for ch in reversed(slug):
                if ch.isdigit():
                    election_year = ch + election_year
                elif election_year:
                    break

            politician = {
                "name": name,
                "constituency": constituency,
                "party": party,
                "state": state,
                "electionType": election_type,
                "election": f"{state} {election_year}" if election_type == "State Assembly" else f"Lok Sabha {election_year}",
                "profileUrl": profile_url,
                "criminalCases": criminal_cases,
                "totalAssets": total_assets,
                "education": education,
            }
            politicians.append(politician)

    return politicians


def main():
    all_politicians = []
    total_elections = len(ELECTIONS)

    print(f"Starting scrape of {total_elections} elections from myneta.info...")
    print("=" * 60)

    for i, (slug, state, etype) in enumerate(ELECTIONS, 1):
        print(f"[{i}/{total_elections}] Scraping {state} ({slug})...", end=" ")
        sys.stdout.flush()

        winners = scrape_winners(slug, state, etype)
        print(f"→ {len(winners)} winners")

        all_politicians.extend(winners)

        # Be polite to the server
        if i < total_elections:
            time.sleep(REQUEST_DELAY)

    print("=" * 60)
    print(f"Total politicians scraped: {len(all_politicians)}")

    # Deduplicate by profile URL
    seen = set()
    unique = []
    for p in all_politicians:
        if p["profileUrl"] not in seen:
            seen.add(p["profileUrl"])
            unique.append(p)

    print(f"After dedup: {unique_count} unique entries" if (unique_count := len(unique)) else "")

    # Save to JSON
    output_path = os.path.join(os.path.dirname(__file__), "..", "data", "politician_index.json")

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(unique, f, ensure_ascii=False, indent=2)

    print(f"Saved to {output_path}")

    # Also save a summary
    states_covered = set(p["state"] for p in unique)
    print(f"\nStates/UTs covered: {len(states_covered)}")
    for state in sorted(states_covered):
        count = sum(1 for p in unique if p["state"] == state)
        print(f"  {state}: {count}")


if __name__ == "__main__":
    main()
