# Phase-1 equipment catalog: two SKUs is enough to demonstrate the full
# diagnose -> guided fix -> verify loop end to end (IT-1 through IT-5).
# Real deployments would load this from an operator-supplied catalog (PRD
# section 11) instead of hardcoding it.

HEALTHY_STATE = "solid_green"

# Each step is {"instruction": str, "checklist": list[str], "note": str | None}.
# checklist/note are optional per-step detail shown alongside the instruction
# on the Troubleshooting screen; "note" is omitted (not included in the dict)
# when a step has nothing extra to call out.

EQUIPMENT_CATALOG: dict[str, dict] = {
    "Arris SB8200": {
        "lights": ["power", "downstream", "online"],
        "fault_light": "online",
        "steps": [
            {
                "instruction": "Unplug the modem's power cable, wait 10 seconds, then plug it back in.",
                "checklist": [
                    "Power cable is unplugged for at least 10 seconds",
                    "Power light turns solid after reconnecting",
                ],
            },
            {
                "instruction": "Check that the coax cable is firmly connected to the modem and the wall outlet.",
                "checklist": [
                    "Coax cable is connected to the correct port",
                    "Coax connector is screwed on tightly, not just pushed in",
                ],
                "note": "Don't overtighten the connector -- hand-tight is enough.",
            },
            {
                "instruction": "Restart your router as well, then wait two minutes.",
                "checklist": [
                    "Router power cable is unplugged for 10 seconds",
                    "Waited at least two minutes after reconnecting",
                ],
            },
        ],
    },
    "Netgear Nighthawk R7000": {
        "lights": ["power", "internet", "wifi"],
        "fault_light": "internet",
        "steps": [
            {
                "instruction": "Unplug the router's power cable, wait 10 seconds, then plug it back in.",
                "checklist": [
                    "Power cable is unplugged for at least 10 seconds",
                    "Power light turns solid after reconnecting",
                ],
            },
            {
                "instruction": "Check that the Ethernet cable between the router and modem is firmly connected.",
                "checklist": [
                    "Cable is connected to the correct WAN/Internet port",
                    "Cable is firmly connected on both ends",
                ],
                "note": "A loose Ethernet cable often looks connected but isn't fully clicked in.",
            },
            {
                "instruction": "Press and hold the Wi-Fi reset button on the back of the router for 5 seconds.",
                "checklist": [
                    "Held the button for the full 5 seconds",
                    "Wi-Fi light blinks to confirm the reset",
                ],
            },
        ],
    },
    "TP-Link Archer C6": {
        "lights": ["power", "wifi", "internet"],
        "fault_light": "internet",
        "steps": [
            {
                "instruction": "Unplug the router's power cable, wait 10 seconds, then plug it back in.",
                "checklist": [
                    "Power cable is unplugged for at least 10 seconds",
                    "Power light turns solid after reconnecting",
                ],
            },
            {
                "instruction": "Check that the cable from your modem/ONT is firmly connected to the router's blue Internet/WAN port.",
                "checklist": [
                    "Cable is connected to the correct port",
                    "Cable is firmly connected",
                ],
                "note": "Don't bend the fiber cable sharply if your ONT uses one.",
            },
            {
                "instruction": "Restart your modem or ONT as well, then wait two minutes.",
                "checklist": [
                    "Modem/ONT power cable is unplugged for 10 seconds",
                    "Waited at least two minutes after reconnecting",
                ],
            },
        ],
    },
    # Catch-all for any router/modem that isn't one of the named SKUs above.
    # The vision prompt is instructed to normalize whatever the device's own
    # internet/online light is called into a single "internet" key, so this
    # playbook works regardless of brand. Keeps the demo usable against real
    # hardware instead of only the hardcoded models.
    "Generic Router/Modem": {
        "lights": ["internet"],
        "fault_light": "internet",
        "steps": [
            {
                "instruction": "Unplug the device's power cable, wait 10 seconds, then plug it back in.",
                "checklist": [
                    "Power cable is unplugged for at least 10 seconds",
                    "Device powers back on normally",
                ],
            },
            {
                "instruction": "Check that all cables (power, coax/Ethernet) are firmly connected at both ends.",
                "checklist": [
                    "Cables are connected to the correct ports",
                    "Cables are firmly connected at both ends",
                ],
                "note": "Don't force a connector -- it should click or screw in smoothly.",
            },
            {
                "instruction": "If it has a separate router, restart that too, then wait two minutes.",
                "checklist": [
                    "Router power cable is unplugged for 10 seconds",
                    "Waited at least two minutes after reconnecting",
                ],
            },
        ],
    },
}
