'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Crown,
  Star,
  Shield,
  Phone,
  Mail,
  TrendingUp,
  Ban,
  Send,
  Eye,
  Award,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

// ── Types ────────────────────────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  isVerified: boolean;
  createdAt: string;
  _count: { bookings: number; reviews: number };
  totalSpent: number;
  totalRentals: number;
  loyaltyStatus: string;
  loyaltyDiscount: number;
  averageRating: number;
}

interface CustomerDetail extends Customer {
  bookings: Array<{
    id: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    status: string;
    vehicle?: { id: string; brand: string; model: string; plateNumber: string };
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    booking?: { vehicle: { brand: string; model: string } };
  }>;
  stats: {
    totalSpent: number;
    totalRentals: number;
    loyaltyStatus: string;
    loyaltyDiscount: number;
    unreadNotifications: number;
  };
}

// ── Constants ────────────────────────────────────────────────────────

const LOYALTY_TIERS = [
  { name: 'Bronze', minBookings: 0, maxBookings: 4, color: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-400', badgeStyle: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: Shield },
  { name: 'Silver', minBookings: 5, maxBookings: 9, color: 'bg-gray-400', textColor: 'text-gray-600 dark:text-gray-300', badgeStyle: 'bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-300 border-gray-200 dark:border-gray-700', icon: Star },
  { name: 'Gold', minBookings: 10, maxBookings: 19, color: 'bg-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400', badgeStyle: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800', icon: Award },
  { name: 'Platinum', minBookings: 20, maxBookings: Infinity, color: 'bg-purple-500', textColor: 'text-purple-700 dark:text-purple-400', badgeStyle: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200 dark:border-purple-800', icon: Crown },
] as const;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru', sortKey: 'createdAt', sortOrder: 'desc' },
  { value: 'name_az', label: 'Nama A-Z', sortKey: 'name', sortOrder: 'asc' },
  { value: 'most_rentals', label: 'Paling Banyak Sewa', sortKey: 'name', sortOrder: 'asc' },
] as const;

const BOOKING_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Menunggu',
  CONFIRMED: 'Dikonfirmasi',
  ACTIVE: 'Aktif',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
};

const BOOKING_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  COMPLETED: 'bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800',
};

// ── Helpers ──────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-pink-500',
    'bg-violet-500',
    'bg-fuchsia-500',
    'bg-lime-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getLoyaltyTier(status: string) {
  return LOYALTY_TIERS.find((t) => t.name === status) || LOYALTY_TIERS[0];
}

function getLoyaltyProgress(totalRentals: number): { current: number; next: number; percentage: number; tier: string } {
  if (totalRentals >= 20) return { current: 20, next: 20, percentage: 100, tier: 'Platinum' };
  if (totalRentals >= 10) return { current: totalRentals, next: 20, percentage: ((totalRentals - 10) / 10) * 100, tier: 'Gold' };
  if (totalRentals >= 5) return { current: totalRentals, next: 10, percentage: ((totalRentals - 5) / 5) * 100, tier: 'Silver' };
  return { current: totalRentals, next: 5, percentage: (totalRentals / 5) * 100, tier: 'Bronze' };
}

// ── Mock data fallback ───────────────────────────────────────────────

const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Budi Santoso', email: 'budi@gmail.com', phone: '081234567890', avatar: null, isVerified: true, createdAt: '2025-01-15T08:00:00Z', _count: { bookings: 8, reviews: 3 }, totalSpent: 15000000, totalRentals: 8, loyaltyStatus: 'Gold', loyaltyDiscount: 10, averageRating: 4.5 },
  { id: 'c2', name: 'Siti Rahayu', email: 'siti@yahoo.com', phone: '082345678901', avatar: null, isVerified: true, createdAt: '2025-03-20T10:00:00Z', _count: { bookings: 3, reviews: 1 }, totalSpent: 4500000, totalRentals: 3, loyaltyStatus: 'Silver', loyaltyDiscount: 5, averageRating: 4.0 },
  { id: 'c3', name: 'Ahmad Wijaya', email: 'ahmad@outlook.com', phone: '083456789012', avatar: null, isVerified: true, createdAt: '2025-06-01T07:00:00Z', _count: { bookings: 15, reviews: 7 }, totalSpent: 28000000, totalRentals: 15, loyaltyStatus: 'Platinum', loyaltyDiscount: 15, averageRating: 4.8 },
  { id: 'c4', name: 'Dewi Lestari', email: 'dewi@gmail.com', phone: null, avatar: null, isVerified: false, createdAt: '2025-08-10T12:00:00Z', _count: { bookings: 1, reviews: 0 }, totalSpent: 500000, totalRentals: 1, loyaltyStatus: 'Bronze', loyaltyDiscount: 0, averageRating: 0 },
  { id: 'c5', name: 'Rizky Pratama', email: 'rizky@mail.com', phone: '085678901234', avatar: null, isVerified: true, createdAt: '2024-11-05T09:00:00Z', _count: { bookings: 22, reviews: 10 }, totalSpent: 35000000, totalRentals: 22, loyaltyStatus: 'Platinum', loyaltyDiscount: 15, averageRating: 4.9 },
];

// ── Skeleton loaders ─────────────────────────────────────────────────

function SummaryCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomerRowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-24 mt-1" /></TableCell>
      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
      <TableCell className="hidden sm:table-cell"><Skeleton className="h-4 w-8" /></TableCell>
      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
      <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
      <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
    </TableRow>
  );
}

function CustomerCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Customer Profile Sheet ───────────────────────────────────────────

function CustomerProfileSheet({
  customer,
  open,
  onOpenChange,
}: {
  customer: CustomerDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  if (!customer) return null;

  const tier = getLoyaltyTier(customer.stats.loyaltyStatus);
  const TierIcon = tier.icon;
  const progress = getLoyaltyProgress(customer.stats.totalRentals);
  const nextTier = progress.tier === 'Platinum' ? null : LOYALTY_TIERS.find((t) => t.name === {
    Bronze: 'Silver', Silver: 'Gold', Gold: 'Platinum',
  }[progress.tier]);

  const handleSaveNotes = () => {
    setNotesSaved(true);
    toast.success('Catatan berhasil disimpan');
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const phone = customer.phone ? customer.phone.replace(/^0/, '62') : '';
    if (!phone) {
      toast.error('Nomor telepon pelanggan tidak tersedia');
      return;
    }
    const message = encodeURIComponent(
      `Halo ${customer.name}! 🚗\n\nTerima kasih telah menjadi pelanggan setia Qia Trans Manajemen!\nAnda mendapat diskon ${customer.stats.loyaltyDiscount}% sebagai pelanggan ${customer.stats.loyaltyStatus}.\n\nHubungi kami untuk info lebih lanjut!`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    toast.success('Membuka WhatsApp...');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Profil Pelanggan</SheetTitle>
          <SheetDescription>Detail informasi pelanggan</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className={`text-lg font-bold text-white ${getAvatarColor(customer.name)}`}>
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-foreground">{customer.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {customer.isVerified && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px]">
                    Terverifikasi
                  </Badge>
                )}
                <Badge className={`${tier.badgeStyle} border text-[10px]`}>
                  <TierIcon className="w-3 h-3 mr-1" />
                  {customer.stats.loyaltyStatus}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{customer.email}</span>
            </div>
            {customer.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{customer.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Bergabung {formatDate(customer.createdAt)}</span>
            </div>
          </div>

          <Separator />

          {/* Loyalty Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Status Loyalitas
              </h4>
              <span className="text-xs text-muted-foreground">
                {progress.tier === 'Platinum' ? 'Tingkat Tertinggi' : `${progress.next - progress.current} booking lagi ke ${nextTier?.name}`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {LOYALTY_TIERS.map((t) => {
                const TIcon = t.icon;
                const isActive = t.name === customer.stats.loyaltyStatus;
                const isPast = LOYALTY_TIERS.findIndex((lt) => lt.name === t.name) < LOYALTY_TIERS.findIndex((lt) => lt.name === customer.stats.loyaltyStatus);
                return (
                  <div key={t.name} className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive ? t.color + ' ring-2 ring-offset-2 ring-primary' : isPast ? 'bg-muted' : 'bg-muted/50'}`}>
                      <TIcon className={`w-5 h-5 ${isActive ? 'text-white' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/40'}`} />
                    </div>
                    <span className={`text-[10px] font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{t.name}</span>
                  </div>
                );
              })}
            </div>
            {progress.tier !== 'Platinum' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progress.tier} ({progress.current})</span>
                  <span>{nextTier?.name} ({progress.next})</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full rounded-full ${tier.color}`}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <p className="text-xl font-bold text-foreground">{customer.stats.totalRentals}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Sewa</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <p className="text-xl font-bold text-foreground">{customer.averageRating.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rating</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-xl">
              <p className="text-sm font-bold text-foreground">{formatRupiah(customer.stats.totalSpent)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Belanja</p>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Catatan</h4>
            <Textarea
              placeholder="Tambahkan catatan tentang pelanggan ini..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveNotes}
              className="w-full"
              disabled={!notes.trim() || notesSaved}
            >
              {notesSaved ? '✓ Tersimpan' : 'Simpan Catatan'}
            </Button>
          </div>

          <Separator />

          {/* Rental History */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Riwayat Sewa ({customer.bookings.length})</h4>
            {customer.bookings.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Belum ada riwayat sewa</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {customer.bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Car className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {booking.vehicle ? `${booking.vehicle.brand} ${booking.vehicle.model}` : 'Kendaraan'}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge className={`${BOOKING_STATUS_STYLES[booking.status] || ''} border text-[10px]`}>
                        {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatRupiah(booking.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WhatsApp Button */}
          <Button className="w-full" onClick={handleSendWhatsApp}>
            <Send className="w-4 h-4 mr-2" />
            Kirim Promo WhatsApp
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Placeholder Car icon for sheet
function Car({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

// ── Main Customers View ──────────────────────────────────────────────

export function CustomersView() {
  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [blacklistOpen, setBlacklistOpen] = useState(false);
  const [blacklistTarget, setBlacklistTarget] = useState<Customer | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Fetch customers ───────────────────────────────────────────
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const sortOpt = SORT_OPTIONS.find((s) => s.value === sortBy) || SORT_OPTIONS[0];
      const params = new URLSearchParams();
      params.set('sortBy', sortOpt.sortKey);
      params.set('sortOrder', sortOpt.sortOrder);
      params.set('limit', '100');
      if (searchInput.trim()) params.set('search', searchInput.trim());

      const res = await fetch(`/api/customers?${params.toString()}`);
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || 'Gagal memuat data pelanggan');
      }

      let data = json.data || [];
      // Client-side sorting for 'most_rentals' since API doesn't support it
      if (sortBy === 'most_rentals') {
        data.sort((a: Customer, b: Customer) => b.totalRentals - a.totalRentals);
      }
      // Client-side search filter as fallback (API may not find all)
      if (searchInput.trim()) {
        const q = searchInput.trim().toLowerCase();
        data = data.filter(
          (c: Customer) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q)),
        );
      }

      setCustomers(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setFetchError(message);
      // Use mock data as fallback
      let mockData = [...MOCK_CUSTOMERS];
      if (searchInput.trim()) {
        const q = searchInput.trim().toLowerCase();
        mockData = mockData.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.phone && c.phone.includes(q)),
        );
      }
      if (sortBy === 'most_rentals') {
        mockData.sort((a, b) => b.totalRentals - a.totalRentals);
      }
      setCustomers(mockData);
    } finally {
      setLoading(false);
    }
  }, [searchInput, sortBy]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Debounced search
  const debounceTimer = useMemo(() => {
    let timer: ReturnType<typeof setTimeout>;
    return (value: string) => {
      clearTimeout(timer);
      timer = setTimeout(() => setSearchInput(value), 300);
    };
  }, []);

  const [localSearch, setLocalSearch] = useState('');
  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    debounceTimer(value);
  };

  // ── Profile detail fetch ──────────────────────────────────────
  const handleViewProfile = useCallback(async (customer: Customer) => {
    setProfileLoading(true);
    setProfileOpen(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`);
      const json = await res.json();
      if (json.success) {
        setSelectedCustomer(json.data);
      } else {
        // Create a detail-like object from list data
        setSelectedCustomer({
          ...customer,
          bookings: [],
          reviews: [],
          stats: {
            totalSpent: customer.totalSpent,
            totalRentals: customer.totalRentals,
            loyaltyStatus: customer.loyaltyStatus,
            loyaltyDiscount: customer.loyaltyDiscount,
            unreadNotifications: 0,
          },
        });
      }
    } catch {
      setSelectedCustomer({
        ...customer,
        bookings: [],
        reviews: [],
        stats: {
          totalSpent: customer.totalSpent,
          totalRentals: customer.totalRentals,
          loyaltyStatus: customer.loyaltyStatus,
          loyaltyDiscount: customer.loyaltyDiscount,
          unreadNotifications: 0,
        },
      });
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // ── Blacklist handler ─────────────────────────────────────────
  const handleBlacklist = () => {
    if (!blacklistTarget) return;
    toast.success(`${blacklistTarget.name} telah ditambahkan ke blacklist`);
    setBlacklistOpen(false);
    setBlacklistTarget(null);
  };

  // ── Send promo handler ────────────────────────────────────────
  const handleSendPromo = (customer: Customer) => {
    const phone = customer.phone ? customer.phone.replace(/^0/, '62') : '';
    if (!phone) {
      toast.error('Nomor telepon pelanggan tidak tersedia');
      return;
    }
    const message = encodeURIComponent(
      `Halo ${customer.name}! 🎉\n\nAnda mendapatkan promo spesial dari Qia Trans Manajemen!\nDiskon ${customer.loyaltyDiscount}% untuk sewa selanjutnya.\n\nSegera hubungi kami!`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    toast.success('Membuka WhatsApp untuk mengirim promo...');
  };

  // ── Computed summary stats ────────────────────────────────────
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.isVerified).length;
  const loyalCustomers = customers.filter((c) => c.loyaltyStatus === 'Gold' || c.loyaltyStatus === 'Platinum').length;
  const blacklistedCount = customers.filter((c) => !c.isVerified).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">CRM Pelanggan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data pelanggan Anda
          </p>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total Pelanggan</p>
                  <p className="text-xl font-bold text-foreground">{totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Pelanggan Aktif</p>
                  <p className="text-xl font-bold text-foreground">{activeCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Pelanggan Loyal</p>
                  <p className="text-xl font-bold text-foreground">{loyalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                  <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Belum Verifikasi</p>
                  <p className="text-xl font-bold text-foreground">{blacklistedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Search & Sort ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari nama, email, atau telepon..."
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9 w-full"
          />
          {localSearch && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Hapus pencarian</span>
            </button>
          )}
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── Customer List ── */}
      {loading ? (
        <>
          {/* Desktop skeleton */}
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Pelanggan</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Sewa</TableHead>
                  <TableHead>Total Belanja</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terakhir Sewa</TableHead>
                  <TableHead className="w-12">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <CustomerRowSkeleton key={i} />
                ))}
              </TableBody>
            </Table>
          </Card>
          {/* Mobile skeleton */}
          <div className="md:hidden space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <CustomerCardSkeleton key={i} />
            ))}
          </div>
        </>
      ) : fetchError ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-destructive" />
            </div>
            <p className="text-sm font-medium text-foreground">Gagal memuat data</p>
            <p className="text-xs text-muted-foreground">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchCustomers}>
              Coba Lagi
            </Button>
          </div>
        </Card>
      ) : customers.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Tidak ada pelanggan ditemukan</p>
            <p className="text-xs text-muted-foreground">
              Coba ubah kata kunci pencarian Anda.
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Sewa</TableHead>
                  <TableHead>Total Belanja</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terakhir Sewa</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer, index) => {
                  const tier = getLoyaltyTier(customer.loyaltyStatus);
                  const TierIcon = tier.icon;
                  return (
                    <motion.tr
                      key={customer.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="hover:bg-muted/50 border-b transition-colors cursor-pointer"
                      onClick={() => handleViewProfile(customer)}
                    >
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`text-xs font-bold text-white ${getAvatarColor(customer.name)}`}>
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">{customer.name}</p>
                          <p className="text-xs text-muted-foreground">{customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          {customer.phone || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-foreground">{customer.totalRentals}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-foreground">{formatRupiah(customer.totalSpent)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${tier.badgeStyle} border text-[11px]`}>
                          <TierIcon className="w-3 h-3 mr-1" />
                          {customer.loyaltyStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`border text-[11px] ${
                            customer.isVerified
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800'
                          }`}
                        >
                          {customer.isVerified ? 'Aktif' : 'Blacklist'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{formatDate(customer.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewProfile(customer);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="sr-only">Lihat profil</span>
                        </Button>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {customers.map((customer, index) => {
              const tier = getLoyaltyTier(customer.loyaltyStatus);
              const TierIcon = tier.icon;
              return (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewProfile(customer)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback className={`text-sm font-bold text-white ${getAvatarColor(customer.name)}`}>
                          {getInitials(customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-foreground truncate">{customer.name}</h3>
                          <Badge className={`${tier.badgeStyle} border text-[10px] shrink-0`}>
                            <TierIcon className="w-2.5 h-2.5 mr-0.5" />
                            {customer.loyaltyStatus}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{customer.email}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {customer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            {customer.averageRating.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-muted-foreground">
                              <span className="font-semibold text-foreground">{customer.totalRentals}</span> sewa
                            </span>
                            <span className="text-muted-foreground">
                              <span className="font-semibold text-foreground">{formatRupiah(customer.totalSpent)}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendPromo(customer);
                              }}
                            >
                              <Send className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewProfile(customer);
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Count Display ── */}
      {!loading && customers.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Menampilkan <span className="font-semibold text-foreground">{customers.length}</span> pelanggan
        </p>
      )}

      {/* ── Customer Profile Sheet ── */}
      <CustomerProfileSheet
        key={selectedCustomer?.id || '_closed'}
        customer={selectedCustomer}
        open={profileOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCustomer(null);
          }
          setProfileOpen(open);
        }}
      />

      {/* ── Blacklist Dialog ── */}
      <AlertDialog open={blacklistOpen} onOpenChange={setBlacklistOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tambahkan ke Blacklist</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menambahkan <span className="font-semibold text-foreground">{blacklistTarget?.name}</span> ke daftar blacklist?
              Pelanggan yang di-blacklist tidak akan dapat melakukan pemesanan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBlacklistTarget(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlacklist}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Ban className="w-4 h-4 mr-1.5" />
              Blacklist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Profile Loading Overlay ── */}
      {profileLoading && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center">
          <div className="bg-card rounded-xl p-6 shadow-lg flex flex-col items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <p className="text-sm text-muted-foreground">Memuat profil...</p>
          </div>
        </div>
      )}
    </div>
  );
}
