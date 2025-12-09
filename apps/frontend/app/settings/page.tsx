"use client";

import { DashboardHeader } from '@/components/shared/DashboardHeader';
import { useTranslation } from '@hockey-hub/translations';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Bell, Shield, Palette } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function SettingsPage() {
  const { t } = useTranslation(['common']);
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader 
        title={t('common:navigation.settings')}
        subtitle={t('common:subtitle', 'Manage your account preferences')}
        role={typeof (user as any)?.role === 'string' ? (user as any).role : ((user as any)?.role?.name ?? 'player')}
      />
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              {t('common:navigation.profile', 'Profile')}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              {t('common:navigation.notifications', 'Notifications')}
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="mr-2 h-4 w-4" />
              {t('common:privacy', 'Privacy')}
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="mr-2 h-4 w-4" />
              {t('common:appearance', 'Appearance')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" defaultValue={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ''} />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Push Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates on your device</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-gray-500">Receive text messages</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control your privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Profile Visibility</p>
                    <p className="text-sm text-gray-500">Make your profile visible to team members</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Show Online Status</p>
                    <p className="text-sm text-gray-500">Let others see when you're online</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>{t('common:appearance', 'Appearance')}</CardTitle>
                <CardDescription>{t('common:appearanceDescription', 'Customize how the app looks and feels')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">{t('common:theme', 'Theme')}</Label>
                    <p className="text-sm text-gray-500 mb-3">{t('common:themeDescription', 'Choose your preferred color theme')}</p>
                    <div className="flex gap-2">
                      <Button variant="outline">{t('settings:themeLight', 'Light')}</Button>
                      <Button variant="outline">{t('settings:themeDark', 'Dark')}</Button>
                      <Button variant="outline">{t('settings:themeSystem', 'System')}</Button>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-medium">{t('common:language', 'Language')}</Label>
                      <p className="text-sm text-gray-500 mb-3">{t('common:languageDescription', 'Select your preferred language for the interface')}</p>
                      <LanguageSelector 
                        showLabel={false}
                        variant="default"
                        className="mt-2"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        {t('common:languageNote', 'Changes will be applied immediately across the entire application')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}