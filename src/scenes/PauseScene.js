import Phaser from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../constants.js'
import * as AudioManager from '../systems/AudioManager.js'
import * as ProgressManager from '../systems/ProgressManager.js'

export default class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' })
  }

  create() {
    const cx = GAME_WIDTH / 2
    const settings = ProgressManager.getSettings()
    this._sfxOn  = settings.sfxVolume   > 0
    this._musicOn = settings.musicVolume > 0

    // Dim overlay
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)

    // Panel — taller to fit volume row
    this.add.rectangle(cx, GAME_HEIGHT / 2, 300, 320, 0x1a1a2e).setStrokeStyle(2, 0x4A7BE8)

    this.add.text(cx, GAME_HEIGHT / 2 - 120, 'PAUSED', {
      fontSize: '32px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)

    // Volume toggles
    this._buildVolumeRow(cx, GAME_HEIGHT / 2 - 60)

    this._makeButton(cx, GAME_HEIGHT / 2, 'RESUME', 0x4AE86B, () => {
      this.scene.stop()
      this.scene.resume(SCENES.GAME)
    })

    this._makeButton(cx, GAME_HEIGHT / 2 + 62, 'RESTART', 0x4A7BE8, () => {
      this.scene.stop()
      this.scene.stop(SCENES.GAME)
      this.scene.start(SCENES.GAME)
    })

    this._makeButton(cx, GAME_HEIGHT / 2 + 122, 'MENU', 0x555577, () => {
      this.scene.stop()
      this.scene.stop(SCENES.GAME)
      this.scene.start(SCENES.MENU)
    })

    // ESC to resume
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.stop()
      this.scene.resume(SCENES.GAME)
    })
  }

  _buildVolumeRow(cx, y) {
    this.add.text(cx, y, 'SOUND', {
      fontSize: '13px', fontFamily: 'monospace', color: '#888899',
    }).setOrigin(0.5)

    // SFX toggle
    this._sfxBtn = this._makeToggle(cx - 50, y + 28, 'SFX', this._sfxOn, () => {
      this._sfxOn = !this._sfxOn
      const vol = this._sfxOn ? 0.8 : 0
      AudioManager.setSfxVolume(vol)
      const settings = ProgressManager.getSettings()
      ProgressManager.saveSettings({ ...settings, sfxVolume: vol })
      this._refreshToggle(this._sfxBtn, this._sfxLabel, 'SFX', this._sfxOn)
    })

    // Music toggle
    this._musicBtn = this._makeToggle(cx + 50, y + 28, 'MUSIC', this._musicOn, () => {
      this._musicOn = !this._musicOn
      const vol = this._musicOn ? 0.5 : 0
      AudioManager.setMusicVolume(vol)
      const settings = ProgressManager.getSettings()
      ProgressManager.saveSettings({ ...settings, musicVolume: vol })
      this._refreshToggle(this._musicBtn, this._musicLabel, 'MUSIC', this._musicOn)
    })
  }

  _makeToggle(x, y, label, on, cb) {
    const bg = this.add.rectangle(x, y, 80, 28, on ? 0x4AE86B : 0x444455, 0.9)
      .setInteractive({ cursor: 'pointer' })
      .setStrokeStyle(1, 0xffffff, 0.3)
    const txt = this.add.text(x, y, label + (on ? ' ON' : ' OFF'), {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)

    if (label === 'SFX')   this._sfxLabel   = txt
    if (label === 'MUSIC') this._musicLabel = txt

    bg.on('pointerdown', cb)
    bg.on('pointerover', () => bg.setAlpha(1))
    bg.on('pointerout',  () => bg.setAlpha(0.9))
    return bg
  }

  _refreshToggle(bg, txt, label, on) {
    bg.setFillStyle(on ? 0x4AE86B : 0x444455)
    txt.setText(label + (on ? ' ON' : ' OFF'))
  }

  _makeButton(x, y, label, color, cb) {
    const btn = this.add.rectangle(x, y, 200, 44, color, 0.9).setInteractive({ cursor: 'pointer' })
    this.add.text(x, y, label, {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)
    btn.on('pointerdown', cb)
    btn.on('pointerover', () => btn.setAlpha(1))
    btn.on('pointerout', () => btn.setAlpha(0.9))
  }
}
