'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  Settings,
  Building2,
  Calendar,
  CreditCard,
  Bell,
  MapPin,
  Palette,
  Database,
  Download,
  Upload,
  Shield,
  Globe,
  Save,
  Smartphone,
  Mail,
  Car,
  DollarSign,
  FileText,
  Trash2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// ── Animation Variants ───────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ── Section Header ───────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  title,
  description,
  iconBg,
  iconColor,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`rounded-lg p-2 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// ── Save Button ──────────────────────────────────────────────────────

function SectionSaveButton({ onSave, loading }: { onSave: () => void; loading: boolean }) {
  return (
    <Button onClick={onSave} disabled={loading} size="sm" className="gap-2">
      <Save className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
      {loading ? 'Menyimpan...' : 'Simpan'}
    </Button>
  );
}

// ── Settings Section Card ────────────────────────────────────────────

function SettingsSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants}>
      <Card className={className}>
        <CardContent className="p-4 lg:p-6">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main Settings View ───────────────────────────────────────────────

export function SettingsView() {
  const { theme, setTheme } = useTheme();

  // ── Company Profile ──
  const [companyName, setCompanyName] = useState('Qua Trans Manajemen');
  const [companyAddress, setCompanyAddress] = useState('Jl. Gatot Subroto No. 123, Jakarta Selatan');
  const [companyPhone, setCompanyPhone] = useState('021-5551234');
  const [companyEmail, setCompanyEmail] = useState('info@quatrans.id');
  const [savingCompany, setSavingCompany] = useState(false);

  // ── Booking Settings ──
  const [minDuration, setMinDuration] = useState('1');
  const [maxDuration, setMaxDuration] = useState('30');
  const [lepasKunci, setLepasKunci] = useState(true);
  const [requireKTP, setRequireKTP] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [dpPercentage, setDpPercentage] = useState('30');
  const [savingBooking, setSavingBooking] = useState(false);

  // ── Payment Settings ──
  const [enableQRIS, setEnableQRIS] = useState(true);
  const [enableBankTransfer, setEnableBankTransfer] = useState(true);
  const [enableEWallet, setEnableEWallet] = useState(true);
  const [enableCash, setEnableCash] = useState(true);
  const [bankName, setBankName] = useState('BCA');
  const [bankAccount, setBankAccount] = useState('1234567890');
  const [bankHolder, setBankHolder] = useState('PT Qua Trans Manajemen Indonesia');
  const [paymentGateway, setPaymentGateway] = useState('midtrans');
  const [savingPayment, setSavingPayment] = useState(false);

  // ── Notification Settings ──
  const [emailNotif, setEmailNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [maintenanceReminder, setMaintenanceReminder] = useState(true);
  const [bookingReminder, setBookingReminder] = useState(true);
  const [savingNotif, setSavingNotif] = useState(false);

  // ── GPS & Tracking ──
  const [enableGPS, setEnableGPS] = useState(true);
  const [geofenceRadius, setGeofenceRadius] = useState('50');
  const [speedLimitAlert, setSpeedLimitAlert] = useState(true);
  const [areaRestriction, setAreaRestriction] = useState(false);
  const [savingGPS, setSavingGPS] = useState(false);

  // ── Appearance ──
  const [language, setLanguage] = useState('id');
  const [currencyFormat, setCurrencyFormat] = useState('id-ID');
  const [savingAppearance, setSavingAppearance] = useState(false);

  // ── Data & Backup ──
  const [exporting, setExporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);

  const handleSave = (section: string, callback: () => Promise<void>) => {
    toast.success(`${section} berhasil disimpan`, {
      description: 'Pengaturan telah diperbarui.',
    });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ─── Header ─── */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Pengaturan</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Konfigurasi aplikasi Qua Trans</p>
        </div>
      </motion.div>

      {/* ─── 1. Profil Perusahaan ─── */}
      <SettingsSection>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeader
            icon={Building2}
            title="Profil Perusahaan"
            description="Informasi dasar perusahaan rental"
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            iconColor="text-blue-600 dark:text-blue-400"
          />
          <SectionSaveButton
            onSave={() => {
              setSavingCompany(true);
              setTimeout(() => {
                setSavingCompany(false);
                handleSave('Profil Perusahaan', async () => {});
              }, 800);
            }}
            loading={savingCompany}
          />
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nama Perusahaan</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nama perusahaan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyEmail">Email</Label>
            <Input
              id="companyEmail"
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              placeholder="email@perusahaan.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyPhone">Telepon</Label>
            <Input
              id="companyPhone"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="021-XXXXXXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyLogo">Logo</Label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-primary/10 border-2 border-dashed border-primary/20 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary/40" />
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Upload className="w-4 h-4" />
                Upload Logo
              </Button>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-2">
            <Label htmlFor="companyAddress">Alamat</Label>
            <Textarea
              id="companyAddress"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="Alamat lengkap perusahaan"
              rows={2}
            />
          </div>
        </div>
      </SettingsSection>

      {/* ─── 2. Pengaturan Booking ─── */}
      <SettingsSection>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeader
            icon={Calendar}
            title="Pengaturan Booking"
            description="Aturan dan konfigurasi pemesanan"
            iconBg="bg-emerald-100 dark:bg-emerald-900/30"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
          <SectionSaveButton
            onSave={() => {
              setSavingBooking(true);
              setTimeout(() => {
                setSavingBooking(false);
                handleSave('Pengaturan Booking', async () => {});
              }, 800);
            }}
            loading={savingBooking}
          />
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>Durasi Minimal Sewa</Label>
            <Select value={minDuration} onValueChange={setMinDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Hari</SelectItem>
                <SelectItem value="2">2 Hari</SelectItem>
                <SelectItem value="3">3 Hari</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Durasi Maksimal Sewa</Label>
            <Select value={maxDuration} onValueChange={setMaxDuration}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 Hari</SelectItem>
                <SelectItem value="60">60 Hari</SelectItem>
                <SelectItem value="90">90 Hari</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dpPercentage">DP Minimum (%)</Label>
            <Input
              id="dpPercentage"
              type="number"
              min={0}
              max={100}
              value={dpPercentage}
              onChange={(e) => setDpPercentage(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <Car className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Lepas Kunci</p>
                <p className="text-[11px] text-muted-foreground">Izinkan sewa tanpa supir</p>
              </div>
            </div>
            <Switch checked={lepasKunci} onCheckedChange={setLepasKunci} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Upload KTP/SIM</p>
                <p className="text-[11px] text-muted-foreground">Wajib upload dokumen</p>
              </div>
            </div>
            <Switch checked={requireKTP} onCheckedChange={setRequireKTP} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Auto-Approve</p>
                <p className="text-[11px] text-muted-foreground">Setujui booking otomatis</p>
              </div>
            </div>
            <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
          </div>
        </div>
      </SettingsSection>

      {/* ─── 3. Pengaturan Pembayaran ─── */}
      <SettingsSection>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeader
            icon={CreditCard}
            title="Pengaturan Pembayaran"
            description="Metode pembayaran dan gateway"
            iconBg="bg-purple-100 dark:bg-purple-900/30"
            iconColor="text-purple-600 dark:text-purple-400"
          />
          <SectionSaveButton
            onSave={() => {
              setSavingPayment(true);
              setTimeout(() => {
                setSavingPayment(false);
                handleSave('Pengaturan Pembayaran', async () => {});
              }, 800);
            }}
            loading={savingPayment}
          />
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>Payment Gateway</Label>
            <Select value={paymentGateway} onValueChange={setPaymentGateway}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="midtrans">Midtrans</SelectItem>
                <SelectItem value="xendit">Xendit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankName">Nama Bank</Label>
            <Input
              id="bankName"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Nama bank"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccount">Nomor Rekening</Label>
            <Input
              id="bankAccount"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              placeholder="Nomor rekening"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankHolder">Nama Pemilik Rekening</Label>
            <Input
              id="bankHolder"
              value={bankHolder}
              onChange={(e) => setBankHolder(e.target.value)}
              placeholder="Nama pemilik"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">QRIS</p>
                <p className="text-[11px] text-muted-foreground">Pembayaran QR</p>
              </div>
            </div>
            <Switch checked={enableQRIS} onCheckedChange={setEnableQRIS} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Transfer Bank</p>
                <p className="text-[11px] text-muted-foreground">BCA, BNI, dll</p>
              </div>
            </div>
            <Switch checked={enableBankTransfer} onCheckedChange={setEnableBankTransfer} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">E-Wallet</p>
                <p className="text-[11px] text-muted-foreground">GoPay, OVO, dll</p>
              </div>
            </div>
            <Switch checked={enableEWallet} onCheckedChange={setEnableEWallet} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Cash</p>
                <p className="text-[11px] text-muted-foreground">Bayar tunai</p>
              </div>
            </div>
            <Switch checked={enableCash} onCheckedChange={setEnableCash} />
          </div>
        </div>
      </SettingsSection>

      {/* ─── 4. Notifikasi ─── */}
      <SettingsSection>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeader
            icon={Bell}
            title="Notifikasi"
            description="Pengaturan notifikasi aplikasi"
            iconBg="bg-amber-100 dark:bg-amber-900/30"
            iconColor="text-amber-600 dark:text-amber-400"
          />
          <SectionSaveButton
            onSave={() => {
              setSavingNotif(true);
              setTimeout(() => {
                setSavingNotif(false);
                handleSave('Pengaturan Notifikasi', async () => {});
              }, 800);
            }}
            loading={savingNotif}
          />
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email Notifikasi</p>
                <p className="text-[11px] text-muted-foreground">Kirim notifikasi via email</p>
              </div>
            </div>
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">WhatsApp Notifikasi</p>
                <p className="text-[11px] text-muted-foreground">Kirim via WhatsApp</p>
              </div>
            </div>
            <Switch checked={whatsappNotif} onCheckedChange={setWhatsappNotif} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Push Notifikasi</p>
                <p className="text-[11px] text-muted-foreground">Notifikasi di browser/mobile</p>
              </div>
            </div>
            <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Pengingat Servis</p>
                <p className="text-[11px] text-muted-foreground">Reminder jadwal maintenance</p>
              </div>
            </div>
            <Switch checked={maintenanceReminder} onCheckedChange={setMaintenanceReminder} />
          </div>
          <div className="lg:col-span-2 flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Pengingat Booking</p>
                <p className="text-[11px] text-muted-foreground">Reminder untuk booking yang akan datang</p>
              </div>
            </div>
            <Switch checked={bookingReminder} onCheckedChange={setBookingReminder} />
          </div>
        </div>
      </SettingsSection>

      {/* ─── 5. GPS & Tracking ─── */}
      <SettingsSection>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeader
            icon={MapPin}
            title="GPS & Tracking"
            description="Pengaturan pelacakan kendaraan"
            iconBg="bg-rose-100 dark:bg-rose-900/30"
            iconColor="text-rose-600 dark:text-rose-400"
          />
          <SectionSaveButton
            onSave={() => {
              setSavingGPS(true);
              setTimeout(() => {
                setSavingGPS(false);
                handleSave('GPS & Tracking', async () => {});
              }, 800);
            }}
            loading={savingGPS}
          />
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="geofenceRadius">Radius Geofence (km)</Label>
            <Input
              id="geofenceRadius"
              type="number"
              min={1}
              max={200}
              value={geofenceRadius}
              onChange={(e) => setGeofenceRadius(e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-4 lg:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">GPS Tracking</p>
                <p className="text-[11px] text-muted-foreground">Aktifkan pelacakan GPS</p>
              </div>
            </div>
            <Switch checked={enableGPS} onCheckedChange={setEnableGPS} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Speed Limit Alert</p>
                <p className="text-[11px] text-muted-foreground">Peringatan kecepatan</p>
              </div>
            </div>
            <Switch checked={speedLimitAlert} onCheckedChange={setSpeedLimitAlert} />
          </div>
          <div className="lg:col-span-2 flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Area Restriction</p>
                <p className="text-[11px] text-muted-foreground">Peringatan jika keluar area yang ditentukan</p>
              </div>
            </div>
            <Switch checked={areaRestriction} onCheckedChange={setAreaRestriction} />
          </div>
        </div>
      </SettingsSection>

      {/* ─── 6. Tampilan ─── */}
      <SettingsSection>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <SectionHeader
            icon={Palette}
            title="Tampilan"
            description="Preferensi tampilan aplikasi"
            iconBg="bg-indigo-100 dark:bg-indigo-900/30"
            iconColor="text-indigo-600 dark:text-indigo-400"
          />
          <SectionSaveButton
            onSave={() => {
              setSavingAppearance(true);
              setTimeout(() => {
                setSavingAppearance(false);
                handleSave('Pengaturan Tampilan', async () => {});
              }, 800);
            }}
            loading={savingAppearance}
          />
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Tema Gelap</p>
                <p className="text-[11px] text-muted-foreground">Ganti ke mode dark</p>
              </div>
            </div>
            <Switch
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Bahasa</Label>
            </div>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id">Indonesia</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2.5">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Format Mata Uang</Label>
            </div>
            <Select value={currencyFormat} onValueChange={setCurrencyFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="id-ID">IDR (Rp)</SelectItem>
                <SelectItem value="en-US">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      {/* ─── 7. Data & Backup ─── */}
      <SettingsSection className="mb-4">
        <SectionHeader
          icon={Database}
          title="Data & Backup"
          description="Kelola data dan cadangan aplikasi"
          iconBg="bg-teal-100 dark:bg-teal-900/30"
          iconColor="text-teal-600 dark:text-teal-400"
        />
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button
            variant="outline"
            className="h-auto py-3 gap-2 justify-start"
            onClick={() => {
              setExporting(true);
              setTimeout(() => {
                setExporting(false);
                toast.success('Data berhasil diekspor', {
                  description: 'File CSV telah diunduh.',
                });
              }, 1500);
            }}
            disabled={exporting}
          >
            <Download className={`w-4 h-4 ${exporting ? 'animate-pulse' : ''}`} />
            <div className="text-left">
              <p className="text-sm font-medium">Export Data</p>
              <p className="text-[11px] text-muted-foreground">Unduh semua data (CSV)</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 gap-2 justify-start"
            onClick={() => {
              setBackingUp(true);
              setTimeout(() => {
                setBackingUp(false);
                toast.success('Backup berhasil', {
                  description: 'Database telah dicadangkan.',
                });
              }, 2000);
            }}
            disabled={backingUp}
          >
            <Database className={`w-4 h-4 ${backingUp ? 'animate-pulse' : ''}`} />
            <div className="text-left">
              <p className="text-sm font-medium">Backup Database</p>
              <p className="text-[11px] text-muted-foreground">Cadangkan seluruh database</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-3 gap-2 justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400"
            onClick={() => {
              setClearingCache(true);
              setTimeout(() => {
                setClearingCache(false);
                toast.success('Cache berhasil dibersihkan', {
                  description: 'Semua cache telah dihapus.',
                });
              }, 1000);
            }}
            disabled={clearingCache}
          >
            <Trash2 className={`w-4 h-4 ${clearingCache ? 'animate-pulse' : ''}`} />
            <div className="text-left">
              <p className="text-sm font-medium">Clear Cache</p>
              <p className="text-[11px] text-muted-foreground">Hapus cache aplikasi</p>
            </div>
          </Button>
        </div>
      </SettingsSection>
    </motion.div>
  );
}
