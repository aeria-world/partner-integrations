# Aeria Parking — Partner Integration Capabilities & Flows

**A common reference for parking hardware / parking management partners integrating with the Aeria platform**

| | |
|---|---|
| Version | 1.1 (Active) |
| Date | 17 August 2026 |
| Prepared by | Aeria |
| Audience | Any parking infrastructure partner (gates, LPR, pay stations) and site stakeholders |
| Scope | Partner-agnostic and site-agnostic. Engagement-specific scope, phasing, and commercials live in a separate per-partner document. |

---

## 1. Purpose

This document describes the parking capabilities of the Aeria platform and the **integration flows and steps** a partner system participates in to deliver them. It is the justification for Aeria's integration ask: every step exists because one or more capabilities need it, and every capability maps to the steps that realize it (§5).

It deliberately describes **flows and steps, not APIs**. Aeria publishes a reference API contract implementing this step model — per-step coverage is tabulated in §6 — but the step, with its trigger, semantics, and data, is the requirement. A partner that supports a step in its own request/response format is fully acceptable: Aeria maintains an adapter layer that translates between the canonical steps and partner-native interfaces, a model already in production across Aeria's access-control integrations with multiple hardware vendors.

## 2. Integration model

**Aeria decides, the partner operates.** Aeria is the system of record for users, tenants, vehicles, entitlements, bookings, tariffs, and payments made in-app; it performs authorization decisions and price calculation. The partner operates the physical infrastructure — barriers, lanes, plate capture, pay stations — executes gate decisions, and collects payments at the gate.

For every vehicle movement the partner either:

- **asks Aeria in real time** whether to admit/release a vehicle (online authorization, flow F3), or
- **decides locally** from data Aeria has synchronized to it (entitlements F1, bookings F2, in-session status F5) — which keeps gates operational when connectivity to Aeria is degraded —

and in both cases **confirms the actual movement back to Aeria** (flow F4) so billing, reconciliation, and analytics are complete.

**Execution channels.** The partner's automated infrastructure (ANPR + boom barrier) is one execution channel for gate decisions. Aeria's **property guard app** is a parallel, manual channel: working off the number plate, it triggers the same authorization and movement flows against the same system of record. A site can operate both channels side by side (the guard app doubling as the operational backup when the automated path can't handle a vehicle) or run on the guard app alone. Where partner hardware controls the physical barrier, the guard-app channel actuates it through the remote-open steps (S12/S13); movements that occur outside the partner's channel entirely are notified to it (S15) so its local session state stays coherent.

**Where the truth lives.** Both systems necessarily hold overlapping data, so the integration assumes one rule about which system owns each domain. Aeria is the system of record for **people and tenants, vehicles and entitlements, bookings, tariffs and pricing rules, payments taken in-app and tenant billing, parking categories and their capacity policy, the parking structure it models (zones, bays, allocation) and the checkpoint definitions that map to partner equipment**. The partner is the system of record for **its own equipment and identifiers, the operational state of that equipment, and the movements its equipment observes**. Where movements arise on more than one channel, each side is authoritative for what it directly observed and **Aeria holds the consolidated history**, since it is the only system receiving every channel — which is also what makes reconciliation possible.

This follows from the model above rather than from preference: Aeria computes fares, invoices tenants and reconciles across channels, none of which works if the same data is authored in two places.

Local operation means a partner necessarily holds a **copy** of several Aeria-owned items — entitlements, bookings, category references — so a gate can decide without asking. Those copies are **replicas: maintained through the steps below and not altered independently on site.** Where an engagement additionally requires partner-side rate or category configuration, its maintenance is agreed in that engagement; there is no tariff-synchronisation step in this model today. The discipline matters either way: a value edited directly in the partner system makes the two systems disagree silently — Aeria invoices one amount while the gate collected another, and the difference surfaces at reconciliation with nothing to show which was intended. Where an on-site change is unavoidable, it needs to be visible to Aeria so the replica can be re-synchronised rather than quietly diverge.

**Site scoping.** One integration is established once between Aeria and the partner. Each deployed site runs as a separate, configuration-scoped integration instance (own credentials, own gate topology, own categories and tariffs). Scaling from one site to many is a matter of provisioning instances and configuration — not re-integration.

## 3. Capability catalogue

Which capabilities are activated for a given partner or site is an engagement decision; how far the published reference contract covers each integration step is tabulated in §6.

**Category model.** Categories — their audience typing, booking eligibility, and tariffs — are an Aeria-internal concept, enforced entirely inside Aeria. **To the partner, a category is opaque**: an identifier with capacity counters per vehicle type. Why a category exists never matters to the integration; the partner just tags movements with the resolved `categoryId` and maintains simple per-category counters (+/− on entry/exit) so offline operation works seamlessly. The **one exception is the default category** (`defaultVisitorCategoryId`, delivered with availability): it is the only category the partner selects on its own — consent-based admissions decided at the lane (press-to-accept, offline walk-ins) draw from its counter and are tagged to it in movement reports. Every other category only ever arrives resolved from Aeria.

### A. Employee & tenant parking

| # | Capability |
|---|---|
| C1 | Employee vehicle registration and management — self-service by the employee, or assisted by the tenant admin |
| C2 | Fixed parking: tenant admins allocate reserved bays to specific employees |
| C3 | Flexi parking: quota-based tenant parking on first-come-first-served, enforced per tenant |
| C4 | Paid property parking — paid parking beyond allocations. An employee can pre-book it (e.g. visitor parking at the visitor tariff), or — walking in when neither a fixed nor flexi entitlement is available — opt into it at the gate, validated via the property guard app |

### B. Visitor parking

| # | Capability |
|---|---|
| C5 | Pay-per-use visitor parking for anonymous walk-ins (retail case) — known only by vehicle number, admitted into the site's **default category on explicit acceptance at the barrier** (press-to-accept, the mall/public-parking pattern) and charged by central tariffs |
| C6 | Visitor pre-booking / prepaid reservation with extension and renewal |
| C7 | Priority / VIP visitor parking — pre-approved plates, or tenant-covered charges applied after entry. Tenant actions apply to sessions attributable to a tenant (bookings, passes, hosted walk-ins); anonymous retail sessions are property-scope only |
| C8 | Hosted walk-in visitors — walk-ins visiting a tenant, registered at the gate/reception via the support app and linked to the host tenant, which enables tenant actions (e.g. C7) |

### C. Operations & revenue

| # | Capability |
|---|---|
| C9 | Real-time occupancy and category-wise availability (drives entry displays and admission decisions) |
| C10 | Central fare computation: tariff plans, overtime/interval pricing, premium days and slots |
| C11 | Unified revenue reconciliation across gate collections (cash/card/UPI/FASTag), in-app prepayments, and tenant-covered charges, attributed gate-wise |
| C12 | Movement audit and analytics from complete entry/exit logs |
| C13 | Offline-tolerant gate operation with post-hoc synchronization (degradation envelope: §7) |
| C14 | Online payment across the session lifecycle — prepaid at booking, post-entry in-app payment while parked, extension top-ups; settled at exit and reconciled centrally (multi-entry passes: C15) |

### D. Extended services

| # | Capability |
|---|---|
| C15 | Multi-entry parking passes with validity windows and purchase limits |
| C16 | Company cab / fleet entry-exit management with time-window penalty enforcement |

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
| **S6 Entry authorization** | Vehicle at entry lane (plate captured) | In: plate, vehicle type, gate identity. Out: admit/deny; assigned bay and category; amount to collect at entry (0 = open free); **settlement horizon (paid-upto) as of admission** — subsequent changes arrive via S11; validity of the bay hold | Aeria resolves down a site-configured ladder: fixed entitlement → booking/pass → flexi quota → **consent-gated fallbacks** — employee paid-parking opt-in (validated via the property guard app) or the site's default category (accepted at the barrier, e.g. press-to-accept). For fallback tiers the response is an offer (category + amount); the partner admits on explicit acceptance at the lane. Where the decision cannot complete synchronously (e.g. guard validation pending), the authorization arrives asynchronously via S12. Duplicate requests replay the same decision |
| **S7 Exit authorization** | Vehicle at exit lane | In: plate, gate identity, and — when known — the session reference received at entry. Out: fare breakdown — total fare, amount already collected, balance due; grace validity to reach the barrier | Duplicate requests replay the same result |
| **S8 Availability query** | Entry display refresh / admission pre-check | Out: per-category totals and available counts by vehicle type; default visitor category | Read-only, freely repeatable. Also the **baseline for the partner's local per-category counters**: seeded from S8, adjusted +/− on each movement — which keeps capacity decisions working while offline |

### F4 — Movement & collection reporting *(bidirectional)*

| Step | Trigger | Data | Expectations |
|---|---|---|---|
| **S9 Movement report** *(Partner → Aeria)* | Every physical entry/exit (singly or batched) — where a partner cannot push, the same evidence is obtained by retrieval (S10) | Movement type (entry/exit); plate; timestamp; gate identity; category; collection made at the gate — amount **and** method (cash / card / UPI / FASTag / other) | **Idempotent and batchable**; must cover movements decided locally while offline; gate identity mandatory for revenue attribution |
| **S10 Movement retrieval** *(Aeria-initiated pull)* | Aeria audit / gap detection | In: time range. Out: the partner's raw movement (and, where used for financial reconciliation, collection) records for the range | **Conditional, transport-neutral** (pull API or scheduled export): required where completeness of the S9 push path cannot be established; otherwise an audit enhancement |
| **S15 Movement notification** *(Aeria → Partner)* | A movement occurs outside the partner's channel (e.g. a guard-operated lane) at a site where the partner also operates | Movements, singly or **batched** — per item: plate; movement type (entry/exit); timestamp; category; session reference; for entries, the **settlement horizon (paid-upto)** as of the movement | **Only movements the partner did not originate or witness** — never an echo of its own S9 reports. Batching mirrors S9: after a partner-side outage, Aeria collates pending notifications and delivers them together. Items apply independently, idempotent by movement reference, order-insensitive (each carries its timestamp). Advisory: lets the partner create the local entry record (so its lane can automate the eventual exit) or close a stale one (occupancy, anti-passback hygiene); partner-side state remains non-authoritative per §7 |

### F5 — In-session status sync *(Aeria → Partner)*

| Step | Trigger | Data | Expectations |
|---|---|---|---|
| **S11 Session status update (push)** | The settlement horizon of an open session changes: a mid-session in-app payment, a post-entry booking extension, or a tenant covering the visit | Plate; **paid-upto horizon** (far-future for full waivers); update timestamp; current category and session reference (correlation, when available) | Proactive, advisory push keyed to the vehicle's **currently open session**; ordered by the update timestamp — older or duplicate deliveries are ignored, and an update for a vehicle with no open session is discarded. Exit authorization (S7) remains the authoritative fare source when Aeria is reachable — absence of a push never implies absence of payment. The synced horizon lets the partner decide exits locally while offline and drive lane/display behaviour. The adjustment itself (e.g. VIP/tenant coverage) is an Aeria-internal session re-categorization; this push is how the gate learns its effect proactively. Dues are computed from the actual exit movement log and invoiced to the sponsoring tenant inside Aeria |

### F6 — Remote authorization *(Aeria → Partner)*

| Step | Trigger | Data | Expectations |
|---|---|---|---|
| **S12 Remote entry open** | A pending entry resolves asynchronously (e.g. guard decision on category choice) or an app/support flow authorizes remotely | **Decision context of the S6 response**: session reference; bay; category; paid-upto; validity; gate identity | **Invariant: an allow push means nothing remains to collect at the lane** — fare-based cases never defer, since the synchronous S6 response carries the amount and the lane collects and admits on the spot. The lane proceeds as if the synchronous response had arrived; honored when the vehicle presents within validity |
| **S13 Remote exit open** | A pending exit resolves asynchronously (e.g. payment completed in-app at the barrier) or an app/support flow authorizes remotely | **Decision context of the S7 response**: session reference; total fare (display/receipt); category; validity; gate identity | Same invariant — sent only when fully settled; the lane opens without collection and the movement is still reported via S9 |

### F7 — Exception settlement *(Partner → Aeria)*

| Step | Trigger | Data | Expectations |
|---|---|---|---|
| **S14 Manual settlement** | Vehicle at exit with missing/inconsistent entry record | Plate; entry time; exit time; gate identity; operator remark | Aeria reconstructs the session and the response prescribes the fare; the amount actually collected is reported via S9 and reconciles onto the same session, so reconciliation stays complete |

## 5. Capability delivery paths

**How to read this table.** For each capability, implement everything in **Always**. Then choose the delivery path that matches the deployment:

- **Online path** — the parking system asks Aeria at the decision point (F3). Sufficient on its own where the site can depend on live Aeria responses.
- **Local (offline-capable) path** — the parking system receives synced data (F1/F2/F5) and decides locally. Required where the site must keep operating without live Aeria decisioning; sufficient on its own where local decisioning is the preferred mode.
- **Either path alone delivers the capability — unless the cell says otherwise.** Cells qualified in parentheses (e.g. "exit side only", "degraded") state exactly what the local path covers; the §7 degradation envelope governs the rest. `S6 + S7` means both steps of that path.
- **Conditional / enhancing** steps are not part of any minimum path. S10 is the retrieval form of movement evidence: required where a partner cannot push (S9) or where push completeness cannot be established (§4); S12/S13 are the asynchronous completion of pending requests (guard decisions, in-app payment at the barrier) and are needed wherever those flows are active.

| Capability | Always | Online path | Local (offline-capable) path | Conditional / enhancing |
|---|---|---|---|---|
| C1 Vehicle registration | — | — (registration is Aeria-side; the gate resolves via S6/S7) | S1 + S2 | |
| C2 Fixed parking | S9 or S10 | S6 + S7 | S1 + S2 | S10 |
| C3 Flexi parking | S9 or S10 | S6 + S7 | S1 + S2 | S8, S10 |
| C4 Paid property parking | S9 or S10 | S6 + S7 (the gate opt-in completes via S12) | S3 + S5 (pre-booked; S4 for extensions) | S10, S11 |
| C5 Pay-per-use visitor (anonymous) | S9 or S10 | S6 + S7 + S8 | S8 counters + default-category admission (**degraded**: no offline fare computation — fares settle post-hoc via S9/S14 per §7) | S11, S10, S14 |
| C6 Pre-booking / reservation | S9 or S10 | S6 + S7 | S3 + S4 + S5 | S8, S10, S11 |
| C7 Priority / VIP visitor | S9 or S10 | S6 + S7 (re-categorization surfaces in the S7 fare) | S11 (**exit side only** — local free exit for validated sessions; entry follows the C2/C5/C6 paths) | S3 (pre-approved plates), S12 |
| C8 Hosted walk-in visitors | S9 or S10 | S6 + S7 | S11 (**exit side only**; entry follows the visitor paths) | S3, S5, S8, S12, S14 |
| C9 Occupancy & availability | S9 or S10 | S8 | S8 baseline + local ± counters | S10 |
| C10 Central fare computation | S9 or S10 | S6 + S7 (fares arrive in the responses) | — (no tariff-synchronisation step exists; where a partner must price locally from its own rate configuration, that arrangement and its maintenance are agreed per engagement) | S14 |
| C11 Revenue reconciliation | S9 (with collection detail) | S7 | — (reconciliation is Aeria-side) | S10, S14 |
| C12 Movement audit | S9 or S10 | — | — | S10 |
| C13 Offline-tolerant operation | S9 (offline catch-up) | *n/a* | **The local-path column of every activated capability** (F1/F2/F5 sync + S8 counters) | |
| C14 Online payments | S9 or S10 | S7 (settle at exit) | S11 (paid-upto sync) | S3 + S4 (booking-shaped), S13 (in-app payment at the barrier) |
| C15 Multi-entry passes | S9 or S10 | S6 + S7 | S1 + S2 | S3 |
| C16 Company cab / fleet | S9 or S10 | S6 + S7 | S1 + S2 | S10, S14 |

Reading column-wise still justifies the ask: **movement evidence is the backbone** — every capability requires it in every mode, delivered by push (S9) or retrieval (S10). S15 (movement notification) is not in the table: it is **topology-driven, not capability-driven** — it applies wherever a site runs the partner channel alongside another execution channel (§2), regardless of which capabilities are active.

## 6. Execution formats and adapters

- **Reference contract.** Aeria publishes an OpenAPI contract (`parking/deep.openapi.yaml` v1.1, aeria-world/partner-integrations). Hosting by step: **Aeria-hosted REST endpoints** for the partner-initiated steps (S6–S9, S14); **partner-hosted interfaces** for the Aeria-initiated steps — the sync and completion webhooks (S1–S5, S11–S13, S15) and the S10 pull. Per-step coverage:

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
  | S11 Session status update | Covered (`updateVehicleStatus` — proactive paid-upto push, advisory; `request-exit` stays authoritative). An adapter to partner-native validation interfaces is an engagement option |
  | S12 / S13 Remote open | Covered (`allowEntry`, `allowExit`) |
  | S14 Manual settlement | Covered (`manual-exit` — the response prescribes the fare; the actual collection is reported via S9) |
  | S15 Movement notification | Covered (`notifyMovements` — batchable, cross-channel movements only, idempotent, advisory) |

- **Partner-native formats are acceptable.** If the partner already exposes interfaces covering a step's semantics in a different request/response format, Aeria builds and maintains an **adapter** that translates between the canonical step and the partner's native interface. This is Aeria's standard practice — the same provider-adapter architecture runs in production across Aeria's access-control integrations with multiple hardware vendors.
- **What cannot be adapted away** is a step's semantics: the trigger, the data listed in §4 (an adapter can rename/reshape fields, not invent missing ones), and the expectations column (idempotency, upsert, offline replay). Gaps at the semantic level are integration scope to agree per engagement, not formatting issues.

## 7. Cross-cutting requirements

- **Authentication:** every call in either direction is authenticated and integrity-protected. The reference contract uses a signed-request scheme (HMAC-SHA256 over the payload with a per-site shared secret, timestamped with a bounded replay window); an equivalent partner-native scheme is acceptable via the adapter.
- **Site instances:** credentials and configuration are scoped per site; multi-site = multiple instances of the same integration.
- **Idempotency:** every partner-initiated call supports an optional **partner-supplied idempotency key** — unique within the integration, any stable pattern — for exact deduplication: re-submissions with the same key return the identical response. Without a key, deduplication falls back to natural keys: movement reporting (S9) on vehicle + time + movement type; authorization (S6/S7) on the vehicle's pending/open session; manual settlement (S14) on vehicle + entry/exit times. Exit requests may additionally carry the **session reference received at entry**, making session resolution explicit rather than plate-inferred. Session references and movement identifiers are distinct: a movement identifier is unique **per physical movement** — never reuse a session reference across an entry and its exit.
- **Completeness:** every movement and every collection — including FASTag-collected fares and offline-period movements — must reach Aeria. The evidence may arrive by push (S9) or by retrieval (S10); what matters is that none is missing. Partial feeds undermine billing and analytics. The reverse also holds in dual-channel operation: movements can originate on the guard-app channel, so the partner's local history is never the complete ledger — authoritative occupancy and already-inside checks live in Aeria, not in partner-side state.
- **Degradation envelope:** gate operation must not depend on Aeria's reachability **for synchronized traffic**: vehicles covered by entitlements (F1), prepaid bookings (F2), or a synced session status (S11 paid-upto) are decided locally by the partner, with S9 catch-up on reconnection. Unsynchronized traffic — walk-in pay-per-use visitors needing live fare computation — follows the site's configured offline policy (e.g., deny, or admit via local ticketing regularized through S9/S14 afterwards); full offline visitor operation is **not** implied by this document and, if a site requires it, is a scoped engagement addition (it needs tariff/state synchronization semantics beyond F1/F2).
- **Vehicle identity:** the integration operates on the vehicle registration number alone — no other vehicle identifier is required by any step. How the plate is captured (LPR, manual entry by ground staff) is a site/partner concern.
- **Gate identity:** every movement report carries the gate/barrier identity, and authorization requests carry it wherever the lane can supply it; Aeria's site configuration maps gate identities to checkpoints and collection points for gate-wise revenue attribution. Engagements enabling gate-wise attribution verify its presence during UAT.

---

*Engagement-specific documents (per partner, per site) select capabilities from §3, derive the step subset from §5, agree the execution format per §6, and define phasing and commercials. This document remains the common reference and evolves by version.*
