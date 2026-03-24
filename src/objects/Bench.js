import Phaser from 'phaser'
import { GAME_WIDTH, BENCH_Y, BENCH_CAPACITY, BENCH_COOLDOWN_MS } from '../constants.js'

const SLOT_SPACING = 54

export default class Bench extends Phaser.Events.EventEmitter {
  constructor(scene) {
    super()
    this.scene = scene
    this._slots = new Array(BENCH_CAPACITY).fill(null)

    this._buildUI()
  }

  _buildUI() {
    const totalW = BENCH_CAPACITY * SLOT_SPACING + 16
    const centerX = GAME_WIDTH / 2

    // Background
    this.scene.add.rectangle(centerX, BENCH_Y, totalW, 48, 0x0d0d1e, 0.75)

    // Label
    this.scene.add.text(centerX, BENCH_Y - 30, 'BENCH', {
      fontSize: '10px', fontFamily: 'monospace', color: '#445566',
    }).setOrigin(0.5)

    this._slotFrames = []
    this._slotPositions = []
    const startX = centerX - (BENCH_CAPACITY - 1) * SLOT_SPACING / 2

    for (let i = 0; i < BENCH_CAPACITY; i++) {
      const x = startX + i * SLOT_SPACING
      const frame = this.scene.add.image(x, BENCH_Y, 'slot_empty')
      frame.setDisplaySize(42, 42)
      this._slotFrames.push(frame)
      this._slotPositions.push({ x, y: BENCH_Y })
    }

    // Flash overlay for overflow warning (hidden by default)
    this._overflowFlash = this.scene.add.rectangle(centerX, BENCH_Y, totalW, 48, 0xff4444, 0)
  }

  // Called when a shooter returns from belt. Returns true if accepted, false if overflow.
  add(color) {
    const emptyIdx = this._slots.findIndex(s => s === null)
    if (emptyIdx === -1) {
      this._flashOverflow()
      return false
    }

    const { x, y } = this._slotPositions[emptyIdx]

    // Icon
    const icon = this.scene.add.image(x, y, `shooter_${color}`)
    icon.setDisplaySize(32, 32).setAlpha(0.85)

    // Bounce-in
    icon.setScale(0)
    this.scene.tweens.add({ targets: icon, scaleX: 1, scaleY: 1, duration: 220, ease: 'Back.Out' })

    // Cooldown bar beneath slot
    const barBg = this.scene.add.rectangle(x, y + 24, 40, 4, 0x222233)
    const bar = this.scene.add.rectangle(x - 20, y + 24, 40, 4, 0x4A7BE8).setOrigin(0, 0.5)

    this._slotFrames[emptyIdx].setTexture('slot_occupied')
    this._slots[emptyIdx] = { color, icon, barBg, bar }

    this.scene.tweens.add({
      targets: bar,
      scaleX: 0,
      duration: BENCH_COOLDOWN_MS,
      ease: 'Linear',
      onComplete: () => {
        this._clearSlot(emptyIdx)
        this.emit('shooterReady', color)
      },
    })

    return true
  }

  _clearSlot(idx) {
    const slot = this._slots[idx]
    if (!slot) return
    slot.icon.destroy()
    slot.barBg.destroy()
    slot.bar.destroy()
    this._slotFrames[idx].setTexture('slot_empty')
    this._slots[idx] = null
  }

  _flashOverflow() {
    this.scene.tweens.add({
      targets: this._overflowFlash,
      alpha: 0.45,
      duration: 120,
      yoyo: true,
      repeat: 1,
    })
  }

  get benchedCount() {
    return this._slots.filter(Boolean).length
  }

  get isFull() {
    return this._slots.every(s => s !== null)
  }
}
