/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Unified Storage Engine (Clean Architectural Facade)
 *
 * All application data is now persisted directly to Supabase as the Single
 * Source of Truth with Realtime postgres_changes invalidation.
 *
 * This facade provides zero-overhead, backwards-compatible shims for legacy
 * callers while guaranteeing NO secondary local database (IndexedDB,
 * localStorage shadow DB, or disk JSON) intercepts or overrides Supabase.
 */
import { toast } from "sonner";

export function cacheKey(table: string): string {
  return `dmps_db_${table}`;
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
      return true;
    }
  } catch {
    // Ignore storage quota or disabled storage
  }
  return false;
}

export function mergeRowsById<T = any>(existingRows: T[], incomingRows: T[]): T[] {
  const map = new Map<string, T>();
  for (const r of incomingRows) {
    if (r && typeof r === "object" && "id" in r) {
      map.set(String((r as any).id), r);
    }
  }
  for (const r of existingRows) {
    if (r && typeof r === "object" && "id" in r) {
      const id = String((r as any).id);
      if (!map.has(id)) {
        map.set(id, r);
      }
    }
  }
  return Array.from(map.values());
}

/**
 * Legacy storage fetch shim: returns an empty array.
 * Data reads must go directly to Supabase.
 */
export async function fetchTableFromStorage<T = any>(_table: string): Promise<T[]> {
  return [];
}

/**
 * Legacy storage read shim.
 */
export function readFromUnifiedStorage<T = any>(_table: string): T[] | null {
  return null;
}

export async function getOrFetchFromUnifiedStorage<T = any>(_table: string): Promise<T[]> {
  return [];
}

export function notifySaveSuccess(customMessage?: string): void {
  toast.success(customMessage || "✓ Se guardó sin ningún problema la información en Supabase.");
}

/**
 * Legacy save shim. Writes must go directly to Supabase via admin or client services.
 */
export async function saveToUnifiedStorage(_table: string, _rows: unknown): Promise<boolean> {
  return true;
}

export function writeToUnifiedStorage(_table: string, _rows: unknown): void {
  // No-op: Supabase is the single source of truth
}

export function upsertSingleRowInUnifiedStorage(_table: string, row: any, _idField = "id"): any[] {
  return [row];
}

export function deleteSingleRowInUnifiedStorage(
  _table: string,
  _id: string,
  _idField = "id",
): any[] {
  return [];
}

/**
 * Initializes real-time synchronization; no longer mounts IndexedDB or persistent_db.json.
 */
export async function initUnifiedStorageEngine(onHydrated?: () => void): Promise<void> {
  if (onHydrated) {
    onHydrated();
  }
}

export function isStorageEngineHydrated(): boolean {
  return true;
}
