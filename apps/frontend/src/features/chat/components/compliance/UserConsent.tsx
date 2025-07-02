import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Shield, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ConsentOptions {
  dataProcessing: boolean;
  analytics: boolean;
  marketing: boolean;
  thirdPartySharing: boolean;
  cookieUsage: boolean;
}

interface UserConsentProps {
  onConsentUpdate?: (consent: ConsentOptions) => void;
}

export const UserConsent: React.FC<UserConsentProps> = ({ onConsentUpdate }) => {
  const { toast } = useToast();
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [consent, setConsent] = useState<ConsentOptions>({
    dataProcessing: false,
    analytics: false,
    marketing: false,
    thirdPartySharing: false,
    cookieUsage: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const savedConsent = localStorage.getItem('userConsent');
    if (!savedConsent) {
      setShowConsentDialog(true);
    } else {
      setConsent(JSON.parse(savedConsent));
    }
  }, []);

  const handleConsentChange = (key: keyof ConsentOptions, value: boolean) => {
    setConsent(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveConsent = () => {
    // Save consent preferences
    localStorage.setItem('userConsent', JSON.stringify(consent));
    localStorage.setItem('consentDate', new Date().toISOString());
    
    if (onConsentUpdate) {
      onConsentUpdate(consent);
    }
    
    setShowConsentDialog(false);
    toast({
      title: 'Consent Preferences Saved',
      description: 'Your privacy preferences have been updated.',
    });
  };

  const handleAcceptAll = () => {
    const allConsent: ConsentOptions = {
      dataProcessing: true,
      analytics: true,
      marketing: true,
      thirdPartySharing: true,
      cookieUsage: true,
    };
    setConsent(allConsent);
    localStorage.setItem('userConsent', JSON.stringify(allConsent));
    localStorage.setItem('consentDate', new Date().toISOString());
    
    if (onConsentUpdate) {
      onConsentUpdate(allConsent);
    }
    
    setShowConsentDialog(false);
    toast({
      title: 'All Consent Granted',
      description: 'Thank you for accepting our privacy terms.',
    });
  };

  const handleRejectAll = () => {
    const minimalConsent: ConsentOptions = {
      dataProcessing: true, // Required for basic functionality
      analytics: false,
      marketing: false,
      thirdPartySharing: false,
      cookieUsage: true, // Required for authentication
    };
    setConsent(minimalConsent);
    localStorage.setItem('userConsent', JSON.stringify(minimalConsent));
    localStorage.setItem('consentDate', new Date().toISOString());
    
    if (onConsentUpdate) {
      onConsentUpdate(minimalConsent);
    }
    
    setShowConsentDialog(false);
    toast({
      title: 'Minimal Consent Applied',
      description: 'Only essential data processing enabled.',
    });
  };

  return (
    <>
      {/* Consent Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Consent Management
          </CardTitle>
          <CardDescription>
            Manage your data processing preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Consent Options */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="data-processing"
                checked={consent.dataProcessing}
                onCheckedChange={(checked) => handleConsentChange('dataProcessing', checked as boolean)}
                disabled // Required for service
              />
              <div className="space-y-1">
                <Label htmlFor="data-processing" className="font-medium">
                  Essential Data Processing
                </Label>
                <p className="text-sm text-muted-foreground">
                  Required for providing chat services and maintaining your account
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="analytics"
                checked={consent.analytics}
                onCheckedChange={(checked) => handleConsentChange('analytics', checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="analytics" className="font-medium">
                  Analytics & Performance
                </Label>
                <p className="text-sm text-muted-foreground">
                  Help us improve our services by collecting usage statistics
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="marketing"
                checked={consent.marketing}
                onCheckedChange={(checked) => handleConsentChange('marketing', checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="marketing" className="font-medium">
                  Marketing Communications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features and Hockey Hub news
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="third-party"
                checked={consent.thirdPartySharing}
                onCheckedChange={(checked) => handleConsentChange('thirdPartySharing', checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="third-party" className="font-medium">
                  Third-Party Integration
                </Label>
                <p className="text-sm text-muted-foreground">
                  Share data with integrated services like calendar and file storage
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="cookies"
                checked={consent.cookieUsage}
                onCheckedChange={(checked) => handleConsentChange('cookieUsage', checked as boolean)}
                disabled // Required for authentication
              />
              <div className="space-y-1">
                <Label htmlFor="cookies" className="font-medium">
                  Essential Cookies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Required for authentication and session management
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button onClick={handleSaveConsent} className="w-full">
              Save Preferences
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPrivacyPolicy(true)}
                className="flex-1"
              >
                <FileText className="mr-2 h-4 w-4" />
                Privacy Policy
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowTerms(true)}
                className="flex-1"
              >
                <FileText className="mr-2 h-4 w-4" />
                Terms of Service
              </Button>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-sm text-muted-foreground">
            <p>Last updated: {new Date(localStorage.getItem('consentDate') || '').toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Initial Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Privacy & Cookie Consent</DialogTitle>
            <DialogDescription>
              We value your privacy. Please review and accept our data processing terms.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  How we use your data
                </h4>
                <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                  <li>Provide and maintain chat services</li>
                  <li>Ensure security and prevent fraud</li>
                  <li>Improve user experience</li>
                  <li>Comply with legal obligations</li>
                  <li>Send service-related communications</li>
                </ul>
              </div>

              <div className="space-y-3">
                {/* Same consent options as above */}
                <div className="space-y-4">
                  {Object.entries({
                    dataProcessing: {
                      label: 'Essential Data Processing',
                      description: 'Required for chat functionality',
                      required: true
                    },
                    cookieUsage: {
                      label: 'Essential Cookies',
                      description: 'Required for authentication',
                      required: true
                    },
                    analytics: {
                      label: 'Analytics & Performance',
                      description: 'Help improve our services',
                      required: false
                    },
                    marketing: {
                      label: 'Marketing Communications',
                      description: 'Updates and news',
                      required: false
                    },
                    thirdPartySharing: {
                      label: 'Third-Party Integration',
                      description: 'Calendar and file storage',
                      required: false
                    }
                  }).map(([key, config]) => (
                    <div key={key} className="flex items-start space-x-3">
                      <Checkbox
                        id={`dialog-${key}`}
                        checked={consent[key as keyof ConsentOptions]}
                        onCheckedChange={(checked) => handleConsentChange(key as keyof ConsentOptions, checked as boolean)}
                        disabled={config.required}
                      />
                      <div className="space-y-0.5">
                        <Label htmlFor={`dialog-${key}`} className="text-sm font-medium">
                          {config.label}
                          {config.required && <span className="text-muted-foreground ml-1">(Required)</span>}
                        </Label>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={handleRejectAll}>
              Reject Optional
            </Button>
            <Button variant="outline" onClick={handleSaveConsent}>
              Save Preferences
            </Button>
            <Button onClick={handleAcceptAll}>
              Accept All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacyPolicy} onOpenChange={setShowPrivacyPolicy}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm max-w-none">
              <h3>Hockey Hub Chat Privacy Policy</h3>
              <p>Last updated: {new Date().toLocaleDateString()}</p>
              
              <h4>1. Information We Collect</h4>
              <p>We collect information you provide directly to us, such as:</p>
              <ul>
                <li>Account information (name, email, role)</li>
                <li>Chat messages and shared files</li>
                <li>Usage data and preferences</li>
              </ul>

              <h4>2. How We Use Your Information</h4>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide and maintain our services</li>
                <li>Communicate with you</li>
                <li>Monitor and analyze usage</li>
                <li>Ensure security and prevent fraud</li>
              </ul>

              <h4>3. Data Retention</h4>
              <p>We retain your data according to your configured retention policies. You can export or delete your data at any time.</p>

              <h4>4. Data Security</h4>
              <p>We implement industry-standard security measures including:</p>
              <ul>
                <li>End-to-end encryption for messages</li>
                <li>TLS for data in transit</li>
                <li>AES-256 encryption for data at rest</li>
                <li>Regular security audits</li>
              </ul>

              <h4>5. Your Rights</h4>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request data deletion</li>
                <li>Export your data</li>
                <li>Object to processing</li>
              </ul>

              <h4>6. Contact Us</h4>
              <p>For privacy concerns, contact: privacy@hockeyhub.com</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="prose prose-sm max-w-none">
              <h3>Hockey Hub Chat Terms of Service</h3>
              <p>Last updated: {new Date().toLocaleDateString()}</p>
              
              <h4>1. Acceptance of Terms</h4>
              <p>By using Hockey Hub Chat, you agree to these terms.</p>

              <h4>2. Use of Service</h4>
              <p>You may use our service for lawful purposes only. You agree not to:</p>
              <ul>
                <li>Violate any laws or regulations</li>
                <li>Infringe on others' rights</li>
                <li>Transmit harmful or offensive content</li>
                <li>Attempt to breach security</li>
              </ul>

              <h4>3. User Content</h4>
              <p>You retain ownership of content you share. By sharing content, you grant us a license to store and display it as part of the service.</p>

              <h4>4. Privacy</h4>
              <p>Your use of our service is subject to our Privacy Policy.</p>

              <h4>5. Limitation of Liability</h4>
              <p>We provide the service "as is" without warranties. We are not liable for any damages arising from use of the service.</p>

              <h4>6. Changes to Terms</h4>
              <p>We may update these terms. Continued use constitutes acceptance of new terms.</p>

              <h4>7. Contact</h4>
              <p>Questions? Contact: support@hockeyhub.com</p>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};