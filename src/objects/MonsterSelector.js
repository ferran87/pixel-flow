import Phaser from 'phaser'
import { GAME_WIDTH, SELECTOR_Y, SELECTOR_COLS, SELECTOR_ROWS, MONSTER_SIZE } from '../constants.js'
import * as AudioManager from '../systems/AudioManager.js'

const SLOT_SIZE = 68
const SLOT_SPACING_X = 78
const SLOT_SPACING_Y = 78

export default class MonsterSelector extends Phaser.Events.EventEmitter {
  constructor(scene, monsterDefs) {
    super()
    this.scene = scene
    this._queue = [...monsterDefs]  // { color, ammo }
    this._slots = []
    this._page = 0

    this._buildUI()
    this._refresh()
  }

  _buildUI() {
    const centerX = GAME_WIDTH / 2
    const totalW = SELECTOR_COLS * SLOT_SPACING_X + 20
    const totalH = SELECTOR_ROWS * SLOT_SPACING_Y + 20

    // Background panel
    this.scene.add.rectangle(
      centerX, SELECTOR_Y + (SELECTOR_ROWS - 1) * SLOT_SPACING_Y / 2,
      totalW, totalH, 0x0d0d1e, 0.88
    ).setDepth(10)

    // "DEPLOY" label
    this.scene.add.text(
      centerX,
      SELECTOR_Y - SLOT_SPACING_Y / 2 - 8,
      'DEPLOY',
      { fontSize: '11px', fontFamily: 'monospace', color: '#445566' }
    ).setOrigin(0.5).setDepth(10)

    // Slot positions
    this._slotPositions = []
    const startX = centerX - (SELECTOR_COLS - 1) * SLOT_SPACING_X / 2
    for (let r = 0; r < SELECTOR_ROWS; r++) {
      for (let c = 0; c < SELECTOR_COLS; c++) {
        this._slotPositions.push({
          x: startX + c * SLOT_SPACING_X,
          y: SELECTOR_Y + r * SLOT_SPACING_Y,
        })
      }
    }

    // Remaining count
    this._countLabel = this.scene.add.text(
      centerX,
      SELECTOR_Y + SELECTOR_ROWS * SLOT_SPACING_Y - 10,
      '',
      { fontSize: '11px', fontFamily: 'monospace', color: '#556677' }
    ).setOrigin(0.5).setDepth(10)
  }

  _refresh() {
    // Destroy existing slot visuals
    this._slots.forEach(s => {
      if (s) s.container.destroy()
    })
    this._slots = []

    const visibleCount = SELECTOR_COLS * SELECTOR_ROWS
    const startIdx = this._page * visibleCount

    for (let i = 0; i < visibleCount; i++) {
      const qIdx = startIdx + i
      const def = this._queue[qIdx]
      if (!def) {
        this._slots.push(null)
        continue
      }

      const pos = this._slotPositions[i]
      const container = this.scene.add.container(pos.x, pos.y).setDepth(11)

      // Slot frame
      const frame = this.scene.add.image(0, 0, 'slot_occupied')
      frame.setDisplaySize(SLOT_SIZE, SLOT_SIZE)
      container.add(frame)

      // Monster sprite
      const sprite = this.scene.add.image(0, -4, `shooter_${def.color}`)
      sprite.setDisplaySize(MONSTER_SIZE, MONSTER_SIZE)
      container.add(sprite)

      // Ammo badge
      const badge = this.scene.add.text(0, MONSTER_SIZE / 2 + 2, `${def.ammo}`, {
        fontSize: '12px',
        fontFamily: 'monospace',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5)
      container.add(badge)

      // Hit area
      const hitArea = this.scene.add.rectangle(0, 0, SLOT_SIZE, SLOT_SIZE, 0xffffff, 0)
      hitArea.setInteractive({ cursor: 'pointer' })
      container.add(hitArea)

      const slotIdx = i
      hitArea.on('pointerover', () => {
        this.scene.tweens.add({ targets: container, scaleX: 1.1, scaleY: 1.1, duration: 80 })
      })
      hitArea.on('pointerout', () => {
        this.scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 })
      })
      hitArea.on('pointerdown', () => {
        AudioManager.init()
        this._deploySlot(slotIdx)
      })

      this._slots.push({ container, def, queueIndex: qIdx })
    }

    this._countLabel?.setText(`${this._queue.length} remaining`)
  }

  _deploySlot(visibleIndex) {
    const slot = this._slots[visibleIndex]
    if (!slot) return

    const def = slot.def
    this._queue.splice(slot.queueIndex, 1)

    // Animate out
    this.scene.tweens.add({
      targets: slot.container,
      y: slot.container.y - 30,
      alpha: 0,
      scaleX: 0.6,
      scaleY: 0.6,
      duration: 180,
      onComplete: () => slot.container.destroy(),
    })

    this.scene.time.delayedCall(220, () => this._refresh())
    this.emit('monsterSelected', def.color, def.ammo)
  }

  get remainingCount() {
    return this._queue.length
  }

  isExhausted() {
    return this._queue.length === 0
  }
}
