import Phaser from 'phaser'
import {
  SCENES, GAME_WIDTH, GAME_HEIGHT, BELT_Y, DANGER_X,
  DEFAULT_BELT_CAPACITY, DEFAULT_AMMO, BENCH_CAPACITY,
} from '../constants.js'
import GameState from '../GameState.js'
import ConveyorBelt from '../objects/ConveyorBelt.js'
import Shooter from '../objects/Shooter.js'
import RotatingTray from '../objects/RotatingTray.js'
import Bench from '../objects/Bench.js'
import LevelLoader from '../systems/LevelLoader.js'
import SlingShotSystem from '../systems/SlingShotSystem.js'
import * as AttackSystem from '../systems/AttackSystem.js'
import * as ProgressManager from '../systems/ProgressManager.js'
import * as AudioManager from '../systems/AudioManager.js'
import * as PictureBuilder from '../utils/PictureBuilder.js'

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
    this._beltCapacity = level.beltCapacity ?? DEFAULT_BELT_CAPACITY
    this._benchActive = (level.benchCapacity ?? 0) > 0
    this._activeShooters = []
    this._beltSlots = new Array(this._beltCapacity).fill(null)
    this._blocksDestroyed = 0
    this._totalBlocks = level.blocks.length
    this._gameOver = false
    this._allBlocksSpawned = false
    this._totalDeploys = 0

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x12121e)

    // Conveyor belt
    this._belt = new ConveyorBelt(this, level.beltSpeed)

    // Level loader schedules block spawns
    this._loader = new LevelLoader(this, level, this._belt)
    this._loader.load()

    // Flag when all blocks have been queued (last cumulative delay + buffer)
    const totalDelay = level.blocks.reduce((sum, b) => sum + b.delay, 0)
    this.time.delayedCall(totalDelay + 500, () => { this._allBlocksSpawned = true })

    // Bench (may be inactive for tutorial levels)
    this._bench = new Bench(this)
    if (!this._benchActive) {
      // Hide bench UI for early levels
      this._bench._overflowFlash?.setAlpha(0)
    }

    // Bench → tray pipeline
    this._bench.on('shooterReady', (color) => {
      if (this._benchActive) this._tray.addToQueue(color)
    })

    // Rotating tray (replaces WaitingSlots)
    const trayConfig = level.trayConfig ?? {}
    this._tray = new RotatingTray(this, level.shooterQueue, trayConfig.rotating ?? false)
    this._tray.on('shooterSelected', (color) => {
      this._sling.recordDeploy(this.time.now)
      this._deployShooter(color)
    })

    // Sling system
    this._sling = new SlingShotSystem(this)

    // Picture builder (HUD preview)
    this._picture = this._buildPicturePreview(level)

    // HUD
    this._buildHUD()
    this._buildPauseButton()

    // Speed trigger flag
    if (level.speedTrigger) {
      this._speedTriggered = false
    }
  }

  // ─── Belt slot helpers ────────────────────────────────────────────────────

  _slotX(slotIndex) {
    const rightEdge = GAME_WIDTH - 40
    const leftEdge  = DANGER_X + 80
    const step = (rightEdge - leftEdge) / Math.max(this._beltCapacity - 1, 1)
    return rightEdge - slotIndex * step
  }

  _deployShooter(color) {
    const freeSlot = this._beltSlots.findIndex(s => s === null)
    if (freeSlot === -1) {
      // Belt full flash
      this._capacityText?.setStyle({ color: '#ff4444' })
      this.time.delayedCall(400, () => this._capacityText?.setStyle({ color: '#888899' }))
      return
    }

    const ammo = this._level.ammo ?? DEFAULT_AMMO
    const shooter = new Shooter(this, this._slotX(freeSlot), BELT_Y, color, ammo)
    this._beltSlots[freeSlot] = shooter
    this._totalDeploys++

    shooter.on('benching', (s) => {
      // Free belt slot
      const slotIdx = this._beltSlots.indexOf(s)
      if (slotIdx !== -1) this._beltSlots[slotIdx] = null
      const idx = this._activeShooters.indexOf(s)
      if (idx !== -1) this._activeShooters.splice(idx, 1)

      // Send to bench (bench handles re-queue via event)
      if (this._benchActive) {
        this._bench.add(s.color)
      }
    })

    this._activeShooters.push(shooter)
  }

  // ─── Picture preview (HUD) ────────────────────────────────────────────────

  _buildPicturePreview(level) {
    const px = GAME_WIDTH - 44
    const py = 85
    return PictureBuilder.build(this, level.blocks, px, py, 5)
  }

  _revealPictureTile(index) {
    this._picture?.reveal(index)
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  _buildHUD() {
    // Level name (top left)
    this.add.text(16, 16, `${this._level.id}. ${this._level.name}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#aaaacc',
    }).setOrigin(0, 0.5)

    // Block counter
    this._blockCountText = this.add.text(GAME_WIDTH / 2, 50, this._getCounterText(), {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5)

    // Progress bar
    this._progressBg = this.add.rectangle(GAME_WIDTH / 2, 72, GAME_WIDTH - 40, 6, 0x333355)
    this._progressBar = this.add.rectangle(20, 72, 0, 6, 0x4AE86B).setOrigin(0, 0.5)

    // Belt capacity
    this._capacityText = this.add.text(GAME_WIDTH - 16, 50, '', {
      fontSize: '12px', fontFamily: 'monospace', color: '#888899',
    }).setOrigin(1, 0.5)
  }

  _buildPauseButton() {
    const pauseBtn = this.add.text(GAME_WIDTH - 16, 18, '⏸', {
      fontSize: '20px',
    }).setOrigin(1, 0.5).setInteractive({ cursor: 'pointer' })

    pauseBtn.on('pointerdown', () => {
      this.scene.pause()
      this.scene.launch(SCENES.PAUSE)
    })
  }

  _getCounterText() {
    const remaining = this._totalBlocks - this._blocksDestroyed
    return `${remaining} block${remaining !== 1 ? 's' : ''} left`
  }

  _updateHUD() {
    this._blockCountText?.setText(this._getCounterText())

    const progress = this._totalBlocks > 0 ? this._blocksDestroyed / this._totalBlocks : 0
    this._progressBar.width = (GAME_WIDTH - 40) * progress

    const active = this._beltSlots.filter(s => s !== null).length
    this._capacityText?.setText(`${active}/${this._beltCapacity}`)

    // Speed trigger
    if (this._level.speedTrigger && !this._speedTriggered) {
      const remaining = this._totalBlocks - this._blocksDestroyed
      if (remaining <= this._level.speedTrigger.blocksRemaining) {
        this._belt.setSpeed(this._belt.speed * this._level.speedTrigger.multiplier)
        this._speedTriggered = true
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

  // ─── Main loop ────────────────────────────────────────────────────────────

  update(time, delta) {
    if (this._gameOver) return

    const safeDelta = Math.min(delta, 100)

    const escaped = this._belt.update(safeDelta)
    if (escaped) {
      this._triggerLoss(); return
    }

    const events = AttackSystem.resolve(this._activeShooters, this._belt.getBlocks(), time)

    events.forEach(evt => {
      if (evt.type === 'blockDestroyed') {
        const idx = this._blocksDestroyed  // reveal tiles in destruction order
        this._blocksDestroyed++
        GameState.score++
        this._belt.removeBlock(evt.block)
        this._revealPictureTile(idx)
        AudioManager.playBlockDestroy()
      } else if (evt.type === 'shooterBenched') {
        AudioManager.playShooterDepleted()
      }
    })

    this._updateHUD()

    if (
      this._allBlocksSpawned &&
      this._belt.blockCount === 0 &&
      this._blocksDestroyed >= this._totalBlocks
    ) {
      this._triggerWin()
    }
  }

  // ─── Win / Loss ───────────────────────────────────────────────────────────

  _triggerWin() {
    if (this._gameOver) return
    this._gameOver = true

    const stars = this._calcStars()
    GameState.starsEarned = stars
    ProgressManager.saveResult(this._level.id, stars)

    // Animate picture complete (reveal any not yet shown)
    this._picture?.revealAll(40)

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
    const par = this._level.parScore ?? this._totalBlocks
    const launches = this._totalDeploys
    const slingStar = this._level.slingStar ?? 0
    const slingAchieved = this._sling.maxChainAchieved >= slingStar

    if (launches <= par && (slingStar === 0 || slingAchieved)) return 3
    if (launches <= par + 2) return 2
    return 1
  }
}
