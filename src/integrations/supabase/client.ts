/* eslint-disable @typescript-eslint/no-explicit-any */
// Supabase client initialization with graceful fallback
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { brokeredPreviewStorage } from "./previewAuthStorage";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

const DEFAULT_PROJECT_URL = "https://nrtndalmngfwqidregma.supabase.co";
const FALLBACK_PUBLISHABLE_KEY = "sb_publishable_nrtndalmngfwqidregma";

const fallbackStore = new Map<string, Record<string, any>[]>();

function isPlaceholderSupabaseKey(key: string): boolean {
  return !key || key === FALLBACK_PUBLISHABLE_KEY || key === "dummy-anon-key";
}

function matchesQueryFilters(row: Record<string, any>, searchParams: URLSearchParams): boolean {
  for (const [key, rawVal] of searchParams.entries()) {
    if (
      key === "select" ||
      key === "order" ||
      key === "limit" ||
      key === "offset" ||
      key === "on_conflict" ||
      key === "columns" ||
      key === "or"
    ) {
      continue;
    }
    if (rawVal.startsWith("eq.")) {
      const target = rawVal.slice(3);
      if (String(row[key] ?? "") !== target) return false;
    } else if (rawVal.startsWith("neq.")) {
      const target = rawVal.slice(4);
      if (String(row[key] ?? "") === target) return false;
    } else if (rawVal.startsWith("in.(") && rawVal.endsWith(")")) {
      const inner = rawVal.slice(4, -1);
      const allowed = inner.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
      if (!allowed.includes(String(row[key] ?? ""))) return false;
    }
  }
  return true;
}

async function handleFallbackSupabaseRequest(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  headers: Headers,
): Promise<Response> {
  const rawUrl =
    typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const url = new URL(rawUrl, DEFAULT_PROJECT_URL);
  const method = (
    init?.method ||
    (typeof Request !== "undefined" && input instanceof Request ? input.method : "GET")
  ).toUpperCase();
  const accept = headers.get("Accept") || headers.get("accept") || "";
  const wantsObject = accept.includes("application/vnd.pgrst.object+json");

  const jsonHeaders: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    "content-range": "0-0/0",
  };

  if (url.pathname.includes("/auth/v1/")) {
    return new Response(JSON.stringify({ user: null, session: null }), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  if (url.pathname.includes("/storage/v1/")) {
    const objectMatch = url.pathname.match(/\/storage\/v1\/object\/([^/]+)\/(.+)$/);
    if (objectMatch && (method === "POST" || method === "PUT")) {
      return new Response(
        JSON.stringify({
          Id: `obj_${Date.now()}`,
          Key: `${objectMatch[1]}/${objectMatch[2]}`,
        }),
        {
          status: 200,
          headers: jsonHeaders,
        },
      );
    }
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  const restMatch = url.pathname.match(/\/rest\/v1\/([^/?]+)/);
  if (!restMatch) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  const segment = decodeURIComponent(restMatch[1]);
  if (segment === "rpc") {
    return new Response(JSON.stringify(null), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  const table = segment;
  const currentRows = fallbackStore.get(table) ?? [];

  if (method === "GET" || method === "HEAD") {
    let filtered = currentRows.filter((r) => matchesQueryFilters(r, url.searchParams));
    const limitParam = url.searchParams.get("limit");
    if (limitParam) {
      const limitNum = Number(limitParam);
      if (!Number.isNaN(limitNum) && limitNum >= 0) {
        filtered = filtered.slice(0, limitNum);
      }
    }
    const body = wantsObject ? (filtered[0] ?? null) : filtered;
    return new Response(method === "HEAD" ? null : JSON.stringify(body), {
      status: 200,
      headers: {
        ...jsonHeaders,
        "content-range": `0-${Math.max(0, filtered.length - 1)}/${filtered.length}`,
      },
    });
  }

  let parsedBody: any = null;
  if (init?.body && typeof init.body === "string") {
    try {
      parsedBody = JSON.parse(init.body);
    } catch {
      parsedBody = null;
    }
  }

  if (method === "POST") {
    const incoming = Array.isArray(parsedBody)
      ? parsedBody
      : parsedBody && typeof parsedBody === "object"
        ? [parsedBody]
        : [];
    const conflictKey = (url.searchParams.get("on_conflict") || "id").split(",")[0].trim();
    const nextRows = [...currentRows];
    const savedItems: Record<string, any>[] = [];

    for (const item of incoming) {
      const now = new Date().toISOString();
      const row: Record<string, any> = {
        ...item,
        updated_at: item.updated_at ?? now,
        created_at: item.created_at ?? now,
      };
      if (!row[conflictKey] && conflictKey === "id") {
        row.id = `${table}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      }
      const idx = nextRows.findIndex(
        (existing) =>
          existing[conflictKey] !== undefined &&
          String(existing[conflictKey]) === String(row[conflictKey]),
      );
      if (idx >= 0) {
        nextRows[idx] = { ...nextRows[idx], ...row };
        savedItems.push(nextRows[idx]);
      } else {
        nextRows.push(row);
        savedItems.push(row);
      }
    }

    fallbackStore.set(table, nextRows);
    const responseData = wantsObject ? (savedItems[0] ?? null) : savedItems;
    return new Response(JSON.stringify(responseData), {
      status: 201,
      headers: jsonHeaders,
    });
  }

  if (method === "PATCH") {
    const updates = parsedBody && typeof parsedBody === "object" ? parsedBody : {};
    const updatedItems: Record<string, any>[] = [];
    const nextRows = currentRows.map((row) => {
      if (matchesQueryFilters(row, url.searchParams)) {
        const next = { ...row, ...updates, updated_at: new Date().toISOString() };
        updatedItems.push(next);
        return next;
      }
      return row;
    });
    fallbackStore.set(table, nextRows);
    const responseData = wantsObject ? (updatedItems[0] ?? null) : updatedItems;
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  if (method === "DELETE") {
    const remaining = currentRows.filter((row) => !matchesQueryFilters(row, url.searchParams));
    fallbackStore.set(table, remaining);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: jsonHeaders,
    });
  }

  return new Response(JSON.stringify([]), {
    status: 200,
    headers: jsonHeaders,
  });
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return async (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);

    if (isPlaceholderSupabaseKey(supabaseKey)) {
      return handleFallbackSupabaseRequest(input, init, headers);
    }

    try {
      const response = await fetch(input, { ...init, headers });
      if (response.status === 401) {
        return handleFallbackSupabaseRequest(input, init, headers);
      }
      return response;
    } catch {
      return handleFallbackSupabaseRequest(input, init, headers);
    }
  };
}

function resolveSupabaseUrl(): string {
  const fromVite =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env["VITE_SUPABASE_URL"] as string | undefined)
      : undefined;
  const fromProcess =
    typeof process !== "undefined"
      ? process.env?.["SUPABASE_URL"] || process.env?.["VITE_SUPABASE_URL"]
      : undefined;
  return (fromVite || fromProcess || DEFAULT_PROJECT_URL).trim();
}

function resolveSupabasePublishableKey(): string {
  const fromVite =
    typeof import.meta !== "undefined" && import.meta.env
      ? ((import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
          import.meta.env["VITE_SUPABASE_ANON_KEY"]) as string | undefined)
      : undefined;
  if (fromVite && fromVite.trim()) return fromVite.trim();

  if (typeof process !== "undefined" && process.env) {
    const direct =
      process.env["SUPABASE_PUBLISHABLE_KEY"] ||
      process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
      process.env["SUPABASE_ANON_KEY"] ||
      process.env["VITE_SUPABASE_ANON_KEY"];
    if (direct && direct.trim()) return direct.trim();

    const keyset = process.env["SUPABASE_PUBLISHABLE_KEYS"];
    if (keyset) {
      try {
        const parsed: unknown = JSON.parse(keyset);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const keys = parsed as Record<string, unknown>;
          const key = [keys["default"], ...Object.values(keys)]
            .find((v): v is string => typeof v === "string" && v.trim().length > 0)
            ?.trim();
          if (key) return key;
        }
      } catch {
        // ignore malformed keyset
      }
    }
  }

  return "sb_publishable_nrtndalmngfwqidregma";
}

export function isSupabaseConfigured(): boolean {
  const url = resolveSupabaseUrl();
  return Boolean(url && !url.includes("placeholder"));
}

export function hasSupabaseRealtimeKey(): boolean {
  return !isPlaceholderSupabaseKey(resolveSupabasePublishableKey());
}

function createSupabaseClient() {
  const SUPABASE_URL = resolveSupabaseUrl();
  const SUPABASE_PUBLISHABLE_KEY = resolveSupabasePublishableKey();

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: brokeredPreviewStorage(),
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(target, prop, receiver) {
    if (prop in target) {
      return (target as any)[prop];
    }
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
  set(target, prop, value, receiver) {
    (target as any)[prop] = value;
    if (_supabase) {
      try {
        Reflect.set(_supabase, prop, value, receiver);
      } catch {
        // ignore
      }
    }
    return true;
  },
  deleteProperty(target, prop) {
    delete (target as any)[prop];
    return true;
  },
});
