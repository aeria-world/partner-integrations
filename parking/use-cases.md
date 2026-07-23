# Aeria Parking — Partner Integration Capabilities & Flows

**A common reference for parking hardware / parking management partners integrating with the Aeria platform**

| | |
|---|---|
| Version | 0.1 (Draft) |
| Date | 23 July 2026 |
| Prepared by | Aeria |
| Audience | Any parking infrastructure partner (gates, LPR, pay stations, valet operators) and site stakeholders |
| Scope | Partner-agnostic and site-agnostic. Engagement-specific scope, phasing, and commercials live in a separate per-partner document. |

---

## 1. Purpose

This document describes the parking capabilities of the Aeria platform and the **integration flows and steps** a partner system participates in to deliver them. It is the justification for Aeria's integration ask: every step exists because one or more capabilities need it, and every capability maps to the steps that realize it (§5).

It deliberately describes **flows and steps, not APIs**. Aeria publishes a reference API contract implementing this step model — per-step coverage is tabulated in §6 — but the step, with its trigger, semantics, and data, is the requirement. A partner that supports a step in its own request/response format is fully acceptable: Aeria maintains an adapter layer that translates between the canonical steps and partner-native interfaces, a model already in production across Aeria's access-control integrations with multiple hardware vendors.

## 2. Integration model

**Aeria decides, the partner operates.** Aeria is the system of record for users, tenants, vehicles, entitlements, bookings, tariffs, and payments made in-app; it performs authorization decisions and price calculation. The partner operates the physical infrastructure — barriers, lanes, plate capture, pay stations — executes gate decisions, and collects payments at the gate.

For every vehicle movement the partner either:

- **asks Aeria in real time** whether to admit/release a vehicle (online authorization, flow F3), or
- **decides locally** from data Aeria has synchronized to it in advance (entitlements F1, bookings F2) — which keeps gates operational when connectivity to Aeria is degraded —

and in both cases **confirms the actual movement back to Aeria** (flow F4) so billing, reconciliation, and analytics are complete.

**Site scoping.** One integration is established once between Aeria and the partner. Each deployed site runs as a separate, configuration-scoped integration instance (own credentials, own gate topology, own categories and tariffs). Scaling from one site to many is a matter of provisioning instances and configuration — not re-integration.

## 3. Capability catalogue

Which capabilities are activated for a given partner or site is an engagement decision; how far the published reference contract covers each integration step is tabulated in §6.

### A. Employee & tenant parking

| # | Capability |
|---|---|
| C1 | Employee vehicle registration and self-service management (plates, vehicle type, FASTag) via the tenant app |
| C2 | Fixed parking: tenant admins allocate reserved bays to specific employees |
| C3 | Flexi parking: quota-based tenant parking on first-come-first-served, enforced per tenant |
| C4 | Paid employee parking (employee-paid daily/period parking) |

### B. Visitor parking

| # | Capability |
|---|---|
| C5 | Pay-per-use visitor parking with category-based admission and central tariffs |
| C6 | Visitor pre-booking / prepaid reservation with extension and renewal |
| C7 | Priority / VIP visitor parking — pre-approved plates, or tenant-covered charges applied after entry |
| C8 | Walk-in visitor management via the support app |

### C. Operations & revenue

| # | Capability |
|---|---|
| C9 | Real-time occupancy and category-wise availability (drives entry displays and admission decisions) |
| C10 | Central fare computation: tariff plans, overtime/interval pricing, premium days and slots |
| C11 | Unified revenue reconciliation across gate collections (cash/card/UPI/FASTag), in-app prepayments, and tenant-covered charges, attributed gate-wise |
| C12 | Movement audit and analytics from complete entry/exit logs |
| C13 | Offline-tolerant gate operation with post-hoc synchronization (degradation envelope: §7) |
| C14 | Manual / exception settlement for inconsistent sessions |

### D. Extended services

| # | Capability |
|---|---|
| C15 | Valet parking: check-in, status tracking, app-initiated vehicle retrieval |
| C16 | Multi-entry parking passes with validity windows and purchase limits |
| C17 | Company cab / fleet entry-exit management with time-window penalty enforcement |

## 4. Integration flows and steps

Each step states its direction, trigger, and the **semantic data** exchanged. Field naming and transport are execution-format concerns (§6); the semantics below are the requirement. All steps are per-site-instance scoped and must be authenticated (§7).

### F1 — Entitlement synchronization *(Aeria → Partner)*

| Step | Trigger | Data | Expectations |
|---|---|---|---|
| **S1 Grant/update entitlement** | Vehicle registered or parking allocated/changed in Aeria | User reference; allowed plate(s); vehicle type; validity window; entitlement kind — reserved (with bay identity) or flexi (with eligible category set) | Upsert semantics: re-push for the same user updates plates and entitlement attributes |
| **S2 Revoke entitlement** | Allocation removed / employee offboarded | User reference | Access removed for all associated plates |

### F2 — Booking synchronization *(Aeria → Partner)*

| Step | Trigger | Data | Expectations |
|---|---|---|---|
| **S3 Create booking** | Prepaid reservation confirmed in Aeria | Booking reference; plate(s); vehicle type; validity window; bay or category | Plate honored like a whitelist entry for the window |
| **S4 Update booking** | Extension / renewal purchased before expiry | Booking reference; updated window | No re-entry required; new window effective immediately |
| **S5 Cancel booking** | Reservation cancelled | Booking reference | Access for the window revoked |

### F3 — Gate authorization *(Partner → Aeria)*

| Step | Trigger | Data | Expectations |
|---|---|---|---|
| **S6 Entry authorization** | Vehicle at entry lane (plate captured) | In: plate, vehicle type, gate identity. Out: admit/deny; assigned bay and category; amount to collect at entry (0 = open free); validity of the bay hold | Aeria resolves entitlement → booking → available capacity; duplicate requests replay the same decision |
| **S7 Exit authorization** | Vehicle at exit lane | In: plate, gate identity. Out: fare breakdown — total fare, amount already collected, balance due; grace validity to reach the barrier | Duplicate requests replay the same result |
| **S8 Availability query** | Entry display refresh / admission pre-check | Out: per-category totals and available counts by vehicle type; default visitor category | Read-only, freely repeatable |

### F4 — Movement & collection reporting *(Partner → Aeria, plus Aeria-initiated pull)*

| Step | Trigger | Data | Expectations |
|---|---|---|---|
| **S9 Movement report** | Every physical entry/exit (singly or batched) | Movement type (entry/exit); plate; timestamp; gate identity; category; collection made at the gate — amount **and** method (cash / card / UPI / FASTag / other) | **Idempotent and batchable**; must cover movements decided locally while offline; gate identity mandatory for revenue attribution |
| **S10 Movement retrieval** | Aeria audit / gap detection | In: time range. Out: the partner's raw movement (and, where used for financial reconciliation, collection) records for the range | **Conditional, transport-neutral** (pull API or scheduled export): required where completeness of the S9 push path cannot be established; otherwise an audit enhancement |

### F5 — In-session adjustment *(Aeria-internal; optional sync)*

| Step | Trigger | Data | Expectations |
|---|---|---|---|
| **S11 Session validation** *(optional sync)* | Tenant covers or discounts a visitor's parking **after entry** | — (no partner exchange in the standard model); optional sync: plate + validity | **No partner interface is required in the deep model.** Aeria re-categorizes the open session internally; exit authorization (S7) then returns the adjusted fare — zero collectible with **far-future validity for full waivers**, so the vehicle can exit free at any time. The amount due is computed from the actual exit movement log and invoiced to the sponsoring tenant inside Aeria. A sync to the partner exists only as an engagement option where the partner's system maintains local fare state (native validation features) or offline exit decisions for validated vehicles are in scope |

### F6 — Remote authorization *(Aeria → Partner)*

| Step | Trigger | Data | Expectations |
|---|---|---|---|
| **S12 Remote entry open** | App/support-initiated authorization | Plate; validity; gate identity | Honored when the vehicle presents within validity |
| **S13 Remote exit open** | App/support-initiated exit | Plate; vehicle type; fare context; validity; gate identity | As above; movement still reported via S9 |

### F7 — Exception settlement *(Partner → Aeria)*

| Step | Trigger | Data | Expectations |
|---|---|---|---|
| **S14 Manual settlement** | Vehicle at exit with missing/inconsistent entry record | Plate; entry time; exit time; gate identity; operator remark | Aeria reconstructs the session and the response prescribes the fare; the amount actually collected is reported via S9 and reconciles onto the same session, so reconciliation stays complete |

### F8 — Valet *(bidirectional)*

| Step | Trigger | Data | Expectations |
|---|---|---|---|
| **S15 Valet lifecycle** | Valet check-in, status change, retrieval request | Valet point; vehicle identity; service status; pickup/drop context; retrieval trigger from the user's app | Aeria initiates retrieval to the valet operator; operator reports status transitions |

## 5. Capability × step matrix

Which steps each capability consumes (● = required, ○ = optional/enhancing):

| Capability | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 | S11 | S12 | S13 | S14 | S15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| C1 Vehicle registration | ● | ● | | | | | | | | | | | | | |
| C2 Fixed parking | ● | ● | | | | ○ | ○ | | ● | ○ | | | | | |
| C3 Flexi parking | ● | ● | | | | ● | ● | ○ | ● | ○ | | | | | |
| C4 Paid employee parking | ● | ● | | | | ● | ● | | ● | ○ | | | | | |
| C5 Pay-per-use visitor | | | | | | ● | ● | ● | ● | ○ | | | | ○ | |
| C6 Pre-booking / reservation | | | ● | ● | ● | ● | ● | ○ | ● | ○ | | | | | |
| C7 Priority / VIP visitor | | | ○ | | | ● | ● | | ● | | ○ | ○ | | | |
| C8 Walk-in visitor mgmt | | | ○ | | ○ | ● | ● | ○ | ● | | | ○ | | ○ | |
| C9 Occupancy & availability | | | | | | | | ● | ● | ○ | | | | | |
| C10 Central fare computation | | | | | | ● | ● | | ● | | | | | ○ | |
| C11 Revenue reconciliation | | | | | | | ● | | ● | ○ | | | | ● | |
| C12 Movement audit | | | | | | ○ | ○ | | ● | ○ | | | | ○ | |
| C13 Offline-tolerant operation | ● | ● | ● | ● | ● | | | | ● | ○ | | | | | |
| C14 Exception settlement | | | | | | | | | ○ | | | | | ● | |
| C15 Valet | | | | | | ○ | ○ | | ○ | | | | | | ● |
| C16 Multi-entry passes | ● | ● | ○ | | | ● | ● | | ● | | | | | | |
| C17 Company cab / fleet | ● | ● | | | | ● | ● | | ● | ○ | | | | ○ | |

Reading the matrix column-wise justifies the ask: e.g., S9 (movement report) is consumed by nearly every capability — it is the backbone; S12/S13 (remote open) serve only convenience scenarios and can be deferred in an engagement without blocking the core. S10 is marked ○ throughout per its conditional definition in §4: it becomes required only where completeness of the S9 push path cannot be established for the engagement.

## 6. Execution formats and adapters

- **Reference contract.** Aeria publishes an OpenAPI contract (`parking/deep.openapi.yaml` v1.1, aeria-world/partner-integrations): F3/F4/F7 steps as Aeria-hosted REST endpoints the partner calls; F1, F2 and F6 steps as partner-hosted webhooks Aeria calls (F5 is Aeria-internal — see S11). Per-step coverage:

  | Step | Reference-contract coverage (v1.1) |
  |---|---|
  | S1 / S2 Entitlement grant/revoke | Covered (`addWhitelistReservedUser`, `addWhitelistFlexiUser`, `removeWhitelistUser`) |
  | S3 Create booking | Covered (`addBooking` — reserved-bay or category-level) |
  | S4 Update booking | Covered (`updateBooking` — extension/renewal with per-field replacement semantics) |
  | S5 Cancel booking | Covered (`removeBooking`) |
  | S6 / S7 Entry & exit authorization | Covered (`request-entry`, `request-exit`) |
  | S8 Availability query | Covered (`category-availabilty`) |
  | S9 Movement report | Covered (`movement-logs` — collection modes incl. FASTag; presence of gate identity and collection detail is verified per engagement in UAT) |
  | S10 Movement retrieval | Covered (`getLogs` incl. gate identity and collection fields); scheduled data-file export is an equally valid transport per engagement |
  | S11 Session validation | Not needed as an interface in the deep model — after Aeria-side re-categorization, exit authorization (`request-exit`) returns the adjusted fare (zero collectible with far-future validity for full waivers); an adapter to partner-native validation interfaces is an engagement option |
  | S12 / S13 Remote open | Covered (`allowEntry`, `allowExit`) |
  | S14 Manual settlement | Covered (`manual-exit` — the response prescribes the fare; the actual collection is reported via S9) |
  | S15 Valet lifecycle | Implemented in the platform's partner valet interface; published to partners on engagement demand |

- **Partner-native formats are acceptable.** If the partner already exposes interfaces covering a step's semantics in a different request/response format, Aeria builds and maintains an **adapter** that translates between the canonical step and the partner's native interface. This is Aeria's standard practice — the same provider-adapter architecture runs in production across Aeria's access-control integrations with multiple hardware vendors.
- **What cannot be adapted away** is a step's semantics: the trigger, the data listed in §4 (an adapter can rename/reshape fields, not invent missing ones), and the expectations column (idempotency, upsert, offline replay). Gaps at the semantic level are integration scope to agree per engagement, not formatting issues.

## 7. Cross-cutting requirements

- **Authentication:** every call in either direction is authenticated and integrity-protected. The reference contract uses a signed-request scheme (HMAC-SHA256 over the payload with a per-site shared secret, timestamped with a bounded replay window); an equivalent partner-native scheme is acceptable via the adapter.
- **Site instances:** credentials and configuration are scoped per site; multi-site = multiple instances of the same integration.
- **Idempotency:** movement reporting (S9) is idempotent on the partner's stable movement identifier (falling back to vehicle + time + movement type); authorization steps (S6/S7) replay the prior decision for a vehicle whose session is already pending or open.
- **Completeness:** every movement and every collection — including FASTag-collected fares and offline-period movements — must reach Aeria (push S9 and/or pull S10). Partial feeds undermine billing and analytics.
- **Degradation envelope:** gate operation must not depend on Aeria's reachability **for synchronized traffic**: vehicles covered by entitlements (F1) and prepaid bookings (F2) are decided locally by the partner, with S9 catch-up on reconnection. Unsynchronized traffic — walk-in pay-per-use visitors needing live fare computation — follows the site's configured offline policy (e.g., deny, or admit via local ticketing regularized through S9/S14 afterwards); full offline visitor operation is **not** implied by this document and, if a site requires it, is a scoped engagement addition (it needs tariff/state synchronization semantics beyond F1/F2).
- **Gate identity:** every movement report carries the gate/barrier identity, and authorization requests carry it wherever the lane can supply it; Aeria's site configuration maps gate identities to checkpoints and collection points for gate-wise revenue attribution. Engagements enabling gate-wise attribution verify its presence during UAT.

---

*Engagement-specific documents (per partner, per site) select capabilities from §3, derive the step subset from §5, agree the execution format per §6, and define phasing and commercials. This document remains the common reference and evolves by version.*
