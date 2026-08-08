# Parking Partner Simulator (Phase 1)

Local web simulator of a parking **barrier partner** that integrates with `ms-parking`. It signs and fires the 5 partner APIs on button click, shows a driver display + barrier state machine, and keeps a local audit log — all backed by a single `db.json`.

See [REQUIREMENTS.md](./REQUIREMENTS.md) for the full spec.

## Run

```bash
npm install
npm start
```

Then open **http://localhost:4100** (set `PORT` to change).

> `ms-parking` runs on `:3000` locally — the simulator deliberately uses `:4100`.

## What's here (Phase 1)

- **Flow:** integration-partner → site → barrier → lane console (no login in Phase 1).
- **5 APIs**, signed server-side (secret never sent to the browser): `category-availabilty`, `request-entry`, `request-exit`, `movement-logs`, `manual-exit`.
- **Lane console:** registration-number reader, direction-gated actions, driver display, 6s auto-close **barrier state machine**, force-open, **error injection** (bad signature / expired timestamp).
- **Configuration:** partners (baseUrl + payment flag), per-`(partner, site)` credential bindings, perimeters, barriers (entry/exit/both + codes), categories, parkings/bays.
- **Vehicles & per-site whitelist**, **occupancy** board + missed-exit reconciliation, **ms-parking log** (newest-first, exportable).

## Layout

```
server.js            Express: static + generic CRUD + /api/call signing proxy
src/sign.js          HMAC signature (matches ms-parking helper.ts)
src/msparking.js     action → method/path, sign + send, classify result
src/db.js            db.json load/save
data/db.json         the store (seeded with aeria-local + a sample site)
public/              vanilla HTML/CSS/JS front end
```

## Notes

- **Auth** (admin password) is intentionally deferred; the app opens on the partner picker.
- **Payment collection flow** and the **webhook receiver** are **Phase 2**; the payment flag is stored/read now.
- Secrets live only in `data/db.json` (server-side) and are redacted from `/api/state`.
