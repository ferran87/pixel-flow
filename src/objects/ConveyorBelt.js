import { GAME_WIDTH, BELT_Y, BELT_HEIGHT, DANGER_X, BLOCK_SIZE } from '../constants.js'
import ColorBlock from './ColorBlock.js'

export default class ConveyorBelt {
  constructor(scene, speed) {
    this.scene = scene
    this.speed = speed      // pixels per second
    this.blocks = []        // active ColorBlock instances

    // Scrolling belt tile
    this._tile = scene.add.tileSprite(
      GAME_WIDTH / 2,
      BELT_Y,
      GAME_WIDTH,
      BELT_HEIGHT,
      'belt_tile'
    )

    // Danger zone indicator — left edge red flash
    this._dangerZone = scene.add.rectangle(
      DANGER_X / 2,
      BELT_Y,
      DANGER_X,
      BELT_HEIGHT + 20,
      0xff0000,
      0.15
    )

    // Danger zone border
    this._dangerLine = scene.add.rectangle(DANGER_X, BELT_Y, 3, BELT_HEIGHT + 20, 0xff4444, 0.8)

    // Belt rail tops/bottoms
    scene.add.rectangle(GAME_WIDTH / 2, BELT_Y - BELT_HEIGHT / 2, GAME_WIDTH, 6, 0x3a3a5e)
    scene.add.rectangle(GAME_WIDTH / 2, BELT_Y + BELT_HEIGHT / 2, GAME_WIDTH, 6, 0x3a3a5e)
  }

  spawnBlock(color, maxHealth = 1) {
    const x = GAME_WIDTH + BLOCK_SIZE / 2
    const block = new ColorBlock(this.scene, x, BELT_Y, color, maxHealth)
    this.blocks.push(block)
    return block
  }

  update(delta) {
    const dt = delta / 1000   // convert ms to seconds
    this._tile.tilePositionX -= this.speed * dt * (64 / GAME_WIDTH) * 4

    const toRemove = []

    this.blocks.forEach(block => {
      if (!block.active) {
        toRemove.push(block)
        return
      }
      block.x -= this.speed * dt

      // Flash danger zone when a block is close
      if (block.x < DANGER_X + 120) {
        this._dangerZone.setAlpha(0.3 + 0.2 * Math.sin(Date.now() / 150))
      }
    })

    toRemove.forEach(b => this._removeBlock(b))

    // Check if any block has crossed the danger line
    const escaped = this.blocks.find(b => b.active && b.x < DANGER_X)
    return escaped || null
  }

  removeBlock(block) {
    this._removeBlock(block)
  }

  _removeBlock(block) {
    const idx = this.blocks.indexOf(block)
    if (idx !== -1) this.blocks.splice(idx, 1)
  }

  setSpeed(newSpeed) {
    this.speed = newSpeed
  }

  getBlocks() {
    return this.blocks.filter(b => b.active)
  }

  get blockCount() {
    return this.blocks.filter(b => b.active).length
  }

  resetDangerZone() {
    this._dangerZone.setAlpha(0.15)
  }
}
