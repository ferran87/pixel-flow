import Phaser from 'phaser'
import {
  SCENES, GAME_WIDTH, GAME_HEIGHT, BELT_Y, DANGER_X, DEFAULT_BELT_CAPACITY, DEFAULT_AMMO,
} from '../constants.js'
import GameState from '../GameState.js'
import ConveyorBelt from '../objects/ConveyorBelt.js'
import Shooter from '../objects/Shooter.js'
import WaitingSlots from '../objects/WaitingSlots.js'
import LevelLoader from '../systems/LevelLoader.js'
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
      console.error('No level data found! Make sure levels.json loaded.')
      this.scene.start(SCENES.MENU)
      return
    }

    this._level = level
    this._beltCapacity = level.beltCapacity ?? DEFAULT_BELT_CAPACITY
    this._activeShooters = []
    this._beltSlots = new Array(this._beltCapacity).fill(null)  // null = free, shooter ref = occupied
    this._blocksDestroyed = 0
    this._totalBlocks = level.blocks.length
    this._gameOver = false
    this._allBlocksSpawned = false

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e)

    // Conveyor belt
    this._belt = new ConveyorBelt(this, level.beltSpeed)

    // Level loader schedules block spawns
    this._loader = new LevelLoader(this, level, this._belt)
    this._loader.load()

    // Mark when all blocks have been queued (last block delay sum)
    const totalDelay = level.blocks.reduce((sum, b) => sum + b.delay, 0)
    this.time.delayedCall(totalDelay + 500, () => { this._allBlocksSpawned = true })

    // Waiting slots
    this._slots = new WaitingSlots(this, level.shooterQueue)
    this._slots.on('shooterSelected', (color) => this._deployShooter(color))

    // HUD
    this._buildHUD()

    // Pause button
    this._buildPauseButton()

    // Speed trigger (belt speeds up when few blocks remain)
    if (level.speedTrigger) {
      this._speedTriggered = false
    }

  }

  // Evenly space shooter slots across the belt from right to left.
  // Slot 0 = rightmost, slot N-1 = leftmost.
  _slotX(slotIndex) {
    const rightEdge = GAME_WIDTH - 40
    const leftEdge  = DANGER_X + 80
    const step = (rightEdge - leftEdge) / Math.max(this._beltCapacity - 1, 1)
    return rightEdge - slotIndex * step
  }

  _deployShooter(color) {
    // Find the first free slot (rightmost first)
    const freeSlot = this._beltSlots.findIndex(s => s === null)
    if (freeSlot === -1) {
      // Belt full — flash capacity indicator
      this._capacityText?.setStyle({ color: '#ff4444' })
      this.time.delayedCall(400, () => this._capacityText?.setStyle({ color: '#888899' }))
      return
    }

    const ammo = this._level.ammo ?? DEFAULT_AMMO
    const shooter = new Shooter(this, this._slotX(freeSlot), BELT_Y, color, ammo)

    this._beltSlots[freeSlot] = shooter

    shooter.on('depleted', (s) => {
      const slotIdx = this._beltSlots.indexOf(s)
      if (slotIdx !== -1) this._beltSlots[slotIdx] = null
      const idx = this._activeShooters.indexOf(s)
      if (idx !== -1) this._activeShooters.splice(idx, 1)
    })

    this._activeShooters.push(shooter)
  }

  _buildHUD() {
    // Level name
    this.add.text(GAME_WIDTH / 2, 24, `Level ${this._level.id}: ${this._level.name}`, {
      fontSize: '16px', fontFamily: 'monospace', color: '#aaaacc',
    }).setOrigin(0.5)

    // Block counter
    this._blockCountText = this.add.text(GAME_WIDTH / 2, 50, this._getCounterText(), {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)

    // Progress bar background
    this._progressBg = this.add.rectangle(GAME_WIDTH / 2, 72, GAME_WIDTH - 40, 8, 0x333355)
    this._progressBar = this.add.rectangle(20, 72, 0, 8, 0x4AE86B).setOrigin(0, 0.5)

    // Belt capacity indicator
    this._capacityText = this.add.text(GAME_WIDTH - 16, 50, '', {
      fontSize: '13px', fontFamily: 'monospace', color: '#888899',
    }).setOrigin(1, 0.5)
  }

  _buildPauseButton() {
    const pauseBtn = this.add.text(GAME_WIDTH - 16, 20, '⏸', {
      fontSize: '22px',
    }).setOrigin(1, 0.5).setInteractive({ cursor: 'pointer' })

    pauseBtn.on('pointerdown', () => {
      this.scene.pause()
      this.scene.launch('PauseScene')
    })
  }

  _getCounterText() {
    const remaining = this._totalBlocks - this._blocksDestroyed
    return `${remaining} block${remaining !== 1 ? 's' : ''} left`
  }

  _updateHUD() {
    this._blockCountText?.setText(this._getCounterText())

    const progress = this._totalBlocks > 0
      ? this._blocksDestroyed / this._totalBlocks
      : 0
    this._progressBar.width = (GAME_WIDTH - 40) * progress

    const active = this._beltSlots.filter(s => s !== null).length
    this._capacityText?.setText(`${active}/${this._beltCapacity} on belt`)

    // Check speed trigger
    if (this._level.speedTrigger && !this._speedTriggered) {
      const remaining = this._totalBlocks - this._blocksDestroyed
      if (remaining <= this._level.speedTrigger.blocksRemaining) {
        this._belt.setSpeed(this._belt.speed * this._level.speedTrigger.multiplier)
        this._speedTriggered = true

        // Flash notification
        AudioManager.playSpeedUp()
        const flash = this.add.text(GAME_WIDTH / 2, BELT_Y - 60, '⚡ SPEED UP!', {
          fontSize: '22px', fontFamily: 'monospace', color: '#E8D44A', fontStyle: 'bold',
        }).setOrigin(0.5)
        this.tweens.add({
          targets: flash, alpha: 0, y: flash.y - 40, duration: 1200,
          onComplete: () => flash.destroy(),
        })
      }
    }
  }

  update(time, delta) {
    if (this._gameOver) return

    // Cap delta to 100ms to avoid huge jumps after tab switch / scene start
    const safeDelta = Math.min(delta, 100)

    // Update belt — returns escaped block if any
    const escaped = this._belt.update(safeDelta)
    if (escaped) {
      this._triggerLoss()
      return
    }

    // Run attack system
    const events = AttackSystem.resolve(
      this._activeShooters,
      this._belt.getBlocks(),
      time
    )

    events.forEach(evt => {
      if (evt.type === 'blockDestroyed') {
        this._blocksDestroyed++
        GameState.score++
        this._belt.removeBlock(evt.block)
        AudioManager.playBlockDestroy()
      } else if (evt.type === 'shooterDepleted') {
        AudioManager.playShooterDepleted()
      }
    })

    this._updateHUD()

    // Win condition: all blocks destroyed + all spawned
    if (
      this._allBlocksSpawned &&
      this._belt.blockCount === 0 &&
      this._blocksDestroyed >= this._totalBlocks
    ) {
      this._triggerWin()
    }
  }

  _triggerWin() {
    if (this._gameOver) return
    this._gameOver = true

    const stars = this._calcStars()
    GameState.starsEarned = stars
    ProgressManager.saveResult(this._level.id, stars)

    AudioManager.playWin()
    this.cameras.main.flash(300, 255, 255, 100)
    this.time.delayedCall(500, () => {
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
    const par = this._level.parScore ?? this._totalBlocks
    const launches = this._level.shooterQueue.length - this._slots.remainingCount
    if (launches <= par) return 3
    if (launches <= par + 2) return 2
    return 1
  }
}
