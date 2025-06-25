"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const eventController_1 = require("../controllers/eventController");
const validateRequest_1 = require("../middleware/validateRequest");
const eventSchemas_1 = require("../validation/eventSchemas");
const router = (0, express_1.Router)();
// Base event routes
router.get('/', (0, validateRequest_1.validate)(eventSchemas_1.listEventsQuerySchema), eventController_1.getAllEvents);
router.post('/', (0, validateRequest_1.validate)(eventSchemas_1.createEventSchema), eventController_1.createEvent);
router.get('/:id', (0, validateRequest_1.validate)(eventSchemas_1.eventIdParamSchema), eventController_1.getEventById);
router.put('/:id', (0, validateRequest_1.validate)(eventSchemas_1.updateEventSchema), eventController_1.updateEvent);
router.delete('/:id', (0, validateRequest_1.validate)(eventSchemas_1.eventIdParamSchema), eventController_1.deleteEvent);
// Event participant routes
router.get('/:id/participants', eventController_1.getEventParticipants);
router.post('/:id/participants', eventController_1.addEventParticipant);
router.delete('/:eventId/participants/:userId', eventController_1.removeEventParticipant);
// Status update route
router.patch('/:id/status', (0, validateRequest_1.validate)(eventSchemas_1.updateEventStatusSchema), eventController_1.updateEventStatus);
// TODO: Add route for updating event status (PATCH /:id/status)
exports.default = router;
