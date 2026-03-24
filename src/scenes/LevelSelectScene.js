import Phaser from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../constants.js'
import GameState from '../GameState.js'
import * as ProgressManager from '../systems/ProgressManager.js'

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.LEVEL_SELECT })
  }

  create() {
    const cx = GAME_WIDTH / 2

    this.add.rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e)

    this.add.text(cx, 50, 'SELECT LEVEL', {
      fontSize: '28px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)

    const levels = GameState.levels
    const cols = 3
    const tileW = 110
    const tileH = 100
    const padX = (GAME_WIDTH - cols * tileW) / (cols + 1)
    const startY = 120

    levels.forEach((level, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = padX + col * (tileW + padX) + tileW / 2
      const y = startY + row * (tileH + 16) + tileH / 2

      const unlocked = ProgressManager.isUnlocked(level.id)
      const stars = ProgressManager.getStars(level.id)

      const bg = this.add.rectangle(x, y, tileW - 4, tileH - 4, unlocked ? 0x1e2a3e : 0x111120)
      bg.setStrokeStyle(2, unlocked ? 0x4A7BE8 : 0x333355)

      if (unlocked) {
        bg.setInteractive({ cursor: 'pointer' })
        bg.on('pointerover', () => bg.setFillStyle(0x2a3a5e))
        bg.on('pointerout', () => bg.setFillStyle(0x1e2a3e))
        bg.on('pointerdown', () => {
          GameState.currentLevelId = level.id
          this.scene.start(SCENES.GAME)
        })

        // Level number
        this.add.text(x, y - 18, `${level.id}`, {
          fontSize: '24px', fontFamily: 'monospace', fontStyle: 'bold',
          color: '#ffffff',
        }).setOrigin(0.5)

        // Level name
        this.add.text(x, y + 8, level.name, {
          fontSize: '10px', fontFamily: 'monospace', color: '#8888aa',
          wordWrap: { width: tileW - 10 }, align: 'center',
        }).setOrigin(0.5)

        // Stars
        const starSpacing = 18
        for (let s = 0; s < 3; s++) {
          const sx = x + (s - 1) * starSpacing
          const starImg = this.add.image(sx, y + 34, s < stars ? 'star_full' : 'star_empty')
          starImg.setDisplaySize(16, 16)
        }
      } else {
        this.add.text(x, y, '🔒', { fontSize: '28px' }).setOrigin(0.5)
      }
    })

    // Back button
    const back = this.add.text(30, 28, '← BACK', {
      fontSize: '16px', fontFamily: 'monospace', color: '#4A7BE8',
    }).setInteractive({ cursor: 'pointer' })
    back.on('pointerdown', () => this.scene.start(SCENES.MENU))
  }
}
