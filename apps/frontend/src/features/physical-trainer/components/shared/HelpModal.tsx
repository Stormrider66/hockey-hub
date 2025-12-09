import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  HelpCircle, 
  Keyboard, 
  Video, 
  MessageCircle, 
  BookOpen,
  Play,
  ChevronRight,
  Mail,
  Phone,
  Globe
} from 'lucide-react';
import { defaultWorkoutShortcuts } from './KeyboardShortcuts';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation(['physicalTrainer', 'common']);
  const [activeTab, setActiveTab] = useState('tour');

  const features = [
    {
      title: t('physicalTrainer:help.features.workoutBuilder.title'),
      description: t('physicalTrainer:help.features.workoutBuilder.description'),
      icon: '💪',
    },
    {
      title: t('physicalTrainer:help.features.calendar.title'),
      description: t('physicalTrainer:help.features.calendar.description'),
      icon: '📅',
    },
    {
      title: t('physicalTrainer:help.features.playerTracking.title'),
      description: t('physicalTrainer:help.features.playerTracking.description'),
      icon: '📊',
    },
    {
      title: t('physicalTrainer:help.features.templates.title'),
      description: t('physicalTrainer:help.features.templates.description'),
      icon: '📋',
    },
    {
      title: t('physicalTrainer:help.features.medical.title'),
      description: t('physicalTrainer:help.features.medical.description'),
      icon: '🏥',
    },
    {
      title: t('physicalTrainer:help.features.analytics.title'),
      description: t('physicalTrainer:help.features.analytics.description'),
      icon: '📈',
    },
  ];

  const tutorials = [
    {
      title: t('physicalTrainer:help.tutorials.createWorkout'),
      duration: '5:30',
      category: 'Basics',
    },
    {
      title: t('physicalTrainer:help.tutorials.scheduleSession'),
      duration: '3:45',
      category: 'Basics',
    },
    {
      title: t('physicalTrainer:help.tutorials.playerAssignment'),
      duration: '4:20',
      category: 'Basics',
    },
    {
      title: t('physicalTrainer:help.tutorials.conditioning'),
      duration: '8:15',
      category: 'Advanced',
    },
    {
      title: t('physicalTrainer:help.tutorials.hybrid'),
      duration: '6:50',
      category: 'Advanced',
    },
    {
      title: t('physicalTrainer:help.tutorials.templates'),
      duration: '4:10',
      category: 'Advanced',
    },
  ];

  const faqs = [
    {
      question: t('physicalTrainer:help.faq.howToCreateWorkout'),
      answer: t('physicalTrainer:help.faq.howToCreateWorkoutAnswer'),
    },
    {
      question: t('physicalTrainer:help.faq.whatAreMedicalRestrictions'),
      answer: t('physicalTrainer:help.faq.whatAreMedicalRestrictionsAnswer'),
    },
    {
      question: t('physicalTrainer:help.faq.howToShareTemplates'),
      answer: t('physicalTrainer:help.faq.howToShareTemplatesAnswer'),
    },
    {
      question: t('physicalTrainer:help.faq.howToTrackProgress'),
      answer: t('physicalTrainer:help.faq.howToTrackProgressAnswer'),
    },
    {
      question: t('physicalTrainer:help.faq.whatIsLiveSession'),
      answer: t('physicalTrainer:help.faq.whatIsLiveSessionAnswer'),
    },
  ];

  // Group shortcuts by category
  const shortcutCategories = defaultWorkoutShortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof defaultWorkoutShortcuts>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {t('physicalTrainer:help.title')}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="tour" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('physicalTrainer:help.tabs.tour')}
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              {t('physicalTrainer:help.tabs.shortcuts')}
            </TabsTrigger>
            <TabsTrigger value="tutorials" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              {t('physicalTrainer:help.tabs.tutorials')}
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              {t('physicalTrainer:help.tabs.faq')}
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t('physicalTrainer:help.tabs.support')}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="tour" className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3>{t('physicalTrainer:help.tour.welcome')}</h3>
                <p>{t('physicalTrainer:help.tour.description')}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {features.map((feature, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{feature.icon}</span>
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 text-center">
                <Button size="lg">
                  {t('physicalTrainer:help.tour.startTour')}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="shortcuts" className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <p>{t('physicalTrainer:help.shortcuts.description')}</p>
              </div>

              {Object.entries(shortcutCategories).map(([category, shortcuts]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle>{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {shortcuts.map((shortcut, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                          <span className="text-sm">{shortcut.description}</span>
                          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                            {shortcut.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="tutorials" className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <p>{t('physicalTrainer:help.tutorials.description')}</p>
              </div>

              <div className="space-y-4">
                {['Basics', 'Advanced'].map(category => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold mb-3">{category}</h3>
                    <div className="grid gap-3">
                      {tutorials
                        .filter(tutorial => tutorial.category === category)
                        .map((tutorial, index) => (
                          <Card key={index} className="cursor-pointer hover:bg-accent transition-colors">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Play className="h-4 w-4" />
                                  {tutorial.title}
                                </CardTitle>
                                <span className="text-sm text-muted-foreground">{tutorial.duration}</span>
                              </div>
                            </CardHeader>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <p>{t('physicalTrainer:help.faq.description')}</p>
              </div>

              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base">{faq.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{faq.answer}</CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="support" className="space-y-4">
              <div className="prose dark:prose-invert max-w-none">
                <h3>{t('physicalTrainer:help.support.title')}</h3>
                <p>{t('physicalTrainer:help.support.description')}</p>
              </div>

              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {t('physicalTrainer:help.support.email')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a href="mailto:support@hockeyhub.com" className="text-primary hover:underline">
                      support@hockeyhub.com
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {t('physicalTrainer:help.support.phone')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{t('physicalTrainer:help.support.hours')}</p>
                    <a href="tel:+1234567890" className="text-primary hover:underline">
                      +1 (234) 567-890
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      {t('physicalTrainer:help.support.documentation')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a href="https://docs.hockeyhub.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      docs.hockeyhub.com
                    </a>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};