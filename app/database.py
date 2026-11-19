import json
import sqlite3
from pathlib import Path
from typing import Iterable, Optional


BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "data" / "scholarships.db"
SEED_PATH = BASE_DIR / "data" / "raw" / "scholarships.json"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS scholarships (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                country TEXT NOT NULL,
                course_levels TEXT NOT NULL,
                provider TEXT NOT NULL,
                description TEXT,
                eligibility TEXT,
                deadline TEXT,
                application_url TEXT,
                source_url TEXT,
                updated_at TEXT
            )
            """
        )
        count = connection.execute("SELECT COUNT(*) FROM scholarships").fetchone()[0]
        if count == 0:
            seed_items = load_seed()
            replace_all(seed_items)


def load_seed() -> list[dict]:
    if not SEED_PATH.exists():
        return []
    with SEED_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)
    return data if isinstance(data, list) else data.get("scholarships", [])


def replace_all(items: Iterable[dict]) -> int:
    records = list(items)
    with get_connection() as connection:
        connection.execute("DELETE FROM scholarships")
        for item in records:
            levels = item.get("course_levels", [])
            if isinstance(levels, str):
                levels = [levels]
            connection.execute(
                """
                INSERT OR REPLACE INTO scholarships (
                    title, country, course_levels, provider, description,
                    eligibility, deadline, application_url, source_url, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item["title"],
                    item["country"],
                    json.dumps(levels),
                    item.get("provider", "Government of Pakistan / HEC"),
                    item.get("description", ""),
                    item.get("eligibility", ""),
                    item.get("deadline"),
                    item.get("application_url", ""),
                    item.get("source_url", ""),
                    item.get("updated_at"),
                ),
            )
    return len(records)


def _row_to_dict(row: sqlite3.Row) -> dict:
    item = dict(row)
    item["course_levels"] = json.loads(item["course_levels"] or "[]")
    return item


def list_scholarships(country: Optional[str] = None, course_level: Optional[str] = None) -> list[dict]:
    query = "SELECT * FROM scholarships"
    clauses = []
    params = []
    if country:
        clauses.append("LOWER(country) LIKE LOWER(?)")
        params.append(f"%{country.strip()}%")
    if course_level:
        clauses.append("LOWER(course_levels) LIKE LOWER(?)")
        params.append(f"%{course_level.strip()}%")
    if clauses:
        query += " WHERE " + " AND ".join(clauses)
    query += " ORDER BY country, title"
    with get_connection() as connection:
        return [_row_to_dict(row) for row in connection.execute(query, params).fetchall()]


def search_scholarships(country: str, course_level: str) -> list[dict]:
    return list_scholarships(country=country, course_level=course_level)
