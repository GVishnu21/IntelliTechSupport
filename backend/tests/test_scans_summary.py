"""Unit tests for the pure aggregation math behind GET /analytics/summary.

These exercise app.db._summarize_scans() directly against plain dicts/lists,
the same shapes psycopg's dict_row would hand back -- no live Postgres
connection involved.
"""

from app.db import _summarize_scans


def test_no_scans_returns_all_zero_and_empty():
    totals = {
        "total_scans": 0,
        "resolved_count": 0,
        "escalated_count": 0,
        "first_contact_count": 0,
        "avg_resolution_seconds": None,
        "avg_rating": None,
    }

    result = _summarize_scans(totals, trend_rows=[], step_rows=[])

    assert result == {
        "total_scans": 0,
        "resolution_rate": 0.0,
        "escalation_rate": 0.0,
        "first_contact_resolution": 0.0,
        "avg_resolution_time_seconds": None,
        "csat": None,
        "resolution_trend": [],
        "escalation_trend": [],
        "top_troubleshooting_steps": [],
    }


def test_resolution_and_escalation_rates_are_computed_from_concluded_only():
    # 3 resolved, 1 escalated, 2 still in_progress/unrecognized -- rates must
    # divide by concluded (4), not total_scans (6).
    totals = {
        "total_scans": 6,
        "resolved_count": 3,
        "escalated_count": 1,
        "first_contact_count": 1,
        "avg_resolution_seconds": 125.4,
        "avg_rating": 4.5,
    }

    result = _summarize_scans(totals, trend_rows=[], step_rows=[])

    assert result["total_scans"] == 6
    assert result["resolution_rate"] == 0.75
    assert result["escalation_rate"] == 0.25
    assert result["first_contact_resolution"] == 1 / 3
    assert result["avg_resolution_time_seconds"] == 125.4
    assert result["csat"] == 4.5


def test_first_contact_resolution_is_zero_when_nothing_resolved():
    totals = {
        "total_scans": 2,
        "resolved_count": 0,
        "escalated_count": 2,
        "first_contact_count": 0,
        "avg_resolution_seconds": None,
        "avg_rating": None,
    }

    result = _summarize_scans(totals, trend_rows=[], step_rows=[])

    assert result["first_contact_resolution"] == 0.0
    assert result["resolution_rate"] == 0.0
    assert result["escalation_rate"] == 1.0


def test_trend_rows_skip_days_with_no_concluded_scans():
    totals = {
        "total_scans": 3,
        "resolved_count": 2,
        "escalated_count": 1,
        "first_contact_count": 2,
        "avg_resolution_seconds": 60.0,
        "avg_rating": None,
    }
    trend_rows = [
        {"day": "2026-09-01", "resolved": 2, "escalated": 0},
        {"day": "2026-09-02", "resolved": 0, "escalated": 0},  # must be skipped
        {"day": "2026-09-03", "resolved": 0, "escalated": 1},
    ]

    result = _summarize_scans(totals, trend_rows, step_rows=[])

    assert result["resolution_trend"] == [
        {"date": "2026-09-01", "value": 1.0},
        {"date": "2026-09-03", "value": 0.0},
    ]
    assert result["escalation_trend"] == [
        {"date": "2026-09-01", "value": 0.0},
        {"date": "2026-09-03", "value": 1.0},
    ]


def test_top_steps_only_counts_completed_last_history_entry():
    step_rows = [
        {"history": [{"step": "Restart the router", "outcome": "completed"}]},
        {"history": [{"step": "Restart the router", "outcome": "completed"}]},
        {"history": [{"step": "Check the cable", "outcome": "completed"}]},
        # Last entry "failed" (a step that was retried and later resolved via
        # a different final step) must not count toward that failed step.
        {
            "history": [
                {"step": "Reset Wi-Fi", "outcome": "failed"},
                {"step": "Restart the router", "outcome": "completed"},
            ]
        },
        {"history": []},  # empty history must be skipped without crashing
    ]
    totals = {
        "total_scans": 5,
        "resolved_count": 4,
        "escalated_count": 0,
        "first_contact_count": 2,
        "avg_resolution_seconds": 90.0,
        "avg_rating": None,
    }

    result = _summarize_scans(totals, trend_rows=[], step_rows=step_rows)

    assert result["top_troubleshooting_steps"] == [
        {"label": "Restart the router", "count": 3},
        {"label": "Check the cable", "count": 1},
    ]


def test_csat_is_none_when_no_ratings_exist():
    totals = {
        "total_scans": 1,
        "resolved_count": 1,
        "escalated_count": 0,
        "first_contact_count": 1,
        "avg_resolution_seconds": 30.0,
        "avg_rating": None,
    }

    result = _summarize_scans(totals, trend_rows=[], step_rows=[])

    assert result["csat"] is None
