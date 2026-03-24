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

export const BELT_Y = 370          // vertical center of the conveyor belt
export const BELT_HEIGHT = 80      // visual height of the belt lane
export const DANGER_X = 60         // x position of the left danger zone
export const BLOCK_SIZE = 48       // width and height of a color block sprite
export const SHOOTER_SIZE = 48     // size of a shooter sprite

export const DEFAULT_BELT_SPEED = 60      // pixels per second
export const DEFAULT_BELT_CAPACITY = 5    // max shooters on belt at once
export const DEFAULT_AMMO = 5             // default shots per shooter
export const ATTACK_RANGE = 80            // pixels — shooter attacks block within this distance
export const ATTACK_DAMAGE = 1
export const ATTACK_RATE = 500            // ms between shots from one shooter

// Bench system
export const BENCH_CAPACITY = 5
export const BENCH_COOLDOWN_MS = 2500     // ms before a benched shooter re-queues
export const BENCH_Y = 490                // y center of the bench row

// Rotating tray
export const TRAY_VISIBLE_SLOTS = 3       // how many shooter slots are visible at once
export const TRAY_Y = 640                 // y center of the tray row

// Slinging
export const SLING_WINDOW_MS = 400        // ms window for rapid deploy chaining
export const SLING_MAX = 10               // max chain length

export const SCENES = {
  BOOT: 'BootScene',
  MENU: 'MenuScene',
  LEVEL_SELECT: 'LevelSelectScene',
  GAME: 'GameScene',
  WIN: 'WinScene',
  LOSS: 'LossScene',
  PAUSE: 'PauseScene',
}
