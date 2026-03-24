// PictureBuilder — derives a pixel-art preview from a level's block array.
// The "picture" is the color pattern of the blocks, arranged in a grid.
// Each tile corresponds to one block; it starts dark and is revealed on destruction.

export const COLOR_HEX_MAP = {
  red:    0xE8534A,
  blue:   0x4A7BE8,
  yellow: 0xE8D44A,
  green:  0x4AE86B,
  purple: 0x9B4AE8,
  orange: 0xE8924A,
}

/**
 * Build and render a picture preview in the HUD.
 *
 * @param {Phaser.Scene} scene
 * @param {Array}  blocks  - level.blocks array
 * @param {number} x       - center x of the preview
 * @param {number} y       - center y of the preview
 * @param {number} tileSize - pixel size of each tile (default 5)
 * @returns {{ tiles, reveal, revealAll }} controller object
 */
export function build(scene, blocks, x, y, tileSize = 5) {
  const count = blocks.length
  if (count === 0) return null

  // Choose grid dimensions (wider than tall to feel more like a picture)
  const cols = Math.ceil(Math.sqrt(count * 1.8))
  const rows = Math.ceil(count / cols)
  const w = cols * tileSize
  const h = rows * tileSize

  // Background border
  scene.add.rectangle(x, y, w + 6, h + 6, 0x333355).setDepth(5)
  scene.add.rectangle(x, y, w + 4, h + 4, 0x0a0a1a).setDepth(5)

  // Tiles
  const tiles = []
  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const tx = x - w / 2 + col * tileSize + tileSize / 2
    const ty = y - h / 2 + row * tileSize + tileSize / 2
    const tile = scene.add.rectangle(tx, ty, tileSize - 1, tileSize - 1, 0x1a1a2e).setDepth(6)
    tiles.push({ tile, color: blocks[i].color })
  }

  // Reveal one tile (called when a block is destroyed)
  function reveal(index) {
    const entry = tiles[index]
    if (!entry) return
    const hex = COLOR_HEX_MAP[entry.color] ?? 0xffffff
    entry.tile.setFillStyle(hex)
    scene.tweens.add({ targets: entry.tile, scaleX: 1.5, scaleY: 1.5, duration: 80, yoyo: true })
  }

  // Reveal all remaining tiles (on win)
  function revealAll(delayPerTile = 30) {
    tiles.forEach((entry, i) => {
      const hex = COLOR_HEX_MAP[entry.color] ?? 0xffffff
      if (entry.tile.fillColor === 0x1a1a2e) {
        scene.time.delayedCall(i * delayPerTile, () => {
          entry.tile.setFillStyle(hex)
        })
      }
    })
  }

  return { tiles, reveal, revealAll }
}
