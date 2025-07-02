import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Bell, 
  FileText,
  MapPin,
  Phone,
  AlertCircle,
  Check,
  X,
  Edit,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useCreateReminderMutation,
  useGetMedicalStaffRemindersQuery,
  useUpdateReminderMutation,
  useCancelReminderMutation,
  AppointmentType,
  ReminderTiming,
  ReminderStatus,
  AppointmentReminder
} from '@/store/api/appointmentReminderApi';
import { useGetPlayersQuery } from '@/store/api/userApi';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const appointmentTypeLabels: Record<AppointmentType, string> = {
  [AppointmentType.MEDICAL_CHECKUP]: 'Medical Checkup',
  [AppointmentType.INJURY_ASSESSMENT]: 'Injury Assessment',
  [AppointmentType.TREATMENT_SESSION]: 'Treatment Session',
  [AppointmentType.PHYSIOTHERAPY]: 'Physiotherapy',
  [AppointmentType.PSYCHOLOGY_SESSION]: 'Psychology Session',
  [AppointmentType.NUTRITIONIST]: 'Nutritionist Consultation',
  [AppointmentType.FOLLOW_UP]: 'Follow-up Appointment',
  [AppointmentType.VACCINATION]: 'Vaccination',
  [AppointmentType.FITNESS_TEST]: 'Fitness Test',
  [AppointmentType.OTHER]: 'Other',
};

const reminderTimingLabels: Record<ReminderTiming, string> = {
  [ReminderTiming.ONE_WEEK_BEFORE]: '1 Week Before',
  [ReminderTiming.THREE_DAYS_BEFORE]: '3 Days Before',
  [ReminderTiming.ONE_DAY_BEFORE]: '1 Day Before',
  [ReminderTiming.MORNING_OF]: 'Morning of Appointment',
  [ReminderTiming.TWO_HOURS_BEFORE]: '2 Hours Before',
  [ReminderTiming.THIRTY_MINUTES_BEFORE]: '30 Minutes Before',
};

export const AppointmentReminderSettings: React.FC = () => {
  const currentUserId = localStorage.getItem('current_user_id') || '';
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<AppointmentReminder | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedReminderId, setExpandedReminderId] = useState<string | null>(null);

  // API hooks
  const { data: reminders = [], isLoading } = useGetMedicalStaffRemindersQuery({ 
    staffId: currentUserId,
    date: selectedDate 
  });
  const { data: players = [] } = useGetPlayersQuery({});
  const [createReminder] = useCreateReminderMutation();
  const [updateReminder] = useUpdateReminderMutation();
  const [cancelReminder] = useCancelReminderMutation();

  // Form state
  const [formData, setFormData] = useState({
    userId: '',
    appointmentType: AppointmentType.MEDICAL_CHECKUP,
    appointmentDate: '',
    appointmentTime: '',
    location: '',
    medicalFacilityName: '',
    medicalFacilityAddress: '',
    medicalFacilityPhone: '',
    appointmentNotes: '',
    preparationInstructions: '',
    documentsTobing: [] as string[],
    requiresFasting: false,
    fastingHours: 0,
    requiresTransportation: false,
    reminderTimings: [ReminderTiming.ONE_DAY_BEFORE, ReminderTiming.TWO_HOURS_BEFORE] as ReminderTiming[],
    notifyPatient: true,
    notifyParents: false,
    notifyCoach: false,
    includeInTeamCalendar: false,
  });

  const [documentInput, setDocumentInput] = useState('');

  const handleCreateReminder = async () => {
    try {
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
      
      await createReminder({
        ...formData,
        medicalStaffId: currentUserId,
        appointmentDate: appointmentDateTime.toISOString(),
        fastingHours: formData.requiresFasting ? formData.fastingHours : undefined,
      }).unwrap();

      toast.success('Appointment reminder created successfully');
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to create appointment reminder');
    }
  };

  const handleUpdateReminder = async () => {
    if (!selectedReminder) return;

    try {
      await updateReminder({
        id: selectedReminder.id,
        data: {
          appointmentNotes: formData.appointmentNotes,
          preparationInstructions: formData.preparationInstructions,
          reminderTimings: formData.reminderTimings,
        }
      }).unwrap();

      toast.success('Reminder updated successfully');
      setSelectedReminder(null);
    } catch (error) {
      toast.error('Failed to update reminder');
    }
  };

  const handleCancelReminder = async (reminder: AppointmentReminder) => {
    if (!confirm('Are you sure you want to cancel this appointment reminder?')) return;

    try {
      await cancelReminder({ id: reminder.id }).unwrap();
      toast.success('Reminder cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel reminder');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      appointmentType: AppointmentType.MEDICAL_CHECKUP,
      appointmentDate: '',
      appointmentTime: '',
      location: '',
      medicalFacilityName: '',
      medicalFacilityAddress: '',
      medicalFacilityPhone: '',
      appointmentNotes: '',
      preparationInstructions: '',
      documentsTobing: [],
      requiresFasting: false,
      fastingHours: 0,
      requiresTransportation: false,
      reminderTimings: [ReminderTiming.ONE_DAY_BEFORE, ReminderTiming.TWO_HOURS_BEFORE],
      notifyPatient: true,
      notifyParents: false,
      notifyCoach: false,
      includeInTeamCalendar: false,
    });
    setDocumentInput('');
  };

  const addDocument = () => {
    if (documentInput.trim()) {
      setFormData({
        ...formData,
        documentsTobing: [...formData.documentsTobing, documentInput.trim()]
      });
      setDocumentInput('');
    }
  };

  const removeDocument = (index: number) => {
    setFormData({
      ...formData,
      documentsTobing: formData.documentsTobing.filter((_, i) => i !== index)
    });
  };

  const getStatusBadge = (status: ReminderStatus) => {
    const variants: Record<ReminderStatus, string> = {
      [ReminderStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
      [ReminderStatus.SENT]: 'bg-green-100 text-green-800',
      [ReminderStatus.FAILED]: 'bg-red-100 text-red-800',
      [ReminderStatus.CANCELLED]: 'bg-gray-100 text-gray-800',
      [ReminderStatus.ACKNOWLEDGED]: 'bg-purple-100 text-purple-800',
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Appointment Reminders
            </CardTitle>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Reminder
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Filter by Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading reminders...
              </div>
            ) : reminders.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No appointment reminders scheduled for this date.
                </AlertDescription>
              </Alert>
            ) : (
              reminders.map((reminder) => (
                <Card key={reminder.id} className="overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setExpandedReminderId(
                      expandedReminderId === reminder.id ? null : reminder.id
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">
                            {players.find(p => p.id === reminder.userId)?.name || 'Unknown Patient'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointmentTypeLabels[reminder.appointmentType]}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm">
                            {format(new Date(reminder.appointmentDate), 'MMM d, yyyy h:mm a')}
                          </p>
                          {reminder.location && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {reminder.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(reminder.status)}
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform ${
                            expandedReminderId === reminder.id ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {expandedReminderId === reminder.id && (
                    <div className="border-t px-4 py-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        {reminder.medicalFacilityName && (
                          <div>
                            <Label className="text-xs">Medical Facility</Label>
                            <p className="text-sm">{reminder.medicalFacilityName}</p>
                            {reminder.medicalFacilityAddress && (
                              <p className="text-xs text-muted-foreground">{reminder.medicalFacilityAddress}</p>
                            )}
                            {reminder.medicalFacilityPhone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {reminder.medicalFacilityPhone}
                              </p>
                            )}
                          </div>
                        )}

                        <div>
                          <Label className="text-xs">Reminder Schedule</Label>
                          <div className="flex flex-wrap gap-1">
                            {reminder.reminderTimings.map((timing) => (
                              <Badge key={timing} variant="secondary" className="text-xs">
                                {reminderTimingLabels[timing]}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {reminder.appointmentNotes && (
                        <div className="mb-4">
                          <Label className="text-xs">Notes</Label>
                          <p className="text-sm">{reminder.appointmentNotes}</p>
                        </div>
                      )}

                      {reminder.preparationInstructions && (
                        <Alert className="mb-4">
                          <FileText className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Preparation:</strong> {reminder.preparationInstructions}
                          </AlertDescription>
                        </Alert>
                      )}

                      {(reminder.requiresFasting || reminder.documentsTobing?.length > 0) && (
                        <div className="mb-4 space-y-2">
                          {reminder.requiresFasting && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Patient must fast for {reminder.fastingHours} hours before appointment
                              </AlertDescription>
                            </Alert>
                          )}
                          {reminder.documentsTobing?.length > 0 && (
                            <div>
                              <Label className="text-xs">Documents to Bring</Label>
                              <ul className="text-sm list-disc list-inside">
                                {reminder.documentsTobing.map((doc, index) => (
                                  <li key={index}>{doc}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Reminders sent: {reminder.reminderCount}
                          </span>
                          {reminder.lastSentAt && (
                            <span>
                              Last sent: {format(new Date(reminder.lastSentAt), 'MMM d, h:mm a')}
                            </span>
                          )}
                        </div>

                        {reminder.status === ReminderStatus.SCHEDULED && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedReminder(reminder);
                                setFormData({
                                  ...formData,
                                  appointmentNotes: reminder.appointmentNotes || '',
                                  preparationInstructions: reminder.preparationInstructions || '',
                                  reminderTimings: reminder.reminderTimings,
                                });
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleCancelReminder(reminder)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || !!selectedReminder} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setSelectedReminder(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReminder ? 'Edit Appointment Reminder' : 'Create Appointment Reminder'}
            </DialogTitle>
            <DialogDescription>
              {selectedReminder 
                ? 'Update the reminder settings for this appointment.'
                : 'Schedule a new appointment reminder for a patient.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedReminder && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Patient</Label>
                    <Select
                      value={formData.userId}
                      onValueChange={(value) => setFormData({ ...formData, userId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Appointment Type</Label>
                    <Select
                      value={formData.appointmentType}
                      onValueChange={(value) => setFormData({ ...formData, appointmentType: value as AppointmentType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(appointmentTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.appointmentDate}
                      onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={formData.appointmentTime}
                      onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Training Center Medical Room"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Medical Facility Details (Optional)</Label>
                  <Input
                    placeholder="Facility Name"
                    value={formData.medicalFacilityName}
                    onChange={(e) => setFormData({ ...formData, medicalFacilityName: e.target.value })}
                  />
                  <Input
                    placeholder="Address"
                    value={formData.medicalFacilityAddress}
                    onChange={(e) => setFormData({ ...formData, medicalFacilityAddress: e.target.value })}
                  />
                  <Input
                    placeholder="Phone Number"
                    value={formData.medicalFacilityPhone}
                    onChange={(e) => setFormData({ ...formData, medicalFacilityPhone: e.target.value })}
                  />
                </div>

                <Separator />
              </>
            )}

            <div>
              <Label>Appointment Notes</Label>
              <Textarea
                value={formData.appointmentNotes}
                onChange={(e) => setFormData({ ...formData, appointmentNotes: e.target.value })}
                placeholder="Any additional notes about the appointment..."
                rows={3}
              />
            </div>

            <div>
              <Label>Preparation Instructions</Label>
              <Textarea
                value={formData.preparationInstructions}
                onChange={(e) => setFormData({ ...formData, preparationInstructions: e.target.value })}
                placeholder="Instructions for the patient to prepare for the appointment..."
                rows={3}
              />
            </div>

            {!selectedReminder && (
              <>
                <div className="space-y-2">
                  <Label>Documents to Bring</Label>
                  <div className="flex gap-2">
                    <Input
                      value={documentInput}
                      onChange={(e) => setDocumentInput(e.target.value)}
                      placeholder="e.g., Insurance card, Previous X-rays"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addDocument();
                        }
                      }}
                    />
                    <Button type="button" onClick={addDocument}>Add</Button>
                  </div>
                  {formData.documentsTobing.length > 0 && (
                    <ul className="space-y-1">
                      {formData.documentsTobing.map((doc, index) => (
                        <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">{doc}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeDocument(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fasting"
                      checked={formData.requiresFasting}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, requiresFasting: checked as boolean })
                      }
                    />
                    <Label htmlFor="fasting">Requires Fasting</Label>
                  </div>
                  {formData.requiresFasting && (
                    <div className="flex items-center gap-2">
                      <Label>Hours:</Label>
                      <Input
                        type="number"
                        min="1"
                        max="24"
                        value={formData.fastingHours}
                        onChange={(e) => setFormData({ ...formData, fastingHours: parseInt(e.target.value) || 0 })}
                        className="w-20"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transportation"
                    checked={formData.requiresTransportation}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, requiresTransportation: checked as boolean })
                    }
                  />
                  <Label htmlFor="transportation">Requires Transportation Arrangement</Label>
                </div>

                <Separator />
              </>
            )}

            <div>
              <Label>Reminder Schedule</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(reminderTimingLabels).map(([value, label]) => (
                  <div key={value} className="flex items-center space-x-2">
                    <Checkbox
                      id={value}
                      checked={formData.reminderTimings.includes(value as ReminderTiming)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            reminderTimings: [...formData.reminderTimings, value as ReminderTiming]
                          });
                        } else {
                          setFormData({
                            ...formData,
                            reminderTimings: formData.reminderTimings.filter(t => t !== value)
                          });
                        }
                      }}
                    />
                    <Label htmlFor={value} className="font-normal">{label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {!selectedReminder && (
              <>
                <Separator />

                <div>
                  <Label>Notification Recipients</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifyPatient"
                        checked={formData.notifyPatient}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, notifyPatient: checked as boolean })
                        }
                      />
                      <Label htmlFor="notifyPatient" className="font-normal">Notify Patient</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifyParents"
                        checked={formData.notifyParents}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, notifyParents: checked as boolean })
                        }
                      />
                      <Label htmlFor="notifyParents" className="font-normal">Notify Parents/Guardians</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="notifyCoach"
                        checked={formData.notifyCoach}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, notifyCoach: checked as boolean })
                        }
                      />
                      <Label htmlFor="notifyCoach" className="font-normal">Notify Coach</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeInTeamCalendar"
                        checked={formData.includeInTeamCalendar}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, includeInTeamCalendar: checked as boolean })
                        }
                      />
                      <Label htmlFor="includeInTeamCalendar" className="font-normal">Include in Team Calendar</Label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setSelectedReminder(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={selectedReminder ? handleUpdateReminder : handleCreateReminder}
              disabled={!selectedReminder && (!formData.userId || !formData.appointmentDate || !formData.appointmentTime)}
            >
              {selectedReminder ? 'Update Reminder' : 'Create Reminder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};