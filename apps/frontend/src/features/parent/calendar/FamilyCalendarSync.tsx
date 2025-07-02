import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  Calendar,
  Smartphone,
  Mail,
  Copy,
  CheckCircle,
  ExternalLink,
  Shield,
  Clock,
  Users,
  FileText,
  Table,
  FileImage,
  Link,
  Apple,
  Chrome,
} from 'lucide-react';

interface Child {
  id: string;
  name: string;
  team: string;
  jersey: string;
}

interface FamilyCalendarSyncProps {
  onClose: () => void;
  children: Child[];
}

const FamilyCalendarSync: React.FC<FamilyCalendarSyncProps> = ({
  onClose,
  children,
}) => {
  const [activeTab, setActiveTab] = useState('export');
  const [exportFormat, setExportFormat] = useState('ics');
  const [dateRange, setDateRange] = useState('month');
  const [selectedChildren, setSelectedChildren] = useState<string[]>(['all']);
  const [eventTypes, setEventTypes] = useState({
    games: true,
    practices: true,
    meetings: true,
    medical: true,
    other: true,
  });
  const [includeDetails, setIncludeDetails] = useState(true);
  const [syncMethod, setSyncMethod] = useState('google');
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    push: false,
    reminderTime: '1hour',
  });
  const [subscriptionUrl, setSubscriptionUrl] = useState('');
  const [urlCopied, setUrlCopied] = useState(false);

  const handleExport = () => {
    // In real app, would generate and download the file
    console.log('Exporting calendar:', {
      format: exportFormat,
      dateRange,
      selectedChildren,
      eventTypes,
      includeDetails,
    });
  };

  const handleSync = () => {
    // In real app, would initiate OAuth flow for selected service
    console.log('Syncing with:', syncMethod);
  };

  const generateSubscriptionUrl = () => {
    // In real app, would generate a unique subscription URL
    const url = `https://hockeyhub.com/calendar/subscribe/${btoa(selectedChildren.join(','))}`;
    setSubscriptionUrl(url);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(subscriptionUrl);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Calendar Export & Sync</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="mx-6">
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="sync">
              <Smartphone className="h-4 w-4 mr-2" />
              Sync
            </TabsTrigger>
            <TabsTrigger value="subscribe">
              <Link className="h-4 w-4 mr-2" />
              Subscribe
            </TabsTrigger>
          </TabsList>

          <div className="px-6 pb-6">
            <TabsContent value="export" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Export Format</Label>
                    <RadioGroup value={exportFormat} onValueChange={setExportFormat}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ics" id="ics" />
                        <Label htmlFor="ics" className="flex items-center gap-2 font-normal">
                          <Calendar className="h-4 w-4" />
                          iCalendar (.ics) - For Calendar Apps
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="csv" id="csv" />
                        <Label htmlFor="csv" className="flex items-center gap-2 font-normal">
                          <Table className="h-4 w-4" />
                          CSV (.csv) - For Spreadsheets
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdf" id="pdf" />
                        <Label htmlFor="pdf" className="flex items-center gap-2 font-normal">
                          <FileText className="h-4 w-4" />
                          PDF - For Printing
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">Next 7 Days</SelectItem>
                        <SelectItem value="month">Next 30 Days</SelectItem>
                        <SelectItem value="season">Current Season</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Include Children</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="all-children"
                          checked={selectedChildren.includes('all')}
                          onCheckedChange={(checked) => {
                            setSelectedChildren(checked ? ['all'] : []);
                          }}
                        />
                        <Label htmlFor="all-children" className="font-normal">
                          All Children
                        </Label>
                      </div>
                      {children.map(child => (
                        <div key={child.id} className="flex items-center space-x-2 ml-6">
                          <Checkbox
                            id={`child-${child.id}`}
                            checked={selectedChildren.includes('all') || selectedChildren.includes(child.id)}
                            disabled={selectedChildren.includes('all')}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedChildren([...selectedChildren, child.id]);
                              } else {
                                setSelectedChildren(selectedChildren.filter(id => id !== child.id));
                              }
                            }}
                          />
                          <Label htmlFor={`child-${child.id}`} className="font-normal">
                            {child.name} ({child.team})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Event Types</Label>
                    <div className="space-y-2">
                      {Object.entries(eventTypes).map(([type, enabled]) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={enabled}
                            onCheckedChange={(checked) => {
                              setEventTypes({ ...eventTypes, [type]: checked as boolean });
                            }}
                          />
                          <Label htmlFor={`type-${type}`} className="font-normal capitalize">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {exportFormat === 'ics' && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <Label htmlFor="include-details">Include Event Details</Label>
                        <Switch
                          id="include-details"
                          checked={includeDetails}
                          onCheckedChange={setIncludeDetails}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sync" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Calendar Sync Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup value={syncMethod} onValueChange={setSyncMethod}>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="google" id="google" />
                        <Label htmlFor="google" className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Chrome className="h-5 w-5" />
                              <div>
                                <p className="font-medium">Google Calendar</p>
                                <p className="text-sm text-muted-foreground">
                                  Sync with your Google account
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary">Recommended</Badge>
                          </div>
                        </Label>
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="apple" id="apple" />
                        <Label htmlFor="apple" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Apple className="h-5 w-5" />
                            <div>
                              <p className="font-medium">Apple Calendar</p>
                              <p className="text-sm text-muted-foreground">
                                Sync with iCloud
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="outlook" id="outlook" />
                        <Label htmlFor="outlook" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            <div>
                              <p className="font-medium">Outlook Calendar</p>
                              <p className="text-sm text-muted-foreground">
                                Sync with Microsoft account
                              </p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Your calendar data is encrypted and only essential event information is shared.
                      You can revoke access at any time from your account settings.
                    </AlertDescription>
                  </Alert>

                  <Separator />

                  <div className="space-y-3">
                    <Label>Sync Preferences</Label>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sync-notifications" className="font-normal">
                        Sync event notifications
                      </Label>
                      <Switch
                        id="sync-notifications"
                        checked={notificationPrefs.email}
                        onCheckedChange={(checked) => {
                          setNotificationPrefs({ ...notificationPrefs, email: checked });
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Default reminder time</Label>
                      <Select
                        value={notificationPrefs.reminderTime}
                        onValueChange={(value) => {
                          setNotificationPrefs({ ...notificationPrefs, reminderTime: value });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15min">15 minutes before</SelectItem>
                          <SelectItem value="30min">30 minutes before</SelectItem>
                          <SelectItem value="1hour">1 hour before</SelectItem>
                          <SelectItem value="1day">1 day before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subscribe" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Calendar Subscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Calendar className="h-4 w-4" />
                    <AlertDescription>
                      Subscribe to your family calendar to receive automatic updates in your preferred calendar app.
                      Changes made in Hockey Hub will automatically sync.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label>Select Children to Include</Label>
                    <div className="space-y-2">
                      {children.map(child => (
                        <div key={child.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sub-child-${child.id}`}
                            checked={selectedChildren.includes('all') || selectedChildren.includes(child.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedChildren([...selectedChildren.filter(id => id !== 'all'), child.id]);
                              } else {
                                setSelectedChildren(selectedChildren.filter(id => id !== child.id));
                              }
                            }}
                          />
                          <Label htmlFor={`sub-child-${child.id}`} className="font-normal">
                            {child.name} ({child.team})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={generateSubscriptionUrl}
                    disabled={selectedChildren.length === 0}
                  >
                    Generate Subscription URL
                  </Button>

                  {subscriptionUrl && (
                    <>
                      <div className="space-y-2">
                        <Label>Subscription URL</Label>
                        <div className="flex gap-2">
                          <Input
                            value={subscriptionUrl}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={copyUrl}
                          >
                            {urlCopied ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <p className="text-sm font-medium">How to subscribe:</p>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <Chrome className="h-4 w-4 mt-0.5" />
                            <div>
                              <p className="font-medium text-foreground">Google Calendar</p>
                              <p>Settings → Add calendar → From URL → Paste the URL</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Apple className="h-4 w-4 mt-0.5" />
                            <div>
                              <p className="font-medium text-foreground">Apple Calendar</p>
                              <p>File → New Calendar Subscription → Paste the URL</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 mt-0.5" />
                            <div>
                              <p className="font-medium text-foreground">Outlook</p>
                              <p>Add calendar → Subscribe from web → Paste the URL</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="px-6 pb-6">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {activeTab === 'export' && (
            <Button onClick={handleExport}>
              Export Calendar
            </Button>
          )}
          {activeTab === 'sync' && (
            <Button onClick={handleSync}>
              Connect {syncMethod === 'google' ? 'Google' : syncMethod === 'apple' ? 'Apple' : 'Outlook'} Calendar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FamilyCalendarSync;