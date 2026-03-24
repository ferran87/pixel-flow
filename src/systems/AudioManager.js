// Procedural audio using Web Audio API — no audio files required.
// All sounds are synthesized from oscillators and gain envelopes.
// Call AudioManager.init() on first user interaction (browser autoplay policy).

import * as ProgressManager from './ProgressManager.js'

let _ctx = null
let _sfxGain = null
let _musicGain = null
let _musicOscillators = []
let _initialized = false

function _getCtx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)()
    _sfxGain = _ctx.createGain()
    _musicGain = _ctx.createGain()
    _sfxGain.connect(_ctx.destination)
    _musicGain.connect(_ctx.destination)
    _applySettings()
  }
  return _ctx
}

function _applySettings() {
  const settings = ProgressManager.getSettings()
  if (_sfxGain)   _sfxGain.gain.value   = settings.sfxVolume   ?? 0.8
  if (_musicGain) _musicGain.gain.value = settings.musicVolume ?? 0.5
}

// Resume AudioContext (required after first user gesture)
export function init() {
  const ctx = _getCtx()
  if (ctx.state === 'suspended') ctx.resume()
  _initialized = true
}

export function setSfxVolume(vol) {
  _getCtx()
  _sfxGain.gain.value = vol
}

export function setMusicVolume(vol) {
  _getCtx()
  _musicGain.gain.value = vol
}

// --- SFX helpers ---

function _tone(freq, type, duration, gainPeak, gainNode) {
  const ctx = _getCtx()
  const osc = ctx.createOscillator()
  const env = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, ctx.currentTime)

  env.gain.setValueAtTime(0, ctx.currentTime)
  env.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + 0.01)
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  osc.connect(env)
  env.connect(gainNode)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

function _chirp(startFreq, endFreq, type, duration, gainNode) {
  const ctx = _getCtx()
  const osc = ctx.createOscillator()
  const env = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + duration)

  env.gain.setValueAtTime(0, ctx.currentTime)
  env.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.01)
  env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  osc.connect(env)
  env.connect(gainNode)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

// --- Public SFX ---

export function playBlockDestroy() {
  if (!_initialized) return
  _chirp(880, 440, 'square', 0.12, _sfxGain)
}

export function playShooterFire() {
  if (!_initialized) return
  _tone(1200, 'sine', 0.06, 0.3, _sfxGain)
}

export function playDeploy() {
  if (!_initialized) return
  _chirp(300, 600, 'sine', 0.15, _sfxGain)
}

export function playShooterDepleted() {
  if (!_initialized) return
  // Descending tones
  const ctx = _getCtx()
  const delays = [0, 0.08, 0.16]
  const freqs  = [600, 400, 250]
  delays.forEach((d, i) => {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freqs[i], ctx.currentTime + d)
    env.gain.setValueAtTime(0, ctx.currentTime + d)
    env.gain.linearRampToValueAtTime(0.4, ctx.currentTime + d + 0.01)
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + d + 0.18)
    osc.connect(env)
    env.connect(_sfxGain)
    osc.start(ctx.currentTime + d)
    osc.stop(ctx.currentTime + d + 0.2)
  })
}

export function playBlockEscape() {
  if (!_initialized) return
  // Low thud + alarm chirp
  _tone(80, 'sawtooth', 0.4, 0.7, _sfxGain)
  _chirp(440, 220, 'square', 0.3, _sfxGain)
}

export function playSpeedUp() {
  if (!_initialized) return
  // Ascending alert
  _chirp(400, 900, 'square', 0.2, _sfxGain)
}

export function playWin() {
  if (!_initialized) return
  const ctx = _getCtx()
  // Ascending major chord arpeggio: C5, E5, G5, C6
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    const t = ctx.currentTime + i * 0.12
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, t)
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.5, t + 0.02)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
    osc.connect(env)
    env.connect(_sfxGain)
    osc.start(t)
    osc.stop(t + 0.6)
  })
}

export function playLoss() {
  if (!_initialized) return
  const ctx = _getCtx()
  // Descending minor arpeggio: A4, F4, D4, A3
  const notes = [440, 349, 294, 220]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    const t = ctx.currentTime + i * 0.14
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, t)
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.4, t + 0.02)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.45)
    osc.connect(env)
    env.connect(_sfxGain)
    osc.start(t)
    osc.stop(t + 0.5)
  })
}

export function stopMusic() {
  _musicOscillators.forEach(o => { try { o.stop() } catch (_) {} })
  _musicOscillators = []
}
