import Phaser from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../constants.js'
import GameState from '../GameState.js'

export default class LossScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.LOSS })
  }

  init(data) {
    this._levelId = data.levelId
  }

  create() {
    const cx = GAME_WIDTH / 2

    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.75)
    this.add.rectangle(cx, GAME_HEIGHT / 2, 320, 300, 0x2a1a1e).setStrokeStyle(2, 0xE8534A)

    this.add.text(cx, GAME_HEIGHT / 2 - 100, '✖ BLOCK ESCAPED!', {
      fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold', color: '#E8534A',
    }).setOrigin(0.5)

    this.add.text(cx, GAME_HEIGHT / 2 - 50, 'A block reached the danger zone.', {
      fontSize: '14px', fontFamily: 'monospace', color: '#aa8888',
    }).setOrigin(0.5)

    this._makeButton(cx, GAME_HEIGHT / 2 + 30, 'RETRY', 0xE8924A, () => {
      GameState.currentLevelId = this._levelId
      this.scene.start(SCENES.GAME)
    })

    this._makeButton(cx, GAME_HEIGHT / 2 + 95, 'MENU', 0x555577, () => {
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
