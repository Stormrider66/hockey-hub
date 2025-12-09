/**
 * Tactical Collaboration Demo
 * Demonstration component showcasing real-time tactical collaboration
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Video,
  Share2,
  Play,
  Zap,
  MessageCircle,
  Eye,
  Recording,
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  Wifi
} from '@/components/icons';
import { useTranslation } from '@hockey-hub/translations';
import CollaborativePlaySystemEditor, { mockCurrentUser } from '../tactical/CollaborativePlaySystemEditor';

interface Feature {
  id: string;
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  status: 'available' | 'demo' | 'coming-soon';
  color: string;
}

export default function TacticalCollaborationDemo() {
  const { t } = useTranslation('coach');
  const [showEditor, setShowEditor] = useState(false);
  
  const collaborationFeatures: Feature[] = [
    {
      id: 'realtime-editing',
      icon: Users,
      title: t('collaboration.features.realtimeEditing'),
      description: t('collaboration.features.realtimeEditingDesc'),
      status: 'available',
      color: 'text-blue-500'
    },
    {
      id: 'live-coaching',
      icon: Video,
      title: t('collaboration.features.liveCoaching'),
      description: t('collaboration.features.liveCoachingDesc'),
      status: 'available',
      color: 'text-green-500'
    },
    {
      id: 'voice-chat',
      icon: MessageCircle,
      title: t('collaboration.features.voiceChat'),
      description: t('collaboration.features.voiceChatDesc'),
      status: 'demo',
      color: 'text-purple-500'
    },
    {
      id: 'session-recording',
      icon: Recording,
      title: t('collaboration.features.sessionRecording'),
      description: t('collaboration.features.sessionRecordingDesc'),
      status: 'available',
      color: 'text-red-500'
    },
    {
      id: 'presence-tracking',
      icon: Eye,
      title: t('collaboration.features.presenceTracking'),
      description: t('collaboration.features.presenceTrackingDesc'),
      status: 'available',
      color: 'text-yellow-500'
    },
    {
      id: 'conflict-resolution',
      icon: Zap,
      title: t('collaboration.features.conflictResolution'),
      description: t('collaboration.features.conflictResolutionDesc'),
      status: 'available',
      color: 'text-orange-500'
    }
  ];

  const getStatusBadge = (status: Feature['status']) => {
    switch (status) {
      case 'available':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t('common.available')}
          </Badge>
        );
      case 'demo':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            <Play className="w-3 h-3 mr-1" />
            {t('common.demo')}
          </Badge>
        );
      case 'coming-soon':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            {t('common.comingSoon')}
          </Badge>
        );
    }
  };

  if (showEditor) {
    return (
      <CollaborativePlaySystemEditor
        teamId="team-1"
        playId="play-1"
        currentUser={mockCurrentUser}
        onClose={() => setShowEditor(false)}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('collaboration.title')}
          </h1>
        </div>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {t('collaboration.description')}
        </p>
        
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => setShowEditor(true)}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-5 h-5 mr-2" />
            {t('collaboration.tryDemo')}
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Wifi className="w-4 h-4 text-green-500" />
            {t('collaboration.realTimeEnabled')}
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collaborationFeatures.map((feature) => {
          const IconComponent = feature.icon;
          
          return (
            <Card key={feature.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-gray-50 rounded-lg ${feature.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </div>
                  {getStatusBadge(feature.status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Technical Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            {t('collaboration.technicalOverview')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">{t('collaboration.architecture')}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Socket.io WebSocket connections
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Real-time event broadcasting
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Optimistic UI updates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Conflict detection & resolution
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">{t('collaboration.capabilities')}</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Multi-user session management
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Live cursor tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Session recording & playback
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Permission-based access control
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                WebSocket: Connected
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Namespaces: /tactical, /training
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Rate limiting: 20 updates/sec
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-500" />
            {t('collaboration.howToUse')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center space-y-2 p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold mx-auto">1</div>
              <h4 className="font-medium">{t('collaboration.steps.create')}</h4>
              <p className="text-sm text-gray-600">{t('collaboration.steps.createDesc')}</p>
            </div>
            
            <div className="text-center space-y-2 p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold mx-auto">2</div>
              <h4 className="font-medium">{t('collaboration.steps.invite')}</h4>
              <p className="text-sm text-gray-600">{t('collaboration.steps.inviteDesc')}</p>
            </div>
            
            <div className="text-center space-y-2 p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold mx-auto">3</div>
              <h4 className="font-medium">{t('collaboration.steps.collaborate')}</h4>
              <p className="text-sm text-gray-600">{t('collaboration.steps.collaborateDesc')}</p>
            </div>
            
            <div className="text-center space-y-2 p-4 bg-orange-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold mx-auto">4</div>
              <h4 className="font-medium">{t('collaboration.steps.present')}</h4>
              <p className="text-sm text-gray-600">{t('collaboration.steps.presentDesc')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}