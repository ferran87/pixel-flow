// Schedules block spawns from level data using Phaser time events.
// Call load() from GameScene.create() after ConveyorBelt is ready.

export default class LevelLoader {
  constructor(scene, levelData, belt) {
    this.scene = scene
    this.levelData = levelData
    this.belt = belt
    this._timerEvents = []
    this._totalBlocks = levelData.blocks.length
  }

  load() {
    let cumulativeDelay = 0

    this.levelData.blocks.forEach((blockDef) => {
      cumulativeDelay += blockDef.delay

      const evt = this.scene.time.delayedCall(cumulativeDelay, () => {
        if (blockDef.double) {
          this.belt.spawnDoubleBlock(blockDef.color)
        } else {
          this.belt.spawnBlock(blockDef.color, blockDef.health || 1)
        }
      })
      this._timerEvents.push(evt)
    })
  }

  get totalBlocks() {
    return this._totalBlocks
  }

  destroy() {
    this._timerEvents.forEach(e => e.remove())
  }
}
