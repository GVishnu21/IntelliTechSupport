import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Json

from app.config import DATABASE_URL

# One connection per call rather than a pool -- fine at this scale (a demo
# hitting escalate/list occasionally), and keeps the dependency footprint
# small. Move to psycopg_pool if this ever sees real concurrent traffic.

_SCHEMA = """
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    equipment TEXT NOT NULL,
    status TEXT NOT NULL,
    status_lights JSONB NOT NULL,
    history JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""


def get_connection() -> psycopg.Connection:
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(_SCHEMA)


def create_ticket(
    ticket_id: str,
    session_id: str | None,
    equipment: str,
    status_lights: dict,
    history: list[dict],
) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO tickets (id, session_id, equipment, status, status_lights, history)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (ticket_id, session_id, equipment, "escalated", Json(status_lights), Json(history)),
        )


def list_tickets() -> list[dict]:
    with get_connection() as conn:
        return conn.execute("SELECT * FROM tickets ORDER BY created_at DESC").fetchall()


def get_ticket(ticket_id: str) -> dict | None:
    with get_connection() as conn:
        return conn.execute("SELECT * FROM tickets WHERE id = %s", (ticket_id,)).fetchone()
