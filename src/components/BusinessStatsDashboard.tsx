import React, { useState, useMemo } from "react";
import {
  Users,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Calendar,
  ArrowUpRight,
  Clock,
  Sparkles,
  Filter,
  CheckCircle2,
  Package,
  PieChart as PieIcon,
  BarChart2,
  Award,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useApp } from "../context/AppContext";
import { Order } from "../types";

type PeriodType = "day" | "week" | "month" | "year" | "all";

const COLORS = ["#be123c", "#e11d48", "#f43f5e", "#fb7185", "#fda4af", "#fecdd3"];

export const BusinessStatsDashboard: React.FC = () => {
  const { orders, registeredUsers, products, currentUser } = useApp();

  // Period Filter State
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("month");
  const [metricView, setMetricView] = useState<"revenue" | "volume">("revenue");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // 1. FILTER ORDERS BY PERIOD
  const filteredOrders = useMemo(() => {
    const now = new Date();

    return orders.filter((order) => {
      // Don't count completely cancelled orders towards net sales unless inspecting all
      if (order.status === "CANCELADO") return false;

      const orderDate = new Date(order.createdAt || order.scheduledDate || Date.now());

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      }

      switch (selectedPeriod) {
        case "day": {
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          return orderDate >= todayStart;
        }
        case "week": {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= sevenDaysAgo;
        }
        case "month": {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= thirtyDaysAgo;
        }
        case "year": {
          const yearStart = new Date(now.getFullYear(), 0, 1);
          return orderDate >= yearStart;
        }
        case "all":
        default:
          return true;
      }
    });
  }, [orders, selectedPeriod, startDate, endDate]);

  // 2. CORE KPIS CALCULATION (Real data only, no mock values)
  const totalRegisteredAccounts = registeredUsers.length;

  // Active Users: Registered users who have placed at least 1 order, or currently logged in
  const activeUsersCount = useMemo(() => {
    const orderUserEmails = new Set(orders.map((o) => o.customerEmail.toLowerCase()));
    if (currentUser?.email) {
      orderUserEmails.add(currentUser.email.toLowerCase());
    }
    const registeredActive = registeredUsers.filter((u) =>
      orderUserEmails.has(u.email.toLowerCase()),
    ).length;
    // Real active accounts: either from registered list or unique clients who ordered
    return Math.max(registeredActive, orderUserEmails.size);
  }, [registeredUsers, orders, currentUser]);

  const totalOrdersCompleted = filteredOrders.length;

  const totalSales = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  }, [filteredOrders]);

  const totalPaidRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (Number(o.amountPaid) || 0), 0);
  }, [filteredOrders]);

  // Estimated gross profit (sales minus estimated raw ribbon/craft materials ~30%)
  const estimatedProfit = useMemo(() => {
    return totalSales * 0.7;
  }, [totalSales]);

  const averageTicket = useMemo(() => {
    return totalOrdersCompleted > 0 ? totalSales / totalOrdersCompleted : 0;
  }, [totalSales, totalOrdersCompleted]);

  // 3. REVENUE OVER TIME CHART DATA
  const timeChartData = useMemo(() => {
    const map = new Map<
      string,
      { label: string; revenue: number; orders: number; timestamp: number }
    >();
    const now = new Date();

    if (selectedPeriod === "day") {
      // Hours of today (0h to 23h)
      for (let h = 8; h <= 21; h += 2) {
        const hourStr = `${h.toString().padStart(2, "0")}:00`;
        map.set(hourStr, { label: hourStr, revenue: 0, orders: 0, timestamp: h });
      }
      filteredOrders.forEach((o) => {
        const d = new Date(o.createdAt || Date.now());
        const hour = d.getHours();
        const roundedHour = Math.floor(hour / 2) * 2;
        const key = `${roundedHour.toString().padStart(2, "0")}:00`;
        if (map.has(key)) {
          const curr = map.get(key)!;
          curr.revenue += Number(o.totalPrice) || 0;
          curr.orders += 1;
        }
      });
    } else if (selectedPeriod === "week") {
      // Last 7 days
      const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayLabel = `${days[d.getDay()]} ${d.getDate()}`;
        const dateKey = d.toISOString().split("T")[0];
        map.set(dateKey, { label: dayLabel, revenue: 0, orders: 0, timestamp: d.getTime() });
      }
      filteredOrders.forEach((o) => {
        const dateKey = (o.createdAt || o.scheduledDate || "").split("T")[0];
        if (map.has(dateKey)) {
          const curr = map.get(dateKey)!;
          curr.revenue += Number(o.totalPrice) || 0;
          curr.orders += 1;
        }
      });
    } else if (selectedPeriod === "month") {
      // 4 weeks of the month
      for (let w = 4; w >= 1; w--) {
        const label = `Semana ${w}`;
        map.set(label, { label, revenue: 0, orders: 0, timestamp: w });
      }
      filteredOrders.forEach((o) => {
        const d = new Date(o.createdAt || Date.now());
        const weekNum = Math.min(4, Math.max(1, Math.ceil(d.getDate() / 7)));
        const key = `Semana ${weekNum}`;
        if (map.has(key)) {
          const curr = map.get(key)!;
          curr.revenue += Number(o.totalPrice) || 0;
          curr.orders += 1;
        }
      });
    } else if (selectedPeriod === "year") {
      // 12 months
      const months = [
        "Ene",
        "Feb",
        "Mar",
        "Abr",
        "May",
        "Jun",
        "Jul",
        "Ago",
        "Sep",
        "Oct",
        "Nov",
        "Dic",
      ];
      months.forEach((m, idx) => {
        map.set(idx.toString(), { label: m, revenue: 0, orders: 0, timestamp: idx });
      });
      filteredOrders.forEach((o) => {
        const d = new Date(o.createdAt || Date.now());
        const monthIdx = d.getMonth().toString();
        if (map.has(monthIdx)) {
          const curr = map.get(monthIdx)!;
          curr.revenue += Number(o.totalPrice) || 0;
          curr.orders += 1;
        }
      });
    } else {
      // All time by month/year
      filteredOrders.forEach((o) => {
        const d = new Date(o.createdAt || Date.now());
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        const label = `${d.toLocaleString("es-MX", { month: "short" })} ${d.getFullYear()}`;
        if (!map.has(key)) {
          map.set(key, { label, revenue: 0, orders: 0, timestamp: d.getTime() });
        }
        const curr = map.get(key)!;
        curr.revenue += Number(o.totalPrice) || 0;
        curr.orders += 1;
      });
    }

    return Array.from(map.values());
  }, [filteredOrders, selectedPeriod]);

  // 4. TOP SELLING PRODUCTS CALCULATION
  const topSellingProducts = useMemo(() => {
    const productStats = new Map<
      string,
      { name: string; units: number; revenue: number; image?: string }
    >();

    filteredOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.productName || "Producto Artesanal";
        if (!productStats.has(key)) {
          productStats.set(key, {
            name: key,
            units: 0,
            revenue: 0,
            image: item.productImage,
          });
        }
        const stat = productStats.get(key)!;
        stat.units += Number(item.quantity) || 1;
        stat.revenue += Number(item.subtotal || item.unitPrice * (item.quantity || 1)) || 0;
        if (!stat.image && item.productImage) stat.image = item.productImage;
      });
    });

    return Array.from(productStats.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);
  }, [filteredOrders]);

  // 5. USER GROWTH CHART DATA (Real registrations over time)
  const userGrowthData = useMemo(() => {
    if (registeredUsers.length === 0) {
      return [{ date: "Inicio", cumulativeUsers: 0, newUsers: 0 }];
    }

    // Sort registered users by creation date
    const sorted = [...registeredUsers].sort(
      (a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime(),
    );

    const dateMap = new Map<string, number>();
    sorted.forEach((u) => {
      const dateStr = (u.createdAt || new Date().toISOString()).split("T")[0];
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    });

    let runningTotal = 0;
    const result: { date: string; cumulativeUsers: number; newUsers: number }[] = [];

    dateMap.forEach((count, dateStr) => {
      runningTotal += count;
      result.push({
        date: dateStr,
        cumulativeUsers: runningTotal,
        newUsers: count,
      });
    });

    return result;
  }, [registeredUsers]);

  // 6. ORDER STATUS DISTRIBUTION (Pie Chart)
  const orderStatusDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    orders.forEach((o) => {
      const st = o.status || "SOLICITUD_RECIBIDA";
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace(/_/g, " "),
      value: count,
    }));
  }, [orders]);

  return (
    <div id="business-stats-dashboard" className="space-y-8 animate-fadeIn">
      {/* Dashboard Top Header & Period Selector */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
              <BarChart2 className="w-3.5 h-3.5 text-rose-700" />
              Métricas y Estadísticas Reales
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Datos 100% calculados en vivo
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-2">
            Estadísticas del Negocio
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl">
            Monitoreo en tiempo real de ingresos, volumen de pedidos en el taller, cuentas de
            clientes registradas y rendimiento del catálogo.
          </p>
        </div>

        {/* Period Selector: Mobile Dropdown + Desktop Artisan Pills */}
        <div className="shrink-0">
          {/* Mobile Dropdown */}
          <div className="sm:hidden relative w-full min-w-[200px]">
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value as any);
                setStartDate("");
                setEndDate("");
              }}
              className="w-full pl-3.5 pr-9 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 appearance-none focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer shadow-2xs"
            >
              <option value="day">📅 Período: Día actual</option>
              <option value="week">📅 Período: Última semana</option>
              <option value="month">📅 Período: Mes actual</option>
              <option value="year">📅 Período: Año en curso</option>
              <option value="all">📅 Período: Todo el historial</option>
            </select>
            <ChevronDown className="w-4 h-4 text-stone-500 absolute right-3 top-3 pointer-events-none" />
          </div>

          {/* Desktop Artisan Pills */}
          <div className="hidden sm:flex flex-wrap items-center gap-1.5 bg-stone-100/90 p-1.5 rounded-2xl border border-stone-200/80 text-xs">
            <button
              id="period-filter-day"
              onClick={() => {
                setSelectedPeriod("day");
                setStartDate("");
                setEndDate("");
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                selectedPeriod === "day" && !startDate
                  ? "bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white shadow-[0_2px_8px_rgba(225,29,72,0.25)]"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
              }`}
            >
              Día
            </button>
            <button
              id="period-filter-week"
              onClick={() => {
                setSelectedPeriod("week");
                setStartDate("");
                setEndDate("");
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                selectedPeriod === "week" && !startDate
                  ? "bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white shadow-[0_2px_8px_rgba(225,29,72,0.25)]"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
              }`}
            >
              Semana
            </button>
            <button
              id="period-filter-month"
              onClick={() => {
                setSelectedPeriod("month");
                setStartDate("");
                setEndDate("");
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                selectedPeriod === "month" && !startDate
                  ? "bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white shadow-[0_2px_8px_rgba(225,29,72,0.25)]"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
              }`}
            >
              Mes
            </button>
            <button
              id="period-filter-year"
              onClick={() => {
                setSelectedPeriod("year");
                setStartDate("");
                setEndDate("");
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                selectedPeriod === "year" && !startDate
                  ? "bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white shadow-[0_2px_8px_rgba(225,29,72,0.25)]"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
              }`}
            >
              Año
            </button>
            <button
              id="period-filter-all"
              onClick={() => {
                setSelectedPeriod("all");
                setStartDate("");
                setEndDate("");
              }}
              className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                selectedPeriod === "all" && !startDate
                  ? "bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white shadow-[0_2px_8px_rgba(225,29,72,0.25)]"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
              }`}
            >
              Todo
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Filter Inputs */}
      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/70 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-stone-700 font-medium">
          <Filter className="w-4 h-4 text-rose-700" />
          <span>Filtro por Rango Personalizado:</span>
        </div>
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-stone-800 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-500">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-stone-300 rounded-lg text-stone-800 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="px-2.5 py-1 text-rose-700 hover:text-rose-900 font-medium hover:underline cursor-pointer"
            >
              Limpiar filtro
            </button>
          )}
        </div>
      </div>

      {/* CORE KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Cuentas Registradas */}
        <div
          id="stat-card-registered-accounts"
          className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs hover:border-rose-200 transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Cuentas Registradas</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              {totalRegisteredAccounts}
            </span>
            <span className="text-[11px] text-stone-500 font-medium">cuentas</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Perfiles creados por clientes</p>
        </div>

        {/* 2. Usuarios Activos */}
        <div
          id="stat-card-active-users"
          className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs hover:border-rose-200 transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Usuarios Activos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              {activeUsersCount}
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">con actividad</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Compradores y sesiones reales</p>
        </div>

        {/* 3. Compras Realizadas */}
        <div
          id="stat-card-orders-count"
          className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs hover:border-rose-200 transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Compras Realizadas</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              {totalOrdersCompleted}
            </span>
            <span className="text-[11px] text-stone-500 font-medium">pedidos</span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">En el período seleccionado</p>
        </div>

        {/* 4. Ventas Totales */}
        <div
          id="stat-card-sales-total"
          className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs hover:border-rose-200 transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Ventas Totales</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              $
              {totalSales.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Total facturado de pedidos</p>
        </div>

        {/* 5. Ganancias Estimadas */}
        <div
          id="stat-card-profits"
          className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs hover:border-rose-200 transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Ganancias Est.</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-emerald-700">
              $
              {estimatedProfit.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Margen estimado 70% taller</p>
        </div>

        {/* 6. Ticket Promedio */}
        <div
          id="stat-card-avg-ticket"
          className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs hover:border-rose-200 transition-colors"
        >
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold">Ticket Promedio</span>
            <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl sm:text-3xl font-bold text-stone-900">
              $
              {averageTicket.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Promedio por orden</p>
        </div>
      </div>

      {/* SECTION 2: INTERACTIVE REVENUE & ORDERS CHART */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900">
              Ingresos y Rendimiento por Período
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Evolución cronológica de ventas e ingresos en el taller (
              {selectedPeriod.toUpperCase()}).
            </p>
          </div>

          {/* Metric display toggle */}
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-medium self-start sm:self-auto">
            <button
              onClick={() => setMetricView("revenue")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                metricView === "revenue"
                  ? "bg-white text-rose-800 font-semibold shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Ingresos ($)
            </button>
            <button
              onClick={() => setMetricView("volume")}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                metricView === "volume"
                  ? "bg-white text-rose-800 font-semibold shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Nº Compras
            </button>
          </div>
        </div>

        {/* Main Chart Container */}
        <div className="h-72 sm:h-80 w-full pt-2">
          {timeChartData.length === 0 ||
          timeChartData.every((d) => d.revenue === 0 && d.orders === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-400">
              <Calendar className="w-10 h-10 text-stone-300 mb-2 stroke-1" />
              <p className="text-sm font-semibold text-stone-600">
                Sin ingresos registrados en este período
              </p>
              <p className="text-xs text-stone-400 max-w-xs mt-1">
                Los nuevos pedidos realizados por clientes generarán la gráfica automáticamente en
                tiempo real.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {metricView === "revenue" ? (
                <AreaChart
                  data={timeChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#be123c" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#be123c" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    formatter={(val: any) => [
                      `$${Number(val).toLocaleString("es-MX")}`,
                      "Ingresos",
                    ]}
                    labelStyle={{ fontWeight: "bold", color: "#1e293b" }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#be123c"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={timeChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val} pedidos`, "Compras"]}
                    labelStyle={{ fontWeight: "bold", color: "#1e293b" }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Bar dataKey="orders" fill="#e11d48" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* SECTION 3: TWO COLUMN - TOP PRODUCTS & USER GROWTH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Productos Más Vendidos */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Productos Más Vendidos
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Ranking de popularidad por unidades solicitadas en pedidos.
              </p>
            </div>
            <span className="text-xs font-semibold text-stone-400">
              {topSellingProducts.length} listados
            </span>
          </div>

          {topSellingProducts.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center p-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-400">
              <Package className="w-10 h-10 text-stone-300 mb-2 stroke-1" />
              <p className="text-sm font-semibold text-stone-600">Sin compras registradas aún</p>
              <p className="text-xs text-stone-400 max-w-xs mt-1">
                Al comprarse arreglos en la tienda, el catálogo generará el top de ramos con mayor
                demanda.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {topSellingProducts.map((prod, idx) => {
                const maxUnits = topSellingProducts[0]?.units || 1;
                const percentage = Math.round((prod.units / maxUnits) * 100);

                return (
                  <div
                    key={prod.name}
                    className="p-3.5 bg-stone-50/80 rounded-2xl border border-stone-100 flex items-center gap-4"
                  >
                    <div className="w-7 h-7 rounded-xl bg-white border border-stone-200 font-bold text-xs flex items-center justify-center text-stone-700 shadow-2xs shrink-0">
                      #{idx + 1}
                    </div>

                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0">
                        <Package className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs sm:text-sm font-semibold text-stone-900 truncate">
                          {prod.name}
                        </h4>
                        <span className="text-xs font-bold text-stone-800 shrink-0">
                          {prod.units} {prod.units === 1 ? "unidad" : "unidades"}
                        </span>
                      </div>

                      <div className="w-full bg-stone-200/70 h-2 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-rose-700 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500 mt-1.5">
                        <span>Total recaudado:</span>
                        <strong className="text-emerald-700">
                          ${prod.revenue.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Card: Crecimiento de Usuarios y Cuentas */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Crecimiento de Cuentas y Usuarios
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Progreso acumulado de usuarios registrados en la plataforma.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Total: {totalRegisteredAccounts}
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-2">
            {registeredUsers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-400">
                <Users className="w-10 h-10 text-stone-300 mb-2 stroke-1" />
                <p className="text-sm font-semibold text-stone-600">
                  Aún no hay cuentas registradas
                </p>
                <p className="text-xs text-stone-400 max-w-xs mt-1">
                  Cuando los clientes creen su cuenta en la tienda, aquí se trazará la curva de
                  adquisición y crecimiento de usuarios.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={userGrowthData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val} usuarios`, "Total Acumulado"]}
                    labelStyle={{ fontWeight: "bold", color: "#1e293b" }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Area
                    type="stepAfter"
                    dataKey="cumulativeUsers"
                    stroke="#9333ea"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorUsers)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Registro seguro de clientes</span>
            <span className="text-stone-700 font-medium">
              Activos: <strong className="text-purple-700">{activeUsersCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: RECENT REAL TRANSACTIONS SUMMARY */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold text-stone-900">
            Historial de Compras Recientes ({filteredOrders.length})
          </h3>
          <span className="text-xs text-stone-400">Últimas transacciones procesadas</span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-400">
            <p className="text-sm font-semibold text-stone-600">
              No hay compras registradas en este período
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Todos los pedidos creados en la app aparecerán listados aquí con su desglose exacto.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 text-stone-500 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-3">Pedido</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Cobrado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrders.slice(0, 8).map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-stone-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-2.5 px-3 text-stone-800 font-medium">{order.customerName}</td>
                    <td className="py-2.5 px-3 text-stone-500">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("es-MX")
                        : order.scheduledDate}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-stone-900">
                      ${Number(order.totalPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-700">
                      ${Number(order.amountPaid || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
