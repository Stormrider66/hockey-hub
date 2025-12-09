import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';

export interface BotUser {
  id: string;
  name: string;
  type: string;
  avatar: string;
  description: string;
  isActive: boolean;
  permissions: string[];
}

export interface BotActivity {
  id: string;
  botName: string;
  botType: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: Date;
  details?: any;
}

export interface BotStats {
  botName: string;
  botType: string;
  messagesPerDay: number[];
  totalMessages: number;
  activeUsers: number;
  averageResponseTime: number;
  satisfactionRate: number;
}

export interface BotInteraction {
  botType: string;
  actionId: string;
  value: string;
  messageId?: string;
}

export function useBots() {
  const [bots, setBots] = useState<BotUser[]>([]);
  const [botActivity, setBotActivity] = useState<{
    activities: BotActivity[];
    stats: BotStats[];
  }>({ activities: [], stats: [] });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch bot configurations
  const fetchBots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bots');
      setBots(response.data.bots);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch bot configurations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Update bot configuration
  const updateBotConfig = useCallback(
    async (botType: string, updates: Partial<BotUser>) => {
      try {
        const response = await axios.put(`/api/bots/${botType}`, updates);
        setBots((current) =>
          current.map((bot) =>
            bot.type === botType ? { ...bot, ...response.data.bot } : bot
          )
        );
        toast({
          title: 'Success',
          description: 'Bot configuration updated',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to update bot configuration',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  // Handle bot interaction
  const handleBotInteraction = useCallback(
    async (interaction: BotInteraction) => {
      try {
        await axios.post(`/api/bots/${interaction.botType}/interact`, {
          actionId: interaction.actionId,
          value: interaction.value,
          messageId: interaction.messageId,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to process bot interaction',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  // Ask FAQ bot a question
  const askFAQBot = useCallback(
    async (question: string, conversationId?: string) => {
      try {
        await axios.post('/api/bots/faq/ask', {
          question,
          conversationId,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to process your question',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  // Fetch bot activity (admin only)
  const fetchBotActivity = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bots/activity');
      setBotActivity(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        toast({
          title: 'Access Denied',
          description: 'Admin access required to view bot activity',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch bot activity',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Check if a user is a bot
  const isBot = useCallback((userId: string) => {
    return bots.some((bot) => bot.id === userId);
  }, [bots]);

  // Get bot by ID
  const getBotById = useCallback(
    (botId: string) => {
      return bots.find((bot) => bot.id === botId);
    },
    [bots]
  );

  // Get bot by type
  const getBotByType = useCallback(
    (botType: string) => {
      return bots.find((bot) => bot.type === botType);
    },
    [bots]
  );

  // Initialize bots on mount
  useEffect(() => {
    fetchBots();
  }, [fetchBots]);

  return {
    bots,
    botActivity,
    loading,
    fetchBots,
    updateBotConfig,
    handleBotInteraction,
    askFAQBot,
    fetchBotActivity,
    isBot,
    getBotById,
    getBotByType,
  };
}

// Hook for bot-specific features
export function useBotFeatures(botType: string) {
  const { toast } = useToast();

  // Send system notification
  const sendSystemNotification = useCallback(
    async (type: string, userId: string, data: any) => {
      try {
        await axios.post('/api/bots/system/notify', {
          type,
          userId,
          data,
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to send system notification',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  // Schedule training reminder
  const scheduleTrainingReminder = useCallback(
    async (reminder: any) => {
      try {
        await axios.post('/api/bots/training/reminder', reminder);
        toast({
          title: 'Success',
          description: 'Training reminder scheduled',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to schedule training reminder',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  // Schedule medical appointment
  const scheduleMedicalAppointment = useCallback(
    async (appointment: any) => {
      try {
        await axios.post('/api/bots/medical/appointment', appointment);
        toast({
          title: 'Success',
          description: 'Appointment reminders scheduled',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to schedule appointment reminders',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  // Send team announcement
  const sendTeamAnnouncement = useCallback(
    async (type: string, data: any) => {
      try {
        await axios.post('/api/bots/coach/announce', {
          type,
          data,
        });
        toast({
          title: 'Success',
          description: 'Team announcement sent',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to send team announcement',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  return {
    sendSystemNotification,
    scheduleTrainingReminder,
    scheduleMedicalAppointment,
    sendTeamAnnouncement,
  };
}