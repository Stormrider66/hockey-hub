import React, { useState } from 'react';
import { Bot, Send, Settings, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BotMessage } from './BotMessage';
import { BotConfiguration } from './BotConfiguration';
import { BotActivityMonitor } from './BotActivityMonitor';
import { useBots, useBotFeatures } from '@/hooks/useBots';
import { format } from 'date-fns';

// Mock data for demo
const mockMessages = [
  {
    id: '1',
    content: 'Welcome to Hockey Hub! I\'m here to help you get started.',
    timestamp: new Date(Date.now() - 3600000),
    botName: 'System Bot',
    botAvatar: '🤖',
    botType: 'system',
    actions: [
      {
        id: 'complete_profile',
        type: 'button' as const,
        label: 'Complete Profile',
        value: '/profile',
        style: 'primary' as const,
      },
    ],
  },
  {
    id: '2',
    content: '🏒 Practice Reminder\n\n**Date:** Tomorrow\n**Time:** 4:00 PM\n**Location:** Main Rink\n\nPlease confirm your attendance:',
    timestamp: new Date(Date.now() - 1800000),
    botName: 'Coach Assistant',
    botAvatar: '👨‍🏫',
    botType: 'coach',
    actions: [
      {
        id: 'confirm_attendance',
        type: 'button' as const,
        label: '✅ Will Attend',
        value: 'attending',
        style: 'primary' as const,
      },
      {
        id: 'confirm_attendance',
        type: 'button' as const,
        label: '❌ Cannot Attend',
        value: 'not_attending',
        style: 'secondary' as const,
      },
    ],
  },
  {
    id: '3',
    content: '💊 Medication Reminder\n\n**Medication:** Ibuprofen\n**Dosage:** 400mg\n\nPlease confirm when you\'ve taken your medication.',
    timestamp: new Date(Date.now() - 900000),
    botName: 'Medical Assistant',
    botAvatar: '🏥',
    botType: 'medical_appointment',
    actions: [
      {
        id: 'medication_taken',
        type: 'button' as const,
        label: '✅ Taken',
        value: 'ibuprofen',
        style: 'primary' as const,
      },
      {
        id: 'medication_taken',
        type: 'button' as const,
        label: '⏰ Snooze 30 min',
        value: 'snooze_ibuprofen',
        style: 'secondary' as const,
      },
    ],
  },
];

export const BotDemo: React.FC = () => {
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('chat');
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const { bots, botActivity, handleBotInteraction, askFAQBot, updateBotConfig } = useBots();
  const { sendTeamAnnouncement } = useBotFeatures('coach');

  const handleSendQuestion = async () => {
    if (!question.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      content: question,
      timestamp: new Date(),
      isUser: true,
    };

    // Simulate FAQ bot response
    const botResponse = {
      id: (Date.now() + 1).toString(),
      content: `I found this answer to your question:\n\n**How to reset password:**\n1. Go to login page\n2. Click "Forgot Password"\n3. Enter your email\n4. Check your email for reset link`,
      timestamp: new Date(),
      botName: 'Help Bot',
      botAvatar: '❓',
      botType: 'faq',
      actions: [
        {
          id: 'faq_helpful',
          type: 'button' as const,
          label: '👍 Helpful',
          value: 'faq_1',
          style: 'primary' as const,
        },
        {
          id: 'faq_not_helpful',
          type: 'button' as const,
          label: '👎 Not Helpful',
          value: 'faq_1',
          style: 'secondary' as const,
        },
      ],
    };

    setMessages([...messages, botResponse]);
    setQuestion('');
    
    // Actually ask the FAQ bot
    await askFAQBot(question);
  };

  const handleActionClick = async (actionId: string, value: string) => {
    // Handle bot interaction
    await handleBotInteraction({
      botType: 'faq', // This would be dynamic based on the bot
      actionId,
      value,
    });

    // Show feedback
    const feedbackMessage = {
      id: Date.now().toString(),
      content: 'Thanks for your feedback!',
      timestamp: new Date(),
      botName: 'Help Bot',
      botAvatar: '❓',
      botType: 'faq',
      isEphemeral: true,
    };

    setMessages([...messages, feedbackMessage]);
  };

  const sendDemoAnnouncement = async () => {
    await sendTeamAnnouncement('practice_reminder', {
      teamId: 'team-1',
      playerIds: ['player-1', 'player-2'],
      practiceDetails: {
        date: new Date(),
        time: '6:00 PM',
        location: 'Main Rink',
        duration: '90 minutes',
        focus: 'Power play drills',
        equipment: ['Full gear', 'Extra pucks'],
      },
    });
  };

  const mockBotActivity = {
    activities: botActivity.activities.length > 0 ? botActivity.activities : [
      {
        id: '1',
        botName: 'System Bot',
        botType: 'system',
        action: 'welcome_message_sent',
        userId: 'user1',
        userName: 'John Doe',
        timestamp: new Date(),
      },
    ],
    stats: botActivity.stats.length > 0 ? botActivity.stats : [
      {
        botName: 'System Bot',
        botType: 'system',
        messagesPerDay: [45, 52, 48, 61, 55, 49, 58],
        totalMessages: 368,
        activeUsers: 142,
        averageResponseTime: 0.8,
        satisfactionRate: 95,
      },
    ],
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chat Bots & Automation</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Automated assistance for your hockey organization
          </p>
        </div>
        <Button onClick={() => setConfigOpen(true)} variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Configure Bots
        </Button>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Bot Chat Demo</TabsTrigger>
          <TabsTrigger value="activity">Bot Activity</TabsTrigger>
          <TabsTrigger value="features">Bot Features</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Bot Demo</CardTitle>
              <CardDescription>
                Try interacting with our bots. Ask questions or click action buttons.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] border rounded-lg mb-4">
                <div className="p-4 space-y-2">
                  {messages.map((message) => (
                    <BotMessage
                      key={message.id}
                      {...message}
                      onActionClick={handleActionClick}
                    />
                  ))}
                </div>
              </ScrollArea>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Ask a question... (e.g., How do I reset my password?)"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
                />
                <Button onClick={handleSendQuestion}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <BotActivityMonitor
            activities={mockBotActivity.activities}
            stats={mockBotActivity.stats}
            timeRange="week"
            onTimeRangeChange={() => {}}
          />
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    🤖
                  </div>
                  System Bot
                </CardTitle>
                <CardDescription>
                  Handles system notifications and security alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>✅ Welcome messages for new users</div>
                  <div>✅ Password reset notifications</div>
                  <div>✅ Security alerts</div>
                  <div>✅ System status updates</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    👨‍🏫
                  </div>
                  Coach Bot
                </CardTitle>
                <CardDescription>
                  Automates team communications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>✅ Practice reminders</div>
                  <div>✅ Game day notifications</div>
                  <div>✅ Schedule changes</div>
                  <div>✅ Performance milestones</div>
                </div>
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={sendDemoAnnouncement}
                >
                  Send Demo Announcement
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    ❓
                  </div>
                  FAQ Bot
                </CardTitle>
                <CardDescription>
                  Answers common questions instantly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>✅ Natural language processing</div>
                  <div>✅ Common questions database</div>
                  <div>✅ Escalation to human support</div>
                  <div>✅ Learning from interactions</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    🏋️
                  </div>
                  Training Bot
                </CardTitle>
                <CardDescription>
                  Manages workout reminders and tips
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>✅ Workout reminders</div>
                  <div>✅ Session preparation tips</div>
                  <div>✅ Recovery reminders</div>
                  <div>✅ Performance tracking</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    🏥
                  </div>
                  Medical Bot
                </CardTitle>
                <CardDescription>
                  Handles medical appointments and reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>✅ Appointment reminders</div>
                  <div>✅ Medication reminders</div>
                  <div>✅ Injury check-ins</div>
                  <div>✅ Pre/post appointment instructions</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <BotConfiguration
        open={configOpen}
        onOpenChange={setConfigOpen}
        bots={bots.length > 0 ? bots : [
          {
            id: '1',
            name: 'System Bot',
            type: 'system',
            avatar: '🤖',
            description: 'System notifications and alerts',
            isActive: true,
            permissions: ['send_system_messages', 'access_user_data'],
          },
          {
            id: '2',
            name: 'Coach Assistant',
            type: 'coach',
            avatar: '👨‍🏫',
            description: 'Team announcements and updates',
            isActive: true,
            permissions: ['send_team_announcements', 'create_reminders'],
          },
          {
            id: '3',
            name: 'Help Bot',
            type: 'faq',
            avatar: '❓',
            description: 'Answers common questions',
            isActive: true,
            permissions: ['answer_questions', 'escalate_to_human'],
          },
          {
            id: '4',
            name: 'Training Assistant',
            type: 'training_reminder',
            avatar: '🏋️',
            description: 'Workout reminders and tips',
            isActive: true,
            permissions: ['create_reminders', 'access_user_data'],
          },
          {
            id: '5',
            name: 'Medical Assistant',
            type: 'medical_appointment',
            avatar: '🏥',
            description: 'Medical appointment reminders',
            isActive: true,
            permissions: ['create_reminders', 'access_user_data'],
          },
        ]}
        onSave={async (updatedBots) => {
          // Update each bot configuration
          for (const bot of updatedBots) {
            await updateBotConfig(bot.type, { isActive: bot.isActive });
          }
        }}
      />
    </div>
  );
};