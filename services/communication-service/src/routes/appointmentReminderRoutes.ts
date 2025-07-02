import { Router, Request, Response } from 'express';
import { AppointmentReminderService } from '../services/AppointmentReminderService';
import { authenticate } from '@hockey-hub/shared-lib/middleware/authenticate';
import { validationMiddleware } from '@hockey-hub/shared-lib/middleware/validationMiddleware';
import { IsUUID, IsEnum, IsDateString, IsOptional, IsBoolean, IsArray, IsString, IsNumber } from 'class-validator';
import { AppointmentType, ReminderTiming, ReminderStatus } from '../entities/AppointmentReminder';

// DTOs
class CreateAppointmentReminderDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  medicalStaffId: string;

  @IsEnum(AppointmentType)
  appointmentType: AppointmentType;

  @IsDateString()
  appointmentDate: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  medicalFacilityName?: string;

  @IsOptional()
  @IsString()
  medicalFacilityAddress?: string;

  @IsOptional()
  @IsString()
  medicalFacilityPhone?: string;

  @IsOptional()
  @IsString()
  appointmentNotes?: string;

  @IsOptional()
  @IsString()
  preparationInstructions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentsTobing?: string[];

  @IsOptional()
  @IsBoolean()
  requiresFasting?: boolean;

  @IsOptional()
  @IsNumber()
  fastingHours?: number;

  @IsOptional()
  @IsBoolean()
  requiresTransportation?: boolean;

  @IsArray()
  @IsEnum(ReminderTiming, { each: true })
  reminderTimings: ReminderTiming[];

  @IsOptional()
  @IsUUID()
  calendarEventId?: string;

  @IsOptional()
  @IsUUID()
  medicalRecordId?: string;

  @IsOptional()
  @IsUUID()
  injuryId?: string;

  @IsOptional()
  @IsBoolean()
  notifyPatient?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyParents?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyCoach?: boolean;

  @IsOptional()
  @IsBoolean()
  includeInTeamCalendar?: boolean;
}

class UpdateAppointmentReminderDto {
  @IsOptional()
  @IsDateString()
  appointmentDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  appointmentNotes?: string;

  @IsOptional()
  @IsString()
  preparationInstructions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentsTobing?: string[];

  @IsOptional()
  @IsBoolean()
  requiresFasting?: boolean;

  @IsOptional()
  @IsNumber()
  fastingHours?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(ReminderTiming, { each: true })
  reminderTimings?: ReminderTiming[];

  @IsOptional()
  @IsBoolean()
  notifyPatient?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyParents?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyCoach?: boolean;
}

export function createAppointmentReminderRoutes(appointmentReminderService: AppointmentReminderService): Router {
  const router = Router();

  // Create appointment reminder
  router.post(
    '/',
    authenticate,
    validationMiddleware(CreateAppointmentReminderDto),
    async (req: Request, res: Response) => {
      try {
        const currentUser = req.user!;
        
        // Check if user is medical staff
        if (currentUser.role !== 'medical_staff' && currentUser.role !== 'admin') {
          return res.status(403).json({ error: 'Only medical staff can create appointment reminders' });
        }

        const reminderData = {
          ...req.body,
          organizationId: currentUser.organizationId,
          teamId: currentUser.teamId,
          createdBy: currentUser.id,
          appointmentDate: new Date(req.body.appointmentDate),
        };

        const reminder = await appointmentReminderService.createReminder(reminderData);
        res.status(201).json(reminder);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Get user's appointment reminders
  router.get('/user/:userId', authenticate, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user!;
      const { userId } = req.params;
      const upcoming = req.query.upcoming !== 'false';

      // Users can view their own reminders, medical staff can view any
      if (currentUser.id !== userId && currentUser.role !== 'medical_staff' && currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const reminders = await appointmentReminderService.getUserReminders(userId, upcoming);
      res.json(reminders);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get medical staff's appointments
  router.get('/medical-staff/:staffId', authenticate, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user!;
      const { staffId } = req.params;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;

      // Only medical staff can view their appointments
      if (currentUser.id !== staffId && currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const reminders = await appointmentReminderService.getMedicalStaffReminders(staffId, date);
      res.json(reminders);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get organization reminders (admin only)
  router.get('/organization', authenticate, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user!;

      // Only admins and medical staff can view organization reminders
      if (currentUser.role !== 'admin' && currentUser.role !== 'medical_staff') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const options = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        status: req.query.status as ReminderStatus | undefined,
        appointmentType: req.query.appointmentType as AppointmentType | undefined,
      };

      const reminders = await appointmentReminderService.getOrganizationReminders(
        currentUser.organizationId,
        options
      );
      res.json(reminders);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get single reminder
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user!;
      const { id } = req.params;

      const reminder = await appointmentReminderService.getReminder(id);
      if (!reminder) {
        return res.status(404).json({ error: 'Appointment reminder not found' });
      }

      // Check access
      if (
        reminder.userId !== currentUser.id &&
        reminder.medicalStaffId !== currentUser.id &&
        currentUser.role !== 'admin'
      ) {
        return res.status(403).json({ error: 'Access denied' });
      }

      res.json(reminder);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update reminder
  router.put(
    '/:id',
    authenticate,
    validationMiddleware(UpdateAppointmentReminderDto),
    async (req: Request, res: Response) => {
      try {
        const currentUser = req.user!;
        const { id } = req.params;

        const reminder = await appointmentReminderService.getReminder(id);
        if (!reminder) {
          return res.status(404).json({ error: 'Appointment reminder not found' });
        }

        // Only medical staff who created it or admins can update
        if (reminder.medicalStaffId !== currentUser.id && currentUser.role !== 'admin') {
          return res.status(403).json({ error: 'Access denied' });
        }

        const updateData = {
          ...req.body,
          updatedBy: currentUser.id,
        };

        if (req.body.appointmentDate) {
          updateData.appointmentDate = new Date(req.body.appointmentDate);
        }

        const updated = await appointmentReminderService.updateReminder(id, updateData);
        res.json(updated);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Cancel reminder
  router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user!;
      const { id } = req.params;
      const reason = req.body.reason;

      const reminder = await appointmentReminderService.getReminder(id);
      if (!reminder) {
        return res.status(404).json({ error: 'Appointment reminder not found' });
      }

      // User can cancel their own, medical staff can cancel any they created
      if (
        reminder.userId !== currentUser.id &&
        reminder.medicalStaffId !== currentUser.id &&
        currentUser.role !== 'admin'
      ) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const cancelled = await appointmentReminderService.cancelReminder(id, currentUser.id, reason);
      res.json(cancelled);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Acknowledge reminder
  router.post('/:id/acknowledge', authenticate, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user!;
      const { id } = req.params;

      const reminder = await appointmentReminderService.getReminder(id);
      if (!reminder) {
        return res.status(404).json({ error: 'Appointment reminder not found' });
      }

      // Only the patient can acknowledge
      if (reminder.userId !== currentUser.id) {
        return res.status(403).json({ error: 'Only the patient can acknowledge the reminder' });
      }

      const acknowledged = await appointmentReminderService.acknowledgeReminder(id, currentUser.id);
      res.json(acknowledged);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Create bulk reminders
  router.post(
    '/bulk',
    authenticate,
    async (req: Request, res: Response) => {
      try {
        const currentUser = req.user!;

        // Only medical staff can create bulk reminders
        if (currentUser.role !== 'medical_staff' && currentUser.role !== 'admin') {
          return res.status(403).json({ error: 'Only medical staff can create bulk appointment reminders' });
        }

        const appointments = req.body.appointments.map((appointment: any) => ({
          ...appointment,
          organizationId: currentUser.organizationId,
          teamId: currentUser.teamId,
          createdBy: currentUser.id,
          appointmentDate: new Date(appointment.appointmentDate),
        }));

        const reminders = await appointmentReminderService.createBulkReminders(appointments);
        res.status(201).json(reminders);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    }
  );

  // Get reminder statistics
  router.get('/statistics/organization', authenticate, async (req: Request, res: Response) => {
    try {
      const currentUser = req.user!;

      // Only admins and medical staff can view statistics
      if (currentUser.role !== 'admin' && currentUser.role !== 'medical_staff') {
        return res.status(403).json({ error: 'Access denied' });
      }

      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const stats = await appointmentReminderService.getReminderStatistics(
        currentUser.organizationId,
        startDate,
        endDate
      );
      res.json(stats);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}