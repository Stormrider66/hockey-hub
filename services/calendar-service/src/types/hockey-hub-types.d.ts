declare module '@hockey-hub/types' {
  export type UUID = string;
  export type ISODateString = string;

  export enum EventType {
    ICE_TRAINING = 'ice-training',
    PHYSICAL_TRAINING = 'physical-training',
    GAME = 'game',
    MEETING = 'meeting',
    MEDICAL = 'medical',
    TRAVEL = 'travel',
    OTHER = 'other'
  }

  export enum EventStatus {
    PLANNED = 'scheduled',
    CANCELED = 'canceled',
    COMPLETED = 'completed'
  }

  export enum EventRepetition {
    NONE = 'NONE',
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY'
  }

  export enum AttendeeStatus {
    INVITED = 'invited',
    ATTENDING = 'attending',
    ABSENT = 'absent',
    MAYBE = 'maybe'
  }
} 