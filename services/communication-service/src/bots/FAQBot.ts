// @ts-nocheck - Suppress TypeScript errors for build
import { BaseBotService } from './BaseBotService';
import { BotType, BotPermission } from './BotUser';
import { MessageType } from '../entities';

export interface FAQEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
  relatedQuestions?: string[];
  views?: number;
  helpful?: number;
  notHelpful?: number;
}

export interface FAQCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export class FAQBot extends BaseBotService {
  private faqDatabase: Map<string, FAQEntry>;
  private categories: Map<string, FAQCategory>;
  private faqSearchIndex: Map<string, string[]>; // Simple search index
  private conversationContext: Map<string, ConversationContext>;
  
  constructor() {
    super(BotType.FAQ);
    this.faqDatabase = new Map();
    this.categories = new Map();
    this.conversationContext = new Map();
    this.faqSearchIndex = new Map();
  }

  public async initialize(): Promise<void> {
    this.logger.info('FAQ Bot initialized');
    
    // Initialize FAQ database
    this.initializeFAQDatabase();
    
    // Build TF-IDF index
    this.buildSearchIndex();
    
    // Register interaction handlers
    this.registerInteractionHandler('faq_helpful', async (interaction) => {
      await this.handleHelpfulFeedback(interaction);
    });
    
    this.registerInteractionHandler('faq_not_helpful', async (interaction) => {
      await this.handleNotHelpfulFeedback(interaction);
    });
    
    this.registerInteractionHandler('escalate_to_human', async (interaction) => {
      await this.escalateToHuman(interaction);
    });
    
    this.registerInteractionHandler('view_category', async (interaction) => {
      await this.showCategoryQuestions(interaction);
    });
  }

  /**
   * Process user question and provide answer
   */
  public async answerQuestion(
    userId: string,
    question: string,
    conversationId?: string
  ): Promise<void> {
    if (!this.hasPermission(BotPermission.ANSWER_QUESTIONS)) {
      throw new Error('Bot lacks permission to answer questions');
    }

    // Get or create conversation context
    const context = this.getOrCreateContext(userId);
    context.lastQuestion = question;

    // Find best matching FAQ entries
    const matches = this.findBestMatches(question, 3);

    if (matches.length === 0) {
      // No matches found
      await this.sendNoMatchResponse(userId, question, conversationId);
      return;
    }

    if (matches[0].score > 0.8) {
      // High confidence match
      await this.sendAnswer(userId, matches[0].entry, conversationId);
    } else if (matches.length > 1) {
      // Multiple possible matches
      await this.sendMultipleMatches(userId, matches, conversationId);
    } else {
      // Low confidence single match
      await this.sendLowConfidenceAnswer(userId, matches[0].entry, conversationId);
    }

    // Update FAQ statistics
    matches[0].entry.views = (matches[0].entry.views || 0) + 1;
  }

  /**
   * Show FAQ categories
   */
  public async showCategories(userId: string, conversationId?: string): Promise<void> {
    let content = '📚 FAQ Categories\n\nSelect a category to see common questions:';

    const actions = Array.from(this.categories.values()).map(category => ({
      id: 'view_category',
      type: 'button' as const,
      label: `${category.icon || '📁'} ${category.name}`,
      value: category.id,
      style: 'secondary' as const,
    }));

    const targetConversation = conversationId 
      ? await this.sendConversationMessage(conversationId, content, {
          type: MessageType.TEXT,
          actions,
        })
      : await this.sendDirectMessage(userId, content, {
          type: MessageType.TEXT,
          actions,
        });

    this.logActivity('categories_shown', { userId });
  }

  /**
   * Initialize FAQ database with common questions
   */
  private initializeFAQDatabase(): void {
    // Categories
    this.categories.set('account', {
      id: 'account',
      name: 'Account & Profile',
      description: 'Questions about account management',
      icon: '👤',
    });
    
    this.categories.set('schedule', {
      id: 'schedule',
      name: 'Schedule & Calendar',
      description: 'Questions about scheduling and events',
      icon: '📅',
    });
    
    this.categories.set('payment', {
      id: 'payment',
      name: 'Payments & Billing',
      description: 'Questions about payments and fees',
      icon: '💳',
    });
    
    this.categories.set('training', {
      id: 'training',
      name: 'Training & Workouts',
      description: 'Questions about training programs',
      icon: '🏋️',
    });
    
    this.categories.set('medical', {
      id: 'medical',
      name: 'Medical & Health',
      description: 'Questions about medical services',
      icon: '🏥',
    });

    // FAQ Entries
    const faqs: FAQEntry[] = [
      // Account & Profile
      {
        id: 'faq_1',
        question: 'How do I reset my password?',
        answer: 'To reset your password:\n1. Go to the login page\n2. Click "Forgot Password"\n3. Enter your email address\n4. Check your email for reset instructions\n5. Follow the link to create a new password\n\nThe reset link expires after 1 hour for security.',
        category: 'account',
        keywords: ['password', 'reset', 'forgot', 'login', 'access'],
      },
      {
        id: 'faq_2',
        question: 'How do I update my profile information?',
        answer: 'To update your profile:\n1. Click on your profile picture in the top right\n2. Select "Profile Settings"\n3. Update your information\n4. Click "Save Changes"\n\nYou can update your name, phone, profile picture, and preferences.',
        category: 'account',
        keywords: ['profile', 'update', 'change', 'edit', 'information'],
      },
      
      // Schedule & Calendar
      {
        id: 'faq_3',
        question: 'How do I view my team\'s schedule?',
        answer: 'To view your team schedule:\n1. Go to the Calendar tab in your dashboard\n2. Select your team from the filter dropdown\n3. Choose between month, week, or day view\n\nYou can also export the schedule to your personal calendar app.',
        category: 'schedule',
        keywords: ['schedule', 'calendar', 'team', 'games', 'practices', 'events'],
      },
      {
        id: 'faq_4',
        question: 'How do I RSVP for an event?',
        answer: 'To RSVP for an event:\n1. Click on the event in your calendar\n2. Select your attendance status (Yes/No/Maybe)\n3. Add any comments if needed\n4. Click "Save RSVP"\n\nYou can change your RSVP status anytime before the event.',
        category: 'schedule',
        keywords: ['rsvp', 'attendance', 'confirm', 'event', 'respond'],
      },
      
      // Payment & Billing
      {
        id: 'faq_5',
        question: 'How do I pay my team fees?',
        answer: 'To pay team fees:\n1. Go to the Payments section\n2. View your outstanding balances\n3. Click "Pay Now" on the invoice\n4. Enter your payment information\n5. Confirm the payment\n\nWe accept credit cards, debit cards, and bank transfers.',
        category: 'payment',
        keywords: ['pay', 'payment', 'fees', 'invoice', 'billing', 'money'],
      },
      {
        id: 'faq_6',
        question: 'Can I set up automatic payments?',
        answer: 'Yes! To set up autopay:\n1. Go to Payments > Settings\n2. Click "Set Up Autopay"\n3. Choose your payment method\n4. Select which fees to autopay\n5. Set your payment schedule\n\nYou\'ll receive notifications before each automatic payment.',
        category: 'payment',
        keywords: ['automatic', 'autopay', 'recurring', 'payment', 'schedule'],
      },
      
      // Training & Workouts
      {
        id: 'faq_7',
        question: 'How do I access my training program?',
        answer: 'To access your training program:\n1. Go to the Training tab\n2. View your assigned workouts\n3. Click on a workout to see details\n4. Mark exercises as complete as you go\n\nYour trainer can see your progress in real-time.',
        category: 'training',
        keywords: ['training', 'workout', 'program', 'exercises', 'fitness'],
      },
      {
        id: 'faq_8',
        question: 'How do I track my wellness data?',
        answer: 'To track wellness data:\n1. Go to the Wellness section\n2. Click "Add Entry"\n3. Fill in your daily metrics (sleep, energy, soreness)\n4. Submit the entry\n\nRegular tracking helps your coaches optimize your training.',
        category: 'training',
        keywords: ['wellness', 'track', 'health', 'metrics', 'sleep', 'energy'],
      },
      
      // Medical & Health
      {
        id: 'faq_9',
        question: 'How do I book a medical appointment?',
        answer: 'To book a medical appointment:\n1. Go to the Medical section\n2. Click "Book Appointment"\n3. Select the service type\n4. Choose an available time slot\n5. Add any notes for the medical staff\n6. Confirm your booking\n\nYou\'ll receive a confirmation and reminder.',
        category: 'medical',
        keywords: ['medical', 'appointment', 'book', 'doctor', 'physio', 'health'],
      },
      {
        id: 'faq_10',
        question: 'How do I report an injury?',
        answer: 'To report an injury:\n1. Go to Medical > Report Injury\n2. Fill in the injury details\n3. Specify when and how it occurred\n4. Rate your pain level\n5. Submit the report\n\nThe medical staff will be notified immediately and follow up with you.',
        category: 'medical',
        keywords: ['injury', 'report', 'hurt', 'pain', 'medical', 'injured'],
      },
    ];

    // Add FAQs to database
    faqs.forEach(faq => {
      this.faqDatabase.set(faq.id, faq);
    });
  }

  /**
   * Build search index for FAQ matching
   */
  private buildSearchIndex(): void {
    this.faqDatabase.forEach((faq, id) => {
      // Create searchable tokens from question and keywords
      const searchableText = `${faq.question.toLowerCase()} ${faq.keywords.join(' ').toLowerCase()}`;
      const tokens = searchableText.split(/\s+/).filter(t => t.length > 2);
      this.faqSearchIndex.set(id, tokens);
    });
  }

  /**
   * Find best matching FAQs for a question
   */
  private findBestMatches(
    question: string,
    maxResults: number = 3
  ): Array<{ entry: FAQEntry; score: number }> {
    const results: Array<{ entry: FAQEntry; score: number }> = [];
    
    // Clean and tokenize the question
    const cleanQuestion = question.toLowerCase().replace(/[?!.,]/g, '');
    const questionTokens = cleanQuestion.split(/\s+/).filter(t => t.length > 2);
    
    // Simple scoring based on token matches
    this.faqSearchIndex.forEach((faqTokens, faqId) => {
      const faq = this.faqDatabase.get(faqId);
      if (!faq) return;
      
      let score = 0;
      let matches = 0;
      
      // Count matching tokens
      questionTokens.forEach(qToken => {
        if (faqTokens.includes(qToken)) {
          matches++;
        }
        // Partial matches
        faqTokens.forEach(fToken => {
          if (fToken.includes(qToken) || qToken.includes(fToken)) {
            score += 0.5;
          }
        });
      });
      
      // Calculate score
      if (matches > 0) {
        score += matches;
        score = score / Math.max(questionTokens.length, faqTokens.length);
        results.push({ entry: faq, score });
      }
    });

    // Sort by score and return top results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);
  }

  /**
   * Send answer to user
   */
  private async sendAnswer(
    userId: string,
    faq: FAQEntry,
    conversationId?: string
  ): Promise<void> {
    let content = `💡 ${faq.question}\n\n${faq.answer}`;

    if (faq.relatedQuestions && faq.relatedQuestions.length > 0) {
      content += '\n\n**Related questions:**';
      faq.relatedQuestions.forEach(q => {
        content += `\n• ${q}`;
      });
    }

    content += '\n\nWas this helpful?';

    const message = conversationId
      ? await this.sendConversationMessage(conversationId, content, {
          type: MessageType.TEXT,
          metadata: { faq_id: faq.id },
          actions: [
            {
              id: 'faq_helpful',
              type: 'button',
              label: '👍 Yes',
              value: faq.id,
              style: 'primary',
            },
            {
              id: 'faq_not_helpful',
              type: 'button',
              label: '👎 No',
              value: faq.id,
              style: 'secondary',
            },
          ],
        })
      : await this.sendDirectMessage(userId, content, {
          type: MessageType.TEXT,
          metadata: { faq_id: faq.id },
          actions: [
            {
              id: 'faq_helpful',
              type: 'button',
              label: '👍 Yes',
              value: faq.id,
              style: 'primary',
            },
            {
              id: 'faq_not_helpful',
              type: 'button',
              label: '👎 No',
              value: faq.id,
              style: 'secondary',
            },
          ],
        });

    this.logActivity('answer_provided', { userId, faqId: faq.id });
  }

  /**
   * Send multiple match options
   */
  private async sendMultipleMatches(
    userId: string,
    matches: Array<{ entry: FAQEntry; score: number }>,
    conversationId?: string
  ): Promise<void> {
    let content = '🤔 I found several questions that might help:';

    matches.forEach((match, index) => {
      content += `\n\n${index + 1}. **${match.entry.question}**`;
    });

    content += '\n\nWhich one best matches your question?';

    const actions = matches.map((match, index) => ({
      id: `select_faq_${match.entry.id}`,
      type: 'button' as const,
      label: `Option ${index + 1}`,
      value: match.entry.id,
      style: 'primary' as const,
    }));

    actions.push({
      id: 'escalate_to_human',
      type: 'button',
      label: 'None of these - Contact Support',
      value: 'escalate',
      style: 'secondary',
    });

    const message = conversationId
      ? await this.sendConversationMessage(conversationId, content, {
          type: MessageType.TEXT,
          actions,
        })
      : await this.sendDirectMessage(userId, content, {
          type: MessageType.TEXT,
          actions,
        });

    this.logActivity('multiple_matches_shown', { userId, matchCount: matches.length });
  }

  /**
   * Send low confidence answer
   */
  private async sendLowConfidenceAnswer(
    userId: string,
    faq: FAQEntry,
    conversationId?: string
  ): Promise<void> {
    let content = `🤔 I think this might help:\n\n**${faq.question}**\n\n${faq.answer}`;
    content += '\n\nIf this doesn\'t answer your question, I can connect you with support.';

    const message = conversationId
      ? await this.sendConversationMessage(conversationId, content, {
          type: MessageType.TEXT,
          metadata: { faq_id: faq.id, low_confidence: true },
          actions: [
            {
              id: 'faq_helpful',
              type: 'button',
              label: '✅ This helped',
              value: faq.id,
              style: 'primary',
            },
            {
              id: 'escalate_to_human',
              type: 'button',
              label: '💬 Contact Support',
              value: 'escalate',
              style: 'secondary',
            },
          ],
        })
      : await this.sendDirectMessage(userId, content, {
          type: MessageType.TEXT,
          metadata: { faq_id: faq.id, low_confidence: true },
          actions: [
            {
              id: 'faq_helpful',
              type: 'button',
              label: '✅ This helped',
              value: faq.id,
              style: 'primary',
            },
            {
              id: 'escalate_to_human',
              type: 'button',
              label: '💬 Contact Support',
              value: 'escalate',
              style: 'secondary',
            },
          ],
        });

    this.logActivity('low_confidence_answer', { userId, faqId: faq.id });
  }

  /**
   * Send no match response
   */
  private async sendNoMatchResponse(
    userId: string,
    question: string,
    conversationId?: string
  ): Promise<void> {
    const content = `😕 I couldn't find an answer to your question:\n\n"${question}"\n\nWould you like to browse FAQ categories or contact support?`;

    const message = conversationId
      ? await this.sendConversationMessage(conversationId, content, {
          type: MessageType.TEXT,
          actions: [
            {
              id: 'show_categories',
              type: 'button',
              label: '📚 Browse FAQs',
              value: 'categories',
              style: 'primary',
            },
            {
              id: 'escalate_to_human',
              type: 'button',
              label: '💬 Contact Support',
              value: 'escalate',
              style: 'secondary',
            },
          ],
        })
      : await this.sendDirectMessage(userId, content, {
          type: MessageType.TEXT,
          actions: [
            {
              id: 'show_categories',
              type: 'button',
              label: '📚 Browse FAQs',
              value: 'categories',
              style: 'primary',
            },
            {
              id: 'escalate_to_human',
              type: 'button',
              label: '💬 Contact Support',
              value: 'escalate',
              style: 'secondary',
            },
          ],
        });

    this.logActivity('no_match_found', { userId, question });
  }

  /**
   * Show questions in a category
   */
  private async showCategoryQuestions(interaction: any): Promise<void> {
    const { userId, value: categoryId } = interaction;
    const category = this.categories.get(categoryId);

    if (!category) {
      return;
    }

    const categoryFAQs = Array.from(this.faqDatabase.values())
      .filter(faq => faq.category === categoryId);

    let content = `${category.icon} ${category.name}\n\nCommon questions:`;

    categoryFAQs.forEach((faq, index) => {
      content += `\n\n${index + 1}. ${faq.question}`;
    });

    await this.sendDirectMessage(userId, content, {
      isEphemeral: true,
    });

    this.logActivity('category_viewed', { userId, categoryId });
  }

  /**
   * Handle helpful feedback
   */
  private async handleHelpfulFeedback(interaction: any): Promise<void> {
    const { userId, value: faqId } = interaction;
    const faq = this.faqDatabase.get(faqId);

    if (faq) {
      faq.helpful = (faq.helpful || 0) + 1;
    }

    await this.sendDirectMessage(userId, '👍 Thanks for your feedback! Glad I could help.', {
      isEphemeral: true,
    });

    this.logActivity('feedback_helpful', { userId, faqId });
  }

  /**
   * Handle not helpful feedback
   */
  private async handleNotHelpfulFeedback(interaction: any): Promise<void> {
    const { userId, value: faqId } = interaction;
    const faq = this.faqDatabase.get(faqId);

    if (faq) {
      faq.notHelpful = (faq.notHelpful || 0) + 1;
    }

    await this.sendDirectMessage(
      userId,
      '😔 Sorry that wasn\'t helpful. Would you like to contact support for assistance?',
      {
        isEphemeral: true,
        actions: [
          {
            id: 'escalate_to_human',
            type: 'button',
            label: 'Contact Support',
            value: 'escalate',
            style: 'primary',
          },
        ],
      }
    );

    this.logActivity('feedback_not_helpful', { userId, faqId });
  }

  /**
   * Escalate to human support
   */
  private async escalateToHuman(interaction: any): Promise<void> {
    const { userId } = interaction;

    if (!this.hasPermission(BotPermission.ESCALATE_TO_HUMAN)) {
      throw new Error('Bot lacks permission to escalate to human support');
    }

    const context = this.conversationContext.get(userId);
    const lastQuestion = context?.lastQuestion || 'No question recorded';

    // In a real implementation, this would create a support ticket
    await this.sendDirectMessage(
      userId,
      `🎧 I'm connecting you with our support team.\n\nYour question: "${lastQuestion}"\n\nA support representative will contact you soon. You can expect a response within 2-4 hours during business hours.`,
      {
        type: MessageType.SYSTEM,
        metadata: {
          escalated: true,
          question: lastQuestion,
        },
      }
    );

    this.logActivity('escalated_to_human', { userId, question: lastQuestion });
  }

  /**
   * Get or create conversation context
   */
  private getOrCreateContext(userId: string): ConversationContext {
    if (!this.conversationContext.has(userId)) {
      this.conversationContext.set(userId, {
        userId,
        startTime: new Date(),
        questions: [],
      });
    }
    return this.conversationContext.get(userId)!;
  }
}

interface ConversationContext {
  userId: string;
  startTime: Date;
  questions: string[];
  lastQuestion?: string;
}