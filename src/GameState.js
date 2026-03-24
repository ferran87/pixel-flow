// Singleton holding runtime state shared across scenes
const GameState = {
  // All levels loaded from data/levels.json
  levels: [],

  // Currently active level id (1-based)
  currentLevelId: 1,

  // Score for the current run (blocks destroyed)
  score: 0,

  // Stars earned in current run (computed at win time)
  starsEarned: 0,

  reset() {
    this.score = 0
    this.starsEarned = 0
  },

  getCurrentLevel() {
    return this.levels.find(l => l.id === this.currentLevelId) || this.levels[0]
  },
}

export default GameState
