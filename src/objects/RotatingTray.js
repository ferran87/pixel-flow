import Phaser from 'phaser'
import { GAME_WIDTH, TRAY_Y, SHOOTER_SIZE, TRAY_VISIBLE_SLOTS } from '../constants.js'
import * as AudioManager from '../systems/AudioManager.js'

const SLOT_SIZE = 68
const SLOT_SPACING = 82

export default class RotatingTray extends Phaser.Events.EventEmitter {
  constructor(scene, shooterQueue, rotating = false) {
    super()
    this.scene = scene
    this._queue = [...shooterQueue]
    this._rotating = rotating
    this._offset = 0  // index into queue for leftmost visible slot
    this._deploysCount = 0

    this._buildUI()
    this._refresh()
  }

  _buildUI() {
    const trayW = TRAY_VISIBLE_SLOTS * SLOT_SPACING + 16
    const centerX = GAME_WIDTH / 2

    // Background tray
    this.scene.add.rectangle(centerX, TRAY_Y, GAME_WIDTH - 16, SLOT_SIZE + 28, 0x0d0d1e, 0.88)

    // Label
    this.scene.add.text(centerX, TRAY_Y - SLOT_SIZE / 2 - 14, 'SHOOTER QUEUE', {
      fontSize: '10px', fontFamily: 'monospace', color: '#445566',
    }).setOrigin(0.5)

    // Slot frames
    this._slotFrames = []
    this._slotContainers = []
    this._slotPositions = []

    const startX = centerX - (TRAY_VISIBLE_SLOTS - 1) * SLOT_SPACING / 2
    for (let i = 0; i < TRAY_VISIBLE_SLOTS; i++) {
      const x = startX + i * SLOT_SPACING
      const frame = this.scene.add.image(x, TRAY_Y, 'slot_empty')
      frame.setDisplaySize(SLOT_SIZE, SLOT_SIZE)
      this._slotFrames.push(frame)
      this._slotContainers.push(null)
      this._slotPositions.push(x)
    }

    // Rotation arrows
    const arrowColor = this._rotating ? '#aaaacc' : '#333344'
    this._arrowLeft = this.scene.add.text(centerX - trayW / 2, TRAY_Y, '◀', {
      fontSize: '22px', color: arrowColor,
    }).setOrigin(0.5).setInteractive({ cursor: this._rotating ? 'pointer' : 'default' })

    this._arrowRight = this.scene.add.text(centerX + trayW / 2, TRAY_Y, '▶', {
      fontSize: '22px', color: arrowColor,
    }).setOrigin(0.5).setInteractive({ cursor: this._rotating ? 'pointer' : 'default' })

    if (this._rotating) {
      this._arrowLeft.on('pointerdown', () => this._rotate(-1))
      this._arrowRight.on('pointerdown', () => this._rotate(1))
    }

    // Queue count indicator
    this._queueLabel = this.scene.add.text(centerX, TRAY_Y + SLOT_SIZE / 2 + 12, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#556677',
    }).setOrigin(0.5)

    // Swipe support
    if (this._rotating) {
      this.scene.input.on('pointermove', (ptr) => {
        if (!ptr.isDown) return
        if (Math.abs(ptr.velocity.x) > 6) {
          this._rotate(ptr.velocity.x < 0 ? 1 : -1)
        }
      })
    }
  }

  _rotate(dir) {
    const newOffset = this._offset + dir
    if (newOffset < 0) return
    if (newOffset + TRAY_VISIBLE_SLOTS > this._queue.length && this._queue.length >= TRAY_VISIBLE_SLOTS) return

    this._offset = Math.max(0, Math.min(newOffset, Math.max(0, this._queue.length - TRAY_VISIBLE_SLOTS)))

    // Nudge animation
    this.scene.tweens.add({
      targets: this._slotFrames,
      x: (t, tk, v) => v + (-dir * 12),
      duration: 70,
      yoyo: true,
      ease: 'Sine.InOut',
    })
    this._refresh()
  }

  _refresh() {
    for (let i = 0; i < TRAY_VISIBLE_SLOTS; i++) {
      const queueIdx = this._offset + i
      const color = this._queue[queueIdx]

      if (this._slotContainers[i]) {
        this._slotContainers[i].destroy()
        this._slotContainers[i] = null
      }

      const frame = this._slotFrames[i]

      if (color == null) {
        frame.setTexture('slot_empty')
        continue
      }

      frame.setTexture('slot_occupied')
      const x = this._slotPositions[i]
      const container = this.scene.add.container(x, TRAY_Y)

      const sprite = this.scene.add.image(0, 0, `shooter_${color}`)
      sprite.setDisplaySize(SHOOTER_SIZE - 8, SHOOTER_SIZE - 8)
      container.add(sprite)

      const hitArea = this.scene.add.rectangle(0, 0, SLOT_SIZE, SLOT_SIZE, 0xffffff, 0)
      hitArea.setInteractive({ cursor: 'pointer' })
      container.add(hitArea)

      const idx = i  // capture for closure
      hitArea.on('pointerover', () => {
        this.scene.tweens.add({ targets: container, scaleX: 1.1, scaleY: 1.1, duration: 80 })
      })
      hitArea.on('pointerout', () => {
        this.scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 })
      })
      hitArea.on('pointerdown', () => {
        AudioManager.init()
        this._deploySlot(idx)
      })

      this._slotContainers[i] = container
    }

    // Update queue label
    const remaining = this._queue.length
    this._queueLabel?.setText(remaining > 0 ? `${remaining} remaining` : 'EMPTY')

    // Update arrow visibility
    if (this._rotating) {
      this._arrowLeft?.setAlpha(this._offset > 0 ? 1 : 0.25)
      this._arrowRight?.setAlpha(this._offset + TRAY_VISIBLE_SLOTS < this._queue.length ? 1 : 0.25)
    }
  }

  _deploySlot(visibleIndex) {
    const queueIdx = this._offset + visibleIndex
    const color = this._queue[queueIdx]
    if (color == null) return

    this._queue.splice(queueIdx, 1)
    this._deploysCount++

    // Clamp offset after removal
    if (this._offset > 0 && this._offset + TRAY_VISIBLE_SLOTS > this._queue.length) {
      this._offset = Math.max(0, this._queue.length - TRAY_VISIBLE_SLOTS)
    }

    // Animate selected slot out
    const container = this._slotContainers[visibleIndex]
    if (container) {
      this.scene.tweens.add({
        targets: container,
        y: container.y - 35,
        alpha: 0,
        scaleX: 0.7,
        scaleY: 0.7,
        duration: 180,
        onComplete: () => container.destroy(),
      })
      this._slotContainers[visibleIndex] = null
    }

    this.scene.time.delayedCall(220, () => this._refresh())
    this.emit('shooterSelected', color)
  }

  // Called by Bench when a shooter returns from cooldown
  addToQueue(color) {
    this._queue.push(color)
    this._refresh()
  }

  get remainingCount() {
    return this._queue.length
  }

  get deploysCount() {
    return this._deploysCount
  }

  isExhausted() {
    return this._queue.length === 0
  }
}
