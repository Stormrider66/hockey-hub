/* eslint-disable */
// No-op service stubs to avoid loading NATS in tests
export class EventBus { publish = jest.fn(async () => {}); subscribe = jest.fn(() => {}); }
export class EventFactory { createEvent = jest.fn((type: string, payload: any) => ({ type, payload, id: `evt-${Date.now()}` })); }
export class EventPublisher { protected bus = new EventBus(); protected factory = new EventFactory(); async publish(type: string, payload: any) { const evt = this.factory.createEvent(type, payload); await this.bus.publish(evt); return evt; } }
