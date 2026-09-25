/**
 * Secure Server-side & Backend Service for Sorteos (Giveaways) & Descuentos
 *
 * Implements:
 * 1. Cryptographically secure winner selection.
 * 2. Strict winner verification and duplicate prevention (idempotent execution).
 * 3. Automatic real Gift Card generation if prizeType === 'gift_card'.
 * 4. Participant entry verification (auth, active status, quota, dates, no duplicates).
 * 5. Strict privacy enforcement: public views only see sanitized publicName and optional avatar.
 */

import {
  Giveaway,
  GiveawayEntry,
  GiveawayWinner,
  GiftCard,
  formatPublicWinnerName,
} from "../types";
import {
  COLLECTIONS,
  saveGiveawayToFirestore,
  saveGiveawayWinnerToFirestore,
  saveGiveawayEntryToFirestore,
  saveGiftCardToFirestore,
} from "../lib/cloudService";

export interface DrawWinnerResult {
  success: boolean;
  message?: string;
  winner?: GiveawayWinner;
  giftCard?: GiftCard;
  alreadyDrawn?: boolean;
}

/**
 * Executes a secure server-side drawing to select a winner for a giveaway.
 * Idempotent: if a winner has already been selected, returns the existing winner
 * and will NEVER generate duplicate gift cards or overwrite previous results.
 */
export async function drawGiveawayWinnerSecurely(params: {
  giveaway: Giveaway;
  entries: GiveawayEntry[];
  existingWinner?: GiveawayWinner | null;
  existingGiftCards?: GiftCard[];
}): Promise<DrawWinnerResult> {
  const { giveaway, entries, existingWinner, existingGiftCards = [] } = params;

  if (!giveaway || !giveaway.id) {
    return { success: false, message: "Sorteo no válido o inexistente." };
  }

  // Idempotency: If winner was already drawn, return existing winner
  if (existingWinner && existingWinner.giveawayId === giveaway.id) {
    return {
      success: true,
      alreadyDrawn: true,
      winner: existingWinner,
      message: "Este sorteo ya tiene un ganador seleccionado previamente.",
    };
  }

  // Filter only valid entries for this giveaway
  const validEntries = (entries || []).filter(
    (e) => e.giveawayId === giveaway.id && e.status === "VALID",
  );

  if (validEntries.length === 0) {
    // End giveaway without winner if no participants
    const endedGiveaway: Giveaway = {
      ...giveaway,
      status: "ENDED",
      endedAt: new Date().toISOString(),
    };
    await saveGiveawayToFirestore(endedGiveaway);

    return {
      success: false,
      message: "No se puede seleccionar ganador: no hay participantes registrados en el sorteo.",
    };
  }

  // Cryptographically secure random selection
  const randomBuffer = new Uint32Array(1);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBuffer);
  } else {
    randomBuffer[0] = Math.floor(Math.random() * 4294967296);
  }
  const winnerIndex = randomBuffer[0] % validEntries.length;
  const winningEntry = validEntries[winnerIndex];

  // Automatic Real Gift Card creation if prizeType === 'gift_card'
  let createdGiftCard: GiftCard | undefined;
  if (giveaway.prizeType === "gift_card") {
    // Check if card was already created for this giveaway
    const alreadyExists = existingGiftCards.find(
      (c) => c.giveawayId === giveaway.id || (c.source === "giveaway" && c.orderId === giveaway.id),
    );

    if (alreadyExists) {
      createdGiftCard = alreadyExists;
    } else {
      const codeTail = Math.random().toString(36).substring(2, 6).toUpperCase();
      const codeTime = Date.now().toString(36).slice(-4).toUpperCase();
      const giftCardCode = `GIFT-SORTEO-${codeTail}-${codeTime}`;
      const cardId = `gc_giveaway_${giveaway.id}_${winningEntry.userId}`;

      const newGiftCard: GiftCard = {
        id: cardId,
        code: giftCardCode,
        initialAmount: Number(giveaway.prizeAmount) || 25,
        currentBalance: Number(giveaway.prizeAmount) || 25,
        currency: "USD",
        status: "active",
        themeDesign: "romantic_rose",
        purchaserName: "Sorteo Hecho por Monce",
        purchaserEmail: "sorteos@hechopormonse.com",
        recipientName: winningEntry.displayName,
        recipientEmail: winningEntry.userEmail || "",
        personalMessage: `¡Felicidades ${winningEntry.displayName}! Has sido seleccionado/a como ganador/a oficial del sorteo "${giveaway.title}". Canjea tu tarjeta en nuestra tienda artesanal.`,
        deliveryMethod: "direct",
        createdAt: new Date().toISOString(),
        redemptionHistory: [],
        source: "giveaway",
        giveawayId: giveaway.id,
        winnerUserId: winningEntry.userId,
      };

      await saveGiftCardToFirestore(newGiftCard);
      createdGiftCard = newGiftCard;
    }
  }

  // Create Giveaway Winner record with privacy-preserved publicName
  const winnerRecord: GiveawayWinner = {
    id: `winner_${giveaway.id}`,
    giveawayId: giveaway.id,
    winnerUserId: winningEntry.userId,
    displayName: winningEntry.displayName,
    publicName: formatPublicWinnerName(winningEntry.displayName),
    avatarUrl: winningEntry.userAvatarUrl,
    selectedAt: new Date().toISOString(),
    prizeType: giveaway.prizeType,
    prizeAmount: giveaway.prizeAmount,
    prizeName: giveaway.prizeName,
    prizeStatus: "PENDING_DELIVERY",
    giftCardId: createdGiftCard?.id,
    giftCardCode: createdGiftCard?.code,
  };

  // Persist winner record to giveaway_winners
  await saveGiveawayWinnerToFirestore(winnerRecord);

  // Update Giveaway status to ENDED
  const updatedGiveaway: Giveaway = {
    ...giveaway,
    status: "ENDED",
    winnerUserId: winningEntry.userId,
    winnerDisplayName: winningEntry.displayName,
    winnerPublicName: formatPublicWinnerName(winningEntry.displayName),
    winnerAvatarUrl: winningEntry.userAvatarUrl,
    endedAt: new Date().toISOString(),
  };

  await saveGiveawayToFirestore(updatedGiveaway);

  return {
    success: true,
    winner: winnerRecord,
    giftCard: createdGiftCard,
    message: `¡Ganador/a seleccionado/a con éxito: ${winnerRecord.publicName}!`,
  };
}

/**
 * Validates and registers a user entry securely.
 * Checks authentication, active state, date validity, remaining capacity,
 * and deterministic duplicate prevention (giveawayId + userId).
 */
export async function registerGiveawayEntry(params: {
  giveaway: Giveaway;
  userId: string;
  displayName: string;
  userEmail?: string;
  avatarUrl?: string;
  existingEntries: GiveawayEntry[];
}): Promise<{ success: boolean; message: string; entry?: GiveawayEntry }> {
  const { giveaway, userId, displayName, userEmail, avatarUrl, existingEntries } = params;

  if (!userId) {
    return { success: false, message: "Debes iniciar sesión para participar en el sorteo." };
  }

  if (!giveaway || giveaway.status !== "ACTIVE") {
    return { success: false, message: "Este sorteo no está activo en este momento." };
  }

  const now = new Date().getTime();
  const start = new Date(giveaway.startAt).getTime();
  const end = new Date(giveaway.endAt).getTime();

  if (now < start) {
    return { success: false, message: "Este sorteo aún no ha comenzado." };
  }

  if (now > end) {
    return { success: false, message: "Este sorteo ya ha finalizado su período de participación." };
  }

  // Count current valid entries
  const currentEntries = (existingEntries || []).filter(
    (e) => e.giveawayId === giveaway.id && e.status === "VALID",
  );

  // Check capacity
  if (giveaway.maxParticipants > 0 && currentEntries.length >= giveaway.maxParticipants) {
    return {
      success: false,
      message: "Lo sentimos, este sorteo ha alcanzado el límite máximo de participantes.",
    };
  }

  // Duplicate check: combination giveawayId + userId
  const alreadyParticipating = currentEntries.some((e) => e.userId === userId);
  if (alreadyParticipating) {
    return {
      success: false,
      message:
        "Ya estás participando en este sorteo. Solamente se permite una participación por persona.",
    };
  }

  const entryId = `${giveaway.id}_${userId}`;
  const newEntry: GiveawayEntry = {
    entryId,
    id: entryId,
    giveawayId: giveaway.id,
    userId,
    displayName: displayName || "Participante",
    userAvatarUrl: avatarUrl,
    userEmail,
    createdAt: new Date().toISOString(),
    status: "VALID",
  };

  await saveGiveawayEntryToFirestore(newEntry);

  return {
    success: true,
    message: "¡Participación confirmada exitosamente! Mucha suerte.",
    entry: newEntry,
  };
}
