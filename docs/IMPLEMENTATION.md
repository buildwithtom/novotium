# Novotium implementation plan

1. Build Willowmere, a small six-plot neighbourhood with an original procedural landscape, cottages, furniture and citizens. Share one scene across the world, character and street cameras.
2. Connect citizenship and equal plot claims to the local save. Let guests walk and tour homes.
3. Add an editor and a trading loop through item instances, doorstep listings, free collection and recorded ownership.
4. Exercise the rules, inspect the rendered neighbourhood and test the citizen journey through reload. Ship a static production build and record remaining work.

## Delivered

| Area | Playable implementation |
| --- | --- |
| Foundation | A modelled creekside neighbourhood, original cottage and nature assets, shared world/character/street views, keyboard movement, camera orbit, pointer lock and collisions |
| Citizenship | Guest exploration, two claimable meadows, two starter cottages or empty land, character styling, a housewarming gift, editable passport and plot certificate |
| Home | Walkable furnished interiors, roof and front-wall cutaways, indoor and outdoor placement, rotation, storage, terrain paint, undo/redo and visitor access |
| Belongings | Instance histories, physical doorstep displays, custom prices, listing cancellation, explicitly simulated neighbour collections, a free box and a transaction ledger |
| Village life | Four simulated neighbours, walking and waving figurines, seating, discovery walks, day/night lighting, luminous windows, rustling foliage, creek ripples, procedural audio and photography |
| Supplies | A seeded market, date-based shop rotation, crafting, a three-gift daily limit and seven days of bankable coins, wood, stone and seeds |
| Persistence | Automatic local saves, revision conflicts, recovery copies, migrations, confirmed reset and validated import/export |

## Verification

The rule suite covers claims, citizen IDs, visitor access, open and closed doorways, land and furniture collisions, inventory consistency, listing cancellation, purchases, simulated collection, ownership history, free-item limits, crafting, reward accrual and save validation.

Five Chrome journeys exercise the compiled game. They cover the complete settling-and-trading loop, keyboard entry and exit through a doorway, all three camera modes, placement undo/redo, backup recovery, archive restoration, graphics preferences, narrow-screen layout and a conflicting claim from another tab. Test screenshots are written under the ignored `test-results/` directory.

A headless Chrome sample at 1280 × 800 with the medium preset measured 60 fps, 333 draw calls and 227,578 triangles in the populated world view. The rendering readout in Settings can be used to compare other machines. Integrated-GPU and physical touch-device coverage remain open.

## Next development work

1. Expand architectural variety and add modular walls, windows and roof editing. The current editor supports whole cottages, terrain and individual belongings.
2. Author another neighbourhood and extend the asset catalogue with instruments and richer object-specific activities. The starting district contains six private plots.
3. Refine camera transitions, mobile walking controls and adaptive detail after testing on a wider hardware range.
4. Add richer resident routines and visitor memories. Current neighbours follow simple local paths, and the player explicitly initiates simulated collections.
5. Introduce authenticated accounts, shared neighbourhoods and server-issued passports when a trusted online authority is available. The current release runs entirely in the browser.
