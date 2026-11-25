# Working on Novotium

Novotium is a peaceful miniature life simulator. A citizen is a Novotian. Willowmere is the first playable neighbourhood. Protect player ownership, preserve object histories and keep building, walking and rearranging existing possessions free.

## Code boundaries

- Use strict TypeScript and the locked dependency versions. Keep React components focused on input and presentation.
- Submit domain commands through the game store. Keep wallet, item state, transfer history and transaction changes atomic.
- Preserve schema migration and validation when extending persistent records. Render-only details, camera state and movement belong outside the save.
- Share geometry, materials and model factories. Reuse the same 3D scene in all camera modes. Keep model dimensions and collision data in agreement.
- Reuse existing private and public coordinates. Every citizen receives exactly one equal square. Keep front paths and openings traversable.
- Keep simulated residents and exchanges explicitly identified. Local profile IDs belong to this browser’s prototype world.

## Art and interaction

Use matte painted colours, miniature architectural details, readable serif headings and restrained parchment controls. Preserve the visual distinction between public paths, private gardens and the creek. Use the procedural model for an item’s preview and its physical display. Support keyboard selection and visible focus. Pause walking while a player fills out a form or uses a panel.

## Verification

Run `npm run typecheck`, `npm test`, and `npm run build` after changes. Run `npm run test:e2e` for input, rendering, onboarding, save or economy changes. Inspect the corresponding screenshot for camera and layout work. Add regression coverage when a change affects ownership, undo/redo, access or recovery.

Prioritise a complete lived experience: discover a chair, read its passport, acquire it, place it by a window, revisit the home after a reload. Update the implementation record when the delivered scope changes.
