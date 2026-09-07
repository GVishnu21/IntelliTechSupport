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
    contact_phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS contact_phone TEXT;

CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    equipment TEXT NOT NULL,
    outcome TEXT NOT NULL DEFAULT 'in_progress',
    steps_completed INT NOT NULL DEFAULT 0,
    history JSONB NOT NULL DEFAULT '[]',
    rating INT,
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
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
    contact_phone: str | None = None,
) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO tickets (id, session_id, equipment, status, status_lights, history, contact_phone)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (ticket_id, session_id, equipment, "escalated", Json(status_lights), Json(history), contact_phone),
        )


def list_tickets() -> list[dict]:
    with get_connection() as conn:
        return conn.execute("SELECT * FROM tickets ORDER BY created_at DESC").fetchall()


def get_ticket(ticket_id: str) -> dict | None:
    with get_connection() as conn:
        return conn.execute("SELECT * FROM tickets WHERE id = %s", (ticket_id,)).fetchone()


def update_ticket_status(ticket_id: str, status: str) -> dict | None:
    with get_connection() as conn:
        return conn.execute(
            "UPDATE tickets SET status = %s WHERE id = %s RETURNING *",
            (status, ticket_id),
        ).fetchone()


# --- Scans: one row per /diagnose call (every photo attempt, not just
# escalations), so Dashboard/Analytics metrics have a real denominator
# instead of being permanently mock. ---


def create_scan(scan_id: str, session_id: str | None, equipment: str, outcome: str) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO scans (id, session_id, equipment, outcome, resolved_at)
            VALUES (%s, %s, %s, %s, CASE WHEN %s = 'resolved' THEN now() ELSE NULL END)
            """,
            (scan_id, session_id, equipment, outcome, outcome),
        )


def update_scan_outcome(session_id: str, outcome: str, steps_completed: int, history: list[dict]) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE scans
            SET outcome = %s,
                steps_completed = %s,
                history = %s,
                resolved_at = CASE WHEN %s = 'resolved' THEN now() ELSE resolved_at END
            WHERE session_id = %s
            """,
            (outcome, steps_completed, Json(history), outcome, session_id),
        )


def update_scan_feedback(scan_id: str, rating: int, feedback: str | None) -> dict | None:
    with get_connection() as conn:
        return conn.execute(
            "UPDATE scans SET rating = %s, feedback = %s WHERE id = %s RETURNING *",
            (rating, feedback, scan_id),
        ).fetchone()


def get_scans_summary() -> dict:
    with get_connection() as conn:
        totals = conn.execute(
            """
            SELECT
              COUNT(*) AS total_scans,
              COUNT(*) FILTER (WHERE outcome = 'resolved') AS resolved_count,
              COUNT(*) FILTER (WHERE outcome = 'escalated') AS escalated_count,
              COUNT(*) FILTER (WHERE outcome = 'resolved' AND steps_completed <= 1) AS first_contact_count,
              AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) FILTER (WHERE outcome = 'resolved')
                AS avg_resolution_seconds,
              AVG(rating) FILTER (WHERE rating IS NOT NULL) AS avg_rating
            FROM scans
            """
        ).fetchone()

        trend_rows = conn.execute(
            """
            SELECT
              to_char(created_at, 'YYYY-MM-DD') AS day,
              COUNT(*) FILTER (WHERE outcome = 'resolved') AS resolved,
              COUNT(*) FILTER (WHERE outcome = 'escalated') AS escalated
            FROM scans
            WHERE outcome IN ('resolved', 'escalated')
            GROUP BY day
            ORDER BY day
            """
        ).fetchall()

        step_rows = conn.execute(
            "SELECT history FROM scans WHERE outcome = 'resolved' AND jsonb_array_length(history) > 0"
        ).fetchall()

    resolution_trend = []
    escalation_trend = []
    for row in trend_rows:
        concluded = row["resolved"] + row["escalated"]
        if concluded == 0:
            continue
        resolution_trend.append({"date": row["day"], "value": row["resolved"] / concluded})
        escalation_trend.append({"date": row["day"], "value": row["escalated"] / concluded})

    step_counts: dict[str, int] = {}
    for row in step_rows:
        history = row["history"]
        if not history:
            continue
        last = history[-1]
        if last.get("outcome") == "completed":
            step_counts[last["step"]] = step_counts.get(last["step"], 0) + 1
    top_steps = sorted(
        ({"label": label, "count": count} for label, count in step_counts.items()),
        key=lambda item: item["count"],
        reverse=True,
    )

    resolved = totals["resolved_count"] or 0
    escalated = totals["escalated_count"] or 0
    concluded = resolved + escalated
    avg_seconds = totals["avg_resolution_seconds"]

    return {
        "total_scans": totals["total_scans"] or 0,
        "resolution_rate": (resolved / concluded) if concluded else 0.0,
        "escalation_rate": (escalated / concluded) if concluded else 0.0,
        "first_contact_resolution": (totals["first_contact_count"] / resolved) if resolved else 0.0,
        "avg_resolution_time_seconds": float(avg_seconds) if avg_seconds is not None else None,
        "csat": float(totals["avg_rating"]) if totals["avg_rating"] is not None else None,
        "resolution_trend": resolution_trend,
        "escalation_trend": escalation_trend,
        "top_troubleshooting_steps": top_steps,
    }
