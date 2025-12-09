type Resolver = (req: any, res: any, ctx: any) => any;

const verb = (method: string) => (url: string | RegExp, resolver: Resolver) => ({ method, url, resolver });

export const rest = {
  get: verb('GET'),
  post: verb('POST'),
  put: verb('PUT'),
  delete: verb('DELETE'),
  patch: verb('PATCH'),
} as any;

export const http = rest as any;
export const HttpResponse = {} as any;
export default { rest } as any;



