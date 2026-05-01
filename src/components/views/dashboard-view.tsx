'use client';

import React, { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  CalendarCheck,
  Wallet,
  RefreshCw,
  Plus,
  CalendarPlus,
  BarChart3,
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Clock,
  Wrench,
  Shield,
  FileText,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/lib/store';
import type {
  DashboardStats,
  Booking,
  MaintenanceRecord,
  BookingStatus,
  MaintenanceStatus,
  MaintenanceType,
  ViewName,
} from '@/lib/types';

// ── Types ────────────────────────────────────────────────────────────

interface ApiMaintenanceAlert {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  dueDate: string;
  completedDate: string | null;
  status: MaintenanceStatus;
  createdAt: string;
  vehicle: {
    brand: string;
    model: string;
    plateNumber: string;
  };
}

interface DashboardApiResponse {
  success: boolean;
  data: {
    vehicles: { total: number; available: number; rented: number; maintenance: number };
    bookings: { today: number; active: number; pending: number };
    revenue: { total: number; daily: number; weekly: number; monthly: number };
    maintenanceAlerts: ApiMaintenanceAlert[];
    customers: { total: number };
    drivers: { total: number };
  };
}

interface ChartDataPoint {
  day: string;
  revenue: number;
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function getIndonesianDate(): string {
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const dayName = days[now.getDay()];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

const bookingStatusConfig: Record<BookingStatus, { label: string; className: string }> = {
  PENDING: { label: 'Menunggu', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' },
  CONFIRMED: { label: 'Dikonfirmasi', className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  ACTIVE: { label: 'Aktif', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
  COMPLETED: { label: 'Selesai', className: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800/40 dark:text-gray-400 dark:border-gray-700' },
  CANCELLED: { label: 'Dibatalkan', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
};

const maintenanceStatusConfig: Record<MaintenanceStatus, { label: string; className: string }> = {
  SCHEDULED: { label: 'Dijadwalkan', className: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' },
  IN_PROGRESS: { label: 'Dalam Proses', className: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' },
  COMPLETED: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' },
  OVERDUE: { label: 'Terlambat', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
};

const maintenanceTypeIcons: Record<MaintenanceType, React.ElementType> = {
  SERVICE: Wrench,
  REPAIR: Wrench,
  INSURANCE: Shield,
  TAX: FileText,
  STNK: FileText,
};

const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  SERVICE: 'Servis',
  REPAIR: 'Perbaikan',
  INSURANCE: 'Asuransi',
  TAX: 'Pajak',
  STNK: 'STNK',
};

// ── Mock Data ────────────────────────────────────────────────────────

function getMockChartData(): ChartDataPoint[] {
  return [
    { day: 'Sen', revenue: 1200000 },
    { day: 'Sel', revenue: 1850000 },
    { day: 'Rab', revenue: 950000 },
    { day: 'Kam', revenue: 2400000 },
    { day: 'Jum', revenue: 1750000 },
    { day: 'Sab', revenue: 3100000 },
    { day: 'Min', revenue: 2100000 },
  ];
}

function getMockRecentBookings(): Booking[] {
  return [
    {
      id: 'bk-001',
      customerId: 'cust-1',
      vehicleId: 'veh-1',
      driverId: 'drv-1',
      startDate: '2026-04-25',
      endDate: '2026-04-28',
      totalPrice: 2250000,
      status: 'ACTIVE',
      withDriver: true,
      pickupLocation: 'Soekarno-Hatta Airport',
      returnLocation: 'Soekarno-Hatta Airport',
      notes: null,
      customer: { id: 'cust-1', email: 'budi@mail.com', name: 'Budi Santoso', phone: '08123456789', role: 'CUSTOMER', avatar: null, isVerified: true, createdAt: '2026-01-15' },
      vehicle: { id: 'veh-1', brand: 'Toyota', model: 'Avanza', year: 2024, color: 'Silver', plateNumber: 'B 1234 XYZ', category: 'MPV', dailyRate: 450000, weeklyRate: 2700000, monthlyRate: 9000000, status: 'RENTED', fuelType: 'Bensin', transmission: 'AT', seats: 7, imageUrl: null, notes: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      payments: [],
      createdAt: '2026-04-24',
    },
    {
      id: 'bk-002',
      customerId: 'cust-2',
      vehicleId: 'veh-3',
      driverId: null,
      startDate: '2026-04-27',
      endDate: '2026-04-30',
      totalPrice: 3600000,
      status: 'ACTIVE',
      withDriver: false,
      pickupLocation: 'Kantor Pusat',
      returnLocation: 'Kantor Pusat',
      notes: 'Tanpa supir',
      customer: { id: 'cust-2', email: 'sari@mail.com', name: 'Sari Dewi', phone: '08198765432', role: 'CUSTOMER', avatar: null, isVerified: true, createdAt: '2026-02-10' },
      vehicle: { id: 'veh-3', brand: 'Toyota', model: 'Innova', year: 2024, color: 'Black', plateNumber: 'B 5678 ABC', category: 'MPV', dailyRate: 600000, weeklyRate: 3600000, monthlyRate: 12000000, status: 'RENTED', fuelType: 'Diesel', transmission: 'AT', seats: 7, imageUrl: null, notes: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      payments: [],
      createdAt: '2026-04-26',
    },
    {
      id: 'bk-003',
      customerId: 'cust-1',
      vehicleId: 'veh-2',
      driverId: null,
      startDate: '2026-04-28',
      endDate: '2026-05-01',
      totalPrice: 2250000,
      status: 'CONFIRMED',
      withDriver: false,
      pickupLocation: 'Bandara Husein Sastranegara',
      returnLocation: 'Hotel Grand Asia',
      notes: null,
      customer: { id: 'cust-1', email: 'budi@mail.com', name: 'Budi Santoso', phone: '08123456789', role: 'CUSTOMER', avatar: null, isVerified: true, createdAt: '2026-01-15' },
      vehicle: { id: 'veh-2', brand: 'Honda', model: 'HR-V', year: 2025, color: 'White', plateNumber: 'D 9012 DEF', category: 'SUV', dailyRate: 550000, weeklyRate: 3300000, monthlyRate: 11000000, status: 'AVAILABLE', fuelType: 'Bensin', transmission: 'CVT', seats: 5, imageUrl: null, notes: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      payments: [],
      createdAt: '2026-04-27',
    },
    {
      id: 'bk-004',
      customerId: 'cust-3',
      vehicleId: 'veh-5',
      driverId: 'drv-2',
      startDate: '2026-04-26',
      endDate: '2026-04-26',
      totalPrice: 750000,
      status: 'COMPLETED',
      withDriver: true,
      pickupLocation: 'Stasiun Gambir',
      returnLocation: 'Monas',
      notes: null,
      customer: { id: 'cust-3', email: 'andi@mail.com', name: 'Andi Prasetyo', phone: '08765432109', role: 'CUSTOMER', avatar: null, isVerified: true, createdAt: '2026-03-01' },
      vehicle: { id: 'veh-5', brand: 'Honda', model: 'Brio', year: 2024, color: 'Red', plateNumber: 'B 3456 GHI', category: 'HATCHBACK', dailyRate: 350000, weeklyRate: 2100000, monthlyRate: 7000000, status: 'AVAILABLE', fuelType: 'Bensin', transmission: 'CVT', seats: 5, imageUrl: null, notes: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      payments: [],
      createdAt: '2026-04-25',
    },
    {
      id: 'bk-005',
      customerId: 'cust-2',
      vehicleId: 'veh-7',
      driverId: null,
      startDate: '2026-04-29',
      endDate: '2026-05-03',
      totalPrice: 4000000,
      status: 'PENDING',
      withDriver: false,
      pickupLocation: 'Apartemen Sudirman',
      returnLocation: 'Apartemen Sudirman',
      notes: 'Mohon disediakan child seat',
      customer: { id: 'cust-2', email: 'sari@mail.com', name: 'Sari Dewi', phone: '08198765432', role: 'CUSTOMER', avatar: null, isVerified: true, createdAt: '2026-02-10' },
      vehicle: { id: 'veh-7', brand: 'Mitsubishi', model: 'Xpander', year: 2025, color: 'Gray', plateNumber: 'F 7890 JKL', category: 'MPV', dailyRate: 500000, weeklyRate: 3000000, monthlyRate: 10000000, status: 'AVAILABLE', fuelType: 'Bensin', transmission: 'AT', seats: 7, imageUrl: null, notes: null, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      payments: [],
      createdAt: '2026-04-28',
    },
  ];
}

// ── Animation Variants ───────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

// ── Custom Tooltip for Chart ────────────────────────────────────────

function CustomChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
}

// ── Stat Card ────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, trend, trendUp, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      variants={itemVariants}
      custom={delay}
      className="group"
    >
      <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground lg:text-sm">{title}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {trend && (
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-3 h-3 ${trendUp ? 'text-emerald-500' : 'text-red-500'}`} />
                  <span className={`text-[11px] font-medium ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {trend}
                  </span>
                </div>
              )}
            </div>
            <div className={`rounded-lg p-2.5 ${iconBg}`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
          </div>
        </CardContent>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-primary/40 to-primary/10 opacity-0 transition-opacity group-hover:opacity-100" />
      </Card>
    </motion.div>
  );
}

// ── Stat Card Skeleton ──────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-14" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Chart Skeleton ──────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Skeleton className="h-64 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

// ── Booking Item ────────────────────────────────────────────────────

function BookingItem({ booking, index }: { booking: Booking; index: number }) {
  const statusConfig = bookingStatusConfig[booking.status];
  return (
    <motion.div
      variants={itemVariants}
      custom={index}
      className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
        <CalendarCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">{booking.customer?.name ?? 'Pelanggan'}</p>
          <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {booking.vehicle?.brand} {booking.vehicle?.model} ({booking.vehicle?.plateNumber})
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[11px] text-muted-foreground">
            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
          </p>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(booking.totalPrice)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Maintenance Alert Item ──────────────────────────────────────────

function MaintenanceAlertItem({ alert, index }: { alert: ApiMaintenanceAlert; index: number }) {
  const statusConfig = maintenanceStatusConfig[alert.status];
  const TypeIcon = maintenanceTypeIcons[alert.type];
  return (
    <motion.div
      variants={itemVariants}
      custom={index}
      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
        <TypeIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate">{alert.vehicle?.plateNumber ?? 'Tidak diketahui'}</p>
          <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusConfig.className}`}>
            {statusConfig.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {maintenanceTypeLabels[alert.type]} - {alert.vehicle?.brand} {alert.vehicle?.model}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground">
            Jatuh tempo: {formatDate(alert.dueDate)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Empty State ─────────────────────────────────────────────────────

function EmptyState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">Data Tidak Tersedia</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{message}</p>
      <Button onClick={onRetry} variant="outline" className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Coba Lagi
      </Button>
    </motion.div>
  );
}

// ── Main Dashboard View ─────────────────────────────────────────────

export function DashboardView() {
  const { setDashboardStats, setCurrentView } = useAppStore();

  const mounted = useSyncExternalStore(
    (_onStoreChange) => () => {},
    () => true,
    () => false,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [availableVehicles, setAvailableVehicles] = useState(0);
  const [rentedVehicles, setRentedVehicles] = useState(0);
  const [todayBookings, setTodayBookings] = useState(0);
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [weeklyRevenue, setWeeklyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [activeBookings, setActiveBookings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<ApiMaintenanceAlert[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<Array<{
    id: string; brand: string; model: string; plateNumber: string; year: number;
    category: string; status: string; dailyRate: number; color: string; imageUrl: string | null;
    fuelType: string; transmission: string; seats: number;
  }>>([]);

  const [recentBookings] = useState<Booking[]>(getMockRecentBookings());
  const [chartData] = useState<ChartDataPoint[]>(getMockChartData());

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(false);

    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json: DashboardApiResponse = await res.json();

      if (!json.success || !json.data) throw new Error('Invalid response');

      const { vehicles, bookings, revenue, maintenanceAlerts: alerts } = json.data;

      // Fetch fleet vehicles for gallery
      try {
        const fleetRes = await fetch('/api/vehicles?limit=12');
        const fleetJson = await fleetRes.json();
        if (fleetJson.success && fleetJson.data) {
          setFleetVehicles(fleetJson.data);
        }
      } catch { /* ignore */ }

      setTotalVehicles(vehicles.total);
      setAvailableVehicles(vehicles.available);
      setRentedVehicles(vehicles.rented);
      setTodayBookings(bookings.today);
      setActiveBookings(bookings.active);
      setPendingBookings(bookings.pending);
      setDailyRevenue(revenue.daily);
      setWeeklyRevenue(revenue.weekly);
      setMonthlyRevenue(revenue.monthly);
      setMaintenanceAlerts(alerts);

      const mappedMaintenance: MaintenanceRecord[] = alerts.map((a) => ({
        id: a.id,
        vehicleId: a.vehicleId,
        type: a.type,
        description: a.description,
        cost: a.cost,
        dueDate: a.dueDate,
        completedDate: a.completedDate,
        status: a.status,
        vehicle: a.vehicle
          ? {
              id: a.vehicleId,
              brand: a.vehicle.brand,
              model: a.vehicle.model,
              year: 2024,
              color: '',
              plateNumber: a.vehicle.plateNumber,
              category: 'MPV' as const,
              dailyRate: 0,
              weeklyRate: 0,
              monthlyRate: 0,
              status: 'AVAILABLE' as const,
              fuelType: '',
              transmission: '',
              seats: 0,
              imageUrl: null,
              notes: null,
              createdAt: '',
              updatedAt: '',
            }
          : undefined,
        createdAt: a.createdAt,
      }));

      const stats: DashboardStats = {
        totalVehicles: vehicles.total,
        availableVehicles: vehicles.available,
        rentedVehicles: vehicles.rented,
        maintenanceVehicles: vehicles.maintenance,
        todayBookings: bookings.today,
        dailyRevenue: revenue.daily,
        weeklyRevenue: revenue.weekly,
        monthlyRevenue: revenue.monthly,
        totalCustomers: 0,
        upcomingMaintenance: mappedMaintenance,
        recentBookings: [],
      };

      setDashboardStats(stats);
    } catch {
      setError(true);

      if (!isRefresh) {
        setAvailableVehicles(7);
        setRentedVehicles(2);
        setTodayBookings(3);
        setDailyRevenue(2100000);
        setWeeklyRevenue(13350000);
        setMonthlyRevenue(42500000);
        setActiveBookings(2);
        setPendingBookings(1);
        setTotalVehicles(10);
        setMaintenanceAlerts([
          {
            id: 'mnt-1',
            vehicleId: 'veh-4',
            type: 'SERVICE',
            description: 'Servis berkala 10.000 km',
            cost: 1500000,
            dueDate: '2026-04-30',
            completedDate: null,
            status: 'IN_PROGRESS',
            createdAt: '2026-04-20',
            vehicle: { brand: 'Suzuki', model: 'Ertiga', plateNumber: 'B 2345 MNO' },
          },
          {
            id: 'mnt-2',
            vehicleId: 'veh-6',
            type: 'TAX',
            description: 'Bayar pajak tahunan',
            cost: 3500000,
            dueDate: '2026-05-02',
            completedDate: null,
            status: 'SCHEDULED',
            createdAt: '2026-04-15',
            vehicle: { brand: 'Toyota', model: 'Fortuner', plateNumber: 'B 6789 PQR' },
          },
          {
            id: 'mnt-3',
            vehicleId: 'veh-8',
            type: 'STNK',
            description: 'Perpanjangan STNK 5 tahun',
            cost: 250000,
            dueDate: '2026-05-05',
            completedDate: null,
            status: 'SCHEDULED',
            createdAt: '2026-04-18',
            vehicle: { brand: 'Daihatsu', model: 'Xenia', plateNumber: 'D 1122 STU' },
          },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setDashboardStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const navigateTo = (view: ViewName) => {
    setCurrentView(view);
  };

  const quickActions: Array<{ label: string; icon: React.ElementType; view: ViewName; className: string }> = [
    { label: 'Tambah Mobil', icon: Plus, view: 'fleet', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50' },
    { label: 'Buat Booking', icon: CalendarPlus, view: 'booking', className: 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50' },
    { label: 'Lihat Laporan', icon: BarChart3, view: 'reports', className: 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50' },
    { label: 'Kelola Driver', icon: Users, view: 'drivers', className: 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ─── Header ─── */}
      <motion.div variants={itemVariants} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            {mounted ? `${getGreeting()}, Admin! 👋` : 'Selamat Datang, Admin! 👋'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{mounted ? getIndonesianDate() : ''}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-2 sm:mt-0 gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Memuat...' : 'Refresh'}
        </Button>
      </motion.div>

      {error && !loading && (
        <motion.div variants={itemVariants}>
          <EmptyState
            message="Gagal memuat data dashboard. Pastikan server berjalan dan coba lagi."
            onRetry={handleRefresh}
          />
        </motion.div>
      )}

      {!error && (
        <>
          {/* ─── Section 1: Quick Stats ─── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title="Mobil Tersedia"
                  value={availableVehicles}
                  icon={Car}
                  iconBg="bg-emerald-100 dark:bg-emerald-900/30"
                  iconColor="text-emerald-600 dark:text-emerald-400"
                  trend={`${Math.round((availableVehicles / Math.max(totalVehicles, 1)) * 100)}% dari total`}
                  trendUp={true}
                  delay={0}
                />
                <StatCard
                  title="Mobil Disewa"
                  value={rentedVehicles}
                  icon={Car}
                  iconBg="bg-orange-100 dark:bg-orange-900/30"
                  iconColor="text-orange-600 dark:text-orange-400"
                  trend={activeBookings > 0 ? `${activeBookings} sedang aktif` : undefined}
                  trendUp={activeBookings > 0}
                  delay={1}
                />
                <StatCard
                  title="Booking Hari Ini"
                  value={todayBookings}
                  icon={CalendarCheck}
                  iconBg="bg-blue-100 dark:bg-blue-900/30"
                  iconColor="text-blue-600 dark:text-blue-400"
                  trend={pendingBookings > 0 ? `${pendingBookings} menunggu konfirmasi` : undefined}
                  trendUp={pendingBookings === 0}
                  delay={2}
                />
                <StatCard
                  title="Pendapatan Hari Ini"
                  value={formatCurrency(dailyRevenue)}
                  icon={Wallet}
                  iconBg="bg-green-100 dark:bg-green-900/30"
                  iconColor="text-green-600 dark:text-green-400"
                  trend="minggu ini Rp 13,4 jt"
                  trendUp={true}
                  delay={3}
                />
              </>
            )}
          </div>

          {/* ─── Section 2: Fleet Gallery ─── */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base lg:text-lg">Armada Kami</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fleetVehicles.length} kendaraan tersedia untuk disewa
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => navigateTo('fleet')}
                  >
                    Lihat Semua
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {fleetVehicles.length === 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-28 w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {fleetVehicles.slice(0, 8).map((v, idx) => {
                      const statusStyle = v.status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : v.status === 'RENTED'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
                      return (
                        <motion.div
                          key={v.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.3 }}
                          className="group rounded-xl border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => navigateTo('fleet')}
                        >
                          {/* Image */}
                          <div className="relative h-28 sm:h-32 overflow-hidden bg-muted">
                            {v.imageUrl ? (
                              <img
                                src={v.imageUrl}
                                alt={`${v.brand} ${v.model}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                                <Car className="w-10 h-10 text-white/30" />
                              </div>
                            )}
                            <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute top-2 right-2">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusStyle}`}>
                                {v.status === 'AVAILABLE' ? 'Tersedia' : v.status === 'RENTED' ? 'Disewa' : 'Servis'}
                              </span>
                            </div>
                          </div>
                          {/* Info */}
                          <div className="p-2.5 space-y-1">
                            <p className="text-sm font-semibold truncate">{v.brand} {v.model}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{v.plateNumber} &middot; {v.year}</p>
                            <p className="text-xs font-semibold text-primary">
                              {formatCurrency(v.dailyRate)}<span className="font-normal text-muted-foreground">/hari</span>
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Section 3: Quick Actions ─── */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base lg:text-lg">Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                  {quickActions.map((action) => (
                    <Button
                      key={action.view}
                      variant="outline"
                      onClick={() => navigateTo(action.view)}
                      className="flex h-auto flex-col items-center gap-2 rounded-xl py-4 px-3 transition-all hover:shadow-sm"
                    >
                      <div className={`rounded-lg p-2.5 ${action.className}`}>
                        <action.icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Summary Cards ─── */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Pendapatan Bulan Ini</p>
                      <p className="text-lg font-bold">{formatCurrency(monthlyRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2">
                      <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Armada</p>
                      <p className="text-lg font-bold">{totalVehicles} <span className="text-sm font-normal text-muted-foreground">kendaraan</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-orange-100 dark:bg-orange-900/30 p-2">
                      <CalendarCheck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Booking Aktif</p>
                      <p className="text-lg font-bold">{activeBookings} <span className="text-sm font-normal text-muted-foreground">kendaraan</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}
