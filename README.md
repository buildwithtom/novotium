# novotium.

*A new little life begins.*

Novotium is a playable, local-first 3D life simulator. Willowmere has six equal garden plots, four simulated residents, a market stall and a footbridge across the creek. Visitors can walk through the village and tour open cottages before becoming a Novotian.

## Run the game

Use Node.js 20.20 or later and a browser with WebGL 2. The project was built and tested with the dependency versions in the lockfile.

```sh
npm ci
npm run dev
```

Open the local address printed by Vite. The game generates its models, textures and sound effects locally. Running it requires no accounts, API keys or remote asset services.

## Your first afternoon

1. Choose **Explore Novotium** and **Take a walk**. Use WASD to move and switch between Character and Street to see the same place from another perspective.
2. Open **Visitor pass** to choose your appearance, claim a meadow, name your home and receive a passport. A chair, table, sapling, housewarming gift and starter supplies come with the plot.
3. Open **Build**, inspect your chair and choose **Place at home**. Click a clear square, or use the arrow keys and Enter. The roof lifts while you decorate.
4. Visit **Bramble Cottage** and inspect Mabel’s second-hand spindle chair. Its passport records where it came from. Buy it, place it by a window and offer your original chair on your own doorstep.
5. Open **Market → Free box** for a neighbour’s gift. The workshop makes new belongings from materials, and the stall sells a daily selection. Daily allowances accumulate for up to seven days away.

**Home** opens your property record, entry controls and plot certificate. **Passport** lets you change your public profile, home access, cottage and appearance.

## Controls

| Action | Control |
| --- | --- |
| Pan or orbit the world | Drag to pan, Shift-drag or secondary-button drag to orbit |
| Zoom | Scroll or use the side controls |
| Choose World, Character or Street | 1, 2 or 3 |
| Walk and look | WASD / arrows and drag |
| Street free look | Click the scene, Escape to release the pointer |
| Inspect something nearby | E |
| Open building tools | B |
| Move the placement preview | Hover, or use arrows for grid steps |
| Place, rotate, cancel | Click or Enter, R, Escape |
| Store the selected placed belonging | Delete |
| Undo / redo a decorating edit | Ctrl/⌘+Z, Ctrl/⌘+Shift+Z |
| Hide the interface for photography | P |

Settings include manual lighting, a natural day/night cycle, graphics presets, reduced motion, camera sensitivity and separate audio levels. Sound starts muted. The minimap opens the neighbourhood directory.

## Saves

IndexedDB stores the local world and a recovery copy. The game saves after each successful change. In **Settings → Local save**, export a JSON archive to back up your world and preferences. Importing and resetting both require confirmation. A save belongs to its browser profile and website origin. Clearing site data removes it.

## Test and build

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

The browser tests use Google Chrome by default. With Playwright’s Chromium installed, set `PW_CHANNEL=chromium`. To exercise the actual production files, build first and run `NOVOTIUM_TEST_PRODUCTION=1 npm run test:e2e`. The test runner starts a temporary static preview.

## Static deployment

For Cloudflare Pages or another static host, use the repository root, build with `npm ci && npm run build`, and publish the **dist** directory over HTTPS. To inspect that output locally, run `npm run preview`. Assets use relative URLs so the build can also be served from a subdirectory.

The [architecture notes](docs/ARCHITECTURE.md) explain the save and transaction boundaries. The [implementation record and roadmap](docs/IMPLEMENTATION.md) cover the delivered scope, verification and remaining work.
# novotium
