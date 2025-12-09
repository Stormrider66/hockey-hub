export const vi = {
  fn: (impl?: any) => jest.fn(impl),
  mock: jest.mock,
  importActual: async (m: string) => jest.requireActual(m),
  clearAllMocks: () => jest.clearAllMocks(),
  resetAllMocks: () => jest.resetAllMocks(),
  spyOn: (obj: any, method: string) => jest.spyOn(obj, method as any),
} as any;
export default vi;


