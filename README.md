# Pixel Flow!

A browser-based puzzle game inspired by the mobile hit **Pixel Flow!** — deploy colored monsters onto a rail to clear pixel-art pictures.

## How to play

A pixel-art picture is displayed as a grid of colored blocks. A rail track wraps around the grid. You have a selection of colored monsters at the bottom, each with limited ammo.

Deploy a monster by tapping it — it travels clockwise around the rail and automatically fires at matching-color blocks on the grid edge.

- **Win**: clear all blocks from the grid
- **Lose**: run out of monsters while blocks remain

## Features

- 12 levels with unique pixel-art pictures and increasing difficulty
- Monsters travel a rail around the grid, firing at matching-color edge blocks
- Rail capacity limits add strategic depth
- Persistent progress and star ratings via localStorage
- Pause screen (ESC or pause button)
- Procedural audio and placeholder art — fully playable with zero assets

## Tech stack

| Tool | Purpose |
|------|---------|
| [Phaser.js 3](https://phaser.io/) | Game engine (scenes, tweens, rendering) |
| [Vite](https://vitejs.dev/) | Build tool + HMR dev server |
| Vanilla JS (ES2022) | No framework |
| GitHub Actions | Auto-deploy to GitHub Pages |

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3001/pixel-flow/](http://localhost:3001/pixel-flow/)

## Build

```bash
npm run build
```

Output goes to `dist/`. Automatically deployed to GitHub Pages on push to `main`.

## Project structure

```
src/
  scenes/       # Phaser scenes (Boot, Menu, LevelSelect, Game, Win, Loss, Pause)
  objects/      # Game objects (PixelGrid, RailTrack, Monster, MonsterSelector)
  systems/      # Logic modules (AttackSystem, AudioManager, ProgressManager)
  utils/        # PlaceholderArt (procedural textures), ColorPalette
  data/         # Level definitions (levels.json)
```
