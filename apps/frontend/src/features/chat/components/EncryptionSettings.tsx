'use client';

import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Key, Lock, Unlock, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import EncryptionService from '@/services/EncryptionService';
import { toast } from 'react-hot-toast';

interface EncryptionSettingsProps {
  className?: string;
  conversationId?: string;
}

interface EncryptionStatus {
  isSupported: boolean;
  isInitialized: boolean;
  hasPublicKey: boolean;
  conversationEncrypted?: boolean;
  participantsWithKeys?: string[];
  participantsWithoutKeys?: string[];
}

export const EncryptionSettings: React.FC<EncryptionSettingsProps> = ({
  className = '',
  conversationId
}) => {
  const [status, setStatus] = useState<EncryptionStatus>({
    isSupported: false,
    isInitialized: false,
    hasPublicKey: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeEncryption();
  }, [conversationId]);

  const initializeEncryption = async () => {
    try {
      setIsInitializing(true);
      
      const isSupported = EncryptionService.isSupported();
      
      if (isSupported) {
        await EncryptionService.initialize();
        const hasPublicKey = await checkHasPublicKey();
        
        let conversationStatus = {};
        if (conversationId && hasPublicKey) {
          conversationStatus = await getConversationEncryptionStatus(conversationId);
        }

        setStatus({
          isSupported: true,
          isInitialized: true,
          hasPublicKey,
          ...conversationStatus
        });
      } else {
        setStatus({
          isSupported: false,
          isInitialized: false,
          hasPublicKey: false
        });
      }
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      toast.error('Failed to initialize encryption');
    } finally {
      setIsInitializing(false);
    }
  };

  const checkHasPublicKey = async (): Promise<boolean> => {
    try {
      const publicKey = await EncryptionService.getPublicKey();
      return !!publicKey;
    } catch (error) {
      console.error('Failed to check public key:', error);
      return false;
    }
  };

  const getConversationEncryptionStatus = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/encryption/conversation/${conversationId}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get conversation encryption status:', error);
    }
    return {};
  };

  const handleGenerateKeys = async () => {
    setIsLoading(true);
    
    try {
      // Reset and regenerate keys
      await EncryptionService.resetKeys();
      await EncryptionService.initialize();
      
      const hasPublicKey = await checkHasPublicKey();
      
      setStatus(prev => ({
        ...prev,
        hasPublicKey,
        isInitialized: true
      }));
      
      toast.success('Encryption keys generated successfully!');
    } catch (error) {
      console.error('Failed to generate encryption keys:', error);
      toast.error('Failed to generate encryption keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetKeys = async () => {
    setIsLoading(true);
    
    try {
      await EncryptionService.resetKeys();
      
      setStatus(prev => ({
        ...prev,
        hasPublicKey: false,
        isInitialized: false
      }));
      
      toast.success('Encryption keys reset successfully');
    } catch (error) {
      console.error('Failed to reset encryption keys:', error);
      toast.error('Failed to reset encryption keys');
    } finally {
      setIsLoading(false);
    }
  };

  const getSupportIcon = () => {
    if (status.isSupported) {
      return <Shield className="h-5 w-5 text-green-500" />;
    }
    return <Shield className="h-5 w-5 text-gray-400" />;
  };

  const getEncryptionIcon = () => {
    if (status.conversationEncrypted) {
      return <Lock className="h-5 w-5 text-green-500" />;
    }
    return <Unlock className="h-5 w-5 text-gray-400" />;
  };

  const getStatusBadge = () => {
    if (!status.isSupported) {
      return <Badge variant="destructive">Not Supported</Badge>;
    }
    if (!status.hasPublicKey) {
      return <Badge variant="secondary">Keys Not Generated</Badge>;
    }
    if (status.conversationEncrypted) {
      return <Badge variant="success">Encrypted</Badge>;
    }
    return <Badge variant="outline">Available</Badge>;
  };

  if (isInitializing) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            End-to-End Encryption
          </CardTitle>
          <CardDescription>
            Loading encryption settings...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status.isSupported) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getSupportIcon()}
            End-to-End Encryption
            {getStatusBadge()}
          </CardTitle>
          <CardDescription>
            Browser compatibility status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              End-to-end encryption is not supported in your current browser. 
              Please use a modern browser with Web Crypto API support.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getSupportIcon()}
          End-to-End Encryption
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>
          Secure your messages with client-side encryption
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Encryption Keys Status */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Encryption Keys</p>
              <p className="text-sm text-muted-foreground">
                {status.hasPublicKey 
                  ? 'Keys are generated and ready to use'
                  : 'No encryption keys found'
                }
              </p>
            </div>
          </div>
          {status.hasPublicKey ? (
            <Badge variant="success">
              <Check className="h-3 w-3 mr-1" />
              Ready
            </Badge>
          ) : (
            <Badge variant="secondary">Not Generated</Badge>
          )}
        </div>

        {/* Conversation Encryption Status */}
        {conversationId && status.hasPublicKey && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              {getEncryptionIcon()}
              <div>
                <p className="font-medium">This Conversation</p>
                <p className="text-sm text-muted-foreground">
                  {status.conversationEncrypted
                    ? 'Messages are end-to-end encrypted'
                    : 'Messages are not encrypted'
                  }
                </p>
                {status.participantsWithoutKeys && status.participantsWithoutKeys.length > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    {status.participantsWithoutKeys.length} participant(s) don't have encryption keys
                  </p>
                )}
              </div>
            </div>
            {status.conversationEncrypted ? (
              <Badge variant="success">Encrypted</Badge>
            ) : (
              <Badge variant="outline">Not Encrypted</Badge>
            )}
          </div>
        )}

        {/* Key Management Actions */}
        <div className="space-y-3">
          {!status.hasPublicKey ? (
            <div>
              <Button
                onClick={handleGenerateKeys}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating Keys...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Generate Encryption Keys
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will generate RSA-2048 keys for end-to-end encryption
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={handleGenerateKeys}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate Keys
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetKeys}
                disabled={isLoading}
                className="w-full"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Reset Encryption
              </Button>
            </div>
          )}
        </div>

        {/* Security Information */}
        {status.hasPublicKey && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="font-medium">Security Details</span>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                RSA-2048 bit encryption keys
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                AES-256-GCM message encryption
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Keys stored locally on your device
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Server cannot decrypt your messages
              </div>
            </div>
          </div>
        )}

        {/* Warning for key reset */}
        {status.hasPublicKey && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Resetting encryption will delete your current keys and disable 
              decryption of existing encrypted messages.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default EncryptionSettings;