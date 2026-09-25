import { Giveaway, GiveawayEntry, GiveawayWinner, StoreDiscount } from "../types";

export const INITIAL_GIVEAWAYS: Giveaway[] = [
  {
    id: "giveaway-primavera-2026",
    title: "Gran Sorteo de Primavera: Ramo Buchón 50 Rosas Eternas",
    description:
      "Celebra la temporada con Hecho por Monce. Participa sin costo para ganar un exclusivo Ramo Buchón artesanal de 50 rosas eternas de listón satinado con corona de pedrería y mariposas doradas.",
    prizeName: "Ramo Buchón 50 Rosas Eternas + Corona Imperial",
    prizeType: "product",
    prizeAmount: 85,
    imageUrl:
      "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=800&q=80",
    maxParticipants: 50,
    startAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    requirements: "Tener cuenta registrada en Hecho por Monce y residir en la zona de entrega.",
    status: "ACTIVE",
    showOnHomepage: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "monse@hechopormonse.com",
  },
  {
    id: "giveaway-giftcard-50usd",
    title: "Sorteo Oficial Tarjeta de Regalo $50 USD Hecho por Monce",
    description:
      "Gana una Gift Card de $50 USD para elegir tus ramos favoritos, joyeros acrílicos o cajas sorpresa eternas en nuestra tienda online.",
    prizeName: "Gift Card Digital $50 USD",
    prizeType: "gift_card",
    prizeAmount: 50,
    imageUrl:
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80",
    maxParticipants: 60,
    startAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    requirements: "Abierto a todos los clientes registrados en la tienda.",
    status: "ACTIVE",
    showOnHomepage: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: "monse@hechopormonse.com",
  },
];

export const INITIAL_GIVEAWAY_ENTRIES: GiveawayEntry[] = [
  {
    entryId: "giveaway-primavera-2026_usr_demo_1",
    id: "giveaway-primavera-2026_usr_demo_1",
    giveawayId: "giveaway-primavera-2026",
    userId: "usr_demo_1",
    displayName: "Valeria Morales",
    userAvatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    status: "VALID",
  },
  {
    entryId: "giveaway-primavera-2026_usr_demo_2",
    id: "giveaway-primavera-2026_usr_demo_2",
    giveawayId: "giveaway-primavera-2026",
    userId: "usr_demo_2",
    displayName: "Carlos Rivas",
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    status: "VALID",
  },
  {
    entryId: "giveaway-giftcard-50usd_usr_demo_3",
    id: "giveaway-giftcard-50usd_usr_demo_3",
    giveawayId: "giveaway-giftcard-50usd",
    userId: "usr_demo_3",
    displayName: "Daniela Castillo",
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    status: "VALID",
  },
];

export const INITIAL_GIVEAWAY_WINNERS: GiveawayWinner[] = [];

export const INITIAL_STORE_DISCOUNTS: StoreDiscount[] = [
  {
    id: "discount-bienvenida10",
    name: "Bienvenida Hecho por Monce",
    code: "BIENVENIDA10",
    type: "percentage",
    value: 10,
    minimumPurchase: 30,
    maxUses: 200,
    currentUses: 14,
    startAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    showOnHomepage: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "discount-amorprimavera",
    name: "Cupón Especial Temporada de Amor",
    code: "AMORPRIMAVERA",
    type: "fixed",
    value: 15,
    minimumPurchase: 60,
    maxUses: 100,
    currentUses: 8,
    startAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    endAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: "ACTIVE",
    showOnHomepage: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
