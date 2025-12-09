// Centralized MSW server mock (can be extended if we re-enable these tests)
export const server = {
  listen: () => undefined,
  close: () => undefined,
  resetHandlers: () => undefined,
  use: (..._handlers: any[]) => undefined,
};




