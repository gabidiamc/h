/**
 * Nuevo sistema de auto-guardado (v2).
 *
 * Idea: en lugar de un "guardar todo" gigante con temporizadores, cada pieza de
 * información se refleja en la base de datos en cuanto cambia, a través de una
 * cola con reintentos. Si algo falla (sin internet, un error momentáneo) el
 * cambio queda pendiente y se vuelve a intentar solo, así los cambios son
 * instantáneos y permanentes.
 */
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

type Status = "idle" | "saving" | "saved" | "error";

type Job =
  | { kind: "doc"; table: string; id: string; data: unknown; ownerId?: string | null }
  | { kind: "mirror"; table: string; items: { id: string; data: unknown }[] }
  | { kind: "upserts"; table: string; items: { id: string; data: unknown }[] }
  | { kind: "delete"; table: string; id: string };

const db = () => supabase as unknown as { from: (table: string) => any };

// Última versión pendiente por clave: si el usuario escribe rápido, sólo se
// envía el estado final. Eso es lo que lo hace eficiente.
const queue = new Map<string, Job>();
let running = false;
let status: Status = "idle";
const listeners = new Set<(s: Status, at: Date | null) => void>();
let lastSavedAt: Date | null = null;

function setStatus(next: Status) {
  status = next;
  if (next === "saved") lastSavedAt = new Date();
  listeners.forEach((fn) => fn(status, lastSavedAt));
}

export function onPersistenceStatus(fn: (s: Status, at: Date | null) => void): () => void {
  listeners.add(fn);
  fn(status, lastSavedAt);
  return () => listeners.delete(fn);
}

const stamp = () => new Date().toISOString();

async function runJob(job: Job): Promise<void> {
  if (job.kind === "doc") {
    const row: Record<string, unknown> = { id: job.id, data: job.data, updated_at: stamp() };
    if (job.ownerId !== undefined) row["owner_id"] = job.ownerId;
    const { error } = await db().from(job.table).upsert(row, { onConflict: "id" });
    if (error) throw new Error(error.message);
    return;
  }

  if (job.kind === "delete") {
    const { error } = await db().from(job.table).delete().eq("id", job.id);
    if (error) throw new Error(error.message);
    return;
  }

  const rows = job.items.map((i) => ({ id: i.id, data: i.data, updated_at: stamp() }));
  if (rows.length > 0) {
    const { error } = await db().from(job.table).upsert(rows, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }

  if (job.kind === "mirror") {
    // Espejo exacto: lo que ya no existe localmente se borra del servidor, así
    // las eliminaciones no "reviven" al recargar.
    const { data: existing, error } = await db().from(job.table).select("id");
    if (error) throw new Error(error.message);
    const keep = new Set(job.items.map((i) => i.id));
    const stale = ((existing ?? []) as { id: string }[])
      .map((r) => r.id)
      .filter((id) => !keep.has(id));
    if (stale.length > 0) {
      const { error: delErr } = await db().from(job.table).delete().in("id", stale);
      if (delErr) throw new Error(delErr.message);
    }
  }
}

async function drain() {
  if (running) return;
  running = true;
  setStatus("saving");
  let failed = false;

  while (queue.size > 0) {
    const [key, job] = queue.entries().next().value as [string, Job];
    queue.delete(key);

    let attempt = 0;
    for (;;) {
      try {
        await runJob(job);
        break;
      } catch (err) {
        attempt += 1;
        if (attempt >= 3) {
          console.warn(`[Autosave] No se pudo guardar ${key}:`, (err as Error).message);
          failed = true;
          // Se reintenta más tarde sólo si nadie escribió algo más nuevo.
          if (!queue.has(key)) queue.set(key, job);
          await sleep(4000);
          break;
        }
        await sleep(400 * attempt);
      }
    }

    if (failed && queue.has(key)) break; // evita un bucle infinito inmediato
  }

  running = false;
  setStatus(failed ? "error" : "saved");

  // Si quedó algo pendiente (por ejemplo sin conexión), se reintenta solo.
  if (queue.size > 0) setTimeout(() => void drain(), 5000);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function enqueue(key: string, job: Job) {
  queue.set(key, job);
  // Arranca en el siguiente tick para agrupar cambios del mismo render.
  setTimeout(() => void drain(), 0);
}

export const persistDoc = (table: string, id: string, data: unknown, ownerId?: string | null) =>
  enqueue(`${table}:${id}`, {
    kind: "doc",
    table,
    id,
    data,
    ...(ownerId !== undefined ? { ownerId } : {}),
  });

export const persistDelete = (table: string, id: string) =>
  enqueue(`${table}:del:${id}`, { kind: "delete", table, id });

export const persistMirror = (table: string, items: { id: string; data: unknown }[]) =>
  enqueue(`mirror:${table}`, { kind: "mirror", table, items });

export const persistUpserts = (table: string, items: { id: string; data: unknown }[]) =>
  enqueue(`upserts:${table}:${items.map((i) => i.id).join(",")}`, {
    kind: "upserts",
    table,
    items,
  });

export function flushPending() {
  if (queue.size > 0) void drain();
}

if (typeof window !== "undefined") {
  window.addEventListener("online", flushPending);
  window.addEventListener("focus", flushPending);
}

// ─── Hooks de reflejo automático ────────────────────────────────────────────

type WithId = { id: string };

/**
 * Refleja una lista completa en su tabla: agrega, actualiza y borra.
 * Sólo escribe cuando el contenido realmente cambió.
 */
export function useMirroredCollection<T extends WithId>(
  table: string,
  items: T[],
  enabled: boolean,
) {
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const json = JSON.stringify(items);
    if (last.current === null) {
      last.current = json; // primera vez: ya viene del servidor
      return;
    }
    if (last.current === json) return;
    last.current = json;
    persistMirror(
      table,
      items.map((i) => ({ id: i.id, data: i })),
    );
  }, [table, items, enabled]);
}

/**
 * Guarda sólo los elementos que cambiaron; nunca borra
 * (pedidos, solicitudes, tarjetas: historial de clientes).
 */
export function useUpsertedCollection<T extends WithId>(
  table: string,
  items: T[],
  enabled: boolean,
  ownerOf?: (item: T) => string | null | undefined,
) {
  const last = useRef<Map<string, string> | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const snapshot = new Map<string, string>();
    items.forEach((i) => i?.id && snapshot.set(i.id, JSON.stringify(i)));

    if (last.current === null) {
      last.current = snapshot;
      return;
    }

    const changed = items.filter((i) => i?.id && last.current?.get(i.id) !== snapshot.get(i.id));
    last.current = snapshot;
    if (changed.length === 0) return;

    changed.forEach((item) => {
      const owner = ownerOf ? ownerOf(item) : undefined;
      persistDoc(table, item.id, item, owner === undefined ? undefined : (owner ?? null));
    });
  }, [table, items, enabled, ownerOf]);
}

/** Guarda un documento único (configuración, portada, lealtad). */
export function useMirroredDoc<T>(table: string, id: string, value: T, enabled: boolean) {
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const json = JSON.stringify(value);
    if (last.current === null) {
      last.current = json;
      return;
    }
    if (last.current === json) return;
    last.current = json;
    persistDoc(table, id, value);
  }, [table, id, value, enabled]);
}
