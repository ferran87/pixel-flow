const STORAGE_KEY_PROGRESS = 'pixelflow_progress'
const STORAGE_KEY_SETTINGS = 'pixelflow_settings'

function _loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_PROGRESS)) || { stars: {}, completed: [] }
  } catch {
    return { stars: {}, completed: [] }
  }
}

function _saveProgress(data) {
  localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(data))
}

export function saveResult(levelId, starsEarned) {
  const data = _loadProgress()
  const prev = data.stars[levelId] || 0
  if (starsEarned > prev) {
    data.stars[levelId] = starsEarned
  }
  if (!data.completed.includes(levelId)) {
    data.completed.push(levelId)
  }
  _saveProgress(data)
}

export function getProgress() {
  return _loadProgress()
}

export function getStars(levelId) {
  return _loadProgress().stars[levelId] || 0
}

export function isUnlocked(levelId) {
  return true
}

export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS)) || { sfxVolume: 0.8, musicVolume: 0.5 }
  } catch {
    return { sfxVolume: 0.8, musicVolume: 0.5 }
  }
}

export function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings))
}
