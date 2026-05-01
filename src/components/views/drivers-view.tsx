'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  UserCog,
  Plus,
  Phone,
  CreditCard,
  Star,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Search,
  Users,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';
import type { Driver, DriverStatus } from '@/lib/types';

// ── Constants ───────────────────────────────────────────────────────

const STATUS_FILTERS: Array<{ value: DriverStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'BUSY', label: 'Sibuk' },
];

const STATUS_CONFIG: Record<DriverStatus, { label: string; className: string; icon: React.ElementType }> = {
  ONLINE: {
    label: 'Online',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    icon: ToggleRight,
  },
  OFFLINE: {
    label: 'Offline',
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    icon: ToggleLeft,
  },
  BUSY: {
    label: 'Sibuk',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    icon: ToggleLeft,
  },
};

const AVATAR_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
];

// ── Helpers ─────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Mock Data ───────────────────────────────────────────────────────

function getMockDrivers(): Driver[] {
  return [
    {
      id: 'drv-001',
      userId: 'user-drv-1',
      licenseNumber: 'B 1234 5678 9012',
      licenseExpiry: '2028-06-15',
      licenseImage: null,
      address: 'Jl. Merdeka No. 45, Jakarta Selatan',
      status: 'ONLINE',
      rating: 4.8,
      totalTrips: 156,
      user: {
        id: 'user-drv-1',
        email: 'ahmad@quatrans.id',
        name: 'Ahmad Hidayat',
        phone: '081234567890',
        role: 'DRIVER',
        avatar: null,
        isVerified: true,
        createdAt: '2025-06-01',
      },
      createdAt: '2025-06-01',
    },
    {
      id: 'drv-002',
      userId: 'user-drv-2',
      licenseNumber: 'D 5678 9012 3456',
      licenseExpiry: '2027-12-20',
      licenseImage: null,
      address: 'Jl. Asia Afrika No. 12, Bandung',
      status: 'BUSY',
      rating: 4.5,
      totalTrips: 98,
      user: {
        id: 'user-drv-2',
        email: 'rudi@quatrans.id',
        name: 'Rudi Setiawan',
        phone: '081987654321',
        role: 'DRIVER',
        avatar: null,
        isVerified: true,
        createdAt: '2025-08-15',
      },
      createdAt: '2025-08-15',
    },
    {
      id: 'drv-003',
      userId: 'user-drv-3',
      licenseNumber: 'F 9012 3456 7890',
      licenseExpiry: '2026-09-10',
      licenseImage: null,
      address: 'Jl. Pemuda No. 78, Surabaya',
      status: 'OFFLINE',
      rating: 4.2,
      totalTrips: 45,
      user: {
        id: 'user-drv-3',
        email: 'dian@quatrans.id',
        name: 'Dian Pratama',
        phone: '087654321098',
        role: 'DRIVER',
        avatar: null,
        isVerified: true,
        createdAt: '2026-01-10',
      },
      createdAt: '2026-01-10',
    },
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

// ── Form data shape ─────────────────────────────────────────────────

interface DriverFormData {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  address: string;
  status: DriverStatus;
}

const emptyForm: DriverFormData = {
  name: '',
  email: '',
  phone: '',
  licenseNumber: '',
  licenseExpiry: '',
  address: '',
  status: 'OFFLINE',
};

function driverToForm(d: Driver): DriverFormData {
  return {
    name: d.user?.name || '',
    email: d.user?.email || '',
    phone: d.user?.phone || '',
    licenseNumber: d.licenseNumber || '',
    licenseExpiry: d.licenseExpiry ? d.licenseExpiry.split('T')[0] : '',
    address: d.address || '',
    status: d.status,
  };
}

// ── Validation ──────────────────────────────────────────────────────

function validateForm(form: DriverFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.name.trim()) errors.name = 'Nama wajib diisi';
  else if (form.name.trim().length < 3) errors.name = 'Nama minimal 3 karakter';

  if (!form.email.trim()) {
    errors.email = 'Email wajib diisi';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Format email tidak valid';
  }

  if (!form.phone.trim()) {
    errors.phone = 'Nomor HP wajib diisi';
  } else if (!/^0[0-9]{9,13}$/.test(form.phone.replace(/[\s-]/g, ''))) {
    errors.phone = 'Nomor HP tidak valid';
  }

  if (!form.licenseNumber.trim()) {
    errors.licenseNumber = 'Nomor SIM wajib diisi';
  } else if (form.licenseNumber.trim().length < 5) {
    errors.licenseNumber = 'Nomor SIM minimal 5 karakter';
  }

  if (!form.licenseExpiry) {
    errors.licenseExpiry = 'Masa berlaku SIM wajib diisi';
  } else {
    const expiry = new Date(form.licenseExpiry);
    if (isNaN(expiry.getTime())) {
      errors.licenseExpiry = 'Tanggal tidak valid';
    } else if (expiry <= new Date()) {
      errors.licenseExpiry = 'SIM sudah kadaluarsa';
    }
  }

  return errors;
}

// ── Skeletons ───────────────────────────────────────────────────────

function DriverCardSkeleton() {
  return (
    <Card className="p-5">
      <div className="flex flex-col items-center text-center space-y-3">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2 pt-2 w-full">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
        </div>
      </div>
    </Card>
  );
}

// ── Star Rating ─────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < fullStars
              ? 'text-amber-400 fill-amber-400'
              : i === fullStars && hasHalf
                ? 'text-amber-400 fill-amber-200'
                : 'text-muted-foreground/30'
          }`}
        />
      ))}
      <span className="text-xs font-semibold text-foreground ml-0.5">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── Driver Card ─────────────────────────────────────────────────────

function DriverCard({
  driver,
  index,
  onEdit,
  onToggleStatus,
  onViewHistory,
  onDelete,
}: {
  driver: Driver;
  index: number;
  onEdit: (d: Driver) => void;
  onToggleStatus: (d: Driver) => void;
  onViewHistory: (d: Driver) => void;
  onDelete: (d: Driver) => void;
}) {
  const statusConfig = STATUS_CONFIG[driver.status];
  const StatusIcon = statusConfig.icon;
  const driverName = driver.user?.name || 'Driver';
  const driverPhone = driver.user?.phone || '-';
  const initials = getInitials(driverName);
  const avatarColor = getAvatarColor(driver.id);

  const isExpiringSoon = driver.licenseExpiry && (() => {
    const expiry = new Date(driver.licenseExpiry);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days < 90 && days > 0;
  })();

  const isExpired = driver.licenseExpiry && new Date(driver.licenseExpiry) <= new Date();

  return (
    <motion.div
      variants={itemVariants}
      className="group"
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <CardContent className="p-5">
          <div className="flex flex-col items-center text-center space-y-3">
            {/* Avatar */}
            <div className={`relative`}>
              <div className={`h-16 w-16 rounded-full ${avatarColor} flex items-center justify-center text-white text-lg font-bold shadow-md`}>
                {initials}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
                driver.status === 'ONLINE'
                  ? 'bg-emerald-500'
                  : driver.status === 'BUSY'
                    ? 'bg-orange-500'
                    : 'bg-gray-400'
              }`} />
            </div>

            {/* Name */}
            <div>
              <h3 className="text-base font-bold text-foreground">{driverName}</h3>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{driverPhone}</p>
              </div>
            </div>

            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-0.5 rounded-full border ${statusConfig.className}`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>

            {/* Rating & Trips */}
            <div className="flex items-center gap-4">
              <StarRating rating={driver.rating} />
              <span className="text-xs text-muted-foreground">
                {driver.totalTrips} trip
              </span>
            </div>

            <Separator />

            {/* License Info */}
            <div className="w-full space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Nomor SIM
                </span>
                <span className="font-mono font-medium">{driver.licenseNumber}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Berlaku
                </span>
                <span className={`font-medium ${
                  isExpired
                    ? 'text-red-600 dark:text-red-400'
                    : isExpiringSoon
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-foreground'
                }`}>
                  {driver.licenseExpiry ? formatDate(driver.licenseExpiry) : '-'}
                  {isExpired && ' (Kadaluarsa)'}
                  {isExpiringSoon && !isExpired && ' (Segera)'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-4 gap-1.5 pt-2 w-full">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] px-0"
                onClick={() => onEdit(driver)}
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="sr-only sm:not-sr-only">Edit</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] px-0"
                onClick={() => onToggleStatus(driver)}
              >
                {driver.status === 'ONLINE' ? (
                  <ToggleRight className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span className="sr-only sm:not-sr-only">Status</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] px-0"
                onClick={() => onViewHistory(driver)}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="sr-only sm:not-sr-only">Riwayat</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] px-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(driver)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="sr-only sm:not-sr-only">Hapus</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Add/Edit Driver Dialog ──────────────────────────────────────────

function DriverFormDialog({
  open,
  onOpenChange,
  driver,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver: Driver | null;
  onSubmit: (data: DriverFormData) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<DriverFormData>(() => driver ? driverToForm(driver) : emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = !!driver;

  const setField = useCallback(
    <K extends keyof DriverFormData>(key: K, value: DriverFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    [],
  );

  const handleSubmit = () => {
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Driver' : 'Tambah Driver Baru'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Perbarui informasi driver yang sudah ada.'
              : 'Isi data driver baru untuk ditambahkan.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nama */}
          <div className="space-y-1.5">
            <Label htmlFor="driver-name">Nama <span className="text-destructive">*</span></Label>
            <Input
              id="driver-name"
              placeholder="Ahmad Hidayat"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="driver-email">Email <span className="text-destructive">*</span></Label>
            <Input
              id="driver-email"
              type="email"
              placeholder="ahmad@quatrans.id"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {/* Nomor HP */}
          <div className="space-y-1.5">
            <Label htmlFor="driver-phone">Nomor HP <span className="text-destructive">*</span></Label>
            <Input
              id="driver-phone"
              placeholder="081234567890"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <Separator />

          {/* Nomor SIM */}
          <div className="space-y-1.5">
            <Label htmlFor="driver-license">Nomor SIM <span className="text-destructive">*</span></Label>
            <Input
              id="driver-license"
              placeholder="B 1234 5678 9012"
              value={form.licenseNumber}
              onChange={(e) => setField('licenseNumber', e.target.value)}
              aria-invalid={!!errors.licenseNumber}
              className="uppercase"
            />
            {errors.licenseNumber && <p className="text-xs text-destructive">{errors.licenseNumber}</p>}
          </div>

          {/* Masa Berlaku SIM */}
          <div className="space-y-1.5">
            <Label htmlFor="driver-expiry">Masa Berlaku SIM <span className="text-destructive">*</span></Label>
            <Input
              id="driver-expiry"
              type="date"
              value={form.licenseExpiry}
              onChange={(e) => setField('licenseExpiry', e.target.value)}
              aria-invalid={!!errors.licenseExpiry}
            />
            {errors.licenseExpiry && <p className="text-xs text-destructive">{errors.licenseExpiry}</p>}
          </div>

          {/* Alamat */}
          <div className="space-y-1.5">
            <Label htmlFor="driver-address">Alamat</Label>
            <Textarea
              id="driver-address"
              placeholder="Jl. Merdeka No. 45, Jakarta Selatan"
              value={form.address}
              onChange={(e) => setField('address', e.target.value)}
              rows={2}
            />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setField('status', v as DriverStatus)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONLINE">Online</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
                <SelectItem value="BUSY">Sibuk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading
              ? isEditing ? 'Menyimpan...' : 'Menambahkan...'
              : isEditing ? 'Simpan Perubahan' : 'Tambah Driver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Driver History Dialog ───────────────────────────────────────────

function DriverHistoryDialog({
  driver,
  open,
  onOpenChange,
}: {
  driver: Driver | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!driver) return null;

  const driverName = driver.user?.name || 'Driver';
  const initials = getInitials(driverName);
  const avatarColor = getAvatarColor(driver.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Riwayat Driver</DialogTitle>
          <DialogDescription>
            Informasi lengkap dan riwayat driver
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Driver header */}
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-full ${avatarColor} flex items-center justify-center text-white text-base font-bold shrink-0`}>
              {initials}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{driverName}</h3>
              <p className="text-xs text-muted-foreground">{driver.user?.email}</p>
              <p className="text-xs text-muted-foreground">{driver.user?.phone}</p>
            </div>
          </div>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{driver.totalTrips}</p>
              <p className="text-xs text-muted-foreground">Total Trip</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <p className="text-2xl font-bold text-foreground">{driver.rating.toFixed(1)}</p>
              </div>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                Nomor SIM
              </span>
              <span className="font-mono font-medium">{driver.licenseNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Masa Berlaku SIM</span>
              <span className="font-medium">{driver.licenseExpiry ? formatDate(driver.licenseExpiry) : '-'}</span>
            </div>
            {driver.address && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Alamat
                </span>
                <span className="font-medium text-right text-xs max-w-[200px]">{driver.address}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${STATUS_CONFIG[driver.status].className}`}>
                {STATUS_CONFIG[driver.status].label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bergabung</span>
              <span className="font-medium">{formatDate(driver.createdAt)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Drivers View ───────────────────────────────────────────────

export function DriversView() {
  const { drivers: storeDrivers, setDrivers } = useAppStore();

  // Local state
  const [drivers, setLocalDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DriverStatus | 'ALL'>('ALL');

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // ── Fetch drivers ─────────────────────────────────────────────
  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/drivers?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Gagal memuat data driver');
      }

      const data = json.data || [];
      setLocalDrivers(data);
      setDrivers(data);
    } catch {
      const message = 'Gagal memuat data driver';
      setFetchError(message);
      // Use mock data as fallback
      const mockData = getMockDrivers();
      setLocalDrivers(mockData);
      setDrivers(mockData);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, setDrivers]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // ── Create driver ────────────────────────────────────────────
  const handleCreate = useCallback(
    async (data: DriverFormData) => {
      setFormLoading(true);
      try {
        const res = await fetch('/api/drivers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'temp-user-' + Date.now(),
            licenseNumber: data.licenseNumber.trim(),
            licenseExpiry: data.licenseExpiry,
            address: data.address.trim() || null,
            status: data.status,
          }),
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Gagal menambah driver');
        }

        toast.success(`Driver ${data.name} berhasil ditambahkan`);
        setFormOpen(false);
        fetchDrivers();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal menambah driver';
        toast.error(message);
      } finally {
        setFormLoading(false);
      }
    },
    [fetchDrivers],
  );

  // ── Update driver ────────────────────────────────────────────
  const handleUpdate = useCallback(
    async (data: DriverFormData) => {
      if (!selectedDriver) return;
      setFormLoading(true);
      try {
        const res = await fetch(`/api/drivers/${selectedDriver.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            licenseNumber: data.licenseNumber.trim(),
            licenseExpiry: data.licenseExpiry,
            address: data.address.trim() || null,
            status: data.status,
          }),
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Gagal memperbarui driver');
        }

        toast.success(`Driver ${data.name} berhasil diperbarui`);
        setFormOpen(false);
        setSelectedDriver(null);
        fetchDrivers();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal memperbarui driver';
        toast.error(message);
      } finally {
        setFormLoading(false);
      }
    },
    [selectedDriver, fetchDrivers],
  );

  // ── Delete driver ────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!selectedDriver) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/drivers/${selectedDriver.id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Gagal menghapus driver');
      }

      toast.success(`Driver ${selectedDriver.user?.name || ''} berhasil dihapus`);
      setDeleteOpen(false);
      setSelectedDriver(null);
      fetchDrivers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus driver';
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  }, [selectedDriver, fetchDrivers]);

  // ── Toggle status ────────────────────────────────────────────
  const handleToggleStatus = useCallback(
    async (driver: Driver) => {
      const newStatus: DriverStatus = driver.status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
      try {
        const res = await fetch(`/api/drivers/${driver.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Gagal mengubah status');
        }

        toast.success(`Status driver ${driver.user?.name || ''} diubah ke ${STATUS_CONFIG[newStatus].label}`);
        fetchDrivers();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal mengubah status';
        toast.error(message);
      }
    },
    [fetchDrivers],
  );

  // ── Open handlers ────────────────────────────────────────────
  const openAddDialog = () => {
    setSelectedDriver(null);
    setFormOpen(true);
  };

  const openEditDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setFormOpen(true);
  };

  const openDeleteDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setDeleteOpen(true);
  };

  const openHistoryDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setHistoryOpen(true);
  };

  // ── Debounced search ─────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const searchTimeout = useMemo(() => {
    let timer: ReturnType<typeof setTimeout>;
    return (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        // Client-side filtering on top of API data
      }, 300);
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    searchTimeout(value);
  };

  // ── Client-side search filter ────────────────────────────────
  const displayDrivers = useMemo(() => {
    if (!searchInput.trim()) return drivers;
    const q = searchInput.toLowerCase();
    return drivers.filter(
      (d) =>
        d.user?.name?.toLowerCase().includes(q) ||
        d.user?.phone?.includes(q) ||
        d.licenseNumber?.toLowerCase().includes(q),
    );
  }, [drivers, searchInput]);

  const handleFormSubmit = (data: DriverFormData) => {
    if (selectedDriver) {
      handleUpdate(data);
    } else {
      handleCreate(data);
    }
  };

  // ── Online/Offline/BUSY counts ───────────────────────────────
  const onlineCount = drivers.filter((d) => d.status === 'ONLINE').length;
  const offlineCount = drivers.filter((d) => d.status === 'OFFLINE').length;
  const busyCount = drivers.filter((d) => d.status === 'BUSY').length;

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Driver</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data sopir Anda
          </p>
        </div>
        <Button onClick={openAddDialog} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Driver
        </Button>
      </motion.div>

      {/* ── Status summary badges ── */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="text-xs">
          <Users className="w-3 h-3 mr-1" />
          Total: {drivers.length}
        </Badge>
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs border border-emerald-200 dark:border-emerald-800">
          Online: {onlineCount}
        </Badge>
        <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800/40 dark:text-gray-400 text-xs border border-gray-200 dark:border-gray-700">
          Offline: {offlineCount}
        </Badge>
        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs border border-orange-200 dark:border-orange-800">
          Sibuk: {busyCount}
        </Badge>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        {/* Status filter */}
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as DriverStatus | 'ALL')}
        >
          <SelectTrigger className="w-full sm:w-[170px]">
            <UserCog className="w-4 h-4 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari nama, nomor HP, atau SIM..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9 w-full"
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Hapus pencarian</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Count ── */}
      <motion.div variants={itemVariants}>
        <p className="text-sm text-muted-foreground">
          Menampilkan <span className="font-semibold text-foreground">{displayDrivers.length}</span> driver
          {searchInput.trim() && ` untuk "${searchInput.trim()}"`}
        </p>
      </motion.div>

      {/* ── Driver Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <DriverCardSkeleton key={i} />
          ))}
        </div>
      ) : fetchError ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <UserCog className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-sm font-medium text-foreground">Gagal memuat data</p>
            <p className="text-xs text-muted-foreground">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchDrivers}>
              Coba Lagi
            </Button>
          </div>
        </Card>
      ) : displayDrivers.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <UserCog className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Tidak ada driver ditemukan</p>
            <p className="text-xs text-muted-foreground">
              {searchInput.trim()
                ? 'Coba ubah kata kunci pencarian.'
                : 'Tambahkan driver baru untuk memulai.'}
            </p>
            {!searchInput.trim() && (
              <Button size="sm" onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-1.5" />
                Tambah Driver
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {displayDrivers.map((driver, index) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              index={index}
              onEdit={openEditDialog}
              onToggleStatus={handleToggleStatus}
              onViewHistory={openHistoryDialog}
              onDelete={openDeleteDialog}
            />
          ))}
        </motion.div>
      )}

      {/* ── Form Dialog ── */}
      <DriverFormDialog
        key={selectedDriver?.id || 'new-driver'}
        open={formOpen}
        onOpenChange={setFormOpen}
        driver={selectedDriver}
        onSubmit={handleFormSubmit}
        loading={formLoading}
      />

      {/* ── Delete Dialog ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus driver{' '}
              <span className="font-semibold text-foreground">
                {selectedDriver?.user?.name || ''}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={formLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={formLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {formLoading ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── History Dialog ── */}
      <DriverHistoryDialog
        driver={selectedDriver}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </motion.div>
  );
}
