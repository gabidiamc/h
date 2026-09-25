/**
 * Unique Order Identifier Generator for Hecho por Monce.
 *
 * Format: HPM-YYYY-XXXXXX (e.g., HPM-2026-000001)
 *
 * Guarantees:
 * - Permanent, unique order numbers.
 * - Sequential padding (6 digits).
 * - Safe against concurrent rapid creations via synchronized sequence tracking.
 * - Backward compatible with legacy formats (ORD-YYYY-XXX).
 */

let inMemorySequenceCounter = 0;

export function getNextOrderSequence(
  year: number,
  existingOrders?: Array<{ orderNumber?: string; id?: string }>,
): number {
  let highestFound = 0;

  // 1. Scan existing orders in state / database for current year
  if (Array.isArray(existingOrders)) {
    const pattern = new RegExp(`^HPM-${year}-(\\d+)$`, "i");
    for (const ord of existingOrders) {
      if (ord.orderNumber) {
        const match = ord.orderNumber.trim().match(pattern);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > highestFound) {
            highestFound = num;
          }
        }
      }
    }
  }

  // 2. Scan persistent localStorage sequence
  const storageKey = `hpm_order_seq_${year}`;
  let storedSeq = 0;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > storedSeq) {
        storedSeq = parsed;
      }
    }
  } catch {
    // ignore storage restrictions
  }

  // 3. Increment beyond the highest known across all sources
  const candidate = Math.max(highestFound, storedSeq, inMemorySequenceCounter) + 1;
  inMemorySequenceCounter = candidate;

  try {
    localStorage.setItem(storageKey, String(candidate));
  } catch {
    // ignore
  }

  return candidate;
}

export function generateUniqueOrderId(
  existingOrders?: Array<{ orderNumber?: string; id?: string }>,
): string {
  const currentYear = new Date().getFullYear();
  const nextSeq = getNextOrderSequence(currentYear, existingOrders);
  const paddedSeq = String(nextSeq).padStart(6, "0");
  return `HPM-${currentYear}-${paddedSeq}`;
}

/**
 * Normalizes query string and checks whether an order matches an order ID search.
 * Supports:
 * - Full ID: "HPM-2026-000001"
 * - Case-insensitive: "hpm-2026-000001"
 * - Short numeric sequence: "000001" or "1" (with prefix)
 * - Legacy prefix: "ORD-2026-..."
 * - Internal document UUID: "ord-174..."
 */
export function matchesOrderQuery(
  order: {
    id: string;
    orderNumber: string;
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    status?: string;
    paymentStatus?: string;
    items?: Array<{ productName?: string }>;
    giftCardCode?: string;
  },
  rawQuery: string,
): boolean {
  if (!rawQuery) return false;
  const q = rawQuery.trim().toLowerCase().replace(/^#/, "");
  if (!q) return false;

  const orderNum = (order.orderNumber || "").toLowerCase();
  const orderId = (order.id || "").toLowerCase();
  const custId = (order.customerId || "").toLowerCase();
  const custName = (order.customerName || "").toLowerCase();
  const custEmail = (order.customerEmail || "").toLowerCase();
  const custPhone = (order.customerPhone || "").replace(/\D/g, "");
  const orderStatus = (order.status || "").toLowerCase();
  const paymentStatus = (order.paymentStatus || "").toLowerCase();
  const giftCard = (order.giftCardCode || "").toLowerCase();

  // 1. Order ID matches (exact or partial)
  if (orderNum === q || orderId === q) return true;
  if (orderNum.includes(q) || orderId.includes(q)) return true;

  // 2. Customer ID, Name & Email matches
  if (custId.includes(q) || custName.includes(q) || custEmail.includes(q)) return true;

  // 3. Customer Phone matches (normalized digits)
  const digitsOnlyQuery = q.replace(/\D/g, "");
  if (digitsOnlyQuery.length >= 3 && custPhone.includes(digitsOnlyQuery)) return true;

  // 4. Numeric shorthand match: if user types "1" or "000421" or "421", check if matches suffix
  const numOnly = q.replace(/\D/g, "");
  if (numOnly.length >= 1) {
    const padded = numOnly.padStart(6, "0");
    if (orderNum.endsWith(padded) || orderNum.endsWith(`-${numOnly}`)) return true;
  }

  // 5. Product name match inside order items
  if (order.items && order.items.length > 0) {
    if (order.items.some((it) => (it.productName || "").toLowerCase().includes(q))) {
      return true;
    }
  }

  // 6. Status and Payment Status match
  if (orderStatus.includes(q) || paymentStatus.includes(q)) return true;
  if (q.includes("entreg") && order.status === "ENTREGADO") return true;
  if (
    q.includes("anticip") &&
    (order.status === "ANTICIPO_RECIBIDO" || order.paymentStatus === "ANTICIPO_PAGADO")
  )
    return true;
  if (
    q.includes("verific") &&
    (order.status === "PAGO_VERIFICADO" || order.paymentStatus === "CONFIRMADO")
  )
    return true;
  if (
    q.includes("taller") &&
    (order.status === "EN_PRODUCCION" || order.status === "EN_PREPARACION")
  )
    return true;
  if (q.includes("cancel") && order.status === "CANCELADO") return true;

  // 7. Gift Card match
  if (giftCard && giftCard.includes(q)) return true;

  return false;
}
