import { COLOR_HEX } from '../constants.js'

// Returns a Phaser-compatible 0xRRGGBB integer for a color name
export function getHex(colorName) {
  return COLOR_HEX[colorName] ?? 0xffffff
}

// Returns a CSS hex string for use with Phaser Text or DOM elements
export function getCssHex(colorName) {
  const hex = COLOR_HEX[colorName]
  if (!hex) return '#ffffff'
  return '#' + hex.toString(16).padStart(6, '0')
}

// Returns a slightly darker version of a color (for cracked block variant)
export function getDarkerHex(colorName) {
  const base = COLOR_HEX[colorName] ?? 0xffffff
  const r = Math.floor(((base >> 16) & 0xff) * 0.6)
  const g = Math.floor(((base >> 8) & 0xff) * 0.6)
  const b = Math.floor((base & 0xff) * 0.6)
  return (r << 16) | (g << 8) | b
}
