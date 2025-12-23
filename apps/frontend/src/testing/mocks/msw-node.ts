type Resolver = (req: any, res: any, ctx: any) => any;
type Handler = { method: string; url: string | RegExp; resolver: Resolver };

const createCtx = () => ({
  json: (data: any) => ({ __kind: 'json', data }),
  status: (code: number) => ({ __kind: 'status', code }),
});

const createRes = () => {
  const res = (...parts: any[]) => {
    const init: any = { status: 200, headers: {} };
    let body: any = undefined;
    for (const part of parts) {
      if (!part) continue;
      if (part.__kind === 'status') init.status = part.code;
      if (part.__kind === 'json') {
        body = JSON.stringify(part.data);
        init.headers['Content-Type'] = 'application/json';
      }
    }
    return new Response(body, init);
  };
  (res as any).networkError = (message: string) => ({ __networkError: message });
  return res;
};

export const setupServer = (...initialHandlers: Handler[]) => {
  let originalFetch: any = undefined;
  const baseHandlers: Handler[] = [...initialHandlers];
  let handlers: Handler[] = [...initialHandlers];

  const match = (method: string, url: string) => {
    const pathname = (() => {
      try { return new URL(url, 'http://localhost').pathname; } catch { return url; }
    })();
    // Give precedence to the most recently added handler (msw's behavior)
    const list = [...handlers].reverse();
    return list.find(h => {
      if (h.method.toUpperCase() !== method.toUpperCase()) return false;
      if (typeof h.url === 'string') {
        if (h.url === url) return true;
        if (url.includes(h.url)) return true;
        try {
          const handlerPath = new URL(h.url, 'http://localhost').pathname;
          if (pathname.endsWith(handlerPath)) return true;
        } catch {
          if (url.endsWith(h.url)) return true;
        }
        return false;
      }
      return h.url.test(url) || h.url.test(pathname);
    });
  };

  return {
    listen: () => {
      if (originalFetch) return;
      originalFetch = global.fetch;
      const handlerFetch = async (input: any, init?: any) => {
        const isRequest = input && typeof input === 'object' && 'url' in input && 'method' in input;
        const url = typeof input === 'string' ? input : (isRequest ? input.url : input?.url);
        const method = (isRequest ? input.method : init?.method || 'GET').toUpperCase();
        const handler = match(method, url);
        if (!handler) {
          return new Response(null, { status: 404 });
        }
        const parsedUrl = (() => {
          try { return new URL(url, 'http://localhost'); } catch { return new URL('http://localhost'); }
        })();
        const headers = new Headers((isRequest ? (input as any).headers : init?.headers) || {});
        const req = {
          url: parsedUrl,
          method,
          headers,
          body: (() => {
            try {
              const body = isRequest ? (input as any).body : init?.body;
              if (!body) return undefined;
              return typeof body === 'string' ? JSON.parse(body) : body;
            } catch {
              return undefined;
            }
          })(),
          json: async () => {
            try {
              const body = isRequest ? input.body : init?.body;
              if (!body) return {};
              return typeof body === 'string' ? JSON.parse(body) : body;
            } catch {
              return {};
            }
          },
        };
        const ctx = createCtx();
        const res = createRes();
        // Small delay so UI can render loading states
        await new Promise(r => setTimeout(r, 80));
        const result = await handler.resolver(req, res, ctx);
        if (result && result.__networkError) {
          // Simulate network error by rejecting
          throw Object.assign(new Error(result.__networkError), { code: 'ERR_NETWORK' });
        }
        if (result instanceof Response) return result;
        // If resolver returned nothing, fall back
        return new Response(null, { status: 200 });
      };
      (global as any).fetch = handlerFetch;
      try { (globalThis as any).fetch = handlerFetch; } catch {}
      try { (window as any).fetch = handlerFetch; } catch {}
    },
    use: (...more: Handler[]) => {
      handlers.push(...more);
    },
    resetHandlers: (...next: Handler[]) => {
      // MSW semantics:
      // - resetHandlers() with no args restores the initial handlers
      // - resetHandlers(...handlers) replaces runtime handlers with the provided ones only
      handlers = next.length ? [...next] : [...baseHandlers];
    },
    close: () => {
      if (originalFetch) {
        global.fetch = originalFetch;
        originalFetch = undefined;
      }
    },
  };
};

export default { setupServer };



