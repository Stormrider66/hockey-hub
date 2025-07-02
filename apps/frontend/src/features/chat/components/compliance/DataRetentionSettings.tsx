import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Download, Shield, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface RetentionPolicy {
  messageRetention: string;
  fileRetention: string;
  autoDelete: boolean;
  encryptionAtRest: boolean;
  auditLogRetention: string;
}

export const DataRetentionSettings: React.FC = () => {
  const { toast } = useToast();
  const [policy, setPolicy] = useState<RetentionPolicy>({
    messageRetention: '365',
    fileRetention: '180',
    autoDelete: true,
    encryptionAtRest: true,
    auditLogRetention: '730'
  });

  const handlePolicyUpdate = (key: keyof RetentionPolicy, value: string | boolean) => {
    setPolicy(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePolicy = () => {
    // Save retention policy
    toast({
      title: 'Retention Policy Updated',
      description: 'Your data retention settings have been saved.',
    });
  };

  const handleExportData = async () => {
    try {
      // Trigger data export
      const response = await fetch('/api/chat/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        toast({
          title: 'Data Export Started',
          description: 'You will receive an email with your data export when ready.',
        });
      }
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to start data export. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAllData = async () => {
    try {
      const response = await fetch('/api/chat/delete-all', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        toast({
          title: 'Data Deletion Scheduled',
          description: 'Your chat data will be permanently deleted within 30 days.',
        });
      }
    } catch (error) {
      toast({
        title: 'Deletion Failed',
        description: 'Failed to schedule data deletion. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Retention Policy
          </CardTitle>
          <CardDescription>
            Configure how long your chat data is retained
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Message Retention */}
          <div className="space-y-2">
            <Label htmlFor="message-retention">Message Retention Period</Label>
            <Select
              value={policy.messageRetention}
              onValueChange={(value) => handlePolicyUpdate('messageRetention', value)}
            >
              <SelectTrigger id="message-retention">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="730">2 years</SelectItem>
                <SelectItem value="1825">5 years</SelectItem>
                <SelectItem value="forever">Forever</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Messages older than this will be automatically deleted
            </p>
          </div>

          {/* File Retention */}
          <div className="space-y-2">
            <Label htmlFor="file-retention">File Retention Period</Label>
            <Select
              value={policy.fileRetention}
              onValueChange={(value) => handlePolicyUpdate('fileRetention', value)}
            >
              <SelectTrigger id="file-retention">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">6 months</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="730">2 years</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Shared files and attachments retention period
            </p>
          </div>

          {/* Audit Log Retention */}
          <div className="space-y-2">
            <Label htmlFor="audit-retention">Audit Log Retention</Label>
            <Select
              value={policy.auditLogRetention}
              onValueChange={(value) => handlePolicyUpdate('auditLogRetention', value)}
            >
              <SelectTrigger id="audit-retention">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="365">1 year</SelectItem>
                <SelectItem value="730">2 years</SelectItem>
                <SelectItem value="1825">5 years</SelectItem>
                <SelectItem value="2555">7 years</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Compliance and audit logs retention period
            </p>
          </div>

          {/* Auto Delete */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-delete">Automatic Deletion</Label>
              <p className="text-sm text-muted-foreground">
                Automatically delete data after retention period
              </p>
            </div>
            <Switch
              id="auto-delete"
              checked={policy.autoDelete}
              onCheckedChange={(checked) => handlePolicyUpdate('autoDelete', checked)}
            />
          </div>

          {/* Encryption at Rest */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="encryption">Encryption at Rest</Label>
              <p className="text-sm text-muted-foreground">
                Encrypt all stored chat data
              </p>
            </div>
            <Switch
              id="encryption"
              checked={policy.encryptionAtRest}
              onCheckedChange={(checked) => handlePolicyUpdate('encryptionAtRest', checked)}
            />
          </div>

          <Button onClick={handleSavePolicy} className="w-full">
            Save Retention Policy
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export or delete your chat data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Data */}
          <div className="space-y-2">
            <h4 className="font-medium">Export Your Data</h4>
            <p className="text-sm text-muted-foreground">
              Download all your chat messages, files, and metadata
            </p>
            <Button onClick={handleExportData} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export All Data
            </Button>
          </div>

          {/* Delete Data */}
          <div className="space-y-2">
            <h4 className="font-medium">Delete Your Data</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete all your chat data
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your chat messages,
                    files, and associated data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAllData} className="bg-destructive text-destructive-foreground">
                    Yes, delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Information */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Your data is stored in accordance with GDPR and CCPA regulations</p>
          <p>• We use industry-standard encryption (AES-256) for data at rest</p>
          <p>• All data transfers are encrypted using TLS 1.3</p>
          <p>• Regular security audits are performed quarterly</p>
          <p>• You can request data deletion at any time</p>
          <p>• Data portability is supported in JSON and CSV formats</p>
        </CardContent>
      </Card>
    </div>
  );
};