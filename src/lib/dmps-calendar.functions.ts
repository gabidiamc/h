import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schoolSchema = z.object({ schoolId: z.enum(["lincoln", "east"]) });

/**
 * Public: keeps the official DMPS calendar fresh for the selected school.
 * Only refreshes when the last import is older than 6 hours, so page views
 * cannot hammer the source site.
 */
export const ensureCalendarFresh = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schoolSchema.parse(data))
  .handler(async ({ data }) => {
    const { scopeIsStale, syncCalendarScope } = await import("./dmps-calendar.server");
    const results = [];
    for (const scope of ["district", data.schoolId] as const) {
      if (await scopeIsStale(scope, 6)) {
        try {
          results.push(await syncCalendarScope(scope));
        } catch (error) {
          results.push({ scope, error: (error as Error).message });
        }
      }
    }
    return { refreshed: results };
  });

/** Staff: forces a full re-import of the district + school calendars. */
export const syncCalendarNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schoolSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: roles, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (error) throw new Error("No se pudo verificar tu cuenta de personal.");
    if (!roles || roles.length === 0) {
      throw new Error("No tienes permiso para importar el calendario (sin rol en user_roles).");
    }
    const { syncCalendarsForSchool } = await import("./dmps-calendar.server");
    return { results: await syncCalendarsForSchool(data.schoolId) };
  });
