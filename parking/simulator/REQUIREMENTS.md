# Parking Partner Simulator — Requirements (v0.1, requirement-gathering)

> Status: **Phase-1 requirements FROZEN** (2026-08-06). Decisions marked ✅ are confirmed by the owner; the only remaining ❓ items are Phase-2 concerns (§11). Grounded in the real `~/ms-parking` partner surface (code-read 2026-08-06), not guesses.

## 1. Purpose

A local, self-contained **web simulator of a parking partner** (the ANPR / RFID / FASTag boom-barrier + barrier-controller system) that integrates with Aeria's `ms-parking` service. It lets a human drive, by hand, everything a real barrier partner would do automatically — read a vehicle's registration number, ask ms-parking to allow/reject entry or exit, show the driver-facing success/error result, and keep local barrier logs — plus author the topology (site → perimeter → checkpoint/barrier → parking → bays), vehicles, and whitelist data the integration needs.

It replaces the hardware (camera/RFID reader/boom) with **web controls**: a text box for the registration number, buttons to fire each API, and an operator/driver display for the outcome.

There is already a minimal `~/ms-parking/partner-api-tester.html` (5 API buttons + correct HMAC signing in-browser). This simulator is a **superset** of that file — reuse its signing logic; do not rewrite from zero.

## 2. Scope

### ✅ Confirmed decisions
- **Role:** Full digital twin — the partner both **calls** ms-parking's partner APIs and (later) **receives** ms-parking's outbound webhooks. Delivered in phases.
- **Stack:** **Node + Express** backend + **vanilla HTML/CSS/JS** front end (no framework, no build step). Same-origin front+back served from one Node process. *(The existing `partner-api-tester.html` and ms-parking's own `helper.ts` both sign with Node `crypto` / the same JS algorithm — reuse it verbatim; no cross-language port needed.)*
- **Persistence:** local **`db.json`** (single file) — see §6.
- **Integration-partner / Environment (top level):** the simulator stores its **own connection profiles** — e.g. `aeria-staging`, `aeria-prod`, `aeria-local`. **`baseUrl` is set here, on the integration-partner** (added when you create it — your local or staging URL), *not* on the site. Selecting a profile **scopes which sites are shown** and which ms-parking deployment calls target. Cloning a profile and changing only `baseUrl` is the "rest all same" case.
- **Config authoring:** under a selected integration-partner the simulator can **create everything itself** — Site, Perimeter, Checkpoint, **Barrier (tagged entry / exit / both)**, Parking → Zone → Sub-zone → Bay, Categories — **plus vehicle details and whitelisted-vehicle data**.
- **Credential placement (resolved ✅):** `baseUrl` lives on the **integration-partner**; `integrationId` + `secretKey` live in a **per-`(partner, site)` binding** row. This lets the *same authored site* be pointed at `aeria-staging` and `aeria-prod` with different credentials. A call resolves `baseUrl` from the partner and `{integrationId, secretKey}` from the `(partner, site)` binding.
- **Data provenance:** all data is **either authored in the front end or captured from partner-API responses** (e.g. `categoryId` from category-availability, utilization `id` from request-entry, vehicle-log `id` from request-exit). No direct DB mirror from ms-parking. IDs returned by the API are stored and reused in later calls.
- **Auth:** **none in Phase 1** — the admin-password/env-var login is **deferred** (revisit later). The app opens straight on the integration-partner picker. Secrets still stay server-side (never rendered).
- **RFID input:** the reader box takes the **registration number directly** (typed value is sent as `registrationNumber` / `vehicleNo`). No RFID→plate lookup layer for now.
- **Payment handling flag:** store, per `(partner, site)`, whether gate payment is handled by **`aeria`** (ms-parking collects) or the **`partner`** (the simulator collects at the gate). **Phase 1 stores/reads the flag; the partner-side collection flow itself is Phase 2.** See §6.3.

### Phased delivery
- **Phase 1** — the **5 partner APIs** (partner → ms-parking) + lane console + full config/vehicle/whitelist authoring + local barrier logs. (This document's primary functional spec.)
- **Phase 2** — the **webhook receiver** (ms-parking → partner): host the 8 outbound endpoints, verify their signature, act on them (open barrier / update local whitelist / bookings), reflect on the display. (Spec sketched in §9, detailed later.)

### Non-goals
- The **valet** partner API (`retrieveVehicle / updateService / getStatus`) — **out of scope** ✅.
- Any **automatic / background** calls to ms-parking — **every** ms-parking API call is triggered by an explicit **button click** ✅. No polling, no auto-refresh.
- Real hardware, real payments, or being a source of truth. The simulator fabricates/mirrors data for testing only.

## 3. Actors
- **Operator** — the human using the simulator UI (stands in for the automatic lane).
- **Driver display** — the success/error/fare screen the operator reads out (a UI panel, not a separate actor).
- **ms-parking** — the external service under test, reached at its base URL (local default `http://localhost:3000`).

## 4. Architecture
- **Front end:** static vanilla HTML/CSS/JS served by Express (`static/` + a couple of routes). Screens in §8.
- **Back end:** Express. Responsibilities: (a) admin login/session, (b) sign & proxy the 5 API calls to ms-parking (secret stays server-side, avoids browser CORS), (c) read/write `db.json`, (d) [Phase 2] host webhook receiver endpoints.
- **Signing lives server-side** in Phase 1 (secret never shipped to the browser). The browser posts intent (`{action, partnerId, siteId, body, overrides}`); the backend resolves `baseUrl` from the **partner** and `{integrationId, secretKey}` from the **`(partner, site)` binding**, signs, and forwards.
- **Ports:** ms-parking is on **:3000** locally, so the simulator serves on a **different port — `:4100`** — and each integration-partner carries its own ms-parking `baseUrl`.
- **Deployment:** runs the same way locally and on **EC2** (one Node process; front+back same origin). For Phase 2, EC2 must be **publicly reachable** by ms-parking for webhook delivery. ❓ confirm EC2 networking expectation.

## 5. The ms-parking partner contract (reference — do not re-derive)

**Signature** (header `x-signature`): `integrationId.timestamp.HMAC_SHA256(secret, sortedJSON(body) + timestamp)`
- `sortedJSON` = `JSON.stringify` after **recursively sorting object keys** (arrays keep order). Empty/absent body signs `{}`... — for GET, body is `null` → signs `"null"`? **Match the existing tester exactly** (it signs `body || {}`).
- `timestamp` = `Date.now()` ms. Server tolerance **±5 minutes** → simulator must send a fresh timestamp per call.

**Inbound APIs (partner → ms-parking), all under `/partner/v1/parking`:**

| API | Method + path | Request | Success response | Notes |
|---|---|---|---|---|
| Category availability | `GET /category-availabilty` | *(no body)* | `{ categories: [{ id, name, "4w":{total,available}, "2w":{total,available} }] }` | Note the endpoint spelling `availabilty`. |
| Request entry | `POST /request-entry` | `{ vehicle:{ registrationNumber, type?, model?, color?, fastagNo?, geotagNo? }, barrierId? }` | `{ id, entryTime, bay:{name?,location?}, category:{id,name}, pendingCollectionAmount, validTill }` | HTTP **208** when vehicle already inside (idempotent). |
| Request exit | `POST /request-exit` | `{ vehicleNo, barrierId? }` | `{ id, entryTime, exitTime, totalFare, preCollectedFare, categoryId?, validTill }` | HTTP **208** when already exited. |
| Movement logs | `POST /movement-logs` | **array** `[{ id(uuid), vehicleNo, time(iso), type:"entry"\|"exit", categoryId(uuid), barrierId?, collection?:{amount,mode} }]` | `[{ id, registrationNumber }]` | Batch. `type` invalid → error. |
| Manual exit | `POST /manual-exit` | `{ vehicleNo, entryTime, exitTime, remark?, barrierId, categoryId? }` | `{ id, entryTime, exitTime, totalFare, preCollectedFare, validTill }` | For reconciling a missed exit. |

**`barrierId` semantics:** it is a **barrier code** that ms-parking validates against a **checkpoint's `barrierCodes[]`** under the perimeter mapped to the integration. The simulator authors these codes in the front end; **they must match what ms-parking has** for entry validation to pass. The simulator additionally tags each barrier as **entry / exit / both** (its own concept) to drive which lane action is offered — ms-parking itself keys off the code + the vehicle state, not this tag.

**Response envelope (verified live + in the nest-libs interceptor):** a `ResponseTransformerInterceptor` wraps **every** partner response as
`{ "statusCode": <http>, "response": { "message", "code", "data": <payload> } }` — so the payload is always at **`response.data`** for all 5 APIs. `ResponseDto` returns (category-availability, request-entry, request-exit, manual-exit) and a **raw array** return (movement-logs → `response.data` is the `[{id,registrationNumber}]` array) both land here. **Errors** come from the global filter as `{ "statusCode": <http>, "response": { "message", "code", "error" } }` — `StateError` is **HTTP 409** (e.g. "Vehicle is not whitelisted", "Entry permission expired", "Vehicle already inside" code 706). The simulator extracts the payload via `getPayload` (`body.response.data ?? body.data ?? body`) and the error message from `body.response.message`; it treats 409 as a normal DENIED verdict.

**`movement-logs` id semantics (verified):** the `id` is **not** a fresh UUID — for `type:"entry"` it must be the **utilization id** returned by `request-entry` (ms-parking does `getUtilizationById`); for `type:"exit"` it must be the **vehicle-log id** returned by `request-exit`. Also `logExitMovement` destructures `collection` unconditionally, so **an exit movement-log must include `collection:{amount,mode}`** (amount may be 0). `categoryId` is required by the DTO but unused in these paths (any UUID is fine). The simulator sources these ids from the captured responses (occupancy `utilizationId` / the last `request-exit` log).

**request-entry / manual-exit prerequisites (verified):** ms-parking validates `barrierId` against a **checkpoint's `barrierCodes`** via the perimeter mapping, and requires a **whitelisted vehicle identity** for the plate at the site. `request-exit` ignores `barrierId`. `request-exit`/`manual-exit` responses also carry **`amountToPay`**.

**Known ms-parking partner-API behaviour gaps (affect test coverage, verified in code):**
- **No visitor / on-spot booking at the gate** — `request-entry` for a non-whitelisted vehicle throws *"Vehicle is not whitelisted"* (explicit `TODO`, not implemented). Any "falls back to visitor flow" expectation will instead be a clean denial.
- **No category override at exit** — `request-exit` takes no category, and `manual-exit` ignores `categoryId` when a prior entry log exists (it only uses it to create a utilization when none exists).
- These are ms-parking gaps, not simulator gaps; the simulator surfaces the denial/result correctly. (The simulator acts as a **test harness** — ms-parking owns the decisions.)

> **The simulator does not provision ms-parking.** For a green-path call, ms-parking must already have the matching integration (`integrationId`+`secret`), a perimeter whose checkpoint `barrierCodes` include the barrier code, parkings mapped to that integration, availability, and a whitelisted vehicle identity. The simulator's local topology/vehicle/whitelist authoring is for the operator's reference and Phase-2 webhook state — it is **not** pushed to ms-parking.

**Outbound webhooks (ms-parking → partner), Phase 2**, same signing, configured per-integration as `{name,url,method}`:
`allowEntry`, `allowExit`, `addWhitelistReservedUser`, `addWhitelistFlexiUser`, `removeWhitelistUser`, `addBooking`, `removeBooking`, `getLogs`.

## 6. Data model (local JSON)

Authored in the front end and/or captured from API responses. Single `db.json`. **Integration-partner is the top-level container**, grouping sites; credentials live in a per-`(partner, site)` binding.

### 6.1 Collections (entity glossary)
- **partners[]** (integration-partners / environments) — `{ id, name (e.g. "aeria-staging"), baseUrl, paymentHandledBy:"aeria"|"partner", createdAt }`. Selecting one scopes the sites shown and the call target (§7.0). `paymentHandledBy` is the **default** gate-payment policy for the partner (see §6.3).
- **siteBindings[]** — `{ partnerId, siteId, integrationId, secretKey, paymentHandledBy? }`. Credentials used to sign for a site *under that partner*; a `(partner, site)` pair signs with these. `paymentHandledBy?` optionally **overrides** the partner default for this site.
- **sites[]** — `{ id, name, locations:[{id,name}] }`. A site can be bound to more than one partner (staging + prod). Operator picks partner → site (§7.0).
- **perimeters[]** — `{ id, siteId, name, parentPerimeterId?, paymentEntity?:{id,name,type} }` (self-referencing tree)
- **barriers[]** (a checkpoint + its barrier codes) — `{ id, siteId, perimeterId, name, locationId, direction:"entry"|"exit"|"both", barrierCodes:[string], state?:"CLOSED"|"OPENING"|"OPENED"|"CLOSING"|"BLOCKED" }`. `direction` drives which lane action the console offers; `state` is the last runtime boom state.
- **parkings[]** — `{ id, siteId, perimeterId, name, parkingType, operationalHours }`
- **zones[] / subZones[] / bays[]** — `bay = { id, parkingId, subZoneId, series, number, name(=series+number), parallelCount, categoryId }`
- **categories[]** — `{ id, name, workflow:"visitor"|"employee"|"tenant_sold"|"staff", siteId }`. May be **seeded from a category-availability response** so `categoryId` is available for movement-logs/manual-exit.
- **vehicles[]** — `{ registrationNumber(PK), type:"4w"|"2w", model?, color?, fastagNo?, geotagNo?, ownerName? }`. A **global vehicle registry** (a plate is one physical vehicle).
- **whitelist[]** — `{ registrationNumber, siteId, categoryId?, validFrom, validTill, source }`. **Whitelisting is per site** — the same vehicle is whitelisted independently for each site (mirrors ms-parking's per-site `vehicle_identities`). The UI whitelists a vehicle into the **currently selected site**.
- **occupancy[]** (derived from entries/exits) — vehicles the simulator believes are currently inside: `{ siteId, registrationNumber, utilizationId, entryTime, bay?, category?, validTill, entryBarrierId }`. Drives the "currently inside" board, idempotency hints, and "missed exit" reconciliation.
- **collections[]** (**Phase 2**, only when `paymentHandledBy="partner"`) — partner-side money taken at the gate: `{ id, partnerId, siteId, registrationNumber, vehicleLogId?, stage:"entry"|"exit", amount, mode:"cash"|"card"|"QR", collectedAt, reportedToAeria:boolean }`. When the partner collects, the amount is echoed back to ms-parking via the `collection{amount,mode}` field on `movement-logs`.
- **barrierLogs[]** — full audit of **every** ms-parking call, **persisted in `db.json`**: `{ id, ts, partnerId, siteId, barrierId, barrierCode, direction, action, registrationNumber, request:{method,url,headers:{x-signature},body}, response:{status,body}, latencyMs, result, error?, injected? }`. `ts` is the sort key — the log view lists **time-wise, newest first**.
- **meta** — `{ schemaVersion, updatedAt }`.

### 6.2 Concrete `db.json` example (seed)
```json
{
  "meta": { "schemaVersion": 1, "updatedAt": "2026-08-06T12:00:00.000Z" },
  "partners": [
    { "id": "ptn_staging", "name": "aeria-staging", "baseUrl": "https://staging-parking.aeria.world", "paymentHandledBy": "aeria", "createdAt": "2026-08-06T12:00:00.000Z" },
    { "id": "ptn_local",   "name": "aeria-local",   "baseUrl": "http://localhost:3000",              "paymentHandledBy": "partner", "createdAt": "2026-08-06T12:00:00.000Z" }
  ],
  "sites": [ { "id": "site_ph", "name": "Prestige Tech Park", "locations": [ { "id": "loc_gate_a", "name": "Gate A" } ] } ],
  "siteBindings": [
    { "partnerId": "ptn_local", "siteId": "site_ph", "integrationId": "<INTEGRATION_ID>", "secretKey": "<SECRET_KEY>" }
  ],
  "perimeters": [ { "id": "per_b1", "siteId": "site_ph", "name": "Basement B1", "parentPerimeterId": null } ],
  "barriers": [
    { "id": "bar_in",  "siteId": "site_ph", "perimeterId": "per_b1", "name": "B1 Entry Boom", "locationId": "loc_gate_a", "direction": "entry", "barrierCodes": ["GATE-A-IN"],  "state": "CLOSED" },
    { "id": "bar_out", "siteId": "site_ph", "perimeterId": "per_b1", "name": "B1 Exit Boom",  "locationId": "loc_gate_a", "direction": "exit",  "barrierCodes": ["GATE-A-OUT"], "state": "CLOSED" }
  ],
  "categories": [ { "id": "cat_emp", "name": "Employee", "workflow": "employee", "siteId": "site_ph" } ],
  "vehicles": [ { "registrationNumber": "KA01AB1234", "type": "4w", "model": "Honda City", "color": "white" } ],
  "whitelist": [ { "registrationNumber": "KA01AB1234", "siteId": "site_ph", "categoryId": "cat_emp", "validFrom": "2026-08-01T00:00:00.000Z", "validTill": "2027-08-01T00:00:00.000Z", "source": "manual" } ],
  "parkings": [], "zones": [], "subZones": [], "bays": [],
  "occupancy": [], "collections": [], "barrierLogs": []
}
```

### 6.3 Payment-handling flag (new)
- **What it stores:** who collects gate money for a `(partner, site)` — **`aeria`** (ms-parking / Transact collects, e.g. online QR; the simulator just *displays* `pendingCollectionAmount` / `totalFare`) or **`partner`** (the simulator collects at the barrier and reports it back).
- **Resolution:** `siteBindings.paymentHandledBy` if set, else `partners.paymentHandledBy`.
- **Phase 1:** store & edit the flag; the lane console **reads** it to label the payment-due state ("collected by Aeria" vs "collect at gate"). No actual collection UI yet.
- **Phase 2:** when `partner`, show a **collect-payment step** (amount + mode), write a `collections[]` row, and send the `collection{amount,mode}` on `movement-logs` (and reconcile against `pendingCollectionAmount` / exit `totalFare`).
- ❓ Assumed granularity = partner default + per-site override. Tell me if you'd rather set it **per barrier** (some gates cash, some online).

## 7. Functional requirements — Phase 1

### 7.0 Primary navigation flow (confirmed)
1. **Integration-partner picker** — the app opens here (no login in Phase 1). A list of connection profiles (e.g. `aeria-staging`, `aeria-prod`) **or Create Integration-partner** (name + `baseUrl` — the local/staging ms-parking URL). Selecting one scopes everything below to that ms-parking deployment.
2. **Site picker** — sites available under the chosen integration-partner **or Create Site** (topology, and credentials per the §2 placement note).
3. **Barrier picker** — after selecting a site, show its **checkpoints with their barriers**, each labelled entry / exit / both; operator selects **one barrier** to operate.
4. **Lane console** — a driver-display screen for that barrier, with the **side actions gated by the barrier's direction**: an **entry** barrier offers *Request Entry* (+ *Movement-log: entry*); an **exit** barrier offers *Request Exit* (+ *Movement-log: exit*); *both* offers all. The screen shows the API result (**success/failure + message**) and the animated **barrier status** (§7.1).
5. Operator can switch barrier / site / partner at any time.

### 7.1 Barrier status state machine
Every lane action drives a visible boom state:
`CLOSED → OPENING → OPENED → CLOSING → CLOSED`, plus `BLOCKED` (request denied, payment due, or validation error — boom stays down with the reason). Details:
- **ALLOWED** (entry/exit OK) → `OPENING → OPENED`, then auto-`CLOSING` after a **6-second dwell** (configurable). *(No vehicle-on-loop toggle in Phase 1.)*
- **PAYMENT DUE** (`pendingCollectionAmount > 0`) → `BLOCKED (payment due ₹X)`; operator collects locally, then may post a `movement-logs` entry carrying `collection{amount,mode}` and open.
- **DENIED** (not whitelisted / unknown barrier / error) → `BLOCKED (reason)`.
- **ALREADY INSIDE/EXITED** (HTTP 208) → distinct `INFO` state, boom behaviour configurable.
- **Manual override** — a guard "force open" button that opens the boom regardless and logs it.

### FR-1 Integration-partner, site & topology authoring
- **Create/edit Integration-partner** incl. its ms-parking `baseUrl` (the `baseUrl` lives here, not on the site).
- **Create/edit Site** and **bind it to a partner** with `integrationId` + `secretKey` (the per-`(partner, site)` binding). The same site may be bound to multiple partners.
- Author **Perimeter → Barrier(checkpoint)** with **direction (entry/exit/both)** and **barrierCodes[]**; author **Parking → Zone → Sub-zone → Bay** and **Categories**.
- Validation that a barrier's codes are set before it can be operated.

### FR-2 Lane / barrier console
- Registration-number text box (the "reader") for the selected barrier; direction-gated **Request Entry / Request Exit / Movement-log** actions.
- Backend signs & calls ms-parking; **driver display** shows **ALLOWED / DENIED / PAYMENT DUE / ALREADY-IN** with bay, category, fare, `pendingCollectionAmount`, plus barrier state animation and raw response on expand.

### FR-3 Direct API caller (superset of existing tester)
- A panel per API (all 5) with editable JSON body, auto-sign, and raw request+response viewer — including `movement-logs` **batches** and `manual-exit`.

### FR-4 Category availability & vacancy sign
- **On button click**, fetch + render the category 4w/2w total/available table; a **FULL / vacancy indicator** per category; optionally **block entry locally** when the target category shows 0 available. *(No auto-refresh — button-click only.)*
- **Before/after snapshot** on the lane console: a *Snapshot* button keeps the last two availability reads and shows the **per-category delta** (e.g. 4W `9/10 −1`) so bay-count changes across an entry/exit are visible (supports 2W/4W count tests).

### FR-5 Vehicles & whitelist
- Vehicle registry CRUD (plate, type, model, colour, fastag/geotag) — global.
- **Per-site** whitelist CRUD (whitelists into the currently selected site). On a **DENIED (not whitelisted)** result, offer **"register + whitelist then retry"** inline.
- Optional **ANPR-misread simulation**: pre-fill the plate but let the operator correct it before submitting.

### FR-6 Occupancy & reconciliation
- **"Currently inside" board** derived from entries − exits, with parked-duration timers and overstay highlight.
- **Missed-exit reconciliation**: vehicles stuck "inside" → one-click **`manual-exit`** with entry/exit times prefilled.
- **Idempotency demo**: re-sending entry surfaces the **208 already-inside** state distinctly.

### FR-7 Movement-log buffering (offline replay)
- Queue entry/exit movements locally and **flush as a batch** to `movement-logs` (models a barrier that was offline then syncs). Show queued vs. synced state.

### FR-8 ms-parking call log & audit
- Dedicated **ms-parking log** view showing, for **every** call (all button-triggered): the **full request** (URL, method, body, signed `x-signature`) and the **full response** (status + body), plus latency and which barrier/site/partner it came from.
- **Persisted in `db.json`** (`barrierLogs[]`) and listed **time-wise, newest first** (`ts` desc).
- Filterable by integration-partner / site / barrier / reg number / result; **exportable** (JSON/CSV). Per-barrier daily entry/exit counters.

### FR-9 Negative-testing / error injection (Phase 1 ✅)
- Toggles to send: **bad signature**, **expired timestamp** (>5 min), **unknown barrier code**, **non-whitelisted vehicle**, **malformed body**, forced network failure — to verify ms-parking's guard responses.

## 8. UX / screens
1. **Integration-partner picker** — list + create (name + baseUrl). *(App opens here; no login in Phase 1.)*
2. **Site picker** — sites under the partner, list + create.
3. **Barrier picker** — checkpoints/barriers for the site, direction-labelled.
4. **Lane Console** (default post-selection) — reader box, direction-gated actions, big driver display + barrier-state animation, force-open.
5. **API Tester** — 5 API panels with JSON + raw I/O.
6. **Configuration** — partner/site creds + topology + categories.
7. **Vehicles & Whitelist** — registries.
8. **Occupancy** — currently-inside board + reconciliation.
9. **ms-parking Log** — request/response log + counters + export.
10. **[Phase 2] Webhooks** — receiver status + inbound webhook log.

Driver display styled like a real **multi-line lane sign** (plate / decision / bay+category / fare-or-message), plain English. Theme-aware, no external assets/CDNs (self-contained).

## 9. Phase 2 — webhook receiver (sketch)
- Express routes for the 8 endpoints; **verify inbound `x-signature`** using the site's secret (reuse validate logic, ±5 min).
- `allowEntry`/`allowExit` → drive boom state + display; `add*Whitelist*`/`removeWhitelistUser` → mutate local whitelist; `addBooking`/`removeBooking` → local bookings; `getLogs` → return barrier logs.
- Register the receiver URLs against the integration's webhook config in ms-parking. ❓ how are webhook URLs registered on the ms-parking side for a test integration?

## 10. Non-functional
- Runs identically local & EC2; config via env (admin password, port) + `db.json` (partners, sites, secrets, topology).
- Secrets stay server-side; never rendered in the browser.
- Single Node process, zero external DB; `db.json` is the store.
- No external network calls except to each integration-partner's configured ms-parking `baseUrl`, and only on button click.

## 11. Remaining open questions
1. Phase 2 webhook URL registration mechanism on the ms-parking side.
2. EC2 networking expectation for Phase 2 (public reachability for inbound webhooks).

*(Both are Phase-2 concerns — Phase-1 requirements are frozen.)*

## 12. Resolved (was open)
- Persistence → single `db.json`. ✅
- Stack → **Node + Express** + vanilla JS. ✅ *(owner reverted from Flask)*
- Top level → **Integration-partner / environment** (holds `baseUrl`) groups **Sites**; operator picks partner → site → barrier after login. Multi-site. ✅
- Credential placement → `integrationId`+`secretKey` in a **per-`(partner, site)` binding**; same site can be bound to staging + prod. ✅
- DB → single `db.json`, structure defined in §6 (concrete seed in §6.2). ✅
- Payment-handling flag → stored per `(partner, site)` as `aeria`|`partner` (partner default + site override); collection flow is **Phase 2**. ✅ *(open: per-barrier granularity?)*
- ID strategy → no DB mirror; data authored locally or captured from API responses. ✅
- UI auth → **deferred** (no login in Phase 1; secrets still stay server-side). ✅
- RFID → registration number typed directly. ✅
- Error-injection (FR-9) → **Phase 1**. ✅
- Valet API → **out of scope**. ✅
- All ms-parking calls → **button-click only**, no auto-refresh; dedicated request/response log. ✅
- Barrier auto-close dwell → **6s**; no vehicle-on-loop toggle in Phase 1. ✅
- Driver display → **plain English**. ✅
- Git repo → owner will `git init` later once base code exists. ✅
