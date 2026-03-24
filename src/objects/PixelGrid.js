import Phaser from 'phaser'
import { GAME_WIDTH, GRID_TOP, GRID_MAX_WIDTH, GRID_MAX_HEIGHT, GRID_CELL_SIZE, RAIL_MARGIN, MONSTER_SIZE, SELECTOR_Y } from '../constants.js'
import { getHex, getDarkerHex } from '../utils/ColorPalette.js'

const HUD_BOTTOM = 86
const SELECTOR_TOP_PAD = 52

export default class PixelGrid {
  constructor(scene, gridData) {
    this.scene = scene
    this.rows = gridData.length
    this.cols = gridData[0].length

    const fitCellW = Math.floor(GRID_MAX_WIDTH / this.cols)
    const fitCellH = Math.floor(GRID_MAX_HEIGHT / this.rows)
    this.cellSize = Math.min(GRID_CELL_SIZE, fitCellW, fitCellH)

    this.width = this.cols * this.cellSize
    this.height = this.rows * this.cellSize
    this.originX = Math.round((GAME_WIDTH - this.width) / 2)

    // Vertically center the grid+rail+monsters in the play area
    const selectorTop = SELECTOR_Y - SELECTOR_TOP_PAD
    const availableH = selectorTop - HUD_BOTTOM
    const envelope = this.height + 2 * RAIL_MARGIN + MONSTER_SIZE
    const centeredY = HUD_BOTTOM + (availableH - envelope) / 2 + RAIL_MARGIN + MONSTER_SIZE / 2
    this.originY = Math.max(GRID_TOP, Math.round(centeredY))

    // cells[row][col] = { color, sprite, ... } | null
    this.cells = []
    this._totalBlocks = 0
    this._destroyedCount = 0

    this._buildGrid(gridData)
  }

  _buildGrid(gridData) {
    const cx = this.originX + this.width / 2
    const cy = this.originY + this.height / 2

    // Outer border frame
    this.scene.add.rectangle(cx, cy, this.width + 14, this.height + 14, 0x3a3a55).setDepth(0)
    // Inner background — slightly lighter so gaps between cells are visible
    this.scene.add.rectangle(cx, cy, this.width + 4, this.height + 4, 0x181828).setDepth(0)

    for (let r = 0; r < this.rows; r++) {
      const row = []
      for (let c = 0; c < this.cols; c++) {
        const color = gridData[r][c]
        if (!color) {
          row.push(null)
          continue
        }
        this._totalBlocks++
        const { x, y } = this._cellCenter(r, c)

        // Cell body with 2px gap (cellSize - 2 instead of cellSize - 1)
        const sprite = this.scene.add.rectangle(
          x, y,
          this.cellSize - 2, this.cellSize - 2,
          getHex(color)
        ).setDepth(1)

        // Top bevel highlight — 3px tall, brighter
        const highlight = this.scene.add.rectangle(
          x, y - this.cellSize / 2 + 2,
          this.cellSize - 2, 3,
          0xffffff, 0.25
        ).setDepth(2)

        // Left-edge highlight — 1px wide, subtle 3D effect
        const leftEdge = this.scene.add.rectangle(
          x - (this.cellSize - 2) / 2 + 0.5, y,
          1, this.cellSize - 2,
          0xffffff, 0.12
        ).setDepth(2)

        // Bottom shadow
        const shadow = this.scene.add.rectangle(
          x, y + this.cellSize / 2 - 1,
          this.cellSize - 2, 2,
          0x000000, 0.2
        ).setDepth(2)

        row.push({ color, sprite, highlight, leftEdge, shadow, alive: true })
      }
      this.cells.push(row)
    }
  }

  _cellCenter(row, col) {
    return {
      x: this.originX + col * this.cellSize + this.cellSize / 2,
      y: this.originY + row * this.cellSize + this.cellSize / 2,
    }
  }

  getBounds() {
    return {
      x: this.originX,
      y: this.originY,
      w: this.width,
      h: this.height,
    }
  }

  /**
   * Get exposed (edge-facing) blocks along one side.
   * side: 'top' | 'bottom' | 'left' | 'right'
   * laneIndex: the col index (for top/bottom) or row index (for left/right)
   */
  getEdgeBlock(side, laneIndex) {
    if (side === 'top') {
      for (let r = 0; r < this.rows; r++) {
        const cell = this.cells[r][laneIndex]
        if (cell && cell.alive) return { row: r, col: laneIndex, cell }
      }
    } else if (side === 'bottom') {
      for (let r = this.rows - 1; r >= 0; r--) {
        const cell = this.cells[r][laneIndex]
        if (cell && cell.alive) return { row: r, col: laneIndex, cell }
      }
    } else if (side === 'left') {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[laneIndex][c]
        if (cell && cell.alive) return { row: laneIndex, col: c, cell }
      }
    } else if (side === 'right') {
      for (let c = this.cols - 1; c >= 0; c--) {
        const cell = this.cells[laneIndex][c]
        if (cell && cell.alive) return { row: laneIndex, col: c, cell }
      }
    }
    return null
  }

  getLaneCount(side) {
    return (side === 'top' || side === 'bottom') ? this.cols : this.rows
  }

  getLaneForPosition(side, worldX, worldY) {
    if (side === 'top' || side === 'bottom') {
      const col = Math.floor((worldX - this.originX) / this.cellSize)
      return Math.max(0, Math.min(col, this.cols - 1))
    } else {
      const row = Math.floor((worldY - this.originY) / this.cellSize)
      return Math.max(0, Math.min(row, this.rows - 1))
    }
  }

  destroyBlock(row, col) {
    const cell = this.cells[row][col]
    if (!cell || !cell.alive) return
    cell.alive = false
    this._destroyedCount++

    const { x, y } = this._cellCenter(row, col)

    // Particle burst
    const particles = this.scene.add.particles(x, y, 'particle', {
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      lifespan: 350,
      quantity: 6,
      tint: getHex(cell.color),
    })
    this.scene.time.delayedCall(400, () => particles.destroy())

    // Shrink + fade
    this.scene.tweens.add({
      targets: cell.sprite,
      scaleX: 1.4, scaleY: 1.4, alpha: 0,
      duration: 150,
      onComplete: () => {
        cell.sprite.destroy()
        if (cell.highlight) cell.highlight.destroy()
        if (cell.leftEdge) cell.leftEdge.destroy()
        if (cell.shadow) cell.shadow.destroy()
      },
    })
  }

  get totalBlocks() { return this._totalBlocks }
  get destroyedCount() { return this._destroyedCount }
  get remainingCount() { return this._totalBlocks - this._destroyedCount }

  allCleared() {
    return this._destroyedCount >= this._totalBlocks
  }
}
