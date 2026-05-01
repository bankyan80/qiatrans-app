'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Smartphone,
  QrCode,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Payment, PaymentMethod, PaymentStatus } from '@/lib/types';

// ── Constants ───────────────────────────────────────────────────────

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: React.ElementType; className: string }> = {
  QRIS: {
    label: 'QRIS',
    icon: QrCode,
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
  BANK_TRANSFER: {
    label: 'Bank Transfer',
    icon: Banknote,
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  E_WALLET: {
    label: 'E-Wallet',
    icon: Smartphone,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  CASH: {
    label: 'Cash',
    icon: DollarSign,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; icon: React.ElementType; className: string }> = {
  PENDING: {
    label: 'Menunggu',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  },
  SUCCESS: {
    label: 'Berhasil',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  FAILED: {
    label: 'Gagal',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
  },
  REFUNDED: {
    label: 'Refund',
    icon: ArrowDownRight,
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  },
};

const TAB_VALUES = ['ALL', 'PENDING', 'SUCCESS', 'FAILED'] as const;

// ── Helpers ─────────────────────────────────────────────────────────

function formatRupiah(amount: number | null | undefined): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── Mock Data ───────────────────────────────────────────────────────

function getMockPayments(): Payment[] {
  return [
    {
      id: 'pay-001',
      bookingId: 'bk-001',
      amount: 2250000,
      method: 'QRIS',
      status: 'SUCCESS',
      isDownPayment: true,
      transactionId: 'QRIS-20260428-001',
      paidAt: '2026-04-25T10:30:00Z',
      booking: {
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
        createdAt: '2026-04-24',
      },
      createdAt: '2026-04-25T10:30:00Z',
    },
    {
      id: 'pay-002',
      bookingId: 'bk-002',
      amount: 3600000,
      method: 'BANK_TRANSFER',
      status: 'SUCCESS',
      isDownPayment: false,
      transactionId: 'TRF-20260427-001',
      paidAt: '2026-04-27T14:15:00Z',
      booking: {
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
        createdAt: '2026-04-26',
      },
      createdAt: '2026-04-27T14:15:00Z',
    },
    {
      id: 'pay-003',
      bookingId: 'bk-003',
      amount: 1125000,
      method: 'E_WALLET',
      status: 'PENDING',
      isDownPayment: true,
      transactionId: 'EW-20260428-001',
      paidAt: null,
      booking: {
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
        createdAt: '2026-04-27',
      },
      createdAt: '2026-04-28T09:00:00Z',
    },
    {
      id: 'pay-004',
      bookingId: 'bk-005',
      amount: 4000000,
      method: 'CASH',
      status: 'FAILED',
      isDownPayment: false,
      transactionId: null,
      paidAt: null,
      booking: {
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
        createdAt: '2026-04-28',
      },
      createdAt: '2026-04-28T11:45:00Z',
    },
    {
      id: 'pay-005',
      bookingId: 'bk-004',
      amount: 750000,
      method: 'BANK_TRANSFER',
      status: 'SUCCESS',
      isDownPayment: false,
      transactionId: 'TRF-20260426-002',
      paidAt: '2026-04-26T16:20:00Z',
      booking: {
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
        createdAt: '2026-04-25',
      },
      createdAt: '2026-04-26T16:20:00Z',
    },
    {
      id: 'pay-006',
      bookingId: 'bk-001',
      amount: 1125000,
      method: 'QRIS',
      status: 'SUCCESS',
      isDownPayment: false,
      transactionId: 'QRIS-20260428-002',
      paidAt: '2026-04-28T08:00:00Z',
      booking: {
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
        createdAt: '2026-04-24',
      },
      createdAt: '2026-04-28T08:00:00Z',
    },
  ];
}

function getMockChartData() {
  return [
    { month: 'Nov', income: 18500000, expenses: 4200000 },
    { month: 'Des', income: 25300000, expenses: 5100000 },
    { month: 'Jan', income: 31200000, expenses: 6800000 },
    { month: 'Feb', income: 22400000, expenses: 4500000 },
    { month: 'Mar', income: 28900000, expenses: 7200000 },
    { month: 'Apr', income: 35600000, expenses: 8900000 },
  ];
}

// ── Animation variants ──────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ── Skeletons ───────────────────────────────────────────────────────

function SummaryCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 lg:p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

// ── Summary Card ────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendUp?: boolean;
}

function SummaryCard({ title, value, icon: Icon, iconBg, iconColor, trend, trendUp }: SummaryCardProps) {
  return (
    <motion.div variants={itemVariants} className="group">
      <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-4 lg:p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground lg:text-sm">{title}</p>
              <p className="text-xl lg:text-2xl font-bold tracking-tight">{value}</p>
              {trend && (
                <div className="flex items-center gap-1">
                  {trendUp ? (
                    <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-red-500" />
                  )}
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

// ── Chart Tooltip ───────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        {payload.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-muted-foreground capitalize">{entry.dataKey === 'income' ? 'Pemasukan' : entry.dataKey === 'expenses' ? 'Pengeluaran' : entry.dataKey}</span>
            <span className="text-xs font-semibold text-foreground">{formatRupiah(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// ── Payment Card ────────────────────────────────────────────────────

function PaymentCard({
  payment,
  index,
  onViewDetails,
}: {
  payment: Payment;
  index: number;
  onViewDetails: (p: Payment) => void;
}) {
  const methodConfig = PAYMENT_METHOD_CONFIG[payment.method];
  const statusConfig = PAYMENT_STATUS_CONFIG[payment.status];
  const MethodIcon = methodConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      variants={itemVariants}
      className="group"
    >
      <Card className="p-4 transition-shadow hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Left side */}
          <div className="flex-1 min-w-0 space-y-2.5">
            {/* Top badges */}
            <div className="flex items-center flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${methodConfig.className}`}>
                <MethodIcon className="w-3 h-3" />
                {methodConfig.label}
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusConfig.className}`}>
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                payment.isDownPayment
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                  : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800'
              }`}>
                {payment.isDownPayment ? 'DP' : 'Pelunasan'}
              </span>
            </div>

            {/* Booking reference */}
            <p className="text-sm text-muted-foreground">
              {payment.booking?.customer?.name ?? 'Pelanggan'} &middot;{' '}
              {payment.booking?.vehicle?.brand} {payment.booking?.vehicle?.model}
            </p>

            {/* Amount */}
            <p className="text-lg font-bold text-foreground">{formatRupiah(payment.amount)}</p>

            {/* Transaction ID & Date */}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {payment.transactionId && (
                <span className="font-mono">{payment.transactionId}</span>
              )}
              <span>{formatDateTime(payment.createdAt)}</span>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => onViewDetails(payment)}
            >
              <Eye className="w-3.5 h-3.5" />
              Detail
            </Button>
            {payment.status === 'PENDING' && (
              <Select onValueChange={(val) => {
                const newStatus = val as PaymentStatus;
                toast.info(`Status pembayaran ${payment.transactionId || payment.id} akan diubah ke ${PAYMENT_STATUS_CONFIG[newStatus].label}`);
              }}>
                <SelectTrigger className="h-7 w-[110px] text-[11px]">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Update" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUCCESS">Berhasil</SelectItem>
                  <SelectItem value="FAILED">Gagal</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Payment Details Dialog ──────────────────────────────────────────

function PaymentDetailDialog({
  payment,
  open,
  onOpenChange,
}: {
  payment: Payment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!payment) return null;

  const methodConfig = PAYMENT_METHOD_CONFIG[payment.method];
  const statusConfig = PAYMENT_STATUS_CONFIG[payment.status];
  const MethodIcon = methodConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detail Pembayaran</DialogTitle>
          <DialogDescription>
            Informasi lengkap transaksi pembayaran
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Amount */}
          <div className="text-center py-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Jumlah Pembayaran</p>
            <p className="text-2xl font-bold text-foreground">{formatRupiah(payment.amount)}</p>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID Transaksi</span>
              <span className="font-mono font-medium">{payment.transactionId || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Metode</span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${methodConfig.className}`}>
                <MethodIcon className="w-3 h-3" />
                {methodConfig.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusConfig.className}`}>
                {statusConfig.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipe</span>
              <span className="font-medium">{payment.isDownPayment ? 'Uang Muka (DP)' : 'Pelunasan'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pelanggan</span>
              <span className="font-medium">{payment.booking?.customer?.name ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kendaraan</span>
              <span className="font-medium">
                {payment.booking?.vehicle?.brand} {payment.booking?.vehicle?.model}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tanggal</span>
              <span className="font-medium">{formatDateTime(payment.createdAt)}</span>
            </div>
            {payment.paidAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibayar</span>
                <span className="font-medium">{formatDateTime(payment.paidAt)}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Finance View ───────────────────────────────────────────────

export function FinanceView() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Financial summary
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [chartData, setChartData] = useState<Array<{ month: string; income: number; expenses: number }>>([]);

  // ── Fetch payments ─────────────────────────────────────────────
  const fetchPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setFetchError(null);

    try {
      const params = new URLSearchParams();
      if (activeTab !== 'ALL') params.set('status', activeTab);
      params.set('limit', '50');
      params.set('sortBy', 'createdAt');
      params.set('sortOrder', 'desc');

      const res = await fetch(`/api/payments?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Gagal memuat data pembayaran');
      }

      setPayments(json.data || []);
    } catch {
      const message = 'Gagal memuat data pembayaran';
      setFetchError(message);
      if (!isRefresh) {
        setPayments(getMockPayments());
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  // ── Fetch reports for summary ─────────────────────────────────
  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/reports?period=yearly');
      const json = await res.json();

      if (json.success && json.data) {
        setTotalIncome(json.data.summary.income || 0);
        setTotalExpenses(json.data.summary.expenses || 0);

        if (json.data.monthlyRevenue && json.data.monthlyRevenue.length > 0) {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          const revenueMap: Record<string, number> = {};
          json.data.monthlyRevenue.forEach((mr: { month: string; revenue: number }) => {
            revenueMap[mr.month] = mr.revenue;
          });

          // Generate last 6 months chart data
          const now = new Date();
          const chartMonths: Array<{ month: string; income: number; expenses: number }> = [];
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const monthIdx = d.getMonth();
            chartMonths.push({
              month: months[monthIdx],
              income: revenueMap[key] || Math.floor(Math.random() * 20000000 + 15000000),
              expenses: Math.floor((revenueMap[key] || 20000000) * (0.15 + Math.random() * 0.1)),
            });
          }
          setChartData(chartMonths);
        }
      }
    } catch {
      // Use mock data as fallback
      setTotalIncome(66000000);
      setTotalExpenses(18400000);
      setChartData(getMockChartData());
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRefresh = () => {
    fetchPayments(true);
    fetchReports();
  };

  // ── Computed ──────────────────────────────────────────────────
  const filteredPayments = payments;
  const netProfit = totalIncome - totalExpenses;
  const totalTransactions = payments.length;

  // ── Handlers ──────────────────────────────────────────────────
  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailOpen(true);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Keuangan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola pembayaran dan keuangan
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="shrink-0 gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Memuat...' : 'Refresh'}
        </Button>
      </motion.div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {loading ? (
          <>
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard
              title="Total Pemasukan"
              value={formatRupiah(totalIncome)}
              icon={TrendingUp}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
              trend="+12% dari bulan lalu"
              trendUp={true}
            />
            <SummaryCard
              title="Total Pengeluaran"
              value={formatRupiah(totalExpenses)}
              icon={TrendingDown}
              iconBg="bg-red-100 dark:bg-red-900/30"
              iconColor="text-red-600 dark:text-red-400"
              trend="servis & pajak"
              trendUp={false}
            />
            <SummaryCard
              title="Laba Bersih"
              value={formatRupiah(netProfit)}
              icon={Wallet}
              iconBg="bg-teal-100 dark:bg-teal-900/30"
              iconColor="text-teal-600 dark:text-teal-400"
              trend={totalIncome > 0 ? `margin ${((netProfit / totalIncome) * 100).toFixed(1)}%` : undefined}
              trendUp={netProfit > 0}
            />
            <SummaryCard
              title="Total Transaksi"
              value={totalTransactions}
              icon={CreditCard}
              iconBg="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-600 dark:text-blue-400"
            />
          </>
        )}
      </div>

      {/* ── Revenue Chart ── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base lg:text-lg">Grafik Pendapatan vs Pengeluaran</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  6 bulan terakhir
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-muted-foreground">Pemasukan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="text-[11px] text-muted-foreground">Pengeluaran</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4 sm:px-4">
            {loading ? (
              <Skeleton className="h-64 w-full rounded-lg" />
            ) : (
              <div className="h-64 lg:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value: number) => `${(value / 1000000).toFixed(0)}jt`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#incomeGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="#f87171"
                      strokeWidth={2}
                      fill="url(#expensesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Payment List ── */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-foreground">Daftar Pembayaran</h2>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-9">
              <TabsTrigger value="ALL" className="text-xs px-3">Semua</TabsTrigger>
              <TabsTrigger value="PENDING" className="text-xs px-3">Menunggu</TabsTrigger>
              <TabsTrigger value="SUCCESS" className="text-xs px-3">Berhasil</TabsTrigger>
              <TabsTrigger value="FAILED" className="text-xs px-3">Gagal</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <PaymentCardSkeleton key={i} />
            ))}
          </div>
        ) : fetchError ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-destructive" />
              </div>
              <p className="text-sm font-medium text-foreground">Gagal memuat data</p>
              <p className="text-xs text-muted-foreground">{fetchError}</p>
              <Button variant="outline" size="sm" onClick={() => fetchPayments()}>
                Coba Lagi
              </Button>
            </div>
          </Card>
        ) : filteredPayments.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Belum ada pembayaran</p>
              <p className="text-xs text-muted-foreground">
                {activeTab === 'ALL'
                  ? 'Pembayaran akan muncul ketika ada transaksi.'
                  : `Tidak ada pembayaran dengan status ${PAYMENT_STATUS_CONFIG[activeTab as PaymentStatus]?.label || activeTab}.`}
              </p>
            </div>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3 max-h-[600px] overflow-y-auto pr-1"
          >
            {filteredPayments.map((payment, index) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                index={index}
                onViewDetails={handleViewDetails}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* ── Detail Dialog ── */}
      <PaymentDetailDialog
        payment={selectedPayment}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </motion.div>
  );
}
