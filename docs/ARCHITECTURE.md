# Architecture

## Runtime boundaries

| Location | Responsibility |
| --- | --- |
| `src/domain/world.ts` | Plot definitions, citizen identity, item instances, ownership histories, access policy, placement and atomic world commands |
| `src/domain/economy.ts`, `footprints.ts` | Prices and supplies, reward accrual, crafting recipes, object dimensions and rotated footprints |
| `src/services/gameStore.ts` | Serialized changes, bounded decorating history and React subscriptions |
| `src/services/save.ts`, `preferences.ts` | IndexedDB transactions, revision checks, schema migration, backups and validated imports |
| `src/art/` | Original procedural models, painted materials, map, compass and citizenship artwork |
| `src/game/` | Shared scene, camera and pointer handling, movement, collision checks, environment, lighting and Web Audio |
| `src/ui/` | Citizenship, market, inventory, passports, plot records, settings and the game HUD |

React presents game records and submits commands. Three.js owns one scene, one render loop, an orthographic camera and a perspective camera. The follow and eye-level views share the character position. Direct Three.js control simplifies instance batching and roof cutaways. React’s external-store subscription delivers committed changes to the interface.

## Spatial model

Each named plot owns a seven-by-seven square in the XZ plane. Y is up. A house is centred 0.85 units behind its parcel centre, with its doorway facing positive Z. The square, creek, bridge and walking lanes are public land. Neighbourhood expansion can add another coordinate origin and plot namespace.

Static mesh factories share geometries and materials. The batcher uses per-instance paint colours while preserving custom shaders and textures. Roofs and front walls form separately switchable batches. The interior furnishings and the exterior shell occupy the same coordinates. A second renderer generates inventory illustrations and portraits on demand from the same models.

## Ownership and editing

A furniture instance has one ID, one owner and one state. A placed instance carries coordinates and rotation. A listed instance carries a price. Doorstep displays and the market read these same records. A purchase moves the existing instance, records a transfer and adjusts the wallet together. A zero-price transfer also updates the daily collection count.

The editor snaps to half units, or whole units for painted tiles. Placement checks the parcel, walls, doorway, permanent garden fixtures and other belongings. Rug layering is intentional. Undo and redo hold up to 40 decorating snapshots within a session. Trading, crafting, profile changes and imported saves clear that history, preventing an old edit from reversing an economic transaction.

## Persistence

The IndexedDB database is `novotium-willowmere`. Its `world` store holds the current snapshot, previous valid snapshot and preferences. LocalStorage caches lightweight preferences for startup. Save schema 3 includes material balances. Earlier schemas migrate before validation.

Each commit compares its expected revision and writes in one IndexedDB read/write transaction. An out-of-date tab receives a refresh prompt. The interface publishes the new state after the write succeeds. When storage is unavailable on startup, the session offers JSON export. Corruption recovery attempts the last valid backup, then a fresh world if both copies are unusable.

The visual clock runs independently from the device calendar used for rewards and rotating stock. A local player can control their device clock and edit exported data.

## Future shared worlds

`SaveRepository` defines the local persistence boundary. An online version should accept authenticated domain commands and return committed state or events. Trusted transactions should assign identity, claim land, validate access, reserve listings, check balances, transfer ownership and append audit history. Use idempotency keys, rate limits, transactional isolation and server time. Keep local prototype imports in a separate trust domain. Crossing a shared boundary will require both owners’ consent.

External GLB models can replace individual procedural factories by preserving their origin, dimensions, forward direction and named cutaway groups. Snapshot records refer to asset kinds and instance IDs independently of rendering.
