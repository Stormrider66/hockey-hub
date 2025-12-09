'use client';

import React, { useState } from 'react';
import { Copy, Link, Users, Globe, Shield, Calendar, Eye, Download, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useShareFileMutation } from '@/store/api/fileApi';
import { format, addDays } from 'date-fns';

interface FileShareModalProps {
  file: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ShareType = 'user' | 'team' | 'organization' | 'public_link';
type Permission = 'view' | 'download' | 'edit' | 'delete';

const FileShareModal: React.FC<FileShareModalProps> = ({
  file,
  open,
  onOpenChange,
}) => {
  const [shareType, setShareType] = useState<ShareType>('public_link');
  const [permissions, setPermissions] = useState<Permission[]>(['view', 'download']);
  const [expiryDays, setExpiryDays] = useState<number>(7);
  const [maxAccessCount, setMaxAccessCount] = useState<number>(0);
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [sharedWithEmail, setSharedWithEmail] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [hasExpiry, setHasExpiry] = useState(true);
  const [hasAccessLimit, setHasAccessLimit] = useState(false);

  const { toast } = useToast();
  const [shareFile, { isLoading }] = useShareFileMutation();

  const handleShare = async () => {
    try {
      const shareData = {
        shareType,
        permissions,
        expiresAt: hasExpiry ? addDays(new Date(), expiryDays).toISOString() : undefined,
        maxAccessCount: hasAccessLimit ? maxAccessCount : undefined,
        password: isPasswordProtected ? password : undefined,
        notes,
        sharedWithId: shareType === 'user' ? sharedWithEmail : undefined,
      };

      const result = await shareFile({ 
        fileId: file.id, 
        shareData 
      }).unwrap();

      if (result.shareToken) {
        const link = `${window.location.origin}/shared/${result.shareToken}`;
        setShareLink(link);
      }

      toast({
        title: 'Share created',
        description: 'The file has been shared successfully.',
      });
    } catch (error) {
      toast({
        title: 'Share failed',
        description: 'Failed to share the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: 'Copied!',
      description: 'Share link copied to clipboard.',
    });
  };

  const togglePermission = (permission: Permission) => {
    setPermissions(prev => {
      if (prev.includes(permission)) {
        return prev.filter(p => p !== permission);
      } else {
        return [...prev, permission];
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share "{file?.name}"</DialogTitle>
          <DialogDescription>
            Create a shareable link or share with specific users
          </DialogDescription>
        </DialogHeader>

        {shareLink ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input value={shareLink} readOnly />
              <Button onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-medium text-sm">Share Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>{' '}
                  <Badge variant="outline" className="ml-1">
                    {shareType.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Permissions:</span>{' '}
                  {permissions.map(p => (
                    <Badge key={p} variant="secondary" className="ml-1">
                      {p}
                    </Badge>
                  ))}
                </div>
                {hasExpiry && (
                  <div>
                    <span className="text-muted-foreground">Expires:</span>{' '}
                    {format(addDays(new Date(), expiryDays), 'MMM d, yyyy')}
                  </div>
                )}
                {hasAccessLimit && (
                  <div>
                    <span className="text-muted-foreground">Access limit:</span>{' '}
                    {maxAccessCount} times
                  </div>
                )}
                {isPasswordProtected && (
                  <div>
                    <span className="text-muted-foreground">Password:</span>{' '}
                    <Badge variant="secondary">Protected</Badge>
                  </div>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShareLink('')}
            >
              Create Another Share
            </Button>
          </div>
        ) : (
          <Tabs value={shareType} onValueChange={(v) => setShareType(v as ShareType)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="public_link">
                <Globe className="h-4 w-4 mr-2" />
                Public Link
              </TabsTrigger>
              <TabsTrigger value="user">
                <Users className="h-4 w-4 mr-2" />
                User
              </TabsTrigger>
              <TabsTrigger value="team">
                <Users className="h-4 w-4 mr-2" />
                Team
              </TabsTrigger>
              <TabsTrigger value="organization">
                <Shield className="h-4 w-4 mr-2" />
                Organization
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              {shareType === 'user' && (
                <div className="space-y-2">
                  <Label htmlFor="email">User Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={sharedWithEmail}
                    onChange={(e) => setSharedWithEmail(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="view"
                      checked={permissions.includes('view')}
                      onCheckedChange={() => togglePermission('view')}
                    />
                    <label htmlFor="view" className="flex items-center space-x-2 text-sm">
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="download"
                      checked={permissions.includes('download')}
                      onCheckedChange={() => togglePermission('download')}
                    />
                    <label htmlFor="download" className="flex items-center space-x-2 text-sm">
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edit"
                      checked={permissions.includes('edit')}
                      onCheckedChange={() => togglePermission('edit')}
                    />
                    <label htmlFor="edit" className="flex items-center space-x-2 text-sm">
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="delete"
                      checked={permissions.includes('delete')}
                      onCheckedChange={() => togglePermission('delete')}
                    />
                    <label htmlFor="delete" className="flex items-center space-x-2 text-sm">
                      <Trash className="h-4 w-4" />
                      <span>Delete</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="expiry">Set expiration</Label>
                  <Switch
                    id="expiry"
                    checked={hasExpiry}
                    onCheckedChange={setHasExpiry}
                  />
                </div>
                {hasExpiry && (
                  <Select value={String(expiryDays)} onValueChange={(v) => setExpiryDays(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="access-limit">Limit access count</Label>
                  <Switch
                    id="access-limit"
                    checked={hasAccessLimit}
                    onCheckedChange={setHasAccessLimit}
                  />
                </div>
                {hasAccessLimit && (
                  <Input
                    type="number"
                    min="1"
                    value={maxAccessCount}
                    onChange={(e) => setMaxAccessCount(Number(e.target.value))}
                    placeholder="Number of times link can be accessed"
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password protect</Label>
                  <Switch
                    id="password"
                    checked={isPasswordProtected}
                    onCheckedChange={setIsPasswordProtected}
                  />
                </div>
                {isPasswordProtected && (
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this share..."
                  rows={3}
                />
              </div>
            </div>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {shareLink ? 'Close' : 'Cancel'}
          </Button>
          {!shareLink && (
            <Button onClick={handleShare} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Share Link'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};