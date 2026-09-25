import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  X,
  Package,
  User,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  CreditCard,
  Gift,
  FileText,
  ShieldCheck,
  Crown,
  Tag,
  Phone,
  Mail,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock3,
} from "lucide-react";
import { Order, Product, User as UserType, GiftCard, SiteSettings } from "../types";
import { matchesOrderQuery } from "../utils/orderIdGenerator";

interface UniversalSearchProps {
  orders: Order[];
  products: Product[];
  registeredUsers: UserType[];
  giftCards: GiftCard[];
  siteSettings: SiteSettings;
  onSelectOrder: (order: Order) => void;
  onOpenReceipt: (order: Order) => void;
  onNavigateToTab?: (tabId: string) => void;
}

export const OwnerUniversalSearch: React.FC<UniversalSearchProps> = ({
  orders,
  products,
  registeredUsers,
  giftCards,
  siteSettings,
  onSelectOrder,
  onOpenReceipt,
  onNavigateToTab,
}) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "ORDERS" | "CUSTOMERS">("ALL");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce query with 250ms delay for fast responsiveness
  useEffect(() => {
    if (!query.trim()) {
      setDebouncedQuery("");
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
      setIsSearching(false);
    }, 220);
    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut: Escape to close / clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Matching Logic
  const results = useMemo(() => {
    if (!debouncedQuery) return { orders: [], customers: [], totalCount: 0 };

    const q = debouncedQuery.toLowerCase();
    const digitsOnly = q.replace(/\D/g, "");

    // 1. Matched Orders
    const matchedOrders = orders.filter((order) => {
      // 1a. Standard order matching (ID, full number, numeric suffix, name, email, phone)
      if (matchesOrderQuery(order, debouncedQuery)) return true;

      // 1b. Match customer ID
      if (order.customerId && order.customerId.toLowerCase().includes(q)) return true;

      // 1c. Match product names inside items
      if (
        order.items &&
        order.items.some((item) => (item.productName || "").toLowerCase().includes(q))
      ) {
        return true;
      }

      // 1d. Match order status or payment status
      if (
        (order.status || "").toLowerCase().includes(q) ||
        (order.paymentStatus || "").toLowerCase().includes(q)
      ) {
        return true;
      }

      // Humanized status matchers (e.g. "entregado", "anticipo", "verificado", "taller", "cancelado")
      if (
        (q.includes("entreg") && order.status === "ENTREGADO") ||
        (q.includes("anticip") &&
          (order.status === "ANTICIPO_RECIBIDO" || order.paymentStatus === "ANTICIPO_PAGADO")) ||
        (q.includes("verific") &&
          (order.status === "PAGO_VERIFICADO" || order.paymentStatus === "CONFIRMADO")) ||
        (q.includes("taller") && order.status === "EN_PRODUCCION") ||
        (q.includes("cancel") && order.status === "CANCELADO") ||
        (q.includes("revis") && order.status === "COMPROBANTE_EN_REVISION")
      ) {
        return true;
      }

      // 1e. Match Gift Card associated with order (code or note)
      if (order.giftCardCode && order.giftCardCode.toLowerCase().includes(q)) {
        return true;
      }

      // Check if any gift card has this order's ID or redemption
      const relatedGc = giftCards.find(
        (gc) =>
          gc.code.toLowerCase().includes(q) &&
          (gc.orderId === order.id ||
            gc.redemptionHistory?.some(
              (r) => r.orderId === order.id || r.orderNumber === order.orderNumber,
            )),
      );
      if (relatedGc) return true;

      return false;
    });

    // 2. Matched Customers (from registeredUsers + distinct order customers)
    const customerMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        phone: string;
        orderCount: number;
        isRegistered: boolean;
        orders: Order[];
      }
    >();

    // From orders
    orders.forEach((ord) => {
      const key = ord.customerEmail ? ord.customerEmail.toLowerCase().trim() : ord.customerId;
      if (!key) return;

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: ord.customerId,
          name: ord.customerName || "Cliente",
          email: ord.customerEmail || "",
          phone: ord.customerPhone || "",
          orderCount: 0,
          isRegistered: false,
          orders: [],
        });
      }
      const existing = customerMap.get(key)!;
      existing.orderCount += 1;
      existing.orders.push(ord);
    });

    // Merge registered users
    registeredUsers.forEach((usr) => {
      const key = usr.email ? usr.email.toLowerCase().trim() : usr.id;
      if (customerMap.has(key)) {
        const existing = customerMap.get(key)!;
        existing.isRegistered = true;
        if (usr.name && !existing.name) existing.name = usr.name;
        if (usr.phone && !existing.phone) existing.phone = usr.phone;
      } else {
        customerMap.set(key, {
          id: usr.id,
          name: usr.name || "Usuario Registrado",
          email: usr.email || "",
          phone: usr.phone || "",
          orderCount: orders.filter(
            (o) =>
              o.customerId === usr.id ||
              (usr.email && o.customerEmail?.toLowerCase() === usr.email.toLowerCase()),
          ).length,
          isRegistered: true,
          orders: orders.filter(
            (o) =>
              o.customerId === usr.id ||
              (usr.email && o.customerEmail?.toLowerCase() === usr.email.toLowerCase()),
          ),
        });
      }
    });

    // Filter customers matching query
    const matchedCustomers = Array.from(customerMap.values()).filter((cust) => {
      const nameMatch = cust.name.toLowerCase().includes(q);
      const emailMatch = cust.email.toLowerCase().includes(q);
      const idMatch = cust.id.toLowerCase().includes(q);
      const custDigits = cust.phone.replace(/\D/g, "");
      const phoneMatch = digitsOnly.length >= 3 && custDigits.includes(digitsOnly);

      return nameMatch || emailMatch || idMatch || phoneMatch;
    });

    return {
      orders: matchedOrders,
      customers: matchedCustomers,
      totalCount: matchedOrders.length + matchedCustomers.length,
    };
  }, [debouncedQuery, orders, registeredUsers, giftCards]);

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PAGO_VERIFICADO":
        return {
          label: "Pago Verificado",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      case "ANTICIPO_RECIBIDO":
        return {
          label: "Anticipo Verificado",
          bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        };
      case "EN_PRODUCCION":
      case "EN_PREPARACION":
        return { label: "En Taller", bg: "bg-blue-50 text-blue-800 border-blue-200" };
      case "LISTO":
      case "LISTO_PARA_ENTREGA":
        return { label: "Listo p/ Entrega", bg: "bg-amber-50 text-amber-800 border-amber-200" };
      case "ENTREGADO":
        return { label: "Entregado", bg: "bg-purple-50 text-purple-800 border-purple-200" };
      case "CANCELADO":
        return { label: "Cancelado", bg: "bg-stone-100 text-stone-700 border-stone-200" };
      case "PAGO_PENDIENTE_VERIFICACION":
      case "COMPROBANTE_EN_REVISION":
        return {
          label: "⏳ Comprobante en Revisión",
          bg: "bg-amber-50 text-amber-900 border-amber-300",
        };
      case "ESPERANDO_PAGO":
      default:
        return { label: "Esperando Pago", bg: "bg-stone-100 text-stone-600 border-stone-200" };
    }
  };

  const getPaymentStatusBadge = (order: Order) => {
    const isApproved =
      order.paymentStatus === "CONFIRMADO" ||
      order.paymentStatus === "PAGADO_TOTAL" ||
      order.status === "PAGO_VERIFICADO";
    const isRejected = order.paymentStatus === "RECHAZADO";
    const isPending =
      order.paymentStatus === "VERIFICANDO" ||
      order.paymentStatus === "COMPROBANTE_EN_REVISION" ||
      order.status === "PAGO_PENDIENTE_VERIFICACION" ||
      (order.paymentProof && order.paymentProof.status === "PENDIENTE");

    if (isApproved) {
      const isFullySettled =
        (order.remainingBalance || 0) === 0 && order.amountPaid >= order.totalPrice;
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          {isFullySettled ? "Liquidado Total" : "Anticipo Aprobado"}
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
          <AlertCircle className="w-3 h-3" />
          Pago Rechazado
        </span>
      );
    }
    if (isPending) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 animate-pulse">
          <Clock3 className="w-3 h-3" />
          Comprobante p/ Revisar
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
        Pendiente
      </span>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Box */}
      <div className="relative flex items-center bg-white rounded-2xl border border-stone-300/80 shadow-xs transition-all focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-200/60">
        <div className="pl-3.5 pr-2 text-stone-400 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-amber-600" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder="Buscar pedido, cliente, producto o ID…"
          className="w-full py-2.5 pr-9 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 bg-transparent focus:outline-none"
        />

        {/* Loading Spinner or Clear Button */}
        <div className="absolute right-2.5 flex items-center gap-1">
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Results Dropdown Overlay */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-3xl border border-stone-200 shadow-2xl z-50 overflow-hidden max-h-[82vh] flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header & Category Filters */}
          <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                Buscador Universal
              </span>
              <span className="text-xs text-stone-500">
                {isSearching ? (
                  "Buscando en tiempo real…"
                ) : (
                  <>
                    <strong>{results.totalCount}</strong> coincidencia
                    {results.totalCount === 1 ? "" : "s"}
                  </>
                )}
              </span>
            </div>

            {/* Sub-filters for quick narrowing */}
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer text-[11px] ${
                  filterType === "ALL"
                    ? "bg-stone-900 text-white font-semibold"
                    : "bg-stone-200/60 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Todos ({results.totalCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("ORDERS")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer text-[11px] ${
                  filterType === "ORDERS"
                    ? "bg-stone-900 text-white font-semibold"
                    : "bg-stone-200/60 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Pedidos ({results.orders.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("CUSTOMERS")}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer text-[11px] ${
                  filterType === "CUSTOMERS"
                    ? "bg-stone-900 text-white font-semibold"
                    : "bg-stone-200/60 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Clientes ({results.customers.length})
              </button>
            </div>
          </div>

          {/* Results Scroll Area */}
          <div className="overflow-y-auto p-3 sm:p-4 space-y-4">
            {/* No Results Fallback */}
            {!isSearching && results.totalCount === 0 && (
              <div className="py-10 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
                  <Search className="w-6 h-6" />
                </div>
                <p className="font-serif text-sm font-bold text-stone-800">
                  No se encontraron resultados para &ldquo;{debouncedQuery}&rdquo;
                </p>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Verifica el número de orden (ej. HPM-2026-000001), nombre del cliente, teléfono,
                  correo o producto.
                </p>
              </div>
            )}

            {/* Section: Matched Orders */}
            {(filterType === "ALL" || filterType === "ORDERS") && results.orders.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-rose-700" />
                    Pedidos Encontrados ({results.orders.length})
                  </span>
                </div>

                <div className="space-y-2">
                  {results.orders.map((ord) => {
                    const statusBadge = getOrderStatusBadge(ord.status);
                    const productPreview =
                      ord.items && ord.items.length > 0
                        ? ord.items.map((i) => `${i.productName} (x${i.quantity})`).join(", ")
                        : "Pedido sin productos especificados";

                    return (
                      <div
                        key={ord.id}
                        className="group p-3.5 bg-stone-50 hover:bg-amber-50/40 rounded-2xl border border-stone-200 hover:border-amber-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        {/* Order info */}
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-stone-900 bg-white px-2 py-0.5 rounded-md border border-stone-200 shadow-2xs">
                              #{ord.orderNumber}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusBadge.bg}`}
                            >
                              {statusBadge.label}
                            </span>
                            {getPaymentStatusBadge(ord)}
                            {ord.giftCardCode && (
                              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
                                <Gift className="w-2.5 h-2.5" />
                                Gift Card: {ord.giftCardCode}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-700">
                            <span className="font-bold text-stone-900 flex items-center gap-1">
                              <User className="w-3 h-3 text-stone-400" />
                              {ord.customerName}
                            </span>
                            {ord.customerPhone && (
                              <span className="text-stone-500 flex items-center gap-1 text-[11px]">
                                <Phone className="w-2.5 h-2.5 text-stone-400" />
                                {ord.customerPhone}
                              </span>
                            )}
                            {ord.customerEmail && (
                              <span className="text-stone-500 flex items-center gap-1 text-[11px] truncate max-w-[180px]">
                                <Mail className="w-2.5 h-2.5 text-stone-400" />
                                {ord.customerEmail}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-stone-600 truncate max-w-xl">
                            <strong className="text-stone-800">Contenido:</strong> {productPreview}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 pt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-stone-400" />
                              Entrega: <strong>{ord.scheduledDate || "No definida"}</strong> (
                              {ord.scheduledTimeSlot || "Horario"})
                            </span>
                            <span>•</span>
                            <span>
                              Total:{" "}
                              <strong className="text-stone-900">
                                ${ord.totalPrice.toFixed(2)} USD
                              </strong>
                            </span>
                            {ord.amountPaid > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-700 font-semibold">
                                  Pagado: ${ord.amountPaid.toFixed(2)} USD
                                </span>
                              </>
                            )}
                            {ord.remainingBalance > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-rose-700 font-semibold">
                                  Resta: ${ord.remainingBalance.toFixed(2)} USD
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              onOpenReceipt(ord);
                              setIsOpen(false);
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            title="Ver recibo oficial del pedido"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-700" />
                            <span className="hidden sm:inline">Recibo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onSelectOrder(ord);
                              setIsOpen(false);
                            }}
                            className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                            title="Abrir detalles de la orden en modal oficial"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Ver Detalles</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section: Matched Customers */}
            {(filterType === "ALL" || filterType === "CUSTOMERS") &&
              results.customers.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      Clientes Encontrados ({results.customers.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.customers.map((cust) => (
                      <div
                        key={cust.id + cust.email}
                        className="p-3 bg-stone-50 hover:bg-amber-50/40 rounded-2xl border border-stone-200 hover:border-amber-300 transition-all flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-stone-900 truncate">
                              {cust.name}
                            </span>
                            {cust.isRegistered && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded-md border border-emerald-200">
                                Cuenta
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 space-y-0.5">
                            {cust.email && <p className="truncate">{cust.email}</p>}
                            {cust.phone && <p>{cust.phone}</p>}
                            <p className="text-[10px] text-stone-400 font-mono">
                              ID: {cust.id} • {cust.orderCount} pedido
                              {cust.orderCount === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>

                        {/* If customer has orders, button to view latest order */}
                        {cust.orders.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectOrder(cust.orders[0]);
                              setIsOpen(false);
                            }}
                            className="px-2.5 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                            title="Ver último pedido de este cliente"
                          >
                            <Eye className="w-3 h-3 text-rose-700" />
                            <span>Pedido Reciente</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-stone-400 italic shrink-0">
                            Sin pedidos
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>

          {/* Footer with tips */}
          <div className="px-4 py-2.5 bg-stone-100/70 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 shrink-0">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-600" />
              Búsqueda universal de la dueña: pedidos, comprobantes, clientes y Gift Cards
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-stone-700 font-medium cursor-pointer"
            >
              Cerrar [Esc]
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
