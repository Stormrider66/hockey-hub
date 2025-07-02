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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar, Trophy, DollarSign, Users, GraduationCap,
  Building, Heart, Star, Target, AlertCircle,
  MapPin, Clock, FileText, Send, Megaphone
} from "lucide-react";
import { format } from "date-fns";

interface OrganizationEventModalProps {
  onClose: () => void;
  selectedSlot: { start: Date; end: Date };
}

export function OrganizationEventModal({ onClose, selectedSlot }: OrganizationEventModalProps) {
  const [currentStep, setCurrentStep] = useState<'type' | 'details' | 'requirements' | 'review'>('type');
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    location: '',
    expectedAttendance: '',
    isPublic: true,
    requiresRegistration: false,
    hasEntryFee: false,
    entryFee: '',
    targetAudience: [] as string[],
    facilities: [] as string[],
    equipment: [] as string[],
    volunteers: '',
    budget: '',
    sponsors: '',
    marketingChannels: [] as string[],
    notifyTeams: [] as string[]
  });

  const eventTypes = [
    {
      id: 'tournament',
      title: 'Tournament',
      description: 'Hockey tournament or competition',
      icon: Trophy,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'fundraiser',
      title: 'Fundraiser',
      description: 'Fundraising event or campaign',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'camp',
      title: 'Training Camp',
      description: 'Skills camp or clinic',
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'tryout',
      title: 'Team Tryouts',
      description: 'Player evaluation sessions',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'community',
      title: 'Community Event',
      description: 'Public outreach or charity',
      icon: Heart,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      id: 'celebration',
      title: 'Celebration',
      description: 'Awards, banquet, or party',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  const teams = [
    'Senior Team', 'Junior A', 'U16 Boys', 'U14 Boys', 
    'U12 Boys', 'U10 Boys', 'U16 Girls', 'U14 Girls'
  ];

  const handleNext = () => {
    const steps: typeof currentStep[] = ['type', 'details', 'requirements', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: typeof currentStep[] = ['type', 'details', 'requirements', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = () => {
    console.log('Creating organization event:', formData);
    onClose();
  };

  const selectedEventType = eventTypes.find(t => t.id === formData.type);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Schedule Organization Event</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {format(selectedSlot.start, "EEEE, MMMM d, yyyy")} at {format(selectedSlot.start, "h:mm a")}
          </p>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-4">
          {['Event Type', 'Details', 'Requirements', 'Review'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index === ['type', 'details', 'requirements', 'review'].indexOf(currentStep)
                  ? 'bg-primary text-primary-foreground'
                  : index < ['type', 'details', 'requirements', 'review'].indexOf(currentStep)
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'}
              `}>
                {index + 1}
              </div>
              <span className={`ml-2 text-sm ${
                index === ['type', 'details', 'requirements', 'review'].indexOf(currentStep)
                  ? 'font-medium'
                  : 'text-muted-foreground'
              }`}>
                {step}
              </span>
              {index < 3 && (
                <div className={`w-12 h-0.5 ml-4 ${
                  index < ['type', 'details', 'requirements', 'review'].indexOf(currentStep)
                    ? 'bg-primary'
                    : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        <div className="min-h-[400px]">
          {/* Step 1: Event Type */}
          {currentStep === 'type' && (
            <div className="space-y-4">
              <h3 className="font-medium">Select Event Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {eventTypes.map((type) => (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all ${
                      formData.type === type.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setFormData({ ...formData, type: type.id })}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className={`p-3 rounded-full ${type.bgColor}`}>
                          <type.icon className={`h-8 w-8 ${type.color}`} />
                        </div>
                        <h4 className="font-medium">{type.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Event Details */}
          {currentStep === 'details' && (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              <div className="flex items-center gap-2 mb-4">
                {selectedEventType && (
                  <>
                    <div className={`p-2 rounded ${selectedEventType.bgColor}`}>
                      <selectedEventType.icon className={`h-5 w-5 ${selectedEventType.color}`} />
                    </div>
                    <h3 className="font-medium">{selectedEventType.title} Details</h3>
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="title">Event Title*</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Spring Hockey Tournament 2024"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description*</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide a detailed description of the event..."
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="location">Location*</Label>
                <Select 
                  value={formData.location} 
                  onValueChange={(v) => setFormData({ ...formData, location: v })}
                >
                  <SelectTrigger id="location" className="mt-1">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main-rink">Main Ice Rink</SelectItem>
                    <SelectItem value="practice-rink">Practice Rink</SelectItem>
                    <SelectItem value="both-rinks">Both Rinks</SelectItem>
                    <SelectItem value="parking-lot">Parking Lot</SelectItem>
                    <SelectItem value="community-hall">Community Hall</SelectItem>
                    <SelectItem value="external">External Venue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="attendance">Expected Attendance*</Label>
                  <Input
                    id="attendance"
                    type="number"
                    value={formData.expectedAttendance}
                    onChange={(e) => setFormData({ ...formData, expectedAttendance: e.target.value })}
                    placeholder="Number of attendees"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="budget">Event Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="Total budget in $"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="public" className="text-base">Open to Public</Label>
                  <Switch
                    id="public"
                    checked={formData.isPublic}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="registration" className="text-base">Requires Registration</Label>
                  <Switch
                    id="registration"
                    checked={formData.requiresRegistration}
                    onCheckedChange={(checked) => setFormData({ ...formData, requiresRegistration: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="fee" className="text-base">Entry Fee</Label>
                  <Switch
                    id="fee"
                    checked={formData.hasEntryFee}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasEntryFee: checked })}
                  />
                </div>

                {formData.hasEntryFee && (
                  <Input
                    type="number"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                    placeholder="Entry fee amount in $"
                    className="ml-8"
                  />
                )}
              </div>

              <div>
                <Label>Target Audience</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Players', 'Parents', 'Coaches', 'General Public', 'Sponsors', 'Alumni'].map((audience) => (
                    <div key={audience} className="flex items-center space-x-2">
                      <Checkbox
                        id={audience}
                        checked={formData.targetAudience.includes(audience)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ 
                              ...formData, 
                              targetAudience: [...formData.targetAudience, audience] 
                            });
                          } else {
                            setFormData({ 
                              ...formData, 
                              targetAudience: formData.targetAudience.filter(a => a !== audience) 
                            });
                          }
                        }}
                      />
                      <Label htmlFor={audience} className="text-sm font-normal cursor-pointer">
                        {audience}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Requirements */}
          {currentStep === 'requirements' && (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              <h3 className="font-medium">Event Requirements</h3>

              <div>
                <Label>Facilities Needed</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Ice Time', 'Meeting Rooms', 'Parking', 'Concession Stand', 'Locker Rooms', 'Sound System'].map((facility) => (
                    <div key={facility} className="flex items-center space-x-2">
                      <Checkbox
                        id={facility}
                        checked={formData.facilities.includes(facility)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ 
                              ...formData, 
                              facilities: [...formData.facilities, facility] 
                            });
                          } else {
                            setFormData({ 
                              ...formData, 
                              facilities: formData.facilities.filter(f => f !== facility) 
                            });
                          }
                        }}
                      />
                      <Label htmlFor={facility} className="text-sm font-normal cursor-pointer">
                        {facility}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Equipment Required</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Tables', 'Chairs', 'Tents', 'Audio Equipment', 'Projector', 'Signage'].map((equipment) => (
                    <div key={equipment} className="flex items-center space-x-2">
                      <Checkbox
                        id={equipment}
                        checked={formData.equipment.includes(equipment)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ 
                              ...formData, 
                              equipment: [...formData.equipment, equipment] 
                            });
                          } else {
                            setFormData({ 
                              ...formData, 
                              equipment: formData.equipment.filter(e => e !== equipment) 
                            });
                          }
                        }}
                      />
                      <Label htmlFor={equipment} className="text-sm font-normal cursor-pointer">
                        {equipment}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="volunteers">Volunteers Needed</Label>
                <Input
                  id="volunteers"
                  type="number"
                  value={formData.volunteers}
                  onChange={(e) => setFormData({ ...formData, volunteers: e.target.value })}
                  placeholder="Number of volunteers"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sponsors">Sponsors/Partners</Label>
                <Textarea
                  id="sponsors"
                  value={formData.sponsors}
                  onChange={(e) => setFormData({ ...formData, sponsors: e.target.value })}
                  placeholder="List any sponsors or partners..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label>Marketing Channels</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['Website', 'Social Media', 'Email', 'Flyers', 'Local Media', 'Word of Mouth'].map((channel) => (
                    <div key={channel} className="flex items-center space-x-2">
                      <Checkbox
                        id={channel}
                        checked={formData.marketingChannels.includes(channel)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ 
                              ...formData, 
                              marketingChannels: [...formData.marketingChannels, channel] 
                            });
                          } else {
                            setFormData({ 
                              ...formData, 
                              marketingChannels: formData.marketingChannels.filter(c => c !== channel) 
                            });
                          }
                        }}
                      />
                      <Label htmlFor={channel} className="text-sm font-normal cursor-pointer">
                        {channel}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Notify Teams</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {teams.map((team) => (
                    <div key={team} className="flex items-center space-x-2">
                      <Checkbox
                        id={team}
                        checked={formData.notifyTeams.includes(team)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({ 
                              ...formData, 
                              notifyTeams: [...formData.notifyTeams, team] 
                            });
                          } else {
                            setFormData({ 
                              ...formData, 
                              notifyTeams: formData.notifyTeams.filter(t => t !== team) 
                            });
                          }
                        }}
                      />
                      <Label htmlFor={team} className="text-sm font-normal cursor-pointer">
                        {team}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 'review' && (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              <h3 className="font-medium">Review Event Details</h3>
              
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {/* Event Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      {selectedEventType && (
                        <div className={`p-2 rounded ${selectedEventType.bgColor}`}>
                          <selectedEventType.icon className={`h-4 w-4 ${selectedEventType.color}`} />
                        </div>
                      )}
                      <h4 className="font-medium text-lg">{formData.title || 'Untitled Event'}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{formData.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date:</span>
                      <p className="font-medium">{format(selectedSlot.start, "MMMM d, yyyy")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Time:</span>
                      <p className="font-medium">
                        {format(selectedSlot.start, "h:mm a")} - {format(selectedSlot.end, "h:mm a")}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Location:</span>
                      <p className="font-medium">{formData.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Expected Attendance:</span>
                      <p className="font-medium">{formData.expectedAttendance || '0'} people</p>
                    </div>
                  </div>

                  {/* Event Settings */}
                  <div className="pt-3 border-t">
                    <h5 className="font-medium mb-2">Event Settings</h5>
                    <div className="flex flex-wrap gap-2">
                      {formData.isPublic && (
                        <Badge variant="secondary">Open to Public</Badge>
                      )}
                      {formData.requiresRegistration && (
                        <Badge variant="secondary">Registration Required</Badge>
                      )}
                      {formData.hasEntryFee && (
                        <Badge variant="secondary">Entry Fee: ${formData.entryFee}</Badge>
                      )}
                      {formData.budget && (
                        <Badge variant="secondary">Budget: ${formData.budget}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Requirements Summary */}
                  {(formData.facilities.length > 0 || formData.equipment.length > 0) && (
                    <div className="pt-3 border-t">
                      <h5 className="font-medium mb-2">Requirements</h5>
                      {formData.facilities.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm text-muted-foreground">Facilities:</p>
                          <p className="text-sm">{formData.facilities.join(', ')}</p>
                        </div>
                      )}
                      {formData.equipment.length > 0 && (
                        <div className="mb-2">
                          <p className="text-sm text-muted-foreground">Equipment:</p>
                          <p className="text-sm">{formData.equipment.join(', ')}</p>
                        </div>
                      )}
                      {formData.volunteers && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">Volunteers needed:</span> {formData.volunteers}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Notifications */}
                  {formData.notifyTeams.length > 0 && (
                    <div className="pt-3 border-t">
                      <h5 className="font-medium mb-2">Teams to Notify</h5>
                      <div className="flex flex-wrap gap-1">
                        {formData.notifyTeams.map((team) => (
                          <Badge key={team} variant="outline" className="text-xs">
                            {team}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-900">Important Notes:</p>
                      <ul className="mt-1 space-y-1 text-amber-800">
                        <li>• This event will be added to the organization calendar</li>
                        <li>• Selected teams will receive notification emails</li>
                        <li>• Facility bookings will be automatically reserved</li>
                        {formData.isPublic && <li>• Event will be visible on the public website</li>}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {currentStep !== 'type' && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {currentStep !== 'review' ? (
              <Button 
                onClick={handleNext}
                disabled={
                  (currentStep === 'type' && !formData.type) ||
                  (currentStep === 'details' && (!formData.title || !formData.description || !formData.location))
                }
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="gap-2">
                <Calendar className="h-4 w-4" />
                Create Event
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}