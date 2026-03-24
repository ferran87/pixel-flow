import { BLOCK_SIZE, SHOOTER_SIZE } from '../constants.js'
import { getHex, getDarkerHex } from './ColorPalette.js'

// Registers all placeholder textures into Phaser's texture cache.
// Call this from BootScene.create() before any game objects are built.
export function registerPlaceholders(scene) {
  const colors = ['red', 'blue', 'yellow', 'green', 'purple', 'orange']

  colors.forEach(color => {
    _makeBlockTexture(scene, color, false)
    _makeBlockTexture(scene, color, true)
    _makeShooterTexture(scene, color)
  })

  _makeBeltTile(scene)
  _makeSlotFrame(scene, false)
  _makeSlotFrame(scene, true)
  _makeParticle(scene)
  _makeStarIcon(scene, 'star_full', 0xFFD700)
  _makeStarIcon(scene, 'star_empty', 0x555555)
  _makeButton(scene, 'btn_primary', 0x4A7BE8)
  _makeButton(scene, 'btn_danger', 0xE8534A)
}

function _makeBlockTexture(scene, color, cracked) {
  const key = cracked ? `block_${color}_cracked` : `block_${color}`
  if (scene.textures.exists(key)) return

  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })
  const hex = cracked ? getDarkerHex(color) : getHex(color)
  const size = BLOCK_SIZE

  // Fill
  gfx.fillStyle(hex, 1)
  gfx.fillRect(0, 0, size, size)

  // Border
  gfx.lineStyle(2, 0x000000, 0.4)
  gfx.strokeRect(1, 1, size - 2, size - 2)

  // Crack marks on cracked variant
  if (cracked) {
    gfx.lineStyle(2, 0x000000, 0.6)
    gfx.beginPath()
    gfx.moveTo(size * 0.3, 0)
    gfx.lineTo(size * 0.5, size * 0.5)
    gfx.lineTo(size * 0.7, size)
    gfx.strokePath()
  }

  gfx.generateTexture(key, size, size)
  gfx.destroy()
}

function _makeShooterTexture(scene, color) {
  const key = `shooter_${color}`
  if (scene.textures.exists(key)) return

  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })
  const hex = getHex(color)
  const s = SHOOTER_SIZE

  // Body circle
  gfx.fillStyle(hex, 1)
  gfx.fillCircle(s / 2, s / 2, s / 2 - 2)

  // Eyes
  gfx.fillStyle(0xffffff, 1)
  gfx.fillCircle(s * 0.35, s * 0.4, 6)
  gfx.fillCircle(s * 0.65, s * 0.4, 6)

  // Pupils
  gfx.fillStyle(0x000000, 1)
  gfx.fillCircle(s * 0.35, s * 0.42, 3)
  gfx.fillCircle(s * 0.65, s * 0.42, 3)

  // Snout
  gfx.fillStyle(0xffd0b0, 1)
  gfx.fillEllipse(s / 2, s * 0.65, 20, 14)
  gfx.fillStyle(0x000000, 0.5)
  gfx.fillCircle(s * 0.42, s * 0.66, 2.5)
  gfx.fillCircle(s * 0.58, s * 0.66, 2.5)

  gfx.generateTexture(key, s, s)
  gfx.destroy()
}

function _makeBeltTile(scene) {
  const key = 'belt_tile'
  if (scene.textures.exists(key)) return

  const w = 64, h = 80
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })

  // Dark base
  gfx.fillStyle(0x2a2a3e, 1)
  gfx.fillRect(0, 0, w, h)

  // Belt lane lines (dashes moving left illusion)
  gfx.lineStyle(2, 0x555577, 0.8)
  gfx.beginPath()
  gfx.moveTo(0, h / 2)
  gfx.lineTo(w, h / 2)
  gfx.strokePath()

  // Notch marks
  gfx.fillStyle(0x3a3a5e, 1)
  gfx.fillRect(8, 6, 12, h - 12)
  gfx.fillRect(44, 6, 12, h - 12)

  gfx.generateTexture(key, w, h)
  gfx.destroy()
}

function _makeSlotFrame(scene, occupied) {
  const key = occupied ? 'slot_occupied' : 'slot_empty'
  if (scene.textures.exists(key)) return

  const s = 64
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })

  gfx.fillStyle(occupied ? 0x2a3a5e : 0x1a1a2e, 1)
  gfx.fillRoundedRect(2, 2, s - 4, s - 4, 8)
  gfx.lineStyle(2, occupied ? 0x4A7BE8 : 0x444466, 1)
  gfx.strokeRoundedRect(2, 2, s - 4, s - 4, 8)

  gfx.generateTexture(key, s, s)
  gfx.destroy()
}

function _makeParticle(scene) {
  const key = 'particle'
  if (scene.textures.exists(key)) return

  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })
  gfx.fillStyle(0xffffff, 1)
  gfx.fillRect(0, 0, 6, 6)
  gfx.generateTexture(key, 6, 6)
  gfx.destroy()
}

function _makeStarIcon(scene, key, color) {
  if (scene.textures.exists(key)) return

  const s = 28
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })
  gfx.fillStyle(color, 1)

  // Simple 5-point star using polygon
  const cx = s / 2, cy = s / 2, outerR = 12, innerR = 5
  const points = []
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r })
  }
  gfx.fillPoints(points, true)
  gfx.generateTexture(key, s, s)
  gfx.destroy()
}

function _makeButton(scene, key, color) {
  if (scene.textures.exists(key)) return

  const w = 160, h = 48
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })
  gfx.fillStyle(color, 1)
  gfx.fillRoundedRect(0, 0, w, h, 10)
  gfx.lineStyle(2, 0xffffff, 0.3)
  gfx.strokeRoundedRect(0, 0, w, h, 10)
  gfx.generateTexture(key, w, h)
  gfx.destroy()
}
