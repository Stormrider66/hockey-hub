// Jest manual mock for CachedEventService used by route tests
// Ensures every `new CachedEventService()` returns the same mock instance

const instance = {
  getEvents: jest.fn(),
  getUpcomingEvents: jest.fn(),
  getEventsByDateRange: jest.fn(),
  checkConflicts: jest.fn(),
  updateParticipantStatus: jest.fn(),
  addParticipants: jest.fn(),
  removeParticipant: jest.fn(),
  createEvent: jest.fn(),
  createRecurringEvent: jest.fn(),
  getRecurringEventInstances: jest.fn(),
  updateRecurringEventInstance: jest.fn(),
  deleteRecurringEventInstance: jest.fn(),
  updateEvent: jest.fn(),
  deleteEvent: jest.fn(),
};

export class CachedEventService {
  constructor() {
    return instance as any;
  }
}

export default CachedEventService;

// Expose the singleton for direct access if needed
export const __mockCachedEventServiceInstance = instance;



