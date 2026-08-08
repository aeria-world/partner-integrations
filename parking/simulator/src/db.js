'use strict';
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

const EMPTY_DB = {
    meta: { schemaVersion: 1, updatedAt: null },
    partners: [],
    sites: [],
    siteBindings: [],
    perimeters: [],
    barriers: [],
    parkings: [],
    zones: [],
    subZones: [],
    bays: [],
    categories: [],
    vehicles: [],
    whitelist: [],
    occupancy: [],
    collections: [],
    barrierLogs: [],
};

// Collections the generic CRUD endpoints may touch, with their primary-key field.
const COLLECTIONS = {
    partners: 'id',
    sites: 'id',
    siteBindings: 'id',
    perimeters: 'id',
    barriers: 'id',
    parkings: 'id',
    zones: 'id',
    subZones: 'id',
    bays: 'id',
    categories: 'id',
    vehicles: 'registrationNumber',
    whitelist: 'id',
    occupancy: 'id',
    collections: 'id',
    barrierLogs: 'id',
};

function load() {
    if (!fs.existsSync(DB_PATH)) {
        save(structuredClone(EMPTY_DB));
    }
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const db = JSON.parse(raw);
    // Make sure every known collection exists so the UI never sees undefined.
    for (const key of Object.keys(EMPTY_DB)) {
        if (db[key] === undefined) db[key] = structuredClone(EMPTY_DB[key]);
    }
    return db;
}

function save(db) {
    db.meta = db.meta || { schemaVersion: 1 };
    db.meta.updatedAt = new Date().toISOString();
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return db;
}

module.exports = { load, save, DB_PATH, COLLECTIONS, EMPTY_DB };
