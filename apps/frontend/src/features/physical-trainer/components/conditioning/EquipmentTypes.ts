// Simple equipment types without enum to avoid runtime issues
export const EQUIPMENT_TYPES = {
  RUNNING: 'running',
  ROWING: 'rowing',
  SKIERG: 'skierg',
  BIKE_ERG: 'bike_erg',
  WATTBIKE: 'wattbike',
  AIRBIKE: 'airbike',
  ROPE_JUMP: 'rope_jump',
  TREADMILL: 'treadmill'
} as const;

export type EquipmentType = typeof EQUIPMENT_TYPES[keyof typeof EQUIPMENT_TYPES];