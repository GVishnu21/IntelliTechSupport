# Intelli TechSupport — Complete UI/UX Specification

You are a senior product designer and frontend engineer.

Build a polished, production-quality responsive web application called **Intelli TechSupport**.

The product helps customers troubleshoot internet/router problems using their phone camera. The user scans their router, the system identifies the router and LED states, provides step-by-step troubleshooting instructions, verifies whether each step worked, and either resolves the issue or escalates it to customer support.

## 1. Product Goal

The experience should feel:

* Simple
* Calm
* Trustworthy
* Fast
* Friendly
* Non-technical
* Mobile-first

The customer may be frustrated because their internet is not working. Do not overwhelm them with information.

The primary flow should be:

Home → Scan → Analyzing → Diagnosis → Troubleshooting → Verify → Success OR Escalation

Known outages should be detected before unnecessary troubleshooting.

---

# 2. Technology

Use:

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Lucide React icons

Do NOT use Next.js.

For now, create frontend mock data/services so the UI works without a backend.

Structure the application so API integration with FastAPI can be added later.

---

# 3. Design System

## Colors

Use a clean telecom/support visual language.

Background:
#F8FAFC

Primary:
#2563EB

Primary dark:
#1D4ED8

Success:
#16A34A

Warning:
#D97706

Error:
#DC2626

Text:
#0F172A

Secondary text:
#64748B

Border:
#E2E8F0

Card:
#FFFFFF

## Typography

Use Inter.

Headings should be bold but not oversized.

Example:

Page title:
28px / 32px

Section heading:
20px / 28px

Body:
16px / 24px

Small text:
14px / 20px

## UI

Use:

* 12–16px border radius
* Soft borders
* Very subtle shadows
* Large touch targets
* Generous spacing
* Clear primary buttons
* Accessible contrast

Avoid:

* Neon colors
* Excessive gradients
* Glassmorphism
* Excessive animations
* Huge illustrations
* Dark futuristic AI styling

---

# 4. Responsive Design

The application must be mobile-first.

Primary target:

390 × 844 mobile viewport.

Also support:

* 768px tablet
* 1024px desktop
* 1440px desktop

On mobile:

* Content should use almost the entire screen width.
* Buttons should be large.
* Bottom actions can be sticky.
* Camera UI should use the full available viewport.

On desktop:

* Center customer workflows inside a maximum-width container.
* Admin dashboard can use a wider layout.

---

# 5. Application Routes

Create these routes:

Customer:

/                 → Home

/scan              → Scan Router

/analyzing         → Analyzing

/diagnosis         → Diagnosis Result

/outage            → Outage Detected

/troubleshoot      → Troubleshooting Step

/verify            → Verify Step

/success           → Resolution Success

/escalate          → Contact Support

Admin:

/admin             → Dashboard

/admin/tickets     → Support Tickets

/admin/tickets/:id → Ticket Details

/admin/analytics   → Analytics

---

# 6. GLOBAL CUSTOMER NAVIGATION

Desktop:

Top navigation:

Intelli TechSupport

Home
My Issues
Help

Right side:

Profile icon

Mobile:

Top bar:

← / Intelli TechSupport / ⋮

Do not show a complicated navigation menu during troubleshooting.

During troubleshooting, focus the user entirely on the current action.

---

# 7. SCREEN 1 — HOME

Route:

/

Purpose:

Start the troubleshooting journey.

Layout:

Top:

Intelli TechSupport
Help icon

Hero section:

Small router/network illustration.

Headline:

"Is your internet not working?"

Subheading:

"Let's check your router and help you get back online."

Primary CTA:

"Scan My Router"

Secondary action:

"Select Router Manually"

Below:

"Already started troubleshooting?"

"Continue previous session"

Then a small help section:

"Need help?"

"View common internet issues"

The primary button must be visually dominant.

Do not add unnecessary cards.

---

# 8. SCREEN 2 — SCAN ROUTER

Route:

/scan

Purpose:

Allow the customer to capture their router.

Header:

← Scan Your Router

Title:

"Show us your router"

Description:

"Position your router inside the frame so we can clearly see the indicator lights."

Camera area:

Large camera preview.

Create a scanning frame overlay.

Inside the frame show a subtle router outline.

Below camera:

"Make sure the lights are clearly visible"

"Keep the router steady"

"Reduce glare if possible"

Controls:

Large circular capture button.

Secondary:

Upload Photo

After capture:

Show preview.

Buttons:

"Use This Photo"

"Retake"

Camera permission error state:

Title:

"Camera access is needed"

Description:

"Allow camera access to scan your router."

Button:

"Enable Camera"

Fallback:

"Upload a photo instead"

---

# 9. SCREEN 3 — ANALYZING

Route:

/analyzing

Purpose:

Show AI processing state.

Center the content vertically.

Icon/animation:

Router with scanning animation.

Headline:

"Analyzing your router"

Description:

"We're checking the equipment and indicator lights."

Progress:

1. Image received
2. Router detected
3. Checking indicator lights
4. Preparing diagnosis

Use subtle animation.

Do not show technical AI terminology.

After a short mock delay, navigate to /diagnosis.

---

# 10. SCREEN 4 — DIAGNOSIS

Route:

/diagnosis

Purpose:

Show what the system detected.

Header:

← Diagnosis

Title:

"Here's what we found"

Router card:

Router image

Manufacturer:

"Nokia"

Model:

"G-2425G"

Detection confidence:

"High confidence"

LED section:

"Indicator Lights"

Create reusable LED status components.

Example:

Power
Green
Normal

Internet
Red
Problem

Wi-Fi
Green
Normal

LOS
Red
Blinking

Use semantic visual indicators.

Green = normal

Red = problem

Amber = attention

Gray = off/unknown

Diagnosis card:

"Possible issue"

"Fiber signal may be unavailable."

Supporting text:

"We'll guide you through a few quick checks."

Primary CTA:

"Start Troubleshooting"

Secondary:

"Not your router?"

"Select router manually"

Important:

Do not expose raw AI confidence numbers.

---

# 11. SCREEN 5 — OUTAGE

Route:

/outage

This screen is conditional.

Only show it when a known service outage exists.

Header:

Service Status

Icon:

Warning / network icon

Title:

"There's an outage in your area"

Description:

"We've detected a known service issue affecting your area."

Outage card:

"Service interruption"

"Estimated restoration"

"4:30 PM"

Location:

"Your area"

Main message:

"You don't need to troubleshoot your router right now."

Primary button:

"View Outage Details"

Secondary:

"Try Troubleshooting Anyway"

Keep this screen reassuring.

---

# 12. SCREEN 6 — TROUBLESHOOTING

Route:

/troubleshoot

This is the most important customer screen.

Header:

← Troubleshooting

Top progress:

Step 2 of 4

Progress bar.

Title:

"Check the fiber cable"

Description:

"Make sure the fiber cable is securely connected to the router."

Instruction illustration:

Create a simple diagram showing the correct cable connection.

Checklist:

✓ Cable is connected to the correct port

✓ Cable is firmly connected

Important note:

"Don't bend the fiber cable sharply."

Bottom sticky action:

"I've done this"

Secondary:

"Skip this step"

Only show ONE troubleshooting action at a time.

Never show all troubleshooting instructions on one screen.

---

# 13. SCREEN 7 — VERIFY

Route:

/verify

Purpose:

Check whether the previous step worked.

Header:

Step complete?

Title:

"Did this fix your internet?"

Description:

"Check your router lights and connection."

Primary button:

"Yes, it's fixed"

Secondary button:

"No, still not working"

Optional:

"Not sure"

If yes:

Navigate to /success.

If no:

Continue to next troubleshooting step.

If all steps fail:

Navigate to /escalate.

---

# 14. SCREEN 8 — SUCCESS

Route:

/success

Purpose:

Celebrate successful resolution.

Large success icon.

Title:

"You're back online!"

Description:

"Your internet connection is working again."

Summary card:

Issue:

Fiber signal problem

Steps completed:

3

Time:

4 min

Primary:

"Finish"

Then:

"How was your experience?"

5-star rating.

Optional feedback field:

"What could we improve?"

Keep the page positive but not overly celebratory.

---

# 15. SCREEN 9 — ESCALATION

Route:

/escalate

Purpose:

Move unresolved cases to customer support.

Icon:

Support agent/headset.

Title:

"We couldn't fix it"

Description:

"Don't worry. We've saved your diagnosis so you don't need to repeat the steps."

Diagnosis summary card:

Issue:

Fiber signal problem

Router:

Nokia G-2425G

LED:

LOS — Red blinking

Steps attempted:

✓ Restart router

✓ Check fiber cable

✓ Wait 2 minutes

Status:

Still unresolved

Primary button:

"Contact Support"

Secondary:

"Start Over"

When Contact Support is clicked:

Show success confirmation:

"Your support request has been created."

"Ticket #TS-1024"

"An agent has your diagnosis and troubleshooting history."

---

# 16. SCREEN 10 — ADMIN DASHBOARD

Route:

/admin

This is a desktop-first support operations dashboard.

Layout:

Left sidebar:

Intelli TechSupport

Dashboard

Support Tickets

Routers

Analytics

Settings

Main area:

Header:

"Overview"

Date filter.

Metric cards:

Total Scans
1,248

Resolution Rate
72%

Escalation Rate
18%

Average Resolution Time
4m 32s

Charts:

1. Resolution rate over time
2. Common issues
3. Most scanned router models
4. Escalation trend

Common issues:

LOS / Fiber signal

Internet disconnected

Wi-Fi disabled

Power issue

Use clean charts.

---

# 17. SCREEN 11 — SUPPORT TICKETS

Route:

/admin/tickets

Create a support ticket table.

Columns:

Ticket

Customer

Issue

Router

Status

Created

Example:

TS-1024
Customer #1024
Fiber signal
Nokia G-2425G
Open
2 min ago

Status badges:

Open

In Progress

Resolved

Escalated

Add:

Search

Filter

Status filter

Issue filter

Clicking a ticket navigates to:

/admin/tickets/:id

---

# 18. SCREEN 12 — TICKET DETAILS

Route:

/admin/tickets/:id

Header:

Ticket #TS-1024

Status:

Open

Customer information.

Router information.

Router image.

AI diagnosis.

LED status:

Power — Green

Internet — Off

Wi-Fi — Green

LOS — Red blinking

Troubleshooting history:

1. Restart router — Completed
2. Check fiber cable — Completed
3. Wait 2 minutes — Failed

AI diagnosis:

"Possible fiber signal loss."

Agent actions:

"Contact Customer"

"Mark Resolved"

"Escalate to Network Team"

The agent should be able to understand the problem without asking the customer to repeat the troubleshooting process.

---

# 19. SCREEN 13 — ANALYTICS

Route:

/admin/analytics

Show:

Resolution Rate

Escalation Rate

Average Resolution Time

First Contact Resolution

Repeat Contact Rate

CSAT

Charts:

Resolution trend

Escalation trend

Common router problems

Most common LED patterns

Most successful troubleshooting steps

Use date filters:

7 days

30 days

90 days

Custom

---

# 20. REUSABLE COMPONENTS

Create these components:

Button

SecondaryButton

Header

MobileHeader

Card

StatusBadge

LedStatus

LedStatusList

ProgressBar

StepIndicator

CameraFrame

RouterImage

DiagnosisCard

TroubleshootingCard

VerificationButtons

OutageCard

TicketCard

MetricCard

ChartCard

Sidebar

EmptyState

LoadingState

ErrorState

Toast

Modal

StarRating

---

# 21. IMPORTANT STATES

Every important screen should have:

Loading state

Error state

Empty state

Success state

Example diagnosis loading:

"Analyzing your router..."

Camera error:

"We couldn't access your camera."

AI failure:

"We couldn't identify the router."

Show:

"Try another photo"

"Select router manually"

Network error:

"We're having trouble connecting."

Button:

"Try Again"

---

# 22. MANUAL ROUTER SELECTION

The user must have a fallback if AI cannot identify the router.

Create a modal/page:

Title:

"Select your router"

Search:

"Search router model"

Filters:

Provider

Brand

Model

Example cards:

Airtel

Jio

ACT

Nokia

Huawei

TP-Link

When selected:

Return to Diagnosis.

---

# 23. MOBILE BOTTOM ACTIONS

For customer troubleshooting pages:

Keep the primary CTA near the bottom.

Example:

┌──────────────────────────────┐
│                              │
│        Troubleshooting       │
│                              │
│        Step content          │
│                              │
│                              │
├──────────────────────────────┤
│ [       I've done this     ] │
│                              │
│          Skip step           │
└──────────────────────────────┘

This makes the application easy to operate with one hand.

---

# 24. ACCESSIBILITY

Implement:

* Keyboard navigation
* Focus states
* ARIA labels
* Minimum 44px touch targets
* Accessible color contrast
* Do not rely only on color to communicate LED status
* Add text labels beside colors
* Screen-reader-friendly buttons

Example:

Do NOT show only:

🔴

Show:

🔴 Red — Problem

---

# 25. ANIMATION

Use subtle animations only.

Good:

* Button hover
* Progress animation
* Camera scanning line
* Page transitions
* Success check animation
* Skeleton loading

Avoid:

* Excessive bouncing
* Large particle effects
* Constant animations
* Long loading animations

The app should feel fast.

---

# 26. MOCK DATA

Create:

src/data/mockData.ts

Include:

router diagnosis

LED states

troubleshooting steps

outage

support tickets

analytics

Example diagnosis:

{
router: "Nokia",
model: "G-2425G",
confidence: "high",
issue: "Fiber signal problem",
lights: [
{
name: "Power",
color: "green",
state: "solid",
status: "normal"
},
{
name: "Internet",
color: "red",
state: "off",
status: "problem"
},
{
name: "Wi-Fi",
color: "green",
state: "solid",
status: "normal"
},
{
name: "LOS",
color: "red",
state: "blinking",
status: "problem"
}
]
}

---

# 27. FRONTEND ARCHITECTURE

Use:

src/

components/

pages/

layouts/

data/

services/

hooks/

types/

utils/

assets/

Example:

src/
├── components/
│   ├── ui/
│   ├── diagnosis/
│   ├── troubleshooting/
│   ├── camera/
│   └── admin/
│
├── pages/
│   ├── Home.tsx
│   ├── Scan.tsx
│   ├── Analyzing.tsx
│   ├── Diagnosis.tsx
│   ├── Outage.tsx
│   ├── Troubleshoot.tsx
│   ├── Verify.tsx
│   ├── Success.tsx
│   ├── Escalate.tsx
│   └── admin/
│
├── services/
│   └── api.ts
│
├── data/
│   └── mockData.ts
│
├── types/
│   └── index.ts
│
└── App.tsx

---

# 28. ROUTER FLOW

Implement the following navigation:

Home
→ Scan

Scan
→ Analyzing

Analyzing
→ Diagnosis

Diagnosis
→ Outage OR Troubleshoot

Troubleshoot
→ Verify

Verify YES
→ Success

Verify NO
→ Troubleshoot next step

All troubleshooting failed
→ Escalate

Escalate
→ Support confirmation

Admin:

Dashboard
→ Tickets
→ Ticket Details

Dashboard
→ Analytics

---

# 29. API-READY ARCHITECTURE

Do not put API calls directly inside UI components.

Create:

src/services/api.ts

Functions:

analyzeRouter()

getTroubleshootingSteps()

verifyStep()

checkOutage()

createSupportTicket()

getTickets()

getTicket()

getAnalytics()

Initially these should return mock data.

Later replace the implementation with FastAPI requests.

---

# 30. FINAL DESIGN PRINCIPLE

The most important UX rule is:

ONE SCREEN = ONE DECISION.

The customer should always know:

1. What happened?
2. What should I do?
3. What should I click next?

Do not make the customer understand networking terminology.

Instead of:

"Optical Network Terminal LOS state indicates upstream PON synchronization failure."

Say:

"We're not receiving a fiber signal."

Instead of:

"Perform a WAN interface reset."

Say:

"Restart your router."

The application should feel like a helpful support person guiding the customer through the problem.

Build the UI polished enough for a real product demo, not like a basic CRUD dashboard.

---

# Addendum — Reconciling the spec with the existing real backend

This project already has a working FastAPI backend (`backend/app`) with a **real** Gemini-vision-based
router/LED reader wired to two endpoints: `POST /diagnose` and `POST /verify-step`, plus a stub
`POST /escalate`. Per the project owner's instruction ("if there is real data let it be"), the frontend
build implementing this spec must:

- Wire `analyzeRouter()` in `src/services/api.ts` to the real `/api/diagnose` endpoint (camera capture →
  real Gemini equipment/LED reading), not mock data.
- Wire step verification and escalation to the real `/api/verify-step` and `/api/escalate` endpoints
  where a session exists.
- Fall back to frontend mock data only for the parts of this spec with no backend support yet: outage
  detection, the manual router-selection catalog (section 22), and the entire admin surface (sections
  16–19: dashboard metrics, tickets, ticket details, analytics) — none of which the backend persists or
  serves today.
- Because the real backend's confidence score is a raw float and its LED reading is a flat
  `{light_name: "solid_green" | "blinking_amber" | "blinking_red" | "solid_red" | "off"}` map (not the
  richer per-light `{color, state, status}` shape sketched in section 26's example), the API service
  layer is responsible for translating the real backend response into this spec's richer frontend types —
  see the Foundation plan's `src/services/api.ts` task for the exact mapping.
