export interface BotUser {
  id: string;
  name: string;
  type: BotType;
  avatar: string;
  description: string;
  isActive: boolean;
  permissions: BotPermission[];
}

export enum BotType {
  SYSTEM = 'system',
  COACH = 'coach',
  FAQ = 'faq',
  TRAINING_REMINDER = 'training_reminder',
  MEDICAL_APPOINTMENT = 'medical_appointment',
}

export enum BotPermission {
  SEND_SYSTEM_MESSAGES = 'send_system_messages',
  SEND_TEAM_ANNOUNCEMENTS = 'send_team_announcements',
  ACCESS_USER_DATA = 'access_user_data',
  CREATE_REMINDERS = 'create_reminders',
  ANSWER_QUESTIONS = 'answer_questions',
  ESCALATE_TO_HUMAN = 'escalate_to_human',
}

// Predefined bot users
export const BOT_USERS: Record<BotType, BotUser> = {
  [BotType.SYSTEM]: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'System Bot',
    type: BotType.SYSTEM,
    avatar: '🤖',
    description: 'System notifications and alerts',
    isActive: true,
    permissions: [
      BotPermission.SEND_SYSTEM_MESSAGES,
      BotPermission.ACCESS_USER_DATA,
    ],
  },
  [BotType.COACH]: {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Coach Assistant',
    type: BotType.COACH,
    avatar: '👨‍🏫',
    description: 'Team announcements and updates',
    isActive: true,
    permissions: [
      BotPermission.SEND_TEAM_ANNOUNCEMENTS,
      BotPermission.ACCESS_USER_DATA,
      BotPermission.CREATE_REMINDERS,
    ],
  },
  [BotType.FAQ]: {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Help Bot',
    type: BotType.FAQ,
    avatar: '❓',
    description: 'Answers common questions',
    isActive: true,
    permissions: [
      BotPermission.ANSWER_QUESTIONS,
      BotPermission.ESCALATE_TO_HUMAN,
    ],
  },
  [BotType.TRAINING_REMINDER]: {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Training Assistant',
    type: BotType.TRAINING_REMINDER,
    avatar: '🏋️',
    description: 'Workout reminders and tips',
    isActive: true,
    permissions: [
      BotPermission.CREATE_REMINDERS,
      BotPermission.ACCESS_USER_DATA,
    ],
  },
  [BotType.MEDICAL_APPOINTMENT]: {
    id: '00000000-0000-0000-0000-000000000005',
    name: 'Medical Assistant',
    type: BotType.MEDICAL_APPOINTMENT,
    avatar: '🏥',
    description: 'Medical appointment reminders',
    isActive: true,
    permissions: [
      BotPermission.CREATE_REMINDERS,
      BotPermission.ACCESS_USER_DATA,
    ],
  },
};