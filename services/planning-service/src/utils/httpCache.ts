import { createHash } from 'crypto';
import type { Request, Response } from 'express';

export function computeEtag(payload: any): string {
  try {
    const json = JSON.stringify(payload);
    const hash = createHash('md5').update(json).digest('hex');
    return `W/"${hash}"`;
  } catch {
    return `W/"${Date.now().toString(16)}"`;
  }
}

export function getLastModified(items: any[] | any): Date {
  if (!Array.isArray(items)) {
    const ts = new Date(items?.updatedAt || items?.createdAt || 0).getTime();
    return new Date(ts || Date.now());
  }
  let latest = 0;
  for (const it of items) {
    const ts = new Date(it?.updatedAt || it?.createdAt || 0).getTime();
    if (!Number.isNaN(ts)) latest = Math.max(latest, ts);
  }
  return new Date(latest || Date.now());
}

export function shouldReturnNotModified(req: Request, etag: string, lastModified: Date): boolean {
  const inm = req.headers['if-none-match'];
  if (typeof inm === 'string') {
    const candidates = inm.split(',').map((s: string) => s.trim());
    if (candidates.includes(etag)) return true;
  }
  const ims = req.headers['if-modified-since'];
  if (typeof ims === 'string') {
    const imsDate = new Date(ims).getTime();
    if (!Number.isNaN(imsDate) && lastModified.getTime() <= imsDate) return true;
  }
  return false;
}

export function conditionalSend(
  req: Request,
  res: Response,
  body: any,
  itemsForLastModified?: any[] | any,
  cacheControl?: string
) {
  if (cacheControl) {
    res.set('Cache-Control', cacheControl);
  }
  const etag = computeEtag(body);
  const lastMod = getLastModified(itemsForLastModified ?? []);
  res.set('ETag', etag);
  res.set('Last-Modified', lastMod.toUTCString());
  if (shouldReturnNotModified(req, etag, lastMod)) {
    return res.status(304).end();
  }
  return res.json(body);
}














