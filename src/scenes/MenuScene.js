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

    // Background
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a2e)

    // Decorative animated belt in background
    this._beltTile = this.add.tileSprite(cx, GAME_HEIGHT / 2, GAME_WIDTH, 80, 'belt_tile')
    this._beltTile.setAlpha(0.3)

    // Floating block decorations
    this._spawnDecorBlocks()

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

    this.add.text(cx, 310, 'Clear the belt. Match the colors.', {
      fontSize: '16px',
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
    this.add.text(cx, GAME_HEIGHT - 30, 'v0.1.0 — vibe coded with ♥', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#444466',
    }).setOrigin(0.5)
  }

  update() {
    if (this._beltTile) {
      this._beltTile.tilePositionX -= 1
    }
    this._decorBlocks?.forEach(b => {
      b.x -= 0.5
      if (b.x < -32) b.x = GAME_WIDTH + 32
    })
  }

  _makeButton(x, y, label, color, callback) {
    const btn = this.add.rectangle(x, y, 220, 52, color, 0.9).setInteractive({ cursor: 'pointer' })
    btn.setStrokeStyle(2, 0xffffff, 0.4)
    const text = this.add.text(x, y, label, {
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
    return { btn, text }
  }

  _spawnDecorBlocks() {
    const colors = Object.keys(COLOR_HEX)
    this._decorBlocks = []
    for (let i = 0; i < 8; i++) {
      const color = colors[i % colors.length]
      const x = Phaser.Math.Between(0, GAME_WIDTH)
      const y = Phaser.Math.Between(340, GAME_HEIGHT - 100)
      const block = this.add.image(x, y, `block_${color}`)
      block.setAlpha(0.15)
      block.setScale(0.8)
      this._decorBlocks.push(block)
    }
  }
}
