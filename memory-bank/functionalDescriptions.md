# Hockey Hub – Functional Descriptions (Summary)

This file provides a condensed reference of the full **development/hockey-app-functional-descriptions.md** document.  It captures key functions, integrations, and technical concerns to aid future development decisions.

---

## Key Platform Modules & Purpose

| Module | Service | Core Purpose |
|--------|---------|--------------|
| Calendar | calendar-service | Central hub for all scheduling & resource booking |
| Physical Training | training-service | Planning, execution & follow‑up of physical training |
| Medical/Rehab | medical-service | Injury management and rehabilitation workflows |
| AI Assist | integrated | Auto‑generate training & rehab programmes |
| Communication | communication-service | Real‑time chat, notifications, file sharing |
| Test Module | training-service | Structuring & analysing physical tests |
| Analysis | statistics-service | Data collection, processing, visualisation |
| Automated Data | statistics-service | Import external game & wearable data |
| Planning | planning-service | Season, team & individual development planning |
| Administration | admin-service | System monitoring, org onboarding, translation mgmt |
| Payment | payment-service | Subscriptions, invoicing & payment processing |

---

## Calendar Highlights
* Event types: Ice training, Physical, Game, Meeting, Medical, Travel, Other (colour‑coded).
* Views: Month, Week, Day.  Navigation helpers & filters (team, location, type, resource).
* Advanced resource booking with conflict detection.
* Integrations: training‑service, medical‑service, user‑service, communication‑service.

## Physical Training Highlights
* Session templates & categories with flexible JSONB structure.
* Exercise library with multimedia.
* Data‑driven intensity via test results.
* Live session execution (timer, real‑time HR/watts, dynamic intervals).
* Integrations: calendar, statistics, user, communication.

## Medical / Rehab Highlights
* Injury registration, treatment plans, progress logging.
* Availability status management (5 levels).
* Medical journal with heightened security.
* Reporting & trend analysis.

## AI‑Assist Highlights
* Generates physical training programmes and rehab plans based on player data.
* Output stored as templates; editable & re‑usable.

## Communication Highlights
* Private & group chats with read receipts, media sharing, notifications.
* File storage & thumbnail generation.

## Test Module Highlights
* Test definitions, batches, results & norms.
* Analysis views and integration with training intensity.

## Analysis Highlights
* Player & team statistics dashboards.
* Predictive models & custom formulas.

## Planning Highlights
* Season framework, periodisation, team & player goals, development plans.

## Administration Highlights
* System monitoring, organization management, translation management.

## Payment Highlights
* Subscription plans, invoicing, payment processing, refunds.

---

## Cross‑Service Integrations (quick view)
* calendar-service receives events from training‑service & medical‑service.
* training‑service pulls test results from statistics‑service.
* communication-service sends notifications for calendar & medical events.
* statistics-service aggregates data from training‑service & medical‑service.

---

## Technical Implementation Patterns
* REST endpoints per service (ports 3003–3009 as per workflow.mdc).
* WebSockets for real‑time features (chat, live metrics, interval timers).
* PostgreSQL schemas with JSONB for flexible structures.
* Strict RBAC enforced at gateway, service & RLS levels.

---

Use this summary as a quick reminder of the functional scope.  For full details, consult the original markdown in `development/`. 