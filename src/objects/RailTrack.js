import Phaser from 'phaser'
import { RAIL_MARGIN, DEFAULT_RAIL_CAPACITY } from '../constants.js'

/**
 * Rectangular rail track around the PixelGrid.
 * Monsters travel counter-clockwise starting from the bottom-left gate:
 * BL → BR → TR → TL → BL
 *
 * Layout:
 *   ┌──── top (facing down) ────┐
 *   │                           │
 *  left (facing right)      right (facing left)
 *   │                           │
 *   └─── bottom (facing up) ───┘
 *  [GATE]
 */
export default class RailTrack {
  constructor(scene, gridBounds, capacity) {
    this.scene = scene
    this.capacity = capacity ?? DEFAULT_RAIL_CAPACITY

    const { x, y, w, h } = gridBounds
    const m = RAIL_MARGIN

    this.topLeft     = { x: x - m, y: y - m }
    this.topRight    = { x: x + w + m, y: y - m }
    this.bottomRight = { x: x + w + m, y: y + h + m }
    this.bottomLeft  = { x: x - m, y: y + h + m }

    // Counter-clockwise: BL → BR → TR → TL → BL
    this.segments = [
      { from: this.bottomLeft,  to: this.bottomRight, side: 'bottom' },
      { from: this.bottomRight, to: this.topRight,    side: 'right' },
      { from: this.topRight,    to: this.topLeft,     side: 'top' },
      { from: this.topLeft,     to: this.bottomLeft,  side: 'left' },
    ]

    this.totalLength = this._computeTotalLength()
    this.monsters = []

    this._gateBars = []
    this._gateLabel = null

    this._drawTrack()
    this._drawGate()
  }

  _computeTotalLength() {
    let len = 0
    for (const seg of this.segments) {
      len += this._segLength(seg)
    }
    return len
  }

  _segLength(seg) {
    const dx = seg.to.x - seg.from.x
    const dy = seg.to.y - seg.from.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  _drawTrack() {
    const tl = this.topLeft
    const tr = this.topRight
    const br = this.bottomRight
    const bl = this.bottomLeft

    const rx = tl.x
    const ry = tl.y
    const rw = tr.x - tl.x
    const rh = bl.y - tl.y
    const radius = 14

    const gfx = this.scene.add.graphics().setDepth(3)

    // Outer pipe body
    gfx.lineStyle(22, 0x6a7a8e, 0.85)
    gfx.strokeRoundedRect(rx, ry, rw, rh, radius)

    // Inner channel (darker inset)
    gfx.lineStyle(14, 0x3a4a5e, 0.9)
    gfx.strokeRoundedRect(rx, ry, rw, rh, radius)

    // Inner groove highlight
    gfx.lineStyle(6, 0x2a3a4e, 0.7)
    gfx.strokeRoundedRect(rx, ry, rw, rh, radius)

    // Directional chevrons along the track to hint at counter-clockwise flow
    const chevronGfx = this.scene.add.graphics().setDepth(3)
    chevronGfx.lineStyle(2, 0x8899aa, 0.25)

    // Bottom side chevrons (left to right)
    for (let i = 1; i <= 3; i++) {
      const cx = bl.x + (br.x - bl.x) * (i / 4)
      const cy = bl.y
      chevronGfx.beginPath()
      chevronGfx.moveTo(cx - 4, cy - 3)
      chevronGfx.lineTo(cx, cy)
      chevronGfx.lineTo(cx - 4, cy + 3)
      chevronGfx.strokePath()
    }

    // Right side chevrons (bottom to top)
    for (let i = 1; i <= 3; i++) {
      const cx = br.x
      const cy = br.y + (tr.y - br.y) * (i / 4)
      chevronGfx.beginPath()
      chevronGfx.moveTo(cx - 3, cy + 4)
      chevronGfx.lineTo(cx, cy)
      chevronGfx.lineTo(cx + 3, cy + 4)
      chevronGfx.strokePath()
    }

    // Top side chevrons (right to left)
    for (let i = 1; i <= 3; i++) {
      const cx = tr.x + (tl.x - tr.x) * (i / 4)
      const cy = tl.y
      chevronGfx.beginPath()
      chevronGfx.moveTo(cx + 4, cy - 3)
      chevronGfx.lineTo(cx, cy)
      chevronGfx.lineTo(cx + 4, cy + 3)
      chevronGfx.strokePath()
    }

    // Left side chevrons (top to bottom)
    for (let i = 1; i <= 3; i++) {
      const cx = tl.x
      const cy = tl.y + (bl.y - tl.y) * (i / 4)
      chevronGfx.beginPath()
      chevronGfx.moveTo(cx - 3, cy - 4)
      chevronGfx.lineTo(cx, cy)
      chevronGfx.lineTo(cx + 3, cy - 4)
      chevronGfx.strokePath()
    }
  }

  _drawGate() {
    const gx = this.bottomLeft.x
    const gy = this.bottomLeft.y
    const gateW = 32
    const gateH = 50

    // Gate housing
    const housing = this.scene.add.graphics().setDepth(4)
    housing.fillStyle(0x2a3040, 1)
    housing.fillRoundedRect(gx - gateW / 2, gy - gateH + 8, gateW, gateH, 6)
    housing.lineStyle(2, 0x556677, 0.8)
    housing.strokeRoundedRect(gx - gateW / 2, gy - gateH + 8, gateW, gateH, 6)

    // Top cap
    housing.fillStyle(0x3a4a5e, 1)
    housing.fillRoundedRect(gx - gateW / 2 - 2, gy - gateH + 4, gateW + 4, 8, 3)

    // Capacity bars (stacked vertically, bottom to top)
    const barW = 20
    const barH = 5
    const barGap = 3
    const startY = gy - 4

    for (let i = 0; i < this.capacity; i++) {
      const by = startY - i * (barH + barGap)
      const bar = this.scene.add.rectangle(gx, by, barW, barH, 0x222233).setDepth(5)
      this._gateBars.push(bar)
    }

    // Label below gate
    this._gateLabel = this.scene.add.text(gx, gy + 14, `0/${this.capacity}`, {
      fontSize: '11px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#8899aa',
    }).setOrigin(0.5).setDepth(5)
  }

  updateGateDisplay(activeCount) {
    for (let i = 0; i < this._gateBars.length; i++) {
      if (i < activeCount) {
        this._gateBars[i].setFillStyle(0x4A7BE8)
      } else {
        this._gateBars[i].setFillStyle(0x222233)
      }
    }
    this._gateLabel?.setText(`${activeCount}/${this.capacity}`)
  }

  isFull() {
    return this.monsters.length >= this.capacity
  }

  addMonster(monster) {
    if (this.isFull()) return false
    monster._railDistance = 0
    this.monsters.push(monster)
    this._positionMonster(monster)
    return true
  }

  removeMonster(monster) {
    const idx = this.monsters.indexOf(monster)
    if (idx !== -1) this.monsters.splice(idx, 1)
  }

  update(delta) {
    const dt = delta / 1000
    for (const monster of this.monsters) {
      if (monster.isDepleted()) continue
      monster._railDistance += monster.speed * dt

      if (monster._railDistance >= this.totalLength) {
        monster._railDistance -= this.totalLength
      }

      this._positionMonster(monster)
    }
  }

  getPositionAtDistance(distance) {
    let remaining = distance % this.totalLength
    for (const seg of this.segments) {
      const len = this._segLength(seg)
      if (remaining <= len) {
        const t = len > 0 ? remaining / len : 0
        return {
          x: seg.from.x + (seg.to.x - seg.from.x) * t,
          y: seg.from.y + (seg.to.y - seg.from.y) * t,
          side: seg.side,
        }
      }
      remaining -= len
    }
    return { x: this.bottomLeft.x, y: this.bottomLeft.y, side: 'bottom' }
  }

  _positionMonster(monster) {
    const pos = this.getPositionAtDistance(monster._railDistance)
    monster.x = pos.x
    monster.y = pos.y
    monster.currentSide = pos.side
  }

  get monsterCount() {
    return this.monsters.length
  }
}
