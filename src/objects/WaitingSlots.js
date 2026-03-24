import Phaser from 'phaser'
import { GAME_WIDTH, GAME_HEIGHT, WAITING_SLOTS, SHOOTER_SIZE } from '../constants.js'
import { getHex } from '../utils/ColorPalette.js'
import * as AudioManager from '../systems/AudioManager.js'

const SLOT_SIZE = 64
const SLOT_Y = GAME_HEIGHT - 70
const SLOT_SPACING = 74

export default class WaitingSlots extends Phaser.Events.EventEmitter {
  constructor(scene, shooterQueue) {
    super()
    this.scene = scene
    this._queue = [...shooterQueue]   // remaining colors to fill slots
    this._slots = []                  // array of { color, container } or null

    this._buildUI()
    this._fillSlots()
  }

  _buildUI() {
    const totalW = WAITING_SLOTS * SLOT_SPACING - (SLOT_SPACING - SLOT_SIZE)
    const startX = (GAME_WIDTH - totalW) / 2 + SLOT_SIZE / 2

    // Background tray
    this.scene.add.rectangle(
      GAME_WIDTH / 2,
      SLOT_Y,
      WAITING_SLOTS * SLOT_SPACING + 20,
      SLOT_SIZE + 20,
      0x0d0d1e,
      0.85
    )

    this._slotPositions = []
    for (let i = 0; i < WAITING_SLOTS; i++) {
      const x = startX + i * SLOT_SPACING
      // Slot frame
      const frame = this.scene.add.image(x, SLOT_Y, 'slot_empty')
      frame.setDisplaySize(SLOT_SIZE, SLOT_SIZE)
      this._slotPositions.push({ x, y: SLOT_Y, frame })
      this._slots.push(null)
    }
  }

  _fillSlots() {
    for (let i = 0; i < WAITING_SLOTS; i++) {
      if (!this._slots[i] && this._queue.length > 0) {
        this._setSlot(i, this._queue.shift())
      }
    }
  }

  _setSlot(index, color) {
    const { x, y, frame } = this._slotPositions[index]

    // Shooter mini-preview: colored circle + label
    const container = this.scene.add.container(x, y)

    const bg = this.scene.add.image(0, 0, `shooter_${color}`)
    bg.setDisplaySize(SHOOTER_SIZE - 4, SHOOTER_SIZE - 4)
    container.add(bg)

    // Make interactive
    const hitArea = this.scene.add.rectangle(0, 0, SLOT_SIZE, SLOT_SIZE, 0xffffff, 0)
    hitArea.setInteractive({ cursor: 'pointer' })
    container.add(hitArea)

    hitArea.on('pointerover', () => {
      this.scene.tweens.add({ targets: container, scaleX: 1.1, scaleY: 1.1, duration: 80 })
      frame.setTexture('slot_occupied')
    })
    hitArea.on('pointerout', () => {
      this.scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 })
      frame.setTexture('slot_empty')
    })
    hitArea.on('pointerdown', () => {
      AudioManager.init()
      this._deploySlot(index)
    })

    frame.setTexture('slot_occupied')
    this._slots[index] = { color, container, frame }

    // Pop-in
    container.setScale(0)
    this.scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 200, ease: 'Back.Out' })
  }

  _deploySlot(index) {
    const slot = this._slots[index]
    if (!slot) return

    const color = slot.color

    // Animate out
    this.scene.tweens.add({
      targets: slot.container,
      y: slot.container.y - 30,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        slot.container.destroy()
        slot.frame.setTexture('slot_empty')
        this._slots[index] = null

        // Refill after short delay
        this.scene.time.delayedCall(300, () => {
          if (this._queue.length > 0) {
            this._setSlot(index, this._queue.shift())
          }
        })
      },
    })

    this.emit('shooterSelected', color)
  }

  get remainingCount() {
    return this._queue.length + this._slots.filter(Boolean).length
  }

  isExhausted() {
    return this._queue.length === 0 && this._slots.every(s => s === null)
  }
}
