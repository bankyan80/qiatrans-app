'use client';

import React, { useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  CalendarCheck,
  Wallet,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';
import type {
  DashboardStats,
  MaintenanceRecord,
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
  const [activeBookings, setActiveBookings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<ApiMaintenanceAlert[]>([]);
  const [fleetVehicles, setFleetVehicles] = useState<Array<{
    id: string; brand: string; model: string; plateNumber: string; year: number;
    category: string; status: string; dailyRate: number; color: string; imageUrl: string | null;
    fuelType: string; transmission: string; seats: number;
  }>>([]);

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
        setActiveBookings(2);
        setPendingBookings(1);
        setTotalVehicles(10);
        setMaintenanceAlerts([]);
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
            {mounted ? `${getGreeting()}! 👋` : 'Selamat Datang! 👋'}
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

        </>
      )}
    </motion.div>
  );
}
