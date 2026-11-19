from typing import Iterable

import httpx
from bs4 import BeautifulSoup

from app.database import load_seed


HEC_URL = "https://www.hec.gov.pk/english/scholarshipsgrants/Pages/International-Scholarships.aspx"


async def fetch_scholarships() -> list[dict]:
    """Best-effort refresh. Seed data is used whenever live parsing fails."""
    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            response = await client.get(
                HEC_URL,
                headers={"User-Agent": "HEC-Scholarship-Finder/1.0"},
            )
            response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        found = []
        for link in soup.select("a[href]"):
            title = " ".join(link.get_text(" ", strip=True).split())
            href = str(link.get("href", ""))
            if not title or len(title) < 12:
                continue
            lower = f"{title} {href}".lower()
            if not any(word in lower for word in ("scholarship", "scholarships")):
                continue
            country = ""
            for known in (
                "China", "Germany", "Japan", "United Kingdom", "USA", "Turkey",
                "Australia", "Canada", "France", "South Korea", "Hungary",
            ):
                if known.lower() in lower:
                    country = known
                    break
            if not country:
                continue
            found.append(
                {
                    "title": title,
                    "country": country,
                    "course_levels": ["Bachelors", "Masters", "PhD"],
                    "provider": "Government of Pakistan / HEC",
                    "description": "Government-supported international scholarship opportunity.",
                    "eligibility": "Eligibility criteria are specified by the awarding programme.",
                    "deadline": None,
                    "application_url": href if href.startswith("http") else f"https://www.hec.gov.pk{href}",
                    "source_url": HEC_URL,
                }
            )
        if found:
            unique = {(item["title"], item["country"]): item for item in found}
            return list(unique.values())
    except Exception:
        pass
    return load_seed()
