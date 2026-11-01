/* Per-canvas undo/redo persistence. History entries hold raw ImageData in memory;
 *  they are stored as PNG blobs (one per touched layer rect) so they survive
 *  leaving the canvas without exploding the database size. */
import type { LayerMeta } from './doc';
import { canvasToBlob, loadImage, openDatabase, HISTORY_STORE } from './storage';

export type Rect = { x: number; y: number; w: number; h: number };
export type HistPixels = { rect: Rect; data: ImageData };
export type HistEntry = { metas: LayerMeta[]; activeId: string; bg: string; bgVisible: boolean; pixels: Map<string, HistPixels> };

type StoredPixels = { id: string; rect: Rect; blob: Blob };
type StoredEntry = { metas: LayerMeta[]; activeId: string; bg: string; bgVisible: boolean; pixels: StoredPixels[] };
type StoredHistory = { id: string; undo: StoredEntry[]; redo: StoredEntry[] };

/** Undo depth the user asked for: 10000 steps, kept per canvas and never cleared. */
export const HISTORY_LIMIT = 10000;
const MAX_UNDO = HISTORY_LIMIT;
const MAX_REDO = HISTORY_LIMIT;

async function packEntry(e: HistEntry): Promise<StoredEntry> {
  const pixels: StoredPixels[] = [];
  for (const [id, p] of e.pixels) {
    const c = document.createElement('canvas');
    c.width = p.rect.w; c.height = p.rect.h;
    c.getContext('2d')!.putImageData(p.data, 0, 0);
    pixels.push({ id, rect: p.rect, blob: await canvasToBlob(c) });
  }
  return { metas: e.metas, activeId: e.activeId, bg: e.bg, bgVisible: e.bgVisible, pixels };
}

async function unpackEntry(s: StoredEntry): Promise<HistEntry> {
  const pixels = new Map<string, HistPixels>();
  for (const p of s.pixels) {
    try {
      const img = await loadImage(p.blob);
      const c = document.createElement('canvas');
      c.width = p.rect.w; c.height = p.rect.h;
      const ctx = c.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0, p.rect.w, p.rect.h);
      pixels.set(p.id, { rect: p.rect, data: ctx.getImageData(0, 0, p.rect.w, p.rect.h) });
    } catch { /* skip a broken snapshot */ }
  }
  return { metas: s.metas, activeId: s.activeId, bg: s.bg, bgVisible: s.bgVisible, pixels };
}

export async function saveHistory(id: string, undo: HistEntry[], redo: HistEntry[]) {
  try {
    const stored: StoredHistory = {
      id,
      undo: await Promise.all(undo.slice(-MAX_UNDO).map(packEntry)),
      redo: await Promise.all(redo.slice(-MAX_REDO).map(packEntry)),
    };
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(HISTORY_STORE, 'readwrite').objectStore(HISTORY_STORE).put(stored);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch { /* history is best-effort */ }
}

export async function loadHistory(id: string): Promise<{ undo: HistEntry[]; redo: HistEntry[] } | null> {
  try {
    const db = await openDatabase();
    const stored = await new Promise<StoredHistory | undefined>((resolve, reject) => {
      const request = db.transaction(HISTORY_STORE, 'readonly').objectStore(HISTORY_STORE).get(id);
      request.onsuccess = () => resolve(request.result as StoredHistory | undefined);
      request.onerror = () => reject(request.error);
    });
    if (!stored) return null;
    return {
      undo: await Promise.all(stored.undo.map(unpackEntry)),
      redo: await Promise.all(stored.redo.map(unpackEntry)),
    };
  } catch {
    return null;
  }
}

export async function clearHistory(id: string) {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(HISTORY_STORE, 'readwrite').objectStore(HISTORY_STORE).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch { /* ignore */ }
}

/** Raw (packed) history record, used by the .arnm file format. */
export type PackedHistory = { undo: StoredEntry[]; redo: StoredEntry[] };
export async function readPackedHistory(id: string): Promise<PackedHistory | null> {
  try {
    const db = await openDatabase();
    const s = await new Promise<StoredHistory | undefined>((resolve, reject) => {
      const r = db.transaction(HISTORY_STORE, 'readonly').objectStore(HISTORY_STORE).get(id);
      r.onsuccess = () => resolve(r.result as StoredHistory | undefined);
      r.onerror = () => reject(r.error);
    });
    return s ? { undo: s.undo, redo: s.redo } : null;
  } catch { return null; }
}
export async function writePackedHistory(id: string, h: PackedHistory) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const r = db.transaction(HISTORY_STORE, 'readwrite').objectStore(HISTORY_STORE).put({ id, ...h });
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}
