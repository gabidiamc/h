/**
 * Cloud persistence layer for Lazo Eterno.
 *
 * Mirrors the document-style API the app was originally written against, but
 * backed by the project's own database. Each collection is a table with an
 * `id` text/uuid primary key and a `data` jsonb document.
 */
import { supabase } from "@/integrations/supabase/client";
import type {
  SiteSettings,
  HomepageConfig,
  Product,
  Order,
  CustomRequest,
  ImportantDate,
  BlockedDate,
  GalleryItem,
  Review,
  GiftCard,
  LoyaltyTier,
  LoyaltyTransaction,
  LoyaltyProgramConfig,
  DiscountCoupon,
  ChatConversation,
  User,
  Giveaway,
  GiveawayEntry,
  GiveawayWinner,
  StoreDiscount,
} from "../types";

export const COLLECTIONS = {
  SITE_CONFIG: "site_config",
  PRODUCTS: "products",
  ORDERS: "orders",
  CUSTOM_REQUESTS: "custom_requests",
  IMPORTANT_DATES: "important_dates",
  BLOCKED_DATES: "blocked_dates",
  GALLERY: "gallery",
  REVIEWS: "reviews",
  GIFT_CARDS: "gift_cards",
  LOYALTY_TIERS: "loyalty_tiers",
  LOYALTY_TRANSACTIONS: "loyalty_transactions",
  COUPONS: "coupons",
  CHAT_CONVERSATIONS: "chat_conversations",
  USERS: "app_users",
  GIVEAWAYS: "giveaways",
  GIVEAWAY_ENTRIES: "giveaway_entries",
  GIVEAWAY_WINNERS: "giveaway_winners",
  DISCOUNTS: "discounts",
} as const;

type TableName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const asUuid = (value: unknown): string | null =>
  typeof value === "string" && UUID_RE.test(value) ? value : null;

const client = () =>
  supabase as unknown as {
    from: (table: string) => any;
    channel: (name: string) => any;
    removeChannel: (channel: unknown) => void;
  };

// ─── Reads & real-time subscriptions ────────────────────────────────────────

export function subscribeToDoc<T>(
  col: string,
  docId: string,
  onUpdate: (data: T | null) => void,
  onError?: (err: Error) => void,
): () => void {
  let cancelled = false;

  const load = async () => {
    const { data, error } = await client().from(col).select("data").eq("id", docId).maybeSingle();
    if (cancelled) return;
    if (error) {
      console.warn(`[Cloud] Read error on ${col}/${docId}:`, error.message);
      onError?.(new Error(error.message));
      return;
    }
    onUpdate((data?.data as T) ?? null);
  };

  void load();

  const channel = client()
    .channel(`doc:${col}:${docId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: col, filter: `id=eq.${docId}` },
      () => void load(),
    )
    .subscribe();

  return () => {
    cancelled = true;
    client().removeChannel(channel);
  };
}

export function subscribeToCollection<T extends { id?: string }>(
  col: string,
  onUpdate: (items: T[]) => void,
  onError?: (err: Error) => void,
): () => void {
  let cancelled = false;
  // Local mirror of the table so a single row event can be applied instantly
  // without waiting for a full re-read.
  let rows = new Map<string, T>();

  const toItem = (row: { id: string; data: Record<string, unknown> }) =>
    ({ ...(row.data ?? {}), id: row.id }) as T;

  const emit = () => {
    if (cancelled) return;
    onUpdate(Array.from(rows.values()));
  };

  const load = async () => {
    const { data, error } = await client().from(col).select("id, data");
    if (cancelled) return;
    if (error) {
      console.warn(`[Cloud] Read error on ${col}:`, error.message);
      onError?.(new Error(error.message));
      return;
    }
    rows = new Map(
      ((data ?? []) as { id: string; data: Record<string, unknown> }[]).map((row) => [
        row.id,
        toItem(row),
      ]),
    );
    emit();
  };

  void load();

  const channel = client()
    .channel(`col:${col}`)
    .on("postgres_changes", { event: "*", schema: "public", table: col }, (payload: any) => {
      if (cancelled) return;
      const oldId = payload?.old?.id as string | undefined;
      const newRow = payload?.new as { id?: string; data?: Record<string, unknown> } | undefined;

      if (payload?.eventType === "DELETE") {
        if (oldId && rows.delete(oldId)) emit();
        else void load();
        return;
      }

      if (newRow?.id && newRow.data !== undefined) {
        rows.set(newRow.id, toItem(newRow as { id: string; data: Record<string, unknown> }));
        emit();
        return;
      }

      void load();
    })
    .subscribe((status: string) => {
      // Re-sync after a reconnect so nothing missed while offline lingers.
      if (status === "SUBSCRIBED") void load();
    });

  // Safety net: if the tab was in the background or offline and missed an
  // event, re-read the table as soon as it comes back so the screen always
  // matches the database. A light periodic check covers dropped events too.
  const resync = () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    void load();
  };
  let poll: ReturnType<typeof setInterval> | undefined;
  if (typeof window !== "undefined") {
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("online", resync);
    window.addEventListener("focus", resync);
    poll = setInterval(resync, 15000);
  }

  return () => {
    cancelled = true;
    if (poll) clearInterval(poll);
    if (typeof window !== "undefined") {
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("online", resync);
      window.removeEventListener("focus", resync);
    }
    client().removeChannel(channel);
  };
}

// ─── Writes ─────────────────────────────────────────────────────────────────

async function upsertDoc(
  table: TableName,
  id: string,
  data: unknown,
  ownerId?: string | null,
): Promise<void> {
  const row: Record<string, unknown> = {
    id,
    data,
    updated_at: new Date().toISOString(),
  };
  if (ownerId !== undefined) row["owner_id"] = ownerId;
  const { error } = await client().from(table).upsert(row, { onConflict: "id" });
  if (error) console.warn(`[Cloud] Write error on ${table}/${id}:`, error.message);
}

async function removeDoc(table: TableName, id: string): Promise<void> {
  const { error } = await client().from(table).delete().eq("id", id);
  if (error) console.warn(`[Cloud] Delete error on ${table}/${id}:`, error.message);
}

/**
 * Makes the remote table match `items` exactly: writes every item and removes
 * rows that no longer exist locally. This is what makes deletions in the owner
 * panel permanent instead of coming back on the next reload.
 */
export async function replaceCollection<T extends { id: string }>(
  table: TableName,
  items: T[],
  transform: (item: T) => unknown = (item) => item,
): Promise<void> {
  const { data: existing, error } = await client().from(table).select("id");
  if (error) {
    console.warn(`[Cloud] Sync read error on ${table}:`, error.message);
  }

  const keepIds = new Set(items.map((i) => i.id));
  const staleIds = ((existing ?? []) as { id: string }[])
    .map((r) => r.id)
    .filter((id) => !keepIds.has(id));

  const rows = items.map((item) => ({
    id: item.id,
    data: transform(item),
    updated_at: new Date().toISOString(),
  }));

  if (rows.length > 0) {
    const { error: upErr } = await client().from(table).upsert(rows, { onConflict: "id" });
    if (upErr) console.warn(`[Cloud] Write error on ${table}:`, upErr.message);
  }

  if (staleIds.length > 0) {
    const { error: delErr } = await client().from(table).delete().in("id", staleIds);
    if (delErr) console.warn(`[Cloud] Delete error on ${table}:`, delErr.message);
  }
}

export const saveSiteSettingsToFirestore = (settings: SiteSettings) =>
  upsertDoc(COLLECTIONS.SITE_CONFIG, "settings", settings);

export const saveHomepageConfigToFirestore = (config: HomepageConfig) =>
  upsertDoc(COLLECTIONS.SITE_CONFIG, "homepage", config);

export const saveProductToFirestore = (product: Product) =>
  upsertDoc(COLLECTIONS.PRODUCTS, product.id, {
    ...product,
    updatedAt: new Date().toISOString(),
  });

export const deleteProductFromFirestore = (id: string) => removeDoc(COLLECTIONS.PRODUCTS, id);

/**
 * Mirrors the full catalog so the public site always matches the owner's
 * current version (adds, edits and removals) in real time.
 */
export const syncProductsToFirestore = (products: Product[]) =>
  replaceCollection(COLLECTIONS.PRODUCTS, products, (p) => ({
    ...p,
    updatedAt: new Date().toISOString(),
  }));

export const saveOrderToFirestore = (order: Order) =>
  upsertDoc(
    COLLECTIONS.ORDERS,
    order.id,
    { ...order, updatedAt: new Date().toISOString() },
    asUuid(order.customerId),
  );

export const deleteOrderFromFirestore = (id: string) => removeDoc(COLLECTIONS.ORDERS, id);

export const saveCustomRequestToFirestore = (req: CustomRequest) =>
  upsertDoc(
    COLLECTIONS.CUSTOM_REQUESTS,
    req.id,
    { ...req, updatedAt: new Date().toISOString() },
    asUuid(req.customerId),
  );

export const deleteCustomRequestFromFirestore = (id: string) =>
  removeDoc(COLLECTIONS.CUSTOM_REQUESTS, id);

export const saveLoyaltyTierToFirestore = (tier: LoyaltyTier) =>
  upsertDoc(COLLECTIONS.LOYALTY_TIERS, tier.id, {
    ...tier,
    updatedAt: new Date().toISOString(),
  });

export const deleteLoyaltyTierFromFirestore = (id: string) =>
  removeDoc(COLLECTIONS.LOYALTY_TIERS, id);

export const saveLoyaltyTransactionToFirestore = (tx: import("../types").LoyaltyTransaction) =>
  upsertDoc(COLLECTIONS.LOYALTY_TRANSACTIONS, tx.id, tx, asUuid(tx.customerId));

export const deleteLoyaltyTransactionFromFirestore = (id: string) =>
  removeDoc(COLLECTIONS.LOYALTY_TRANSACTIONS, id);

export const saveLoyaltyConfigToFirestore = (config: import("../types").LoyaltyProgramConfig) =>
  upsertDoc(COLLECTIONS.SITE_CONFIG, "loyalty_config", config);

export const saveCouponToFirestore = (coupon: DiscountCoupon) =>
  upsertDoc(COLLECTIONS.COUPONS, coupon.id, coupon);

export const deleteCouponFromFirestore = (id: string) => removeDoc(COLLECTIONS.COUPONS, id);

export const saveGiftCardToFirestore = (card: GiftCard) =>
  upsertDoc(
    COLLECTIONS.GIFT_CARDS,
    card.id,
    card,
    asUuid((card as { purchaserId?: string }).purchaserId),
  );

export const deleteGiftCardFromFirestore = (id: string) => removeDoc(COLLECTIONS.GIFT_CARDS, id);

export const saveImportantDateToFirestore = (item: ImportantDate) =>
  upsertDoc(COLLECTIONS.IMPORTANT_DATES, item.id, item);

export const deleteImportantDateFromFirestore = (id: string) =>
  removeDoc(COLLECTIONS.IMPORTANT_DATES, id);

export const saveBlockedDateToFirestore = (item: BlockedDate) =>
  upsertDoc(COLLECTIONS.BLOCKED_DATES, item.id, item);

export const deleteBlockedDateFromFirestore = (id: string) =>
  removeDoc(COLLECTIONS.BLOCKED_DATES, id);

export const saveGalleryItemToFirestore = (item: GalleryItem) =>
  upsertDoc(COLLECTIONS.GALLERY, item.id, item);

export const deleteGalleryItemFromFirestore = (id: string) => removeDoc(COLLECTIONS.GALLERY, id);

export const saveReviewToFirestore = (item: Review) =>
  upsertDoc(COLLECTIONS.REVIEWS, item.id, item);

export const deleteReviewFromFirestore = (id: string) => removeDoc(COLLECTIONS.REVIEWS, id);

export const saveChatConversationToFirestore = (convo: ChatConversation) =>
  upsertDoc(COLLECTIONS.CHAT_CONVERSATIONS, convo.id, convo, asUuid(convo.customerId));

export const saveGiveawayToFirestore = (giveaway: Giveaway) =>
  upsertDoc(COLLECTIONS.GIVEAWAYS, giveaway.id, giveaway);

export const deleteGiveawayFromFirestore = (id: string) => removeDoc(COLLECTIONS.GIVEAWAYS, id);

export const saveGiveawayEntryToFirestore = (entry: GiveawayEntry) =>
  upsertDoc(
    COLLECTIONS.GIVEAWAY_ENTRIES,
    entry.entryId || entry.id || `${entry.giveawayId}_${entry.userId}`,
    entry,
    asUuid(entry.userId),
  );

export const saveGiveawayWinnerToFirestore = (winner: GiveawayWinner) =>
  upsertDoc(COLLECTIONS.GIVEAWAY_WINNERS, winner.id || `winner_${winner.giveawayId}`, winner);

export const deleteGiveawayWinnerFromFirestore = (id: string) =>
  removeDoc(COLLECTIONS.GIVEAWAY_WINNERS, id);

export const saveDiscountToFirestore = (discount: StoreDiscount) =>
  upsertDoc(COLLECTIONS.DISCOUNTS, discount.id, discount);

export const deleteDiscountFromFirestore = (id: string) => removeDoc(COLLECTIONS.DISCOUNTS, id);

export const saveUserToFirestore = async (user: User): Promise<void> => {
  if (!user || !user.id) return;
  return upsertDoc(COLLECTIONS.USERS, user.id, user);
};

export const deleteUserFromFirestore = (userId: string): Promise<void> => {
  if (!userId) return Promise.resolve();
  return removeDoc(COLLECTIONS.USERS, userId);
};

export async function deleteUserCompletelyFromServers(user: {
  id: string;
  email?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { id, email } = user;
    const cleanEmail = (email || "").toLowerCase().trim();

    // 1. Delete user from app_users
    await removeDoc(COLLECTIONS.USERS, id);

    // 2. Delete user's orders
    try {
      const { data: orders } = await client().from(COLLECTIONS.ORDERS).select("id, data");
      if (orders && Array.isArray(orders)) {
        for (const row of orders) {
          const o = row.data as Order | undefined;
          if (
            o &&
            (o.customerId === id || (cleanEmail && o.customerEmail?.toLowerCase() === cleanEmail))
          ) {
            await removeDoc(COLLECTIONS.ORDERS, row.id);
          }
        }
      }
    } catch (err) {
      console.warn("[Cloud] Error deleting user orders:", err);
    }

    // 3. Delete user's custom requests
    try {
      const { data: requests } = await client()
        .from(COLLECTIONS.CUSTOM_REQUESTS)
        .select("id, data");
      if (requests && Array.isArray(requests)) {
        for (const row of requests) {
          const r = row.data as CustomRequest | undefined;
          if (
            r &&
            (r.customerId === id || (cleanEmail && r.customerEmail?.toLowerCase() === cleanEmail))
          ) {
            await removeDoc(COLLECTIONS.CUSTOM_REQUESTS, row.id);
          }
        }
      }
    } catch (err) {
      console.warn("[Cloud] Error deleting user custom requests:", err);
    }

    // 4. Delete user's chat conversations
    try {
      const { data: convos } = await client()
        .from(COLLECTIONS.CHAT_CONVERSATIONS)
        .select("id, data");
      if (convos && Array.isArray(convos)) {
        for (const row of convos) {
          const c = row.data as ChatConversation | undefined;
          if (
            c &&
            (c.customerId === id || (cleanEmail && c.customerEmail?.toLowerCase() === cleanEmail))
          ) {
            await removeDoc(COLLECTIONS.CHAT_CONVERSATIONS, row.id);
          }
        }
      }
    } catch (err) {
      console.warn("[Cloud] Error deleting user chats:", err);
    }

    // 5. Delete user's reviews
    try {
      const { data: reviews } = await client().from(COLLECTIONS.REVIEWS).select("id, data");
      if (reviews && Array.isArray(reviews)) {
        for (const row of reviews) {
          const rev = row.data as Review | undefined;
          if (
            rev &&
            (rev.customerId === id ||
              (cleanEmail && rev.customerEmail?.toLowerCase() === cleanEmail))
          ) {
            await removeDoc(COLLECTIONS.REVIEWS, row.id);
          }
        }
      }
    } catch (err) {
      console.warn("[Cloud] Error deleting user reviews:", err);
    }

    // 6. Delete user's loyalty transactions
    try {
      const { data: txs } = await client()
        .from(COLLECTIONS.LOYALTY_TRANSACTIONS)
        .select("id, data");
      if (txs && Array.isArray(txs)) {
        for (const row of txs) {
          const t = row.data as LoyaltyTransaction | undefined;
          if (
            t &&
            (t.customerId === id || (cleanEmail && t.customerEmail?.toLowerCase() === cleanEmail))
          ) {
            await removeDoc(COLLECTIONS.LOYALTY_TRANSACTIONS, row.id);
          }
        }
      }
    } catch (err) {
      console.warn("[Cloud] Error deleting user loyalty transactions:", err);
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("[Cloud] Error during complete user deletion:", err);
    return { success: false, error: (err as Error)?.message || "Error al eliminar datos" };
  }
}

// ─── Bulk sync ──────────────────────────────────────────────────────────────

export async function syncCompleteStateToFirestore(data: {
  siteSettings?: SiteSettings;
  homepageConfig?: HomepageConfig;
  loyaltyConfig?: LoyaltyProgramConfig;
  products?: Product[];
  orders?: Order[];
  customRequests?: CustomRequest[];
  importantDates?: ImportantDate[];
  blockedDates?: BlockedDate[];
  gallery?: GalleryItem[];
  reviews?: Review[];
  giftCards?: GiftCard[];
  loyaltyTiers?: LoyaltyTier[];
  loyaltyTransactions?: LoyaltyTransaction[];
  coupons?: DiscountCoupon[];
}): Promise<void> {
  const jobs: Promise<unknown>[] = [];

  if (data.siteSettings) jobs.push(saveSiteSettingsToFirestore(data.siteSettings));
  if (data.homepageConfig) jobs.push(saveHomepageConfigToFirestore(data.homepageConfig));
  if (data.loyaltyConfig) jobs.push(saveLoyaltyConfigToFirestore(data.loyaltyConfig));

  // Shared shop content the owner fully controls: mirror it exactly (adds,
  // edits AND deletions).
  const stamp = <T extends object>(item: T) => ({ ...item, updatedAt: new Date().toISOString() });
  if (data.products) jobs.push(replaceCollection(COLLECTIONS.PRODUCTS, data.products, stamp));
  if (data.importantDates)
    jobs.push(replaceCollection(COLLECTIONS.IMPORTANT_DATES, data.importantDates));
  if (data.blockedDates) jobs.push(replaceCollection(COLLECTIONS.BLOCKED_DATES, data.blockedDates));
  if (data.gallery) jobs.push(replaceCollection(COLLECTIONS.GALLERY, data.gallery));
  if (data.reviews) jobs.push(replaceCollection(COLLECTIONS.REVIEWS, data.reviews));
  if (data.loyaltyTiers)
    jobs.push(replaceCollection(COLLECTIONS.LOYALTY_TIERS, data.loyaltyTiers, stamp));
  if (data.coupons) jobs.push(replaceCollection(COLLECTIONS.COUPONS, data.coupons));

  // Customer-generated records: never deleted by a bulk sync.
  data.orders?.forEach((o) => jobs.push(saveOrderToFirestore(o)));
  data.customRequests?.forEach((r) => jobs.push(saveCustomRequestToFirestore(r)));
  data.giftCards?.forEach((c) => jobs.push(saveGiftCardToFirestore(c)));
  data.loyaltyTransactions?.forEach((tx) => jobs.push(saveLoyaltyTransactionToFirestore(tx)));

  await Promise.all(jobs);
}

/**
 * The baseline configuration now ships with the database itself, so there is
 * nothing to seed at runtime.
 */
export async function checkAndSeedFirestoreDatabase(_baseline: unknown): Promise<boolean> {
  return false;
}
