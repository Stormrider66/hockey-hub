import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Share2, 
  Users, 
  Eye, 
  Edit3, 
  Settings, 
  Link2, 
  Calendar,
  X,
  Search,
  Copy,
  BarChart3,
  User,
  Shield,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { 
  useTemplateSharing, 
  type ShareRecipient, 
  type TemplateShareData 
} from '../../hooks/useTemplateSharing';
import type { WorkoutTemplate, TemplatePermission } from '../../types/template.types';

interface TemplateShareModalProps {
  template: WorkoutTemplate;
  isOpen: boolean;
  onClose: () => void;
}

const PERMISSION_ICONS = {
  owner: Shield,
  collaborator: Edit3,
  viewer: Eye,
  link_access: Link2
};

const PERMISSION_COLORS = {
  owner: 'text-red-600 bg-red-50',
  collaborator: 'text-blue-600 bg-blue-50',
  viewer: 'text-green-600 bg-green-50',
  link_access: 'text-purple-600 bg-purple-50'
};

export const TemplateShareModal: React.FC<TemplateShareModalProps> = ({
  template,
  isOpen,
  onClose
}) => {
  const { t } = useTranslation(['physicalTrainer']);
  const {
    loading,
    shareTemplate,
    generatePublicLink,
    getShareStats,
    searchRecipients,
    shareStats
  } = useTemplateSharing();

  const [activeTab, setActiveTab] = useState('share');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ShareRecipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<ShareRecipient[]>([]);
  const [permission, setPermission] = useState<TemplatePermission>('viewer');
  const [message, setMessage] = useState('');
  const [expirationDays, setExpirationDays] = useState<number | null>(null);
  const [allowPublicLink, setAllowPublicLink] = useState(false);
  const [notifyRecipients, setNotifyRecipients] = useState(true);
  const [publicLink, setPublicLink] = useState<string | null>(null);

  // Load share stats when modal opens
  useEffect(() => {
    if (isOpen && template.id) {
      getShareStats(template.id);
    }
  }, [isOpen, template.id, getShareStats]);

  // Search for recipients
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        const results = await searchRecipients(searchQuery);
        setSearchResults(results.filter(r => 
          !selectedRecipients.some(selected => selected.id === r.id)
        ));
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery, selectedRecipients, searchRecipients]);

  const handleAddRecipient = (recipient: ShareRecipient) => {
    setSelectedRecipients(prev => [...prev, recipient]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveRecipient = (recipientId: string) => {
    setSelectedRecipients(prev => prev.filter(r => r.id !== recipientId));
  };

  const handleShare = async () => {
    if (selectedRecipients.length === 0 && !allowPublicLink) {
      toast.error(t('templates.share.noRecipients'));
      return;
    }

    const shareData: TemplateShareData = {
      templateId: template.id,
      recipients: selectedRecipients,
      permission,
      message: message.trim() || undefined,
      expiresAt: expirationDays 
        ? new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
        : undefined,
      allowPublicLink,
      notifyRecipients
    };

    const result = await shareTemplate(shareData);
    if (result.success) {
      onClose();
      // Reset form
      setSelectedRecipients([]);
      setMessage('');
      setExpirationDays(null);
      setAllowPublicLink(false);
      setNotifyRecipients(true);
    }
  };

  const handleGeneratePublicLink = async () => {
    const result = await generatePublicLink(
      template.id, 
      expirationDays || undefined
    );
    if (result.success && result.link) {
      setPublicLink(result.link);
      toast.success(t('templates.share.linkGenerated'));
    }
  };

  const handleCopyLink = () => {
    if (publicLink) {
      navigator.clipboard.writeText(publicLink);
      toast.success(t('templates.share.linkCopied'));
    }
  };

  const getPermissionIcon = (permission: TemplatePermission) => {
    const Icon = PERMISSION_ICONS[permission];
    return <Icon className="h-4 w-4" />;
  };

  const renderRecipientBadge = (recipient: ShareRecipient) => (
    <div key={recipient.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
      <div className="flex items-center gap-2 flex-1">
        {recipient.avatarUrl ? (
          <img 
            src={recipient.avatarUrl} 
            alt={recipient.name}
            className="w-6 h-6 rounded-full"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
            <User className="h-3 w-3 text-gray-600" />
          </div>
        )}
        <div>
          <span className="text-sm font-medium">{recipient.name}</span>
          {recipient.email && (
            <span className="text-xs text-gray-500 ml-1">({recipient.email})</span>
          )}
        </div>
        <Badge variant="outline" className="text-xs">
          {t(`templates.share.recipientTypes.${recipient.type}`)}
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleRemoveRecipient(recipient.id)}
        className="p-1 h-auto"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );

  const stats = shareStats[template.id];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('templates.share.title')}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {t('templates.share.subtitle', { templateName: template.name })}
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="share" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              {t('templates.share.tabs.share')}
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              {t('templates.share.tabs.publicLink')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t('templates.share.tabs.analytics')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="share" className="space-y-4">
            {/* Recipients Selection */}
            <div className="space-y-2">
              <Label>{t('templates.share.recipients')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('templates.share.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border rounded-md p-2 space-y-1 max-h-32 overflow-y-auto">
                  {searchResults.map(recipient => (
                    <div
                      key={recipient.id}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => handleAddRecipient(recipient)}
                    >
                      {recipient.avatarUrl ? (
                        <img 
                          src={recipient.avatarUrl} 
                          alt={recipient.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-3 w-3 text-gray-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <span className="text-sm font-medium">{recipient.name}</span>
                        {recipient.email && (
                          <span className="text-xs text-gray-500 block">{recipient.email}</span>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {t(`templates.share.recipientTypes.${recipient.type}`)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Recipients */}
              {selectedRecipients.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">{t('templates.share.selectedRecipients')}</Label>
                  <div className="space-y-2">
                    {selectedRecipients.map(renderRecipientBadge)}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Permission Level */}
            <div className="space-y-2">
              <Label>{t('templates.share.permission')}</Label>
              <Select value={permission} onValueChange={(value: TemplatePermission) => setPermission(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      {getPermissionIcon('viewer')}
                      <div>
                        <div className="font-medium">{t('templates.share.permissions.viewer.title')}</div>
                        <div className="text-xs text-gray-500">{t('templates.share.permissions.viewer.description')}</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="collaborator">
                    <div className="flex items-center gap-2">
                      {getPermissionIcon('collaborator')}
                      <div>
                        <div className="font-medium">{t('templates.share.permissions.collaborator.title')}</div>
                        <div className="text-xs text-gray-500">{t('templates.share.permissions.collaborator.description')}</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label>{t('templates.share.message')} ({t('templates.share.optional')})</Label>
              <Textarea
                placeholder={t('templates.share.messagePlaceholder')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{t('templates.share.notifyRecipients')}</Label>
                  <p className="text-sm text-gray-500">{t('templates.share.notifyRecipientsDescription')}</p>
                </div>
                <Switch 
                  checked={notifyRecipients} 
                  onCheckedChange={setNotifyRecipients} 
                />
              </div>

              <div className="space-y-2">
                <Label>{t('templates.share.expiration')}</Label>
                <Select 
                  value={expirationDays?.toString() || "never"} 
                  onValueChange={(value) => setExpirationDays(value === "never" ? null : parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">{t('templates.share.expirationOptions.never')}</SelectItem>
                    <SelectItem value="7">{t('templates.share.expirationOptions.7days')}</SelectItem>
                    <SelectItem value="30">{t('templates.share.expirationOptions.30days')}</SelectItem>
                    <SelectItem value="90">{t('templates.share.expirationOptions.90days')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="link" className="space-y-4">
            <div className="text-center py-4">
              <Link2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('templates.share.publicLink.title')}</h3>
              <p className="text-gray-600 mb-4">{t('templates.share.publicLink.description')}</p>
              
              {publicLink ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-md">
                    <Input 
                      value={publicLink} 
                      readOnly 
                      className="flex-1 bg-white"
                    />
                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      className="flex items-center gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      {t('templates.share.copyLink')}
                    </Button>
                  </div>
                  {expirationDays && (
                    <p className="text-sm text-gray-500 flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4" />
                      {t('templates.share.linkExpires', { days: expirationDays })}
                    </p>
                  )}
                </div>
              ) : (
                <Button 
                  onClick={handleGeneratePublicLink}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Link2 className="h-4 w-4" />
                  {t('templates.share.generateLink')}
                </Button>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>{t('templates.share.linkExpiration')}</Label>
              <Select 
                value={expirationDays?.toString() || "never"} 
                onValueChange={(value) => setExpirationDays(value === "never" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">{t('templates.share.expirationOptions.never')}</SelectItem>
                  <SelectItem value="1">{t('templates.share.expirationOptions.1day')}</SelectItem>
                  <SelectItem value="7">{t('templates.share.expirationOptions.7days')}</SelectItem>
                  <SelectItem value="30">{t('templates.share.expirationOptions.30days')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            {stats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">{t('templates.share.analytics.totalShares')}</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalShares}</p>
                  <p className="text-sm text-blue-700">{stats.activeShares} {t('templates.share.analytics.active')}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">{t('templates.share.analytics.totalUses')}</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{stats.totalUses}</p>
                  {stats.lastUsed && (
                    <p className="text-sm text-green-700">
                      {t('templates.share.analytics.lastUsed')}: {stats.lastUsed.toLocaleDateString()}
                    </p>
                  )}
                </div>

                {stats.topUsers.length > 0 && (
                  <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">{t('templates.share.analytics.topUsers')}</h4>
                    <div className="space-y-2">
                      {stats.topUsers.map((user, index) => (
                        <div key={user.userId} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span>{user.userName}</span>
                          </div>
                          <Badge variant="outline">{user.useCount} {t('templates.share.analytics.uses')}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('templates.share.analytics.noData')}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          {activeTab === 'share' && (
            <Button 
              onClick={handleShare}
              disabled={loading || (selectedRecipients.length === 0 && !allowPublicLink)}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              {t('templates.share.shareButton')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};