import { Router } from 'express';
import {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventParticipants,
    addEventParticipant,
    removeEventParticipant,
    updateEventStatus
} from '../controllers/eventController';
import { validate } from '../middleware/validateRequest';
import { createEventSchema, updateEventSchema, eventIdParamSchema, listEventsQuerySchema, updateEventStatusSchema } from '../validation/eventSchemas';

const router = Router();

// Base event routes
router.get('/', validate(listEventsQuerySchema), getAllEvents);
router.post('/', validate(createEventSchema), createEvent);
router.get('/:id', validate(eventIdParamSchema), getEventById);
router.put('/:id', validate(updateEventSchema), updateEvent);
router.delete('/:id', validate(eventIdParamSchema), deleteEvent);

// Event participant routes
router.get('/:id/participants', getEventParticipants);
router.post('/:id/participants', addEventParticipant);
router.delete('/:eventId/participants/:userId', removeEventParticipant);

// Status update route
router.patch('/:id/status', validate(updateEventStatusSchema), updateEventStatus);

// TODO: Add route for updating event status (PATCH /:id/status)

export default router; 