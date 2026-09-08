import base64
import json
import re
import time

from google import genai
from google.genai import errors, types

from app.config import GEMINI_API_KEY, GEMINI_MODEL
from app.orchestration.playbooks import EQUIPMENT_CATALOG
from app.vision.base import VisionEngine, VisionReading

_NAMED_SKUS = {
    name: spec for name, spec in EQUIPMENT_CATALOG.items() if name != "Generic Router/Modem"
}
_CATALOG_DESCRIPTION = "\n".join(
    f"- {name}: lights are {', '.join(spec['lights'])}" for name, spec in _NAMED_SKUS.items()
)

_PROMPT = f"""You are reading a photo of home internet equipment (modem/router) to help a
customer troubleshoot a connectivity problem.

Equipment this operator has specific playbooks for:
{_CATALOG_DESCRIPTION}

Rules for the "equipment" field:
- If the photo clearly matches one of the named models above, use that exact name.
- If the photo shows some OTHER modem/router/gateway with visible status lights,
  but it doesn't match a named model, use "Generic Router/Modem" — don't refuse
  just because the exact brand/model isn't in the list above.
- Only use "unknown" if the photo doesn't show networking equipment at all, or is
  too unclear to read any lights (e.g. blurry, wrong object, no visible lights).

Rules for the "status_lights" field:
- For a named model, use that model's own light names (as listed above).
- For "Generic Router/Modem", report EVERY individual status light you can
  distinguish on the device — don't collapse them into one. Use these
  normalized keys where they apply: "power" (power/on light), "wifi"
  (Wi-Fi/wireless light, combine 2.4GHz+5GHz into one entry if both are
  present), "internet" (the light for internet/WAN/online connectivity —
  look for labels like "Internet", "Online", "WAN", or a globe icon), "lan"
  (wired LAN/Ethernet port lights, combined into one entry if there are
  several), "security" (WPS/security/lock icon). Use "other" for any other
  clearly visible light that doesn't fit those categories. Always include
  "internet" — if the device has no light specifically labeled for internet
  status, use whichever single light best represents overall connectivity.
  Use one of: "solid_green", "blinking_amber", "blinking_red", "solid_red",
  "off" for each value.

Respond with ONLY a JSON object, no markdown fences, in exactly this shape:
{{"equipment": "<name, Generic Router/Modem, or unknown>", "confidence": <0.0-1.0>, "status_lights": {{"<light>": "<state>"}}}}
"""

_JSON_FENCE = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


class GeminiVisionEngine(VisionEngine):
    def __init__(self) -> None:
        self._client = genai.Client(api_key=GEMINI_API_KEY)

    def _call_with_retry(self, image_bytes: bytes):
        # Gemini's 503 "high demand" is explicitly documented as transient —
        # a couple of short retries clears most of them without making the
        # customer wait through a full failed diagnosis + manual fallback.
        attempts = 3
        for attempt in range(1, attempts + 1):
            try:
                return self._client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                        _PROMPT,
                    ],
                )
            except errors.ServerError as exc:
                if attempt == attempts:
                    raise
                wait = 1.5 * attempt
                print(f"[gemini] {exc} — retrying in {wait}s (attempt {attempt}/{attempts})")
                time.sleep(wait)

    def interpret(self, image_base64: str, session_id: str | None = None) -> VisionReading:
        # session_id is part of the shared VisionEngine interface (the mock
        # adapter needs it to avoid cross-session state) but real vision is
        # genuinely stateless per photo, so it's unused here.
        # Fail safely end to end: a bad frame, a Gemini-side rejection, or an
        # unparseable response should degrade to "unknown, low confidence" —
        # never a crash, and never a guessed diagnosis (PRD UX principle).
        try:
            image_bytes = base64.b64decode(image_base64)
            response = self._call_with_retry(image_bytes)
            raw_text = (response.text or "").strip()

            print("=" * 60)
            print("[gemini] raw response.text:")
            print(raw_text if raw_text else "(empty)")
            if not raw_text and response.candidates:
                # Empty text usually means the response was blocked/truncated —
                # this shows why (e.g. finish_reason SAFETY, MAX_TOKENS, etc.).
                candidate = response.candidates[0]
                print(f"[gemini] finish_reason: {candidate.finish_reason}")
                print(f"[gemini] safety_ratings: {candidate.safety_ratings}")
            print(f"[gemini] usage: {response.usage_metadata}")
            print("=" * 60)
        except Exception as exc:
            print(f"[vision] Gemini call failed: {exc}")
            return VisionReading(equipment="unknown", confidence=0.0, status_lights={})

        cleaned = _JSON_FENCE.sub("", raw_text).strip()

        try:
            parsed = json.loads(cleaned)
            return VisionReading(
                equipment=parsed.get("equipment", "unknown"),
                confidence=float(parsed.get("confidence", 0.0)),
                status_lights=parsed.get("status_lights", {}),
            )
        except (json.JSONDecodeError, ValueError, TypeError):
            # Fail safely: never guess a diagnosis from an unparseable response.
            print(f"[vision] could not parse Gemini response as JSON: {raw_text!r}")
            return VisionReading(equipment="unknown", confidence=0.0, status_lights={})
