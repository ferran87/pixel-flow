# Pixel Flow!

A browser-based clone of the mobile game **Pixel Flow!** — a conveyor belt action-puzzle game.

## How to play

Colored blocks scroll left along a conveyor belt. You have a queue of colored shooter characters waiting at the bottom. Deploy shooters by clicking them — each shooter will automatically attack the nearest block of the same color.

- **Win**: destroy all blocks before any escape off the left edge
- **Lose**: a block reaches the danger zone on the left

## Features

- 10 levels with increasing difficulty (more colors, faster belt, multi-hit blocks)
- Persistent progress and star ratings via localStorage
- Pause screen (ESC or pause button)
- Fully playable in the browser — no install needed

## Tech stack

| Tool | Purpose |
|------|---------|
| [Phaser.js 3](https://phaser.io/) | Game engine (scenes, physics, tweens) |
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
  objects/      # Game objects (ConveyorBelt, WaitingSlots, Shooter)
  systems/      # Pure logic modules (AttackSystem, LevelLoader, ProgressManager)
  utils/        # PlaceholderArt (procedural textures), GameState, constants
public/
  data/
    levels.json # All 10 level definitions
```
