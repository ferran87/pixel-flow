import Phaser from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT, COLOR_HEX } from '../constants.js'
import GameState from '../GameState.js'
import * as AudioManager from '../systems/AudioManager.js'

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.MENU })
  }

  create() {
    const cx = GAME_WIDTH / 2

    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e)

    // Floating monster decorations
    this._spawnDecorMonsters()

    // Game title
    this.add.text(cx, 180, 'PIXEL', {
      fontSize: '64px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#4A7BE8',
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.add.text(cx, 250, 'FLOW!', {
      fontSize: '64px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#E8D44A',
      stroke: '#E8924A',
      strokeThickness: 4,
    }).setOrigin(0.5)

    this.add.text(cx, 310, 'Clear the picture. Match the colors.', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#8888aa',
    }).setOrigin(0.5)

    // Play button
    this._makeButton(cx, 440, 'PLAY', 0x4AE86B, () => {
      GameState.currentLevelId = 1
      this.scene.start(SCENES.GAME)
    })

    // Level Select button
    this._makeButton(cx, 520, 'LEVEL SELECT', 0x4A7BE8, () => {
      this.scene.start(SCENES.LEVEL_SELECT)
    })

    // Version tag
    this.add.text(cx, GAME_HEIGHT - 30, 'v0.2.0 — vibe coded with ♥', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#444466',
    }).setOrigin(0.5)
  }

  update() {
    this._decorMonsters?.forEach(m => {
      m.x += m.getData('vx') || 0.3
      m.y += Math.sin(Date.now() / 1000 + m.x) * 0.3
      if (m.x > GAME_WIDTH + 40) m.x = -40
      if (m.x < -40) m.x = GAME_WIDTH + 40
    })
  }

  _makeButton(x, y, label, color, callback) {
    const btn = this.add.rectangle(x, y, 220, 52, color, 0.9).setInteractive({ cursor: 'pointer' })
    btn.setStrokeStyle(2, 0xffffff, 0.4)
    this.add.text(x, y, label, {
      fontSize: '20px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5)

    btn.on('pointerover', () => { btn.setAlpha(1); this.tweens.add({ targets: btn, scaleX: 1.04, scaleY: 1.04, duration: 80 }) })
    btn.on('pointerout', () => { btn.setAlpha(0.9); this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 80 }) })
    btn.on('pointerdown', () => {
      AudioManager.init()
      AudioManager.playShooterFire()
      callback()
    })
    return { btn }
  }

  _spawnDecorMonsters() {
    const colors = Object.keys(COLOR_HEX)
    this._decorMonsters = []
    for (let i = 0; i < 6; i++) {
      const color = colors[i % colors.length]
      const x = Phaser.Math.Between(0, GAME_WIDTH)
      const y = Phaser.Math.Between(380, GAME_HEIGHT - 120)
      const monster = this.add.image(x, y, `shooter_${color}`)
      monster.setAlpha(0.15).setScale(0.9)
      monster.setData('vx', Phaser.Math.FloatBetween(-0.5, 0.5))
      this._decorMonsters.push(monster)
    }
  }
}
