/**
 * Content Lifecycle & Expiration Engine for DMPS Info
 *
 * Official Timezone: America/Chicago (Des Moines, Iowa)
 * Guarantees accurate status determination, non-destructive logical archiving,
 * search sorting priority, and registration cutoff enforcement.
 */

export const DES_MOINES_TIMEZONE = "America/Chicago";

export type ContentStatus =
  | "active"
  | "happening_now"
  | "upcoming"
  | "completed"
  | "out_of_season"
  | "registration_closed"
  | "archived"
  | "cancelled"
  | "postponed";

export interface LifecycleItem {
  id?: string;
  table?:
    | "events"
    | "announcements"
    | "activities"
    | "programs"
    | "articles"
    | "faqs"
    | "contacts"
    | string;
  title?: string;
  typeLabel?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  registration_starts_at?: string | null;
  registration_ends_at?: string | null;
  expires_at?: string | null;
  review_date?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  is_cancelled?: boolean | null;
  is_postponed?: boolean | null;
  is_permanent?: boolean | null;
  season?: string | null;
  published_at?: string | null;
  archived_at?: string | null;
  verified_at?: string | null;
  updated_at?: string | null;
  last_modified_by?: string | null;
  timezone?: string | null;
  directAdminLink?: string;
}

export type ExpirationFilter =
  "all" | "today" | "next_7_days" | "next_30_days" | "no_end_date" | "completed" | "archived";

/**
 * Returns current Date object for comparisons.
 */
export function getDesMoinesNow(): Date {
  return new Date();
}

/**
 * Gets the current date/time components strictly in America/Chicago timezone.
 */
export function getDesMoinesComponents(d: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  isoDate: string;
  timeStr: string;
  formattedDisplay: string;
} {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: DES_MOINES_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "00";
  const year = parseInt(get("year"), 10);
  const month = parseInt(get("month"), 10);
  const day = parseInt(get("day"), 10);
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(get("minute"), 10);
  const second = parseInt(get("second"), 10);

  const pad = (n: number) => String(n).padStart(2, "0");
  const isoDate = `${year}-${pad(month)}-${pad(day)}`;
  const timeStr = `${pad(hour)}:${pad(minute)}:${pad(second)}`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    isoDate,
    timeStr,
    formattedDisplay: `${isoDate} ${timeStr} (CT)`,
  };
}

/**
 * Converts a date/time string or combination of date + time into an ISO date string or Date object.
 */
export function parseDesMoinesDateTime(
  dateStr?: string | null,
  timeStr?: string | null,
): Date | null {
  if (!dateStr) return null;

  // If already an ISO string with T or Z
  if (dateStr.includes("T")) {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  // If date is YYYY-MM-DD
  const cleanDate = dateStr.trim();
  const cleanTime = timeStr ? timeStr.trim().slice(0, 5) : "23:59";
  // Create an ISO string format for parsing
  const combined = `${cleanDate}T${cleanTime.length === 5 ? cleanTime + ":00" : "23:59:59"}`;
  const d = new Date(combined);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Parses starts_at or start_date
 */
export function getEffectiveStartsAt(item: LifecycleItem): Date | null {
  if (item.starts_at) {
    const d = new Date(item.starts_at);
    if (!isNaN(d.getTime())) return d;
  }
  if (item.start_date) {
    return parseDesMoinesDateTime(item.start_date, item.start_time || "00:00");
  }
  return null;
}

/**
 * Parses ends_at, end_date, expires_at, or review_date
 */
export function getEffectiveEndsAt(item: LifecycleItem): Date | null {
  if (item.is_permanent) return null;

  if (item.ends_at) {
    const d = new Date(item.ends_at);
    if (!isNaN(d.getTime())) return d;
  }
  if (item.expires_at) {
    const d = new Date(item.expires_at);
    if (!isNaN(d.getTime())) return d;
  }
  if (item.review_date) {
    return parseDesMoinesDateTime(item.review_date, "23:59");
  }
  if (item.end_date) {
    return parseDesMoinesDateTime(item.end_date, item.end_time || "23:59");
  }
  if (item.start_date && item.start_time && item.end_time) {
    return parseDesMoinesDateTime(item.start_date, item.end_time);
  }
  return null;
}

/**
 * Checks if a resource is designated as permanently active (no expiration date).
 */
export function isItemPermanent(item: LifecycleItem): boolean {
  if (item.is_permanent) return true;
  const endsAt = getEffectiveEndsAt(item);
  return !endsAt && item.status !== "archived" && !item.archived_at && !item.is_cancelled;
}

/**
 * Parses registration ends_at
 */
export function getEffectiveRegistrationEndsAt(item: LifecycleItem): Date | null {
  if (item.registration_ends_at) {
    const d = new Date(item.registration_ends_at);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/**
 * Official computation of content status based on Des Moines time.
 * Rules:
 * 1. Cancelled items remain 'cancelled' and never transition to 'completed'.
 * 2. Postponed items remain 'postponed' and are not archived without a new date.
 * 3. If archived_at exists or status is explicitly 'archived', returns 'archived'.
 * 4. If current time >= ends_at, content is 'completed' (or 'out_of_season' for sports/seasons).
 * 5. If registration_ends_at has passed and item is a registration form, returns 'registration_closed'.
 * 6. If currently between starts_at and ends_at on same day/short window -> 'happening_now'.
 * 7. If current time < starts_at -> 'upcoming'.
 * 8. Otherwise 'active'.
 */
export function computeContentStatus(
  item: LifecycleItem,
  options?: { isSport?: boolean; isRegistration?: boolean; now?: Date },
): ContentStatus {
  const now = options?.now || getDesMoinesNow();
  const nowTime = now.getTime();

  // 1. Explicit cancellation override (never becomes completed)
  if (item.is_cancelled || item.status === "cancelled" || item.status === "Cancelado") {
    return "cancelled";
  }

  // 2. Explicit postponed override (never auto-archived without date)
  if (item.is_postponed || item.status === "postponed" || item.status === "Pospuesto") {
    return "postponed";
  }

  // 3. Logical archive override
  if (item.archived_at || item.status === "archived" || item.status === "Archivado") {
    return "archived";
  }

  const startsAt = getEffectiveStartsAt(item);
  const endsAt = getEffectiveEndsAt(item);
  const regEndsAt = getEffectiveRegistrationEndsAt(item);

  // 4. Check Registration Cutoff
  if (options?.isRegistration && regEndsAt && nowTime >= regEndsAt.getTime()) {
    return "registration_closed";
  }

  // 5. Check Expiration / End Date (ends_at is strict upper bound: now >= ends_at -> completed)
  if (endsAt && nowTime >= endsAt.getTime()) {
    if (
      options?.isSport ||
      item.season ||
      item.status === "out_of_season" ||
      item.status === "Fuera de temporada"
    ) {
      return "out_of_season";
    }
    return "completed";
  }

  // 6. Check Happening Now (for short duration events happening right now)
  if (startsAt && endsAt && nowTime >= startsAt.getTime() && nowTime <= endsAt.getTime()) {
    const durationHours = (endsAt.getTime() - startsAt.getTime()) / (1000 * 60 * 60);
    // If it's a specific single-day event or under 24 hours
    if (durationHours <= 24) {
      return "happening_now";
    }
  }

  // 7. Check Upcoming
  if (startsAt && nowTime < startsAt.getTime()) {
    return "upcoming";
  }

  // 8. Specific manual status flags
  if (item.status === "out_of_season" || item.status === "Fuera de temporada") {
    return "out_of_season";
  }

  if (item.status === "registration_closed" || item.status === "Registro cerrado") {
    return "registration_closed";
  }

  if (item.is_active === false && item.status !== "published" && item.status !== "active") {
    return "completed";
  }

  return "active";
}

/**
 * Checks if registration is currently open.
 */
export function isRegistrationOpen(item: LifecycleItem, now?: Date): boolean {
  const curr = now || getDesMoinesNow();
  const currTime = curr.getTime();

  if (item.is_cancelled || item.is_postponed || item.archived_at) {
    return false;
  }

  if (item.registration_starts_at) {
    const regStart = new Date(item.registration_starts_at);
    if (!isNaN(regStart.getTime()) && currTime < regStart.getTime()) {
      return false;
    }
  }

  if (item.registration_ends_at) {
    const regEnd = new Date(item.registration_ends_at);
    if (!isNaN(regEnd.getTime()) && currTime >= regEnd.getTime()) {
      return false;
    }
  }

  const status = computeContentStatus(item, { isRegistration: true, now: curr });
  return status === "active" || status === "upcoming" || status === "happening_now";
}

/**
 * Checks if content is currently active and should appear in active family feeds.
 */
export function isItemActive(item: LifecycleItem, now?: Date): boolean {
  const status = computeContentStatus(item, { now });
  return status === "active" || status === "happening_now";
}

/**
 * Checks if content is upcoming (starts in the future and has not expired).
 */
export function isItemUpcoming(item: LifecycleItem, now?: Date): boolean {
  const status = computeContentStatus(item, { now });
  return status === "upcoming";
}

/**
 * Checks if content has expired/completed/out-of-season.
 */
export function isItemExpired(item: LifecycleItem, now?: Date): boolean {
  const status = computeContentStatus(item, { now });
  return status === "completed" || status === "out_of_season" || status === "archived";
}

/**
 * Formats a date specifically in America/Chicago timezone for human readability.
 */
export function formatDesMoinesDate(
  dateInput: string | Date | null | undefined,
  locale: string = "es",
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: DES_MOINES_TIMEZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale === "kar" ? "en" : locale, defaultOptions).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

/**
 * Formats a date and time specifically in America/Chicago timezone.
 */
export function formatDesMoinesDateTime(
  dateInput: string | Date | null | undefined,
  locale: string = "es",
): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  try {
    return new Intl.DateTimeFormat(locale === "kar" ? "en" : locale, {
      timeZone: DES_MOINES_TIMEZONE,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/**
 * Categorizes an item by its expiration proximity for the Admin "Contenido próximo a finalizar" panel.
 */
export function getExpirationUrgency(
  item: LifecycleItem,
  now?: Date,
): {
  filterGroup: ExpirationFilter;
  daysRemaining: number | null;
  endsAt: Date | null;
  isExpired: boolean;
  status: ContentStatus;
} {
  const curr = now || getDesMoinesNow();
  const endsAt = getEffectiveEndsAt(item);
  const status = computeContentStatus(item, { now: curr });

  if (status === "archived") {
    return {
      filterGroup: "archived",
      daysRemaining: null,
      endsAt,
      isExpired: true,
      status,
    };
  }

  if (!endsAt) {
    return {
      filterGroup: "no_end_date",
      daysRemaining: null,
      endsAt: null,
      isExpired: false,
      status,
    };
  }

  const diffMs = endsAt.getTime() - curr.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs <= 0 || status === "completed" || status === "out_of_season") {
    return {
      filterGroup: "completed",
      daysRemaining,
      endsAt,
      isExpired: true,
      status,
    };
  }

  // Ends today (less than 24h remaining and same calendar day in Des Moines)
  if (daysRemaining <= 1 && diffMs > 0) {
    return {
      filterGroup: "today",
      daysRemaining: 0,
      endsAt,
      isExpired: false,
      status,
    };
  }

  if (daysRemaining <= 7) {
    return {
      filterGroup: "next_7_days",
      daysRemaining,
      endsAt,
      isExpired: false,
      status,
    };
  }

  if (daysRemaining <= 30) {
    return {
      filterGroup: "next_30_days",
      daysRemaining,
      endsAt,
      isExpired: false,
      status,
    };
  }

  return {
    filterGroup: "all",
    daysRemaining,
    endsAt,
    isExpired: false,
    status,
  };
}

/**
 * Maps status string to human-readable label and color badge styling.
 */
export function getStatusBadgeInfo(
  status: ContentStatus,
  lang: string = "es",
): {
  label: string;
  className: string;
  isExpired: boolean;
} {
  const isEn = lang === "en";
  const isKar = lang === "kar";

  switch (status) {
    case "happening_now":
      return {
        label: isKar ? "တၢ်မၤအိၣ်ခဲအံၤ" : isEn ? "Happening now" : "Ocurriendo ahora",
        className: "bg-emerald-600 text-white font-bold animate-pulse shadow-xs",
        isExpired: false,
      };
    case "active":
      return {
        label: isKar ? "တၢ်မၤအိၣ်ဒံး" : isEn ? "Active" : "Activo",
        className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        isExpired: false,
      };
    case "upcoming":
      return {
        label: isKar ? "ကဟဲကဒါဒံး" : isEn ? "Upcoming" : "Próximamente",
        className: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
        isExpired: false,
      };
    case "completed":
      return {
        label: isKar ? "ဝံၤဝတံၤလံ" : isEn ? "Completed" : "Finalizado",
        className: "bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 border-neutral-500/30",
        isExpired: true,
      };
    case "out_of_season":
      return {
        label: isKar ? "တၢ်ဆၢကတီၢ်ပူၤကွံာ်လံ" : isEn ? "Out of season" : "Fuera de temporada",
        className: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        isExpired: true,
      };
    case "registration_closed":
      return {
        label: isKar ? "တၢ်မၤမံၤပိာ်ဖျါလံ" : isEn ? "Registration closed" : "Registro cerrado",
        className: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
        isExpired: true,
      };
    case "archived":
      return {
        label: isKar ? "ပာ်ကရၢၢ်လံ" : isEn ? "Archived" : "Archivado",
        className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
        isExpired: true,
      };
    case "cancelled":
      return {
        label: isKar ? "တၢ်ပတုာ်လံ" : isEn ? "Cancelled" : "Cancelado",
        className: "bg-destructive/10 text-destructive border-destructive/30",
        isExpired: true,
      };
    case "postponed":
      return {
        label: isKar ? "တၢ်ဆုဒံး" : isEn ? "Postponed" : "Pospuesto",
        className: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
        isExpired: false,
      };
    default:
      return {
        label: status,
        className: "bg-muted text-muted-foreground border-border",
        isExpired: false,
      };
  }
}
