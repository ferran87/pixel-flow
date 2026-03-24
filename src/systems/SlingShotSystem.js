import Phaser from 'phaser'
import { SLING_WINDOW_MS, SLING_MAX, GAME_WIDTH, BELT_Y } from '../constants.js'

export default class SlingShotSystem extends Phaser.Events.EventEmitter {
  constructor(scene) {
    super()
    this.scene = scene
    this._chainCount = 0
    this._lastDeployTime = -Infinity
    this._resetTimer = null
    this._maxChain = 0

    this._buildUI()
  }

  _buildUI() {
    this._chainText = this.scene.add.text(GAME_WIDTH / 2, BELT_Y - 72, '', {
      fontSize: '26px', fontFamily: 'monospace', fontStyle: 'bold', color: '#FFD700',
    }).setOrigin(0.5).setAlpha(0).setDepth(10)

    // Subtle glow ring around screen edges during chain
    this._glowLeft  = this.scene.add.rectangle(0, BELT_Y, 8, 120, 0xFFD700, 0).setOrigin(0, 0.5).setDepth(9)
    this._glowRight = this.scene.add.rectangle(GAME_WIDTH, BELT_Y, 8, 120, 0xFFD700, 0).setOrigin(1, 0.5).setDepth(9)
  }

  // Call this every time a shooter is deployed
  recordDeploy(now) {
    const elapsed = now - this._lastDeployTime
    this._lastDeployTime = now

    if (elapsed <= SLING_WINDOW_MS) {
      this._chainCount = Math.min(this._chainCount + 1, SLING_MAX)
    } else {
      this._chainCount = 1
    }

    if (this._chainCount > this._maxChain) {
      this._maxChain = this._chainCount
    }

    // Reset timer — chain breaks after window of inactivity
    if (this._resetTimer) this._resetTimer.remove()
    this._resetTimer = this.scene.time.delayedCall(SLING_WINDOW_MS + 60, () => {
      const finalChain = this._chainCount
      this._chainCount = 0
      this.emit('chainEnded', finalChain)
      this._hideUI()
    })

    this._updateUI()
    this.emit('chain', this._chainCount)
  }

  _updateUI() {
    if (this._chainCount < 2) {
      this._chainText.setAlpha(0)
      this._glowLeft.setAlpha(0)
      this._glowRight.setAlpha(0)
      return
    }

    const intensity = Math.min((this._chainCount - 1) / (SLING_MAX - 1), 1)
    const glowAlpha = 0.25 + intensity * 0.5

    this._chainText.setText(`SLING ×${this._chainCount}`)
    this.scene.tweens.killTweensOf(this._chainText)
    this.scene.tweens.add({
      targets: this._chainText,
      alpha: 1,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 90,
      yoyo: true,
      onComplete: () => this._chainText.setAlpha(1),
    })

    this._glowLeft.setAlpha(glowAlpha)
    this._glowRight.setAlpha(glowAlpha)
  }

  _hideUI() {
    this.scene.tweens.add({ targets: this._chainText, alpha: 0, duration: 350 })
    this.scene.tweens.add({ targets: this._glowLeft, alpha: 0, duration: 350 })
    this.scene.tweens.add({ targets: this._glowRight, alpha: 0, duration: 350 })
  }

  get currentChain() {
    return this._chainCount
  }

  get maxChainAchieved() {
    return this._maxChain
  }
}
