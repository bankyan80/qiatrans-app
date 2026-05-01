'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  CalendarCheck,
  Calendar,
  Plus,
  Search,
  Eye,
  Trash2,
  User,
  UserPlus,
  Car,
  MapPin,
  Clock,
  CreditCard,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  Ban,
  RotateCcw,
  IdCard,
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import type { BookingStatus, PaymentMethod, PaymentStatus } from '@/lib/types';

// ── Types ────────────────────────────────────────────────────────────

interface CustomerOption {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

interface VehicleOption {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
  dailyRate: number;
  category: string;
}

interface DriverOption {
  id: string;
  name: string;
  phone: string | null;
  rating: number;
  status: string;
}

interface PaymentInfo {
  id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  isDownPayment: boolean;
  paidAt: string | null;
  transactionId: string | null;
}

interface ApiBooking {
  id: string;
  customerId: string;
  vehicleId: string;
  driverId: string | null;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: BookingStatus;
  withDriver: boolean;
  pickupLocation: string;
  returnLocation: string;
  notes: string | null;
  customer: { id: string; name: string; email: string; phone: string | null };
  vehicle: { id: string; brand: string; model: string; plateNumber: string; imageUrl: string | null };
  driver: { id: string; name: string; phone: string | null } | null;
  payments: PaymentInfo[];
  createdAt: string;
}

type TabValue = 'ALL' | BookingStatus;

// ── Constants ────────────────────────────────────────────────────────

const DRIVER_FEE_PER_DAY = 150000;

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; dotClass: string; bgClass: string; textClass: string }
> = {
  PENDING: {
    label: 'Menunggu',
    dotClass: 'bg-amber-500',
    bgClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    textClass: 'text-amber-600 dark:text-amber-400',
  },
  CONFIRMED: {
    label: 'Dikonfirmasi',
    dotClass: 'bg-blue-500',
    bgClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    textClass: 'text-blue-600 dark:text-blue-400',
  },
  ACTIVE: {
    label: 'Aktif',
    dotClass: 'bg-emerald-500',
    bgClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    textClass: 'text-emerald-600 dark:text-emerald-400',
  },
  COMPLETED: {
    label: 'Selesai',
    dotClass: 'bg-slate-500',
    bgClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    textClass: 'text-slate-600 dark:text-slate-400',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    dotClass: 'bg-red-500',
    bgClass: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    textClass: 'text-red-600 dark:text-red-400',
  },
};

const TAB_CONFIG: Array<{ value: TabValue; label: string }> = [
  { value: 'ALL', label: 'Semua' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'CONFIRMED', label: 'Dikonfirmasi' },
  { value: 'ACTIVE', label: 'Aktif' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  QRIS: 'QRIS',
  BANK_TRANSFER: 'Transfer Bank',
  E_WALLET: 'E-Wallet',
  CASH: 'Tunai',
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: 'Menunggu',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  SUCCESS: {
    label: 'Berhasil',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  FAILED: {
    label: 'Gagal',
    className: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  },
  REFUNDED: {
    label: 'Dikembalikan',
    className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  },
};

const EMPTY_FORM = {
  customerId: '',
  vehicleId: '',
  driverId: '',
  startDate: undefined as Date | undefined,
  endDate: undefined as Date | undefined,
  pickupLocation: '',
  returnLocation: '',
  withDriver: false,
  notes: '',
};

const EMPTY_NEW_CUSTOMER = {
  name: '',
  email: '',
  phone: '',
  idNumber: '',
};

// ── Helper functions ─────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateIndonesian(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getBookingShortId(id: string): string {
  return `BK-${id.slice(0, 8).toUpperCase()}`;
}

function getDurationDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e.getTime() - s.getTime()) / 86400000);
  return Math.max(diff, 0);
}

function getTotalPaid(payments: PaymentInfo[]): number {
  return payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);
}

// ── Sub-components ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="secondary" className={`${config.bgClass} border-0 gap-1.5 font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </Badge>
  );
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const config = PAYMENT_STATUS_CONFIG[status];
  return (
    <Badge variant="secondary" className={`${config.className} border-0 text-xs font-medium`}>
      {config.label}
    </Badge>
  );
}

function BookingCardSkeleton() {
  return (
    <Card className="p-4 lg:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-4 w-36" />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>
    </Card>
  );
}

function BookingCard({
  booking,
  onViewDetail,
  onDelete,
}: {
  booking: ApiBooking;
  onViewDetail: (b: ApiBooking) => void;
  onDelete: (b: ApiBooking) => void;
}) {
  const duration = getDurationDays(booking.startDate, booking.endDate);
  const totalPaid = getTotalPaid(booking.payments);
  const paymentStatus: PaymentStatus =
    booking.payments.length === 0
      ? 'PENDING'
      : booking.payments.every((p) => p.status === 'SUCCESS') &&
        totalPaid >= booking.totalPrice
        ? 'SUCCESS'
        : booking.payments.some((p) => p.status === 'SUCCESS')
        ? 'PENDING'
        : 'FAILED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: 'easeOut' as const }}
      layout
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 lg:p-6">
          {/* Top row: Booking ID + Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {getBookingShortId(booking.id)}
              </span>
              {booking.withDriver && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                  + Sopir
                </Badge>
              )}
            </div>
            <StatusBadge status={booking.status} />
          </div>

          {/* Customer info */}
          <div className="flex items-center gap-2 mb-2">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">
              {booking.customer.name}
            </span>
            {booking.customer.phone && (
              <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
                · {booking.customer.phone}
              </span>
            )}
          </div>

          {/* Vehicle info */}
          <div className="flex items-center gap-2 mb-2">
            <Car className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground truncate">
              {booking.vehicle.brand} {booking.vehicle.model}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              ({booking.vehicle.plateNumber})
            </span>
          </div>

          {/* Driver info */}
          <div className="flex items-center gap-2 mb-2">
            {booking.driver ? (
              <>
                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground">{booking.driver.name}</span>
              </>
            ) : (
              <>
                <Ban className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">Lepas Kunci</span>
              </>
            )}
          </div>

          {/* Date range + duration */}
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {formatDateIndonesian(booking.startDate)} — {formatDateIndonesian(booking.endDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-foreground">{duration} hari</span>
          </div>

          <Separator className="my-3" />

          {/* Bottom row: Price + Payment + Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-base font-bold text-foreground">
                {formatRupiah(booking.totalPrice)}
              </span>
              <PaymentBadge status={paymentStatus} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetail(booking)}
                className="gap-1.5 text-xs"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Detail</span>
              </Button>
              {booking.status !== 'ACTIVE' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(booking)}
                  className="gap-1.5 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hapus</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Create Booking Dialog ───────────────────────────────────────────

function CreateBookingDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState(EMPTY_NEW_CUSTOMER);

  // Fetch dropdown data when dialog opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setFetching(true);

    async function fetchData() {
      try {
        const [custRes, vehRes, drivRes] = await Promise.all([
          fetch('/api/customers?limit=50'),
          fetch('/api/vehicles?status=AVAILABLE&limit=50'),
          fetch('/api/drivers?limit=50'),
        ]);

        const [custData, vehData, drivData] = await Promise.all([
          custRes.json(),
          vehRes.json(),
          drivRes.json(),
        ]);

        if (!cancelled) {
          setCustomers((custData.data || []).map((c: Record<string, unknown>) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
          })));
          setVehicles(vehData.data || []);
          // Drivers API returns nested user object.
          // IMPORTANT: use user.id as driver option value because
          // Booking.driverId is a FK to User.id (not Driver.id)
          setDrivers((drivData.data || []).map((d: Record<string, unknown>) => {
            const user = d.user as Record<string, unknown> | undefined;
            return {
              id: user?.id || d.id,
              name: user?.name || d.name || '',
              phone: user?.phone || d.phone || null,
              rating: d.rating || 0,
              status: d.status,
            };
          }));
        }
      } catch (err) {
        if (!cancelled) {
          toast.error('Gagal memuat data formulir');
        }
      } finally {
        if (!cancelled) {
          setFetching(false);
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === form.vehicleId),
    [vehicles, form.vehicleId]
  );

  const calculatedDays = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    return Math.max(
      Math.ceil(
        (form.endDate.getTime() - form.startDate.getTime()) / 86400000
      ),
      0
    );
  }, [form.startDate, form.endDate]);

  const calculatedTotal = useMemo(() => {
    if (!selectedVehicle || calculatedDays === 0) return 0;
    let total = selectedVehicle.dailyRate * calculatedDays;
    if (form.withDriver) {
      total += DRIVER_FEE_PER_DAY * calculatedDays;
    }
    return total;
  }, [selectedVehicle, calculatedDays, form.withDriver]);

  const isNewCustomerValid =
    newCustomer.name.trim() &&
    newCustomer.phone.trim() &&
    newCustomer.idNumber.trim();

  const isFormValid =
    !isNewCustomer
      ? form.customerId &&
        form.vehicleId &&
        form.startDate &&
        form.endDate &&
        calculatedDays > 0 &&
        form.pickupLocation
      : isNewCustomerValid &&
        form.vehicleId &&
        form.startDate &&
        form.endDate &&
        calculatedDays > 0 &&
        form.pickupLocation;

  async function handleSubmit() {
    if (!isFormValid) return;

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        vehicleId: form.vehicleId,
        driverId: form.withDriver ? form.driverId || null : null,
        startDate: (form.startDate ?? new Date()).toISOString(),
        endDate: (form.endDate ?? new Date()).toISOString(),
        totalPrice: calculatedTotal,
        withDriver: form.withDriver,
        pickupLocation: form.pickupLocation,
        returnLocation: form.returnLocation || null,
        notes: form.notes || null,
      };

      if (isNewCustomer) {
        payload.newCustomer = {
          name: newCustomer.name.trim(),
          email: newCustomer.email.trim() || undefined,
          phone: newCustomer.phone.trim(),
          idNumber: newCustomer.idNumber.trim(),
        };
      } else {
        payload.customerId = form.customerId;
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Booking berhasil dibuat!');
        setForm(EMPTY_FORM);
        setNewCustomer(EMPTY_NEW_CUSTOMER);
        setIsNewCustomer(false);
        onOpenChange(false);
        onSubmit();
      } else {
        toast.error(data.error || 'Gagal membuat booking');
      }
    } catch {
      toast.error('Terjadi kesalahan saat membuat booking');
    } finally {
      setLoading(false);
    }
  }

  function resetAndClose() {
    setForm(EMPTY_FORM);
    setNewCustomer(EMPTY_NEW_CUSTOMER);
    setIsNewCustomer(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-primary" />
            Buat Booking Baru
          </DialogTitle>
          <DialogDescription>
            Isi data di bawah untuk membuat pemesanan rental baru
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-5 py-2">
            {/* Customer select / New customer form */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pelanggan</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-primary hover:text-primary"
                  onClick={() => {
                    setIsNewCustomer(!isNewCustomer);
                    if (isNewCustomer) {
                      setNewCustomer(EMPTY_NEW_CUSTOMER);
                    } else {
                      setForm((f) => ({ ...f, customerId: '' }));
                    }
                  }}
                >
                  {isNewCustomer ? (
                    <>
                      <User className="w-3 h-3" />
                      Pilih Pelanggan Terdaftar
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" />
                      Pelanggan Baru
                    </>
                  )}
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {!isNewCustomer ? (
                  <motion.div
                    key="select-customer"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <Select
                      value={form.customerId}
                      onValueChange={(val) => setForm((f) => ({ ...f, customerId: val }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={fetching ? 'Memuat...' : 'Pilih pelanggan'} />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{c.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {c.phone || c.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                ) : (
                  <motion.div
                    key="new-customer"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <UserPlus className="w-4 h-4" />
                        Data Pelanggan Baru
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="new-name" className="text-xs">
                            Nama Lengkap <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="new-name"
                            placeholder="Nama pelanggan"
                            value={newCustomer.name}
                            onChange={(e) =>
                              setNewCustomer((c) => ({ ...c, name: e.target.value }))
                            }
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="new-phone" className="text-xs">
                            No. Telepon <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="new-phone"
                            placeholder="08xxxxxxxxxx"
                            value={newCustomer.phone}
                            onChange={(e) =>
                              setNewCustomer((c) => ({ ...c, phone: e.target.value }))
                            }
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="new-id" className="text-xs">
                            No. KTP / SIM <span className="text-destructive">*</span>
                          </Label>
                          <div className="relative">
                            <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="new-id"
                              placeholder="Nomor identitas (KTP/SIM)"
                              className="pl-9"
                              value={newCustomer.idNumber}
                              onChange={(e) =>
                                setNewCustomer((c) => ({ ...c, idNumber: e.target.value }))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="new-email" className="text-xs">
                            Email <span className="text-muted-foreground">(opsional)</span>
                          </Label>
                          <Input
                            id="new-email"
                            type="email"
                            placeholder="email@contoh.com"
                            value={newCustomer.email}
                            onChange={(e) =>
                              setNewCustomer((c) => ({ ...c, email: e.target.value }))
                            }
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        Pelanggan baru akan otomatis terdaftar sebagai pelanggan rental.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Vehicle select */}
            <div className="space-y-2">
              <Label htmlFor="vehicle">Kendaraan</Label>
              <Select
                value={form.vehicleId}
                onValueChange={(val) => setForm((f) => ({ ...f, vehicleId: val }))}
              >
                <SelectTrigger className="w-full" id="vehicle">
                  <SelectValue placeholder={fetching ? 'Memuat...' : 'Pilih kendaraan'} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {v.brand} {v.model}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {v.plateNumber} · {v.category} · {formatRupiah(v.dailyRate)}/hari
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* With Driver toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="withDriver">Dengan Sopir</Label>
                <p className="text-xs text-muted-foreground">
                  Biaya tambahan {formatRupiah(DRIVER_FEE_PER_DAY)}/hari
                </p>
              </div>
              <Switch
                id="withDriver"
                checked={form.withDriver}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, withDriver: checked, driverId: '' }))
                }
              />
            </div>

            {/* Driver select (conditional) */}
            {form.withDriver && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <Label htmlFor="driver">Sopir (Opsional)</Label>
                <Select
                  value={form.driverId}
                  onValueChange={(val) => setForm((f) => ({ ...f, driverId: val }))}
                >
                  <SelectTrigger className="w-full" id="driver">
                    <SelectValue placeholder="Pilih sopir" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{d.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ★ {d.rating.toFixed(1)} · {d.phone || '-'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {drivers.length === 0 && !fetching && (
                  <p className="text-xs text-muted-foreground">
                    Tidak ada sopir yang tersedia saat ini
                  </p>
                )}
              </motion.div>
            )}

            <Separator />

            {/* Date pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal gap-2"
                    >
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {form.startDate ? formatDateShort(form.startDate) : 'Pilih tanggal'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={form.startDate}
                      onSelect={(date) =>
                        setForm((f) => ({ ...f, startDate: date || undefined }))
                      }
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Selesai</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal gap-2"
                    >
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {form.endDate ? formatDateShort(form.endDate) : 'Pilih tanggal'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={form.endDate}
                      onSelect={(date) =>
                        setForm((f) => ({ ...f, endDate: date || undefined }))
                      }
                      disabled={(date) =>
                        date < (form.startDate || new Date(new Date().setHours(0, 0, 0, 0)))
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Duration display */}
            {calculatedDays > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">
                  Durasi: <strong>{calculatedDays} hari</strong>
                </span>
              </div>
            )}

            <Separator />

            {/* Location inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Lokasi Penjemputan
                  </span>
                </Label>
                <Input
                  id="pickup"
                  placeholder="Contoh: Bandara Soekarno-Hatta"
                  value={form.pickupLocation}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, pickupLocation: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="return">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Lokasi Pengembalian
                  </span>
                </Label>
                <Input
                  id="return"
                  placeholder="Sama dengan penjemputan"
                  value={form.returnLocation}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, returnLocation: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan (opsional)"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <Separator />

            {/* Price summary */}
            {selectedVehicle && calculatedDays > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border p-4 space-y-2"
              >
                <h4 className="text-sm font-semibold text-foreground">Ringkasan Harga</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {selectedVehicle.brand} {selectedVehicle.model} × {calculatedDays} hari
                  </span>
                  <span className="text-foreground">
                    {formatRupiah(selectedVehicle.dailyRate * calculatedDays)}
                  </span>
                </div>
                {form.withDriver && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Biaya Sopir × {calculatedDays} hari
                    </span>
                    <span className="text-foreground">
                      {formatRupiah(DRIVER_FEE_PER_DAY * calculatedDays)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary text-base">{formatRupiah(calculatedTotal)}</span>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={resetAndClose} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || loading}>
            {loading ? 'Menyimpan...' : 'Buat Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Booking Detail Sheet ────────────────────────────────────────────

function BookingDetailSheet({
  booking,
  open,
  onOpenChange,
  onStatusChange,
}: {
  booking: ApiBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: () => void;
}) {
  const [updating, setUpdating] = useState(false);

  if (!booking) return null;

  const duration = getDurationDays(booking.startDate, booking.endDate);
  const totalPaid = getTotalPaid(booking.payments);
  const paymentStatus: PaymentStatus =
    booking.payments.length === 0
      ? 'PENDING'
      : booking.payments.every((p) => p.status === 'SUCCESS') &&
        totalPaid >= booking.totalPrice
        ? 'SUCCESS'
        : booking.payments.some((p) => p.status === 'SUCCESS')
        ? 'PENDING'
        : 'FAILED';

  async function handleStatusChange(newStatus: BookingStatus) {
    if (!booking) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Status booking berhasil diubah ke ${STATUS_CONFIG[newStatus].label}`);
        onStatusChange();
        onOpenChange(false);
      } else {
        toast.error(data.error || 'Gagal mengubah status');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setUpdating(false);
    }
  }

  const canConfirm = booking.status === 'PENDING';
  const canStart = booking.status === 'CONFIRMED';
  const canComplete = booking.status === 'ACTIVE';
  const canCancel = booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED';

  // Status timeline
  const statusFlow: Array<{ status: BookingStatus; label: string; done: boolean; current: boolean }> = [
    { status: 'PENDING', label: 'Menunggu', done: ['CONFIRMED', 'ACTIVE', 'COMPLETED'].includes(booking.status), current: booking.status === 'PENDING' },
    { status: 'CONFIRMED', label: 'Dikonfirmasi', done: ['ACTIVE', 'COMPLETED'].includes(booking.status), current: booking.status === 'CONFIRMED' },
    { status: 'ACTIVE', label: 'Aktif', done: booking.status === 'COMPLETED', current: booking.status === 'ACTIVE' },
    { status: 'COMPLETED', label: 'Selesai', done: booking.status === 'COMPLETED', current: false },
  ];

  const isCancelledFlow = booking.status === 'CANCELLED';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg w-full p-0">
        <SheetHeader className="p-6 pb-0">
          <div className="flex items-center justify-between pr-6">
            <div>
              <SheetTitle className="text-lg flex items-center gap-2">
                Detail Booking
              </SheetTitle>
              <SheetDescription className="mt-1">
                {getBookingShortId(booking.id)}
              </SheetDescription>
            </div>
            <StatusBadge status={booking.status} />
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
          <div className="p-6 space-y-6">
            {/* Status Timeline */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Progress Booking</h4>
              {isCancelledFlow ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                  <Ban className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-400">
                    Booking dibatalkan
                  </span>
                </div>
              ) : (
                <div className="relative space-y-0">
                  {statusFlow.map((step, idx) => (
                    <div key={step.status} className="flex gap-3">
                      {/* Vertical line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 ${
                            step.done
                              ? 'bg-primary border-primary text-primary-foreground'
                              : step.current
                              ? 'border-primary bg-background'
                              : 'border-muted-foreground/30 bg-background'
                          }`}
                        >
                          {step.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {step.current && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        {idx < statusFlow.length - 1 && (
                          <div
                            className={`w-0.5 flex-1 min-h-6 ${
                              step.done ? 'bg-primary' : 'bg-muted-foreground/20'
                            }`}
                          />
                        )}
                      </div>
                      <div className="pb-6">
                        <p
                          className={`text-sm font-medium ${
                            step.current ? 'text-foreground' : step.done ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Customer info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Informasi Pelanggan</h4>
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{booking.customer.name}</span>
                </div>
                {booking.customer.phone && (
                  <p className="text-xs text-muted-foreground pl-6">{booking.customer.phone}</p>
                )}
                <p className="text-xs text-muted-foreground pl-6">{booking.customer.email}</p>
              </div>
            </div>

            {/* Vehicle info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Kendaraan</h4>
              <div className="rounded-lg border p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {booking.vehicle.brand} {booking.vehicle.model}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Plat: {booking.vehicle.plateNumber}
                </p>
              </div>
            </div>

            {/* Driver info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Sopir</h4>
              <div className="rounded-lg border p-3">
                {booking.driver ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{booking.driver.name}</span>
                    </div>
                    {booking.driver.phone && (
                      <p className="text-xs text-muted-foreground pl-6">{booking.driver.phone}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Ban className="w-4 h-4" />
                    <span className="text-sm">Lepas Kunci</span>
                  </div>
                )}
              </div>
            </div>

            {/* Date & Duration */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Tanggal & Durasi</h4>
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {formatDateIndonesian(booking.startDate)}
                  </span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm">
                    {formatDateIndonesian(booking.endDate)}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium">{duration} hari</span>
                </div>
              </div>
            </div>

            {/* Locations */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Lokasi</h4>
              <div className="rounded-lg border p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Penjemputan</p>
                    <p className="text-sm">{booking.pickupLocation || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pengembalian</p>
                    <p className="text-sm">{booking.returnLocation || booking.pickupLocation || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Pembayaran</h4>
              <div className="rounded-lg border p-3 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Harga</span>
                  <span className="text-base font-bold text-foreground">
                    {formatRupiah(booking.totalPrice)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sudah Dibayar</span>
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(totalPaid)}
                  </span>
                </div>
                {totalPaid < booking.totalPrice && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sisa</span>
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      {formatRupiah(booking.totalPrice - totalPaid)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Status Pembayaran</span>
                  <PaymentBadge status={paymentStatus} />
                </div>

                {/* Payment history */}
                {booking.payments.length > 0 && (
                  <div className="space-y-2 mt-2">
                    <p className="text-xs font-medium text-muted-foreground">Riwayat Pembayaran</p>
                    {booking.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                          <div>
                            <p className="text-xs font-medium">
                              {PAYMENT_METHOD_LABELS[payment.method]}
                              {payment.isDownPayment && ' (DP)'}
                            </p>
                            {payment.paidAt && (
                              <p className="text-[10px] text-muted-foreground">
                                {formatDateIndonesian(payment.paidAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold">{formatRupiah(payment.amount)}</p>
                          <PaymentBadge status={payment.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {booking.notes && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Catatan</h4>
                <div className="rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">{booking.notes}</p>
                </div>
              </div>
            )}

            {/* Created at */}
            <p className="text-xs text-muted-foreground text-center">
              Dibuat: {formatDateIndonesian(booking.createdAt)}
            </p>
          </div>
        </ScrollArea>

        {/* Action buttons */}
        {(canConfirm || canStart || canComplete || canCancel) && (
          <div className="border-t p-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              {canConfirm && (
                <Button
                  size="sm"
                  className="gap-1.5 flex-1"
                  onClick={() => handleStatusChange('CONFIRMED')}
                  disabled={updating}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Konfirmasi
                </Button>
              )}
              {canStart && (
                <Button
                  size="sm"
                  className="gap-1.5 flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleStatusChange('ACTIVE')}
                  disabled={updating}
                >
                  <PlayCircle className="w-4 h-4" />
                  Mulai Rental
                </Button>
              )}
              {canComplete && (
                <Button
                  size="sm"
                  className="gap-1.5 flex-1"
                  onClick={() => handleStatusChange('COMPLETED')}
                  disabled={updating}
                >
                  <RotateCcw className="w-4 h-4" />
                  Selesaikan
                </Button>
              )}
              {canCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 flex-1 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={updating}
                >
                  <Ban className="w-4 h-4" />
                  Batalkan
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Delete Confirmation Dialog ──────────────────────────────────────

function DeleteConfirmDialog({
  booking,
  open,
  onOpenChange,
  onConfirm,
}: {
  booking: ApiBooking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  if (!booking) return null;

  async function handleDelete() {
    if (!booking) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('Booking berhasil dihapus');
        onOpenChange(false);
        onConfirm();
      } else {
        toast.error(data.error || 'Gagal menghapus booking');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Hapus Booking
          </AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus booking{' '}
            <strong>{getBookingShortId(booking.id)}</strong> untuk{' '}
            <strong>{booking.customer.name}</strong>? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={deleting}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleting ? 'Menghapus...' : 'Hapus'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── CalendarPlus icon (shim) ─────────────────────────────────────────

function CalendarPlus({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M10 16h4" />
      <path d="M12 14v4" />
    </svg>
  );
}

// ── Main BookingView ─────────────────────────────────────────────────

export function BookingView() {
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>('ALL');
  const [search, setSearch] = useState('');

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState<ApiBooking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteBooking, setDeleteBooking] = useState<ApiBooking | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      params.set('sortBy', 'createdAt');
      params.set('sortOrder', 'desc');

      const res = await fetch(`/api/bookings?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setBookings(data.data || []);
      } else {
        toast.error('Gagal memuat data booking');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<TabValue, number> = {
      ALL: bookings.length,
      PENDING: 0,
      CONFIRMED: 0,
      ACTIVE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    bookings.forEach((b) => {
      counts[b.status]++;
    });
    return counts;
  }, [bookings]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    let result = bookings;

    if (activeTab !== 'ALL') {
      result = result.filter((b) => b.status === activeTab);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.customer.name.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q) ||
          getBookingShortId(b.id).toLowerCase().includes(q) ||
          b.vehicle.brand.toLowerCase().includes(q) ||
          b.vehicle.model.toLowerCase().includes(q) ||
          b.vehicle.plateNumber.toLowerCase().includes(q)
      );
    }

    return result;
  }, [bookings, activeTab, search]);

  function handleViewDetail(booking: ApiBooking) {
    setDetailBooking(booking);
    setDetailOpen(true);
  }

  function handleDeleteBooking(booking: ApiBooking) {
    setDeleteBooking(booking);
    setDeleteOpen(true);
  }

  function handleRefresh() {
    fetchBookings();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-primary" />
            Manajemen Booking
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola semua pemesanan rental
          </p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Buat Booking Baru
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="space-y-4">
        {/* Tabs with horizontal scroll on mobile */}
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as TabValue)}
          >
            <TabsList className="w-fit min-w-full sm:min-w-0">
              {TAB_CONFIG.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden text-xs">{tab.label.slice(0, 4)}</span>
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 px-1.5 text-[10px] flex items-center justify-center rounded-full"
                  >
                    {statusCounts[tab.value]}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama pelanggan, booking ID, atau kendaraan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 max-w-md"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Booking List */}
      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <BookingCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <CalendarCheck className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {search ? 'Tidak ditemukan' : 'Belum ada booking'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {search
              ? 'Coba ubah kata kunci pencarian atau filter status.'
              : 'Klik tombol "Buat Booking Baru" untuk membuat pemesanan pertama.'}
          </p>
          {search && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setSearch('')}
            >
              Reset Pencarian
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onViewDetail={handleViewDetail}
                onDelete={handleDeleteBooking}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Results count */}
      {!loading && filteredBookings.length > 0 && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Menampilkan {filteredBookings.length} dari {bookings.length} booking
          </p>
        </div>
      )}

      {/* Create Booking Dialog */}
      <CreateBookingDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleRefresh}
      />

      {/* Booking Detail Sheet */}
      <BookingDetailSheet
        booking={detailBooking}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={handleRefresh}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        booking={deleteBooking}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleRefresh}
      />
    </div>
  );
}
