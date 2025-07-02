"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Download, Upload, Calendar, Smartphone, Link2,
  CheckCircle, Copy, AlertCircle, RefreshCw,
  FileDown, ExternalLink, Shield, Clock
} from "lucide-react";
import { format } from "date-fns";

interface CalendarSyncModalProps {
  onClose: () => void;
  events: any[];
}

export function CalendarSyncModal({ onClose, events }: CalendarSyncModalProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'sync' | 'subscribe'>('export');
  const [exportOptions, setExportOptions] = useState({
    format: 'ics',
    range: 'all',
    eventTypes: ['all'],
    includePrivate: true
  });
  const [syncProvider, setSyncProvider] = useState('');
  const [subscribeUrl, setSubscribeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const handleExport = () => {
    console.log('Exporting calendar with options:', exportOptions);
    // Generate and download file
  };

  const handleSync = () => {
    console.log('Syncing with provider:', syncProvider);
    // Initiate OAuth flow
  };

  const generateSubscribeUrl = () => {
    // Generate a unique subscribe URL
    const baseUrl = window.location.origin;
    const playerId = 'current'; // Would come from auth
    const token = 'unique-token'; // Would be generated
    return `${baseUrl}/api/calendar/subscribe/${playerId}/${token}.ics`;
  };

  const copyToClipboard = () => {
    const url = subscribeUrl || generateSubscribeUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const eventStats = {
    total: events.length,
    games: events.filter(e => e.type === 'game').length,
    training: events.filter(e => e.type === 'training').length,
    medical: events.filter(e => e.type === 'medical').length,
    personal: events.filter(e => e.metadata?.isPersonal).length,
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Calendar Sync & Export</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Export your schedule or sync with external calendars
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="sync">Sync</TabsTrigger>
            <TabsTrigger value="subscribe">Subscribe</TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-4">Export Options</h4>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="format">Export Format</Label>
                    <RadioGroup 
                      value={exportOptions.format} 
                      onValueChange={(v) => setExportOptions({ ...exportOptions, format: v })}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ics" id="ics" />
                        <Label htmlFor="ics" className="font-normal cursor-pointer">
                          <div>
                            <p className="font-medium">iCalendar (.ics)</p>
                            <p className="text-sm text-muted-foreground">
                              Compatible with most calendar apps (Google, Apple, Outlook)
                            </p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="csv" id="csv" />
                        <Label htmlFor="csv" className="font-normal cursor-pointer">
                          <div>
                            <p className="font-medium">CSV Spreadsheet</p>
                            <p className="text-sm text-muted-foreground">
                              For analysis in Excel or Google Sheets
                            </p>
                          </div>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdf" id="pdf" />
                        <Label htmlFor="pdf" className="font-normal cursor-pointer">
                          <div>
                            <p className="font-medium">PDF Schedule</p>
                            <p className="text-sm text-muted-foreground">
                              Printable format with all event details
                            </p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label htmlFor="range">Date Range</Label>
                    <Select 
                      value={exportOptions.range} 
                      onValueChange={(v) => setExportOptions({ ...exportOptions, range: v })}
                    >
                      <SelectTrigger id="range" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="future">Future Events Only</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="season">Current Season</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Event Types to Include</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['Games', 'Training', 'Medical', 'Team Meetings', 'Personal'].map((type) => (
                        <label key={type} className="flex items-center gap-2 text-sm">
                          <Checkbox defaultChecked />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <Label htmlFor="private" className="text-sm cursor-pointer">
                      Include private event details
                    </Label>
                    <Checkbox 
                      id="private"
                      checked={exportOptions.includePrivate}
                      onCheckedChange={(checked) => 
                        setExportOptions({ ...exportOptions, includePrivate: checked as boolean })
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900 font-medium mb-1">Export Summary</p>
                  <p className="text-xs text-blue-800">
                    {eventStats.total} total events • {eventStats.games} games • 
                    {eventStats.training} training sessions • {eventStats.medical} medical
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync Tab */}
          <TabsContent value="sync" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-4">Connect Calendar Service</h4>
                
                <RadioGroup value={syncProvider} onValueChange={setSyncProvider}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                      <RadioGroupItem value="google" id="google" />
                      <Label htmlFor="google" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Google Calendar</p>
                            <p className="text-sm text-muted-foreground">
                              Sync with your Google account
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                      <RadioGroupItem value="apple" id="apple" />
                      <Label htmlFor="apple" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded">
                            <Smartphone className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">Apple Calendar</p>
                            <p className="text-sm text-muted-foreground">
                              Sync with iCloud
                            </p>
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
                      <RadioGroupItem value="outlook" id="outlook" />
                      <Label htmlFor="outlook" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded">
                            <Calendar className="h-5 w-5 text-blue-700" />
                          </div>
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

                {syncProvider && (
                  <div className="mt-4 space-y-3">
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-amber-900">Permissions Required</p>
                          <p className="text-amber-800 mt-1">
                            Hockey Hub will need permission to:
                          </p>
                          <ul className="mt-1 space-y-0.5 text-amber-800">
                            <li>• Read your calendar events</li>
                            <li>• Create new calendar events</li>
                            <li>• Update existing events</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Your data is encrypted and secure</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscribe Tab */}
          <TabsContent value="subscribe" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-medium mb-2">Calendar Subscription URL</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Subscribe to your Hockey Hub calendar from any calendar app
                </p>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="url">Your Personal Calendar URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="url"
                        value={subscribeUrl || generateSubscribeUrl()}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={copyToClipboard}
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium">How to use:</p>
                    <div className="space-y-2">
                      <div className="flex gap-3 text-sm">
                        <Badge className="w-6 h-6 rounded-full p-0 flex items-center justify-center">1</Badge>
                        <p>Copy the URL above</p>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <Badge className="w-6 h-6 rounded-full p-0 flex items-center justify-center">2</Badge>
                        <p>Open your calendar app (Google, Apple, Outlook)</p>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <Badge className="w-6 h-6 rounded-full p-0 flex items-center justify-center">3</Badge>
                        <p>Add calendar by URL or "Subscribe to calendar"</p>
                      </div>
                      <div className="flex gap-3 text-sm">
                        <Badge className="w-6 h-6 rounded-full p-0 flex items-center justify-center">4</Badge>
                        <p>Paste the URL and confirm</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <RefreshCw className="h-4 w-4 text-muted-foreground" />
                      <span>Updates automatically every hour</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span>Secure, read-only access</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Includes all team and personal events</span>
                    </div>
                  </div>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <p className="text-sm text-blue-900 font-medium mb-1">Pro Tip</p>
                      <p className="text-xs text-blue-800">
                        Subscribe to your calendar instead of importing to always have the latest schedule. 
                        Your calendar app will automatically check for updates.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {activeTab === 'export' && (
            <Button onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Calendar
            </Button>
          )}
          {activeTab === 'sync' && syncProvider && (
            <Button onClick={handleSync}>
              <Link2 className="h-4 w-4 mr-2" />
              Connect {syncProvider.charAt(0).toUpperCase() + syncProvider.slice(1)}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}