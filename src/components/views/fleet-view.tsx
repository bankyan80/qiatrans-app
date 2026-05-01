'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Car,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Fuel,
  Users as UsersIcon,
  Settings2,
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
import type {
  Vehicle,
  VehicleStatus,
  VehicleCategory,
} from '@/lib/types';

// ── Constants ───────────────────────────────────────────────────────

const CATEGORIES: VehicleCategory[] = [
  'SUV', 'SEDAN', 'MPV', 'HATCHBACK', 'VAN', 'PICKUP', 'LUXURY',
];

const STATUSES: Array<{ value: VehicleStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'AVAILABLE', label: 'Tersedia' },
  { value: 'RENTED', label: 'Disewa' },
  { value: 'MAINTENANCE', label: 'Servis' },
  { value: 'OUT_OF_SERVICE', label: 'Nonaktif' },
];

const STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE: 'Tersedia',
  RENTED: 'Disewa',
  MAINTENANCE: 'Servis',
  OUT_OF_SERVICE: 'Nonaktif',
};

const STATUS_STYLES: Record<VehicleStatus, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  RENTED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  MAINTENANCE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  OUT_OF_SERVICE: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
};

const CATEGORY_COLORS: Record<VehicleCategory, { bg: string; gradient: string; badge: string }> = {
  SUV: {
    bg: 'bg-emerald-500',
    gradient: 'from-emerald-400 to-teal-600',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  },
  SEDAN: {
    bg: 'bg-blue-500',
    gradient: 'from-blue-400 to-indigo-600',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  },
  MPV: {
    bg: 'bg-purple-500',
    gradient: 'from-purple-400 to-violet-600',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  },
  HATCHBACK: {
    bg: 'bg-orange-500',
    gradient: 'from-orange-400 to-amber-600',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  },
  VAN: {
    bg: 'bg-teal-500',
    gradient: 'from-teal-400 to-cyan-600',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400 border-teal-200 dark:border-teal-800',
  },
  PICKUP: {
    bg: 'bg-amber-500',
    gradient: 'from-amber-400 to-yellow-600',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  },
  LUXURY: {
    bg: 'bg-rose-500',
    gradient: 'from-rose-400 to-pink-600',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
  },
};

function formatRupiah(amount: number | null | undefined): string {
  if (amount == null) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Form data shape ─────────────────────────────────────────────────

interface VehicleFormData {
  brand: string;
  model: string;
  year: string;
  color: string;
  plateNumber: string;
  category: VehicleCategory;
  dailyRate: string;
  weeklyRate: string;
  monthlyRate: string;
  fuelType: string;
  transmission: string;
  seats: string;
  notes: string;
  status: VehicleStatus;
}

const emptyForm: VehicleFormData = {
  brand: '',
  model: '',
  year: new Date().getFullYear().toString(),
  color: '',
  plateNumber: '',
  category: 'SUV',
  dailyRate: '',
  weeklyRate: '',
  monthlyRate: '',
  fuelType: 'BENSIN',
  transmission: 'AUTOMATIC',
  seats: '5',
  notes: '',
  status: 'AVAILABLE',
};

function vehicleToForm(v: Vehicle): VehicleFormData {
  return {
    brand: v.brand,
    model: v.model,
    year: v.year.toString(),
    color: v.color || '',
    plateNumber: v.plateNumber,
    category: v.category,
    dailyRate: v.dailyRate.toString(),
    weeklyRate: v.weeklyRate?.toString() || '',
    monthlyRate: v.monthlyRate?.toString() || '',
    fuelType: v.fuelType || 'BENSIN',
    transmission: v.transmission || 'AUTOMATIC',
    seats: v.seats?.toString() || '5',
    notes: v.notes || '',
    status: v.status,
  };
}

// ── Validation ──────────────────────────────────────────────────────

function validateForm(form: VehicleFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.brand.trim()) errors.brand = 'Merk wajib diisi';
  if (!form.model.trim()) errors.model = 'Tipe/Model wajib diisi';
  if (!form.plateNumber.trim()) {
    errors.plateNumber = 'Nomor polisi wajib diisi';
  } else if (form.plateNumber.trim().length < 3) {
    errors.plateNumber = 'Nomor polisi minimal 3 karakter';
  }
  if (!form.year.trim()) {
    errors.year = 'Tahun wajib diisi';
  } else {
    const y = parseInt(form.year, 10);
    if (isNaN(y) || y < 1900 || y > new Date().getFullYear() + 2) {
      errors.year = 'Tahun tidak valid';
    }
  }
  if (!form.dailyRate.trim()) {
    errors.dailyRate = 'Tarif harian wajib diisi';
  } else {
    const r = parseFloat(form.dailyRate);
    if (isNaN(r) || r <= 0) errors.dailyRate = 'Tarif harus berupa angka positif';
  }
  if (form.weeklyRate.trim()) {
    const r = parseFloat(form.weeklyRate);
    if (isNaN(r) || r <= 0) errors.weeklyRate = 'Tarif harus berupa angka positif';
  }
  if (form.monthlyRate.trim()) {
    const r = parseFloat(form.monthlyRate);
    if (isNaN(r) || r <= 0) errors.monthlyRate = 'Tarif harus berupa angka positif';
  }

  return errors;
}

// ── Skeleton loader ─────────────────────────────────────────────────

function VehicleCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Separator />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Vehicle card ────────────────────────────────────────────────────

function VehicleCard({
  vehicle,
  onEdit,
  onDelete,
  onStatusChange,
  index,
}: {
  vehicle: Vehicle;
  onEdit: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
  onStatusChange: (v: Vehicle) => void;
  index: number;
}) {
  const catColor = CATEGORY_COLORS[vehicle.category] || CATEGORY_COLORS.SUV;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' as const }}
      className="group"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
        {/* Image placeholder */}
        <div className={`relative h-40 bg-gradient-to-br ${catColor.gradient} flex items-center justify-center overflow-hidden`}>
          <Car className="w-16 h-16 text-white/30" strokeWidth={1.2} />
          <div className="absolute top-3 left-3">
            <Badge className={`${catColor.badge} border text-[11px] font-semibold`}>
              {vehicle.category}
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <Badge className={`${STATUS_STYLES[vehicle.status]} border text-[11px] font-semibold`}>
              {STATUS_LABELS[vehicle.status]}
            </Badge>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <p className="text-white font-bold text-lg drop-shadow-md leading-tight">
              {vehicle.brand} {vehicle.model}
            </p>
            <p className="text-white/90 text-xs font-semibold bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-md">
              {vehicle.plateNumber}
            </p>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Info badges */}
          <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            {vehicle.year && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted">
                {vehicle.year}
              </span>
            )}
            {vehicle.color && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-muted-foreground/30 shrink-0"
                  style={{ backgroundColor: vehicle.color }}
                />
                {vehicle.color}
              </span>
            )}
            {vehicle.transmission && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted">
                <Settings2 className="w-3 h-3" />
                {vehicle.transmission}
              </span>
            )}
            {vehicle.seats && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted">
                <UsersIcon className="w-3 h-3" />
                {vehicle.seats} kursi
              </span>
            )}
            {vehicle.fuelType && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted">
                <Fuel className="w-3 h-3" />
                {vehicle.fuelType}
              </span>
            )}
          </div>

          <Separator />

          {/* Rates */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Harian</p>
              <p className="text-xs font-semibold text-foreground truncate">{formatRupiah(vehicle.dailyRate)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Mingguan</p>
              <p className="text-xs font-semibold text-foreground truncate">{formatRupiah(vehicle.weeklyRate)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Bulanan</p>
              <p className="text-xs font-semibold text-foreground truncate">{formatRupiah(vehicle.monthlyRate)}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onEdit(vehicle)}
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8 text-xs"
              onClick={() => onStatusChange(vehicle)}
            >
              <Settings2 className="w-3.5 h-3.5 mr-1.5" />
              Status
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
              onClick={() => onDelete(vehicle)}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="sr-only">Hapus kendaraan</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Status change dialog ────────────────────────────────────────────

function StatusChangeDialog({
  vehicle,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string, status: VehicleStatus) => void;
  loading: boolean;
}) {
  const [status, setStatus] = useState<VehicleStatus>(() => vehicle?.status ?? 'AVAILABLE');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ubah Status Kendaraan</DialogTitle>
          <DialogDescription>
            {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plateNumber})` : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as VehicleStatus)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AVAILABLE">Tersedia</SelectItem>
              <SelectItem value="RENTED">Disewa</SelectItem>
              <SelectItem value="MAINTENANCE">Servis</SelectItem>
              <SelectItem value="OUT_OF_SERVICE">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={() => vehicle && onConfirm(vehicle.id, status)} disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add/Edit Vehicle Dialog ─────────────────────────────────────────

function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  onSubmit: (data: VehicleFormData) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<VehicleFormData>(() => vehicle ? vehicleToForm(vehicle) : emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = !!vehicle;

  const setField = useCallback(
    <K extends keyof VehicleFormData>(key: K, value: VehicleFormData[K]) => {
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Perbarui informasi kendaraan yang sudah ada.'
              : 'Isi data kendaraan baru untuk ditambahkan ke armada.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          {/* Merk */}
          <div className="space-y-1.5">
            <Label htmlFor="brand">Merk <span className="text-destructive">*</span></Label>
            <Input
              id="brand"
              placeholder="Toyota"
              value={form.brand}
              onChange={(e) => setField('brand', e.target.value)}
              aria-invalid={!!errors.brand}
            />
            {errors.brand && <p className="text-xs text-destructive">{errors.brand}</p>}
          </div>

          {/* Tipe/Model */}
          <div className="space-y-1.5">
            <Label htmlFor="model">Tipe/Model <span className="text-destructive">*</span></Label>
            <Input
              id="model"
              placeholder="Avanza"
              value={form.model}
              onChange={(e) => setField('model', e.target.value)}
              aria-invalid={!!errors.model}
            />
            {errors.model && <p className="text-xs text-destructive">{errors.model}</p>}
          </div>

          {/* Tahun */}
          <div className="space-y-1.5">
            <Label htmlFor="year">Tahun <span className="text-destructive">*</span></Label>
            <Input
              id="year"
              type="number"
              placeholder="2024"
              value={form.year}
              onChange={(e) => setField('year', e.target.value)}
              aria-invalid={!!errors.year}
            />
            {errors.year && <p className="text-xs text-destructive">{errors.year}</p>}
          </div>

          {/* Warna */}
          <div className="space-y-1.5">
            <Label htmlFor="color">Warna</Label>
            <Input
              id="color"
              placeholder="Hitam"
              value={form.color}
              onChange={(e) => setField('color', e.target.value)}
            />
          </div>

          {/* Nomor Polisi */}
          <div className="space-y-1.5">
            <Label htmlFor="plateNumber">Nomor Polisi <span className="text-destructive">*</span></Label>
            <Input
              id="plateNumber"
              placeholder="B 1234 ABC"
              value={form.plateNumber}
              onChange={(e) => setField('plateNumber', e.target.value)}
              aria-invalid={!!errors.plateNumber}
              className="uppercase"
            />
            {errors.plateNumber && <p className="text-xs text-destructive">{errors.plateNumber}</p>}
          </div>

          {/* Kategori */}
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Select value={form.category} onValueChange={(v) => setField('category', v as VehicleCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator className="sm:col-span-2" />

          {/* Tarif Harian */}
          <div className="space-y-1.5">
            <Label htmlFor="dailyRate">Tarif Harian <span className="text-destructive">*</span></Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                Rp
              </span>
              <Input
                id="dailyRate"
                type="number"
                placeholder="350000"
                value={form.dailyRate}
                onChange={(e) => setField('dailyRate', e.target.value)}
                aria-invalid={!!errors.dailyRate}
                className="pl-10"
              />
            </div>
            {errors.dailyRate && <p className="text-xs text-destructive">{errors.dailyRate}</p>}
          </div>

          {/* Tarif Mingguan */}
          <div className="space-y-1.5">
            <Label htmlFor="weeklyRate">Tarif Mingguan</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                Rp
              </span>
              <Input
                id="weeklyRate"
                type="number"
                placeholder="2100000"
                value={form.weeklyRate}
                onChange={(e) => setField('weeklyRate', e.target.value)}
                aria-invalid={!!errors.weeklyRate}
                className="pl-10"
              />
            </div>
            {errors.weeklyRate && <p className="text-xs text-destructive">{errors.weeklyRate}</p>}
          </div>

          {/* Tarif Bulanan */}
          <div className="space-y-1.5">
            <Label htmlFor="monthlyRate">Tarif Bulanan</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                Rp
              </span>
              <Input
                id="monthlyRate"
                type="number"
                placeholder="7500000"
                value={form.monthlyRate}
                onChange={(e) => setField('monthlyRate', e.target.value)}
                aria-invalid={!!errors.monthlyRate}
                className="pl-10"
              />
            </div>
            {errors.monthlyRate && <p className="text-xs text-destructive">{errors.monthlyRate}</p>}
          </div>

          {/* Tipe BBM */}
          <div className="space-y-1.5">
            <Label htmlFor="fuelType">Tipe BBM</Label>
            <Select value={form.fuelType} onValueChange={(v) => setField('fuelType', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih tipe BBM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BENSIN">Bensin</SelectItem>
                <SelectItem value="DIESEL">Diesel</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
                <SelectItem value="ELECTRIC">Electric</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transmisi */}
          <div className="space-y-1.5">
            <Label htmlFor="transmission">Transmisi</Label>
            <Select value={form.transmission} onValueChange={(v) => setField('transmission', v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih transmisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="AUTOMATIC">Automatic</SelectItem>
                <SelectItem value="CVT">CVT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Jumlah Kursi */}
          <div className="space-y-1.5">
            <Label htmlFor="seats">Jumlah Kursi</Label>
            <Input
              id="seats"
              type="number"
              placeholder="5"
              value={form.seats}
              onChange={(e) => setField('seats', e.target.value)}
              min={1}
              max={50}
            />
          </div>

          {/* Status (only for edit) */}
          {isEditing && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setField('status', v as VehicleStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Tersedia</SelectItem>
                  <SelectItem value="RENTED">Disewa</SelectItem>
                  <SelectItem value="MAINTENANCE">Servis</SelectItem>
                  <SelectItem value="OUT_OF_SERVICE">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Catatan */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              placeholder="Catatan tambahan tentang kendaraan..."
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={3}
            />
          </div>
        </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading
              ? isEditing ? 'Menyimpan...' : 'Menambahkan...'
              : isEditing ? 'Simpan Perubahan' : 'Tambah Kendaraan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Fleet View ─────────────────────────────────────────────────

export function FleetView() {
  const { vehicleFilter, setVehicleFilter } = useAppStore();

  // Local state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // ── Fetch vehicles ───────────────────────────────────────────
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams();
      if (vehicleFilter.status !== 'ALL') params.set('status', vehicleFilter.status);
      if (vehicleFilter.category !== 'ALL') params.set('category', vehicleFilter.category);
      if (vehicleFilter.search.trim()) params.set('search', vehicleFilter.search.trim());
      params.set('limit', '100');

      const res = await fetch(`/api/vehicles?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Gagal memuat data kendaraan');
      }

      setVehicles(json.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setFetchError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [vehicleFilter.status, vehicleFilter.category, vehicleFilter.search]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // ── Create vehicle ───────────────────────────────────────────
  const handleCreate = useCallback(
    async (data: VehicleFormData) => {
      setFormLoading(true);
      try {
        const payload = {
          brand: data.brand.trim(),
          model: data.model.trim(),
          year: parseInt(data.year, 10),
          color: data.color.trim() || null,
          plateNumber: data.plateNumber.trim().toUpperCase(),
          category: data.category,
          dailyRate: parseFloat(data.dailyRate),
          weeklyRate: data.weeklyRate ? parseFloat(data.weeklyRate) : null,
          monthlyRate: data.monthlyRate ? parseFloat(data.monthlyRate) : null,
          fuelType: data.fuelType || null,
          transmission: data.transmission || null,
          seats: parseInt(data.seats, 10) || 5,
          notes: data.notes.trim() || null,
          status: 'AVAILABLE' as VehicleStatus,
        };

        const res = await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Gagal menambah kendaraan');
        }

        toast.success(`Kendaraan ${payload.brand} ${payload.model} berhasil ditambahkan`);
        setFormOpen(false);
        fetchVehicles();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal menambah kendaraan';
        toast.error(message);
      } finally {
        setFormLoading(false);
      }
    },
    [fetchVehicles],
  );

  // ── Update vehicle ───────────────────────────────────────────
  const handleUpdate = useCallback(
    async (data: VehicleFormData) => {
      if (!selectedVehicle) return;
      setFormLoading(true);
      try {
        const payload = {
          brand: data.brand.trim(),
          model: data.model.trim(),
          year: parseInt(data.year, 10),
          color: data.color.trim() || null,
          plateNumber: data.plateNumber.trim().toUpperCase(),
          category: data.category,
          dailyRate: parseFloat(data.dailyRate),
          weeklyRate: data.weeklyRate ? parseFloat(data.weeklyRate) : null,
          monthlyRate: data.monthlyRate ? parseFloat(data.monthlyRate) : null,
          fuelType: data.fuelType || null,
          transmission: data.transmission || null,
          seats: parseInt(data.seats, 10) || 5,
          notes: data.notes.trim() || null,
          status: data.status,
        };

        const res = await fetch(`/api/vehicles/${selectedVehicle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Gagal memperbarui kendaraan');
        }

        toast.success(`Kendaraan ${payload.brand} ${payload.model} berhasil diperbarui`);
        setFormOpen(false);
        setSelectedVehicle(null);
        fetchVehicles();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal memperbarui kendaraan';
        toast.error(message);
      } finally {
        setFormLoading(false);
      }
    },
    [selectedVehicle, fetchVehicles],
  );

  // ── Delete vehicle ───────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!selectedVehicle) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${selectedVehicle.id}`, {
        method: 'DELETE',
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Gagal menghapus kendaraan');
      }

      toast.success(`Kendaraan ${selectedVehicle.brand} ${selectedVehicle.model} berhasil dihapus`);
      setDeleteOpen(false);
      setSelectedVehicle(null);
      fetchVehicles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal menghapus kendaraan';
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  }, [selectedVehicle, fetchVehicles]);

  // ── Change status ────────────────────────────────────────────
  const handleStatusChange = useCallback(
    async (id: string, status: VehicleStatus) => {
      setFormLoading(true);
      try {
        const res = await fetch(`/api/vehicles/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        const json = await res.json();
        if (!json.success) {
          throw new Error(json.error || 'Gagal mengubah status');
        }

        toast.success(`Status kendaraan berhasil diubah menjadi ${STATUS_LABELS[status]}`);
        setStatusOpen(false);
        setSelectedVehicle(null);
        fetchVehicles();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal mengubah status';
        toast.error(message);
      } finally {
        setFormLoading(false);
      }
    },
    [fetchVehicles],
  );

  // ── Open handlers ────────────────────────────────────────────
  const openAddDialog = () => {
    setSelectedVehicle(null);
    setFormOpen(true);
  };

  const openEditDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setFormOpen(true);
  };

  const openDeleteDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDeleteOpen(true);
  };

  const openStatusDialog = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setStatusOpen(true);
  };

  // ── Computed ─────────────────────────────────────────────────
  const filteredCount = vehicles.length;

  // Debounced search
  const [searchInput, setSearchInput] = useState(vehicleFilter.search);
  const searchTimeout = useMemo(() => {
    let timer: ReturnType<typeof setTimeout>;
    return (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setVehicleFilter({ ...vehicleFilter, search: value });
      }, 300);
    };
  }, [vehicleFilter, setVehicleFilter]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    searchTimeout(value);
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Armada</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola semua kendaraan rental Anda
          </p>
        </div>
        <Button onClick={openAddDialog} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Mobil
        </Button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status filter */}
        <Select
          value={vehicleFilter.status}
          onValueChange={(v) =>
            setVehicleFilter({ ...vehicleFilter, status: v as VehicleStatus | 'ALL' })
          }
        >
          <SelectTrigger className="w-full sm:w-[170px]">
            <Filter className="w-4 h-4 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Category filter */}
        <Select
          value={vehicleFilter.category}
          onValueChange={(v) =>
            setVehicleFilter({ ...vehicleFilter, category: v as VehicleCategory | 'ALL' })
          }
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Kategori</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari merk, model, atau plat nomor..."
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
      </div>

      {/* ── Count display ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Menampilkan <span className="font-semibold text-foreground">{filteredCount}</span> kendaraan
        </p>
      </div>

      {/* ── Vehicle grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <VehicleCardSkeleton key={i} />
          ))}
        </div>
      ) : fetchError ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Car className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-sm font-medium text-foreground">Gagal memuat data</p>
            <p className="text-xs text-muted-foreground">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchVehicles}>
              Coba Lagi
            </Button>
          </div>
        </Card>
      ) : vehicles.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Car className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Tidak ada kendaraan ditemukan</p>
            <p className="text-xs text-muted-foreground">
              Coba ubah filter atau tambahkan kendaraan baru.
            </p>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Kendaraan
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle, index) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
              onStatusChange={openStatusDialog}
              index={index}
            />
          ))}
        </div>
      )}

      {/* ── Add/Edit Dialog ── */}
      <VehicleFormDialog
        key={selectedVehicle?.id ?? 'new'}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setSelectedVehicle(null);
        }}
        vehicle={selectedVehicle}
        onSubmit={selectedVehicle ? handleUpdate : handleCreate}
        loading={formLoading}
      />

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kendaraan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kendaraan{' '}
              <span className="font-semibold text-foreground">
                {selectedVehicle?.brand} {selectedVehicle?.model}
              </span>{' '}
              ({selectedVehicle?.plateNumber})? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={formLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={formLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {formLoading ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Status Change Dialog ── */}
      <StatusChangeDialog
        key={selectedVehicle?.id ?? 'none'}
        vehicle={selectedVehicle}
        open={statusOpen}
        onOpenChange={(open) => {
          setStatusOpen(open);
          if (!open) setSelectedVehicle(null);
        }}
        onConfirm={handleStatusChange}
        loading={formLoading}
      />
    </div>
  );
}
