export const GAME_WIDTH = 480
export const GAME_HEIGHT = 854

export const COLORS = ['red', 'blue', 'yellow', 'green', 'purple', 'orange']

export const COLOR_HEX = {
  red:    0xE8534A,
  blue:   0x4A7BE8,
  yellow: 0xE8D44A,
  green:  0x4AE86B,
  purple: 0x9B4AE8,
  orange: 0xE8924A,
}

// Grid (pixel-art picture)
export const GRID_TOP = 100
export const GRID_MAX_WIDTH = 380
export const GRID_MAX_HEIGHT = 380
export const GRID_CELL_SIZE = 20

// Rail track around the grid
export const RAIL_MARGIN = 32
export const DEFAULT_RAIL_SPEED = 120
export const RAIL_FIRE_RATE = 300
export const DEFAULT_RAIL_CAPACITY = 5

// Monster (shooter on rail)
export const MONSTER_SIZE = 36

// Monster selector (bottom tray)
export const SELECTOR_Y = 730
export const SELECTOR_COLS = 3
export const SELECTOR_ROWS = 2

export const SCENES = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  LEVEL_SELECT: 'LevelSelectScene',
  GAME: 'GameScene',
  WIN: 'WinScene',
  LOSS: 'LossScene',
  PAUSE: 'PauseScene',
}
