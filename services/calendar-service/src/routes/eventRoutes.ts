import { Router } from 'express';
import {
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventParticipants,
    addEventParticipant,
    removeEventParticipant
} from '../controllers/eventController';

const router = Router();

// Base event routes
router.get('/', getAllEvents);
router.post('/', createEvent);
router.get('/:id', getEventById);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

// Event participant routes
router.get('/:id/participants', getEventParticipants);
router.post('/:id/participants', addEventParticipant);
router.delete('/:eventId/participants/:userId', removeEventParticipant);

// TODO: Add route for updating event status (PATCH /:id/status)

export default router; 