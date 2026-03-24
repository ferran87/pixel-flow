import Phaser from 'phaser'
import { SCENES, GAME_WIDTH, GAME_HEIGHT } from '../constants.js'
import GameState from '../GameState.js'
import PixelGrid from '../objects/PixelGrid.js'
import RailTrack from '../objects/RailTrack.js'
import Monster from '../objects/Monster.js'
import MonsterSelector from '../objects/MonsterSelector.js'
import * as AttackSystem from '../systems/AttackSystem.js'
import * as ProgressManager from '../systems/ProgressManager.js'
import * as AudioManager from '../systems/AudioManager.js'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENES.GAME })
  }

  init(data) {
    if (data?.levelId) GameState.currentLevelId = data.levelId
    GameState.reset()
  }

  create() {
    const level = GameState.getCurrentLevel()
    if (!level) {
      console.error('No level data found!')
      this.scene.start(SCENES.MENU)
      return
    }

    this._level = level
    this._gameOver = false
    this._totalDeploys = 0

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2a2a3e)

    // Pixel grid (the picture)
    this._grid = new PixelGrid(this, level.grid)

    // Rail track around the grid
    this._rail = new RailTrack(this, this._grid.getBounds(), level.railCapacity)

    // Monster selector (bottom tray)
    this._selector = new MonsterSelector(this, level.monsters)
    this._selector.on('monsterSelected', (color, ammo) => {
      this._deployMonster(color, ammo)
    })

    // HUD
    this._buildHUD()
    this._buildPauseButton()
  }

  _deployMonster(color, ammo) {
    if (this._rail.isFull()) {
      this._flashCapacity()
      return
    }

    const monster = new Monster(this, color, ammo, this._level.railSpeed)
    const added = this._rail.addMonster(monster)
    if (!added) {
      monster.destroy()
      return
    }

    this._totalDeploys++
    AudioManager.init()
    AudioManager.playDeploy()

    monster.on('depleted', (m) => {
      this._rail.removeMonster(m)
      this._checkLoss()
    })
  }

  // ---- HUD ----

  _buildHUD() {
    // Level name
    this.add.text(16, 16, `Level ${this._level.id}`, {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', color: '#aaaacc',
    }).setOrigin(0, 0.5).setDepth(20)

    this.add.text(16, 36, this._level.name, {
      fontSize: '12px', fontFamily: 'monospace', color: '#667788',
    }).setOrigin(0, 0.5).setDepth(20)

    // Block counter
    this._blockCountText = this.add.text(GAME_WIDTH / 2, 50, '', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(20)

    // Progress bar
    this._progressBg = this.add.rectangle(GAME_WIDTH / 2, 70, GAME_WIDTH - 40, 6, 0x333355).setDepth(20)
    this._progressBar = this.add.rectangle(20, 70, 0, 6, 0x4AE86B).setOrigin(0, 0.5).setDepth(20)

    // Rail capacity is shown by the gate machine on the rail track
  }

  _buildPauseButton() {
    const pauseBtn = this.add.text(GAME_WIDTH - 16, 18, '⏸', {
      fontSize: '20px',
    }).setOrigin(1, 0.5).setInteractive({ cursor: 'pointer' }).setDepth(20)

    pauseBtn.on('pointerdown', () => {
      this.scene.pause()
      this.scene.launch(SCENES.PAUSE)
    })
  }

  _updateHUD() {
    const remaining = this._grid.remainingCount
    const total = this._grid.totalBlocks
    this._blockCountText?.setText(`${remaining} / ${total}`)

    const progress = total > 0 ? (total - remaining) / total : 0
    this._progressBar.width = (GAME_WIDTH - 40) * progress

    const onRail = this._rail.monsterCount
    this._rail.updateGateDisplay(onRail)
  }

  _flashCapacity() {
    const label = this._rail._gateLabel
    if (label) {
      label.setStyle({ color: '#ff4444' })
      this.time.delayedCall(400, () => label.setStyle({ color: '#8899aa' }))
    }
  }

  // ---- Main loop ----

  update(time, delta) {
    if (this._gameOver) return

    const safeDelta = Math.min(delta, 100)

    // Move monsters along the rail
    this._rail.update(safeDelta)

    // Resolve attacks
    const activeMonsters = this._rail.monsters.filter(m => !m.isDepleted())
    const events = AttackSystem.resolve(activeMonsters, this._grid, time)

    events.forEach(evt => {
      if (evt.type === 'blockDestroyed') {
        GameState.score++
        AudioManager.playBlockDestroy()
      } else if (evt.type === 'monsterDepleted') {
        AudioManager.playShooterDepleted()
      }
    })

    this._updateHUD()

    // Win check
    if (this._grid.allCleared()) {
      this._triggerWin()
    }
  }

  _checkLoss() {
    if (this._gameOver) return

    // Lose if no monsters on rail AND no monsters left to deploy AND blocks remain
    const monstersOnRail = this._rail.monsters.filter(m => !m.isDepleted()).length
    if (monstersOnRail === 0 && this._selector.isExhausted() && !this._grid.allCleared()) {
      this.time.delayedCall(500, () => {
        if (!this._gameOver) this._triggerLoss()
      })
    }
  }

  // ---- Win / Loss ----

  _triggerWin() {
    if (this._gameOver) return
    this._gameOver = true

    const stars = this._calcStars()
    GameState.starsEarned = stars
    ProgressManager.saveResult(this._level.id, stars)

    AudioManager.playWin()
    this.cameras.main.flash(300, 255, 255, 100)
    this.time.delayedCall(600, () => {
      this.scene.start(SCENES.WIN, {
        levelId: this._level.id,
        score: GameState.score,
        starsEarned: stars,
      })
    })
  }

  _triggerLoss() {
    if (this._gameOver) return
    this._gameOver = true

    AudioManager.playBlockEscape()
    this.cameras.main.shake(400, 0.02)
    this.cameras.main.flash(300, 255, 0, 0)
    this.time.delayedCall(600, () => {
      this.scene.start(SCENES.LOSS, { levelId: this._level.id })
    })
  }

  _calcStars() {
    const totalMonsters = this._level.monsters.length
    const used = this._totalDeploys
    if (used <= Math.ceil(totalMonsters * 0.6)) return 3
    if (used <= Math.ceil(totalMonsters * 0.8)) return 2
    return 1
  }
}
