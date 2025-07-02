import { BaseBotService } from './BaseBotService';
import { SystemBot } from './SystemBot';
import { CoachBot } from './CoachBot';
import { FAQBot } from './FAQBot';
import { TrainingReminderBot } from './TrainingReminderBot';
import { MedicalAppointmentBot } from './MedicalAppointmentBot';
import { BotType, BotUser, BOT_USERS } from './BotUser';
import { OptimizedSocketManager } from '../sockets/OptimizedSocketManager';
import { Logger } from '@hockey-hub/shared-lib';

export class BotManager {
  private static instance: BotManager;
  private bots: Map<BotType, BaseBotService>;
  private socketManager?: OptimizedSocketManager;
  private logger: Logger;
  private initialized: boolean = false;

  private constructor() {
    this.bots = new Map();
    this.logger = new Logger('BotManager');
  }

  public static getInstance(): BotManager {
    if (!BotManager.instance) {
      BotManager.instance = new BotManager();
    }
    return BotManager.instance;
  }

  /**
   * Initialize all bots
   */
  public async initialize(socketManager?: OptimizedSocketManager): Promise<void> {
    if (this.initialized) {
      this.logger.warn('BotManager already initialized');
      return;
    }

    this.socketManager = socketManager;

    try {
      // Create and initialize all bots
      const botInstances: Array<[BotType, BaseBotService]> = [
        [BotType.SYSTEM, new SystemBot()],
        [BotType.COACH, new CoachBot()],
        [BotType.FAQ, new FAQBot()],
        [BotType.TRAINING_REMINDER, new TrainingReminderBot()],
        [BotType.MEDICAL_APPOINTMENT, new MedicalAppointmentBot()],
      ];

      // Initialize each bot
      for (const [type, bot] of botInstances) {
        if (socketManager) {
          bot.setSocketManager(socketManager);
        }
        await bot.initialize();
        this.bots.set(type, bot);
        this.logger.info(`Initialized bot: ${type}`);
      }

      this.initialized = true;
      this.logger.info('All bots initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize bots:', error);
      throw error;
    }
  }

  /**
   * Get a specific bot
   */
  public getBot<T extends BaseBotService>(type: BotType): T | undefined {
    return this.bots.get(type) as T;
  }

  /**
   * Get System Bot
   */
  public getSystemBot(): SystemBot {
    const bot = this.getBot<SystemBot>(BotType.SYSTEM);
    if (!bot) {
      throw new Error('System Bot not initialized');
    }
    return bot;
  }

  /**
   * Get Coach Bot
   */
  public getCoachBot(): CoachBot {
    const bot = this.getBot<CoachBot>(BotType.COACH);
    if (!bot) {
      throw new Error('Coach Bot not initialized');
    }
    return bot;
  }

  /**
   * Get FAQ Bot
   */
  public getFAQBot(): FAQBot {
    const bot = this.getBot<FAQBot>(BotType.FAQ);
    if (!bot) {
      throw new Error('FAQ Bot not initialized');
    }
    return bot;
  }

  /**
   * Get Training Reminder Bot
   */
  public getTrainingReminderBot(): TrainingReminderBot {
    const bot = this.getBot<TrainingReminderBot>(BotType.TRAINING_REMINDER);
    if (!bot) {
      throw new Error('Training Reminder Bot not initialized');
    }
    return bot;
  }

  /**
   * Get Medical Appointment Bot
   */
  public getMedicalAppointmentBot(): MedicalAppointmentBot {
    const bot = this.getBot<MedicalAppointmentBot>(BotType.MEDICAL_APPOINTMENT);
    if (!bot) {
      throw new Error('Medical Appointment Bot not initialized');
    }
    return bot;
  }

  /**
   * Handle bot interaction from user
   */
  public async handleBotInteraction(
    botType: BotType,
    interaction: any
  ): Promise<void> {
    const bot = this.bots.get(botType);
    if (!bot) {
      this.logger.error(`Bot not found: ${botType}`);
      throw new Error(`Bot not found: ${botType}`);
    }

    await bot.handleInteraction(interaction);
  }

  /**
   * Process a message for bot commands
   */
  public async processMessage(
    userId: string,
    message: string,
    conversationId?: string
  ): Promise<boolean> {
    // Check for bot commands
    if (message.startsWith('/')) {
      return await this.handleCommand(userId, message, conversationId);
    }

    // Check if message is a question (ends with ?)
    if (message.endsWith('?') || this.looksLikeQuestion(message)) {
      const faqBot = this.getFAQBot();
      await faqBot.answerQuestion(userId, message, conversationId);
      return true;
    }

    return false;
  }

  /**
   * Handle bot commands
   */
  private async handleCommand(
    userId: string,
    command: string,
    conversationId?: string
  ): Promise<boolean> {
    const [cmd, ...args] = command.slice(1).split(' ');
    const argument = args.join(' ');

    switch (cmd.toLowerCase()) {
      case 'help':
      case 'faq':
        const faqBot = this.getFAQBot();
        if (argument) {
          await faqBot.answerQuestion(userId, argument, conversationId);
        } else {
          await faqBot.showCategories(userId, conversationId);
        }
        return true;

      case 'status':
        const systemBot = this.getSystemBot();
        await systemBot.sendSystemStatusUpdate('operational', []);
        return true;

      case 'bots':
        await this.sendBotList(userId, conversationId);
        return true;

      default:
        return false;
    }
  }

  /**
   * Send list of available bots
   */
  private async sendBotList(userId: string, conversationId?: string): Promise<void> {
    let content = '🤖 Available Bots:\n\n';

    Object.values(BOT_USERS).forEach(bot => {
      content += `${bot.avatar} **${bot.name}** - ${bot.description}\n`;
    });

    content += '\n**Commands:**\n';
    content += '• `/help` or `/faq` - Get help or browse FAQs\n';
    content += '• `/status` - Check system status\n';
    content += '• `/bots` - Show this list\n';
    content += '\nYou can also ask questions naturally and I\'ll try to help!';

    const systemBot = this.getSystemBot();
    if (conversationId) {
      await systemBot.sendConversationMessage(conversationId, content);
    } else {
      await systemBot.sendDirectMessage(userId, content);
    }
  }

  /**
   * Check if text looks like a question
   */
  private looksLikeQuestion(text: string): boolean {
    const questionWords = ['what', 'when', 'where', 'why', 'how', 'who', 'which', 'can', 'could', 'would', 'should', 'is', 'are', 'do', 'does'];
    const lowerText = text.toLowerCase();
    
    return questionWords.some(word => lowerText.startsWith(word + ' '));
  }

  /**
   * Get all active bot users
   */
  public getAllBotUsers(): BotUser[] {
    return Object.values(BOT_USERS).filter(bot => bot.isActive);
  }

  /**
   * Check if a user ID is a bot
   */
  public isBot(userId: string): boolean {
    return Object.values(BOT_USERS).some(bot => bot.id === userId);
  }

  /**
   * Get bot user by ID
   */
  public getBotUser(userId: string): BotUser | undefined {
    return Object.values(BOT_USERS).find(bot => bot.id === userId);
  }

  /**
   * Shutdown all bots
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down all bots...');

    // Shutdown specific bots that have cleanup
    const trainingBot = this.getBot<TrainingReminderBot>(BotType.TRAINING_REMINDER);
    if (trainingBot) {
      trainingBot.shutdown();
    }

    const medicalBot = this.getBot<MedicalAppointmentBot>(BotType.MEDICAL_APPOINTMENT);
    if (medicalBot) {
      medicalBot.shutdown();
    }

    this.bots.clear();
    this.initialized = false;
    this.logger.info('All bots shut down');
  }
}

// Export singleton instance
export const botManager = BotManager.getInstance();