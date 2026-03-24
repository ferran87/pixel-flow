import { MONSTER_SIZE } from '../constants.js'
import { getHex, getDarkerHex } from './ColorPalette.js'

export function registerPlaceholders(scene) {
  const colors = ['red', 'blue', 'yellow', 'green', 'purple', 'orange']

  colors.forEach(color => {
    _makeShooterTexture(scene, color)
  })

  _makeSlotFrame(scene, false)
  _makeSlotFrame(scene, true)
  _makeParticle(scene)
  _makeStarIcon(scene, 'star_full', 0xFFD700)
  _makeStarIcon(scene, 'star_empty', 0x555555)
  _makeButton(scene, 'btn_primary', 0x4A7BE8)
  _makeButton(scene, 'btn_danger', 0xE8534A)
}

function _makeShooterTexture(scene, color) {
  const key = `shooter_${color}`
  if (scene.textures.exists(key)) return

  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })
  const hex = getHex(color)
  const darker = getDarkerHex(color)
  const s = MONSTER_SIZE

  // Darker outline/border
  gfx.fillStyle(darker, 1)
  gfx.fillRoundedRect(1, 3, s - 2, s - 2, 10)

  // Main body — tall rounded rectangle
  gfx.fillStyle(hex, 1)
  gfx.fillRoundedRect(3, 5, s - 6, s - 6, 9)

  // Ear bumps (two small circles on top)
  gfx.fillStyle(hex, 1)
  gfx.fillCircle(s * 0.3, 6, 5)
  gfx.fillCircle(s * 0.7, 6, 5)
  // Ear inner highlight
  gfx.fillStyle(0xffffff, 0.15)
  gfx.fillCircle(s * 0.3, 5, 3)
  gfx.fillCircle(s * 0.7, 5, 3)

  // Body top highlight (glossy sheen)
  gfx.fillStyle(0xffffff, 0.22)
  gfx.fillRoundedRect(5, 7, s - 10, (s - 6) * 0.35, 7)

  // Eyes — larger white sclera
  gfx.fillStyle(0xffffff, 1)
  gfx.fillEllipse(s * 0.34, s * 0.42, 12, 13)
  gfx.fillEllipse(s * 0.66, s * 0.42, 12, 13)

  // Pupils — dark, slightly offset down-center
  gfx.fillStyle(0x111122, 1)
  gfx.fillCircle(s * 0.36, s * 0.44, 4)
  gfx.fillCircle(s * 0.68, s * 0.44, 4)

  // Pupil highlights
  gfx.fillStyle(0xffffff, 0.9)
  gfx.fillCircle(s * 0.34, s * 0.41, 1.5)
  gfx.fillCircle(s * 0.66, s * 0.41, 1.5)

  // Belly / lighter area
  gfx.fillStyle(0xffffff, 0.08)
  gfx.fillEllipse(s / 2, s * 0.7, s * 0.5, s * 0.25)

  gfx.generateTexture(key, s, s)
  gfx.destroy()
}

function _makeSlotFrame(scene, occupied) {
  const key = occupied ? 'slot_occupied' : 'slot_empty'
  if (scene.textures.exists(key)) return

  const s = 68
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })

  gfx.fillStyle(occupied ? 0x2a3a5e : 0x1e2030, 1)
  gfx.fillRoundedRect(2, 2, s - 4, s - 4, 10)
  gfx.lineStyle(2, occupied ? 0x4A7BE8 : 0x3a3a55, 1)
  gfx.strokeRoundedRect(2, 2, s - 4, s - 4, 10)

  gfx.generateTexture(key, s, s)
  gfx.destroy()
}

function _makeParticle(scene) {
  const key = 'particle'
  if (scene.textures.exists(key)) return

  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })
  gfx.fillStyle(0xffffff, 1)
  gfx.fillCircle(3, 3, 3)
  gfx.generateTexture(key, 6, 6)
  gfx.destroy()
}

function _makeStarIcon(scene, key, color) {
  if (scene.textures.exists(key)) return

  const s = 28
  const gfx = scene.make.graphics({ x: 0, y: 0, add: false })
  gfx.fillStyle(color, 1)

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
