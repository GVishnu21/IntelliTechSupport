# Phase-1 equipment catalog: two SKUs is enough to demonstrate the full
# diagnose -> guided fix -> verify loop end to end (IT-1 through IT-5).
# Real deployments would load this from an operator-supplied catalog (PRD
# section 11) instead of hardcoding it.

HEALTHY_STATE = "solid_green"

EQUIPMENT_CATALOG: dict[str, dict] = {
    "Arris SB8200": {
        "lights": ["power", "downstream", "online"],
        "fault_light": "online",
        "steps": [
            "Unplug the modem's power cable, wait 10 seconds, then plug it back in.",
            "Check that the coax cable is firmly connected to the modem and the wall outlet.",
            "Restart your router as well, then wait two minutes.",
        ],
    },
    "Netgear Nighthawk R7000": {
        "lights": ["power", "internet", "wifi"],
        "fault_light": "internet",
        "steps": [
            "Unplug the router's power cable, wait 10 seconds, then plug it back in.",
            "Check that the Ethernet cable between the router and modem is firmly connected.",
            "Press and hold the Wi-Fi reset button on the back of the router for 5 seconds.",
        ],
    },
    # Catch-all for any router/modem that isn't one of the two named SKUs
    # above. The vision prompt is instructed to normalize whatever the
    # device's own internet/online light is called into a single "internet"
    # key, so this playbook works regardless of brand. Keeps the demo usable
    # against real hardware instead of only the two hardcoded models.
    "Generic Router/Modem": {
        "lights": ["internet"],
        "fault_light": "internet",
        "steps": [
            "Unplug the device's power cable, wait 10 seconds, then plug it back in.",
            "Check that all cables (power, coax/Ethernet) are firmly connected at both ends.",
            "If it has a separate router, restart that too, then wait two minutes.",
        ],
    },
}
