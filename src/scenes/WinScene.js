import Phaser from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../constants.js'
import GameState from '../GameState.js'

export default class WinScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.WIN })
  }

  init(data) {
    this._levelId = data.levelId
    this._score = data.score
    this._stars = data.starsEarned
  }

  create() {
    const cx = GAME_WIDTH / 2

    // Dim overlay
    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)

    // Panel
    this.add.rectangle(cx, GAME_HEIGHT / 2, 340, 420, 0x1a2a3e).setStrokeStyle(2, 0x4A7BE8)

    // Title
    this.add.text(cx, GAME_HEIGHT / 2 - 160, 'LEVEL CLEAR!', {
      fontSize: '28px', fontFamily: 'monospace', fontStyle: 'bold', color: '#4AE86B',
    }).setOrigin(0.5)

    // Stars
    const starSpacing = 60
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * starSpacing
      const filled = i < this._stars
      const star = this.add.image(x, GAME_HEIGHT / 2 - 90, filled ? 'star_full' : 'star_empty')
      star.setDisplaySize(40, 40)
      if (filled) {
        star.setScale(0)
        this.tweens.add({
          targets: star, scaleX: 1, scaleY: 1,
          delay: i * 150,
          duration: 300,
          ease: 'Back.Out',
        })
      }
    }

    // Score
    this.add.text(cx, GAME_HEIGHT / 2 - 20, `Blocks destroyed: ${this._score}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#aaaacc',
    }).setOrigin(0.5)

    // Buttons
    this._makeButton(cx, GAME_HEIGHT / 2 + 60, 'NEXT LEVEL', 0x4AE86B, () => {
      const nextId = this._levelId + 1
      if (nextId <= GameState.levels.length) {
        GameState.currentLevelId = nextId
        this.scene.start(SCENES.GAME)
      } else {
        this.scene.start(SCENES.MENU)
      }
    })

    this._makeButton(cx, GAME_HEIGHT / 2 + 130, 'REPLAY', 0x4A7BE8, () => {
      GameState.currentLevelId = this._levelId
      this.scene.start(SCENES.GAME)
    })

    this._makeButton(cx, GAME_HEIGHT / 2 + 190, 'MENU', 0x555577, () => {
      this.scene.start(SCENES.MENU)
    })
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
