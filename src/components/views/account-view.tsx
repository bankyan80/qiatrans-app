'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Lock,
  Bell,
  Shield,
  Clock,
  Camera,
  Save,
  Eye,
  EyeOff,
  Calendar,
  CheckCircle2,
  LogIn,
  Edit,
  Settings,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

// ── Recent Activity Types ────────────────────────────────────────────

interface Activity {
  id: string;
  action: string;
  description: string;
  time: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const recentActivities: Activity[] = [
  {
    id: '1',
    action: 'Login',
    description: 'Login berhasil dari Chrome di Jakarta',
    time: '5 menit lalu',
    icon: LogIn,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: '2',
    action: 'Edit Profil',
    description: 'Mengubah nomor telepon',
    time: '1 jam lalu',
    icon: Edit,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: '3',
    action: 'Booking Dibuat',
    description: 'Booking baru #BK-005 untuk Sari Dewi',
    time: '3 jam lalu',
    icon: Calendar,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: '4',
    action: 'Pengaturan',
    description: 'Mengubah pengaturan notifikasi',
    time: '1 hari lalu',
    icon: Settings,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: '5',
    action: 'Login',
    description: 'Login berhasil dari Safari di Bandung',
    time: '2 hari lalu',
    icon: LogIn,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: '6',
    action: 'Pembayaran',
    description: 'Pembayaran diterima untuk booking #BK-003',
    time: '3 hari lalu',
    icon: CheckCircle2,
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
];

// ── Main Account View ────────────────────────────────────────────────

export function AccountView() {
  // ── Profile data ──
  const [name, setName] = useState('Admin Rental');
  const [email, setEmail] = useState('admin@quatrans.id');
  const [phone, setPhone] = useState('08123456789');

  // ── Password ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Notifications ──
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [whatsappNotif, setWhatsappNotif] = useState(true);
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);

  // ── Saving states ──
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);

  // ── Edit mode ──
  const [editingProfile, setEditingProfile] = useState(false);

  const handleSaveProfile = () => {
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      setEditingProfile(false);
      toast.success('Profil berhasil diperbarui', {
        description: 'Informasi pribadi Anda telah disimpan.',
      });
    }, 800);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Semua field harus diisi');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password baru minimal 8 karakter');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Password baru dan konfirmasi tidak cocok');
      return;
    }
    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password berhasil diubah', {
        description: 'Gunakan password baru untuk login berikutnya.',
      });
    }, 800);
  };

  const handleSaveNotifications = () => {
    setSavingNotif(true);
    setTimeout(() => {
      setSavingNotif(false);
      toast.success('Preferensi notifikasi disimpan', {
        description: 'Pengaturan notifikasi telah diperbarui.',
      });
    }, 800);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ─── Header ─── */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Akun Saya</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Kelola informasi profil dan keamanan akun Anda</p>
      </motion.div>

      {/* ─── Profile Card ─── */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/80 to-primary/40 relative">
            <div className="absolute -bottom-10 left-4 lg:left-6">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg">
                  <AvatarImage src="" alt="Admin" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                    AR
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-7 w-7 rounded-full shadow-md"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span className="sr-only">Ubah foto</span>
                </Button>
              </div>
            </div>
          </div>
          <CardContent className="pt-12 pb-5 px-4 lg:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-foreground">{name}</h2>
                <p className="text-sm text-muted-foreground">{email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    className="bg-primary/10 text-primary border-primary/20 text-[10px]"
                  >
                    OWNER
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Bergabung sejak Jan 2026
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 mt-2 sm:mt-0"
                onClick={() => setEditingProfile(!editingProfile)}
              >
                <Edit className="w-4 h-4" />
                {editingProfile ? 'Batal' : 'Edit Profil'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Two Column Layout for Desktop ─── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ─── Left Column ─── */}
        <div className="space-y-6">
          {/* ─── Informasi Pribadi ─── */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-1.5">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Informasi Pribadi</CardTitle>
                    <CardDescription className="text-xs">Data profil dan kontak Anda</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profileName">Nama Lengkap</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="profileName"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!editingProfile}
                        className="pl-9"
                        placeholder="Nama lengkap"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profileEmail">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="profileEmail"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!editingProfile}
                        className="pl-9"
                        placeholder="Email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profilePhone">No. Telepon</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="profilePhone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!editingProfile}
                        className="pl-9"
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>
                  {editingProfile && (
                    <Button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="w-full gap-2"
                    >
                      <Save className={`w-4 h-4 ${savingProfile ? 'animate-pulse' : ''}`} />
                      {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Keamanan ─── */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-rose-100 dark:bg-rose-900/30 p-1.5">
                    <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Keamanan</CardTitle>
                    <CardDescription className="text-xs">Ubah password akun Anda</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Password Saat Ini</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pl-9 pr-9"
                        placeholder="••••••••"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Password Baru</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-9 pr-9"
                        placeholder="Minimal 8 karakter"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9 pr-9"
                        placeholder="Ulangi password baru"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={savingPassword}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Shield className={`w-4 h-4 ${savingPassword ? 'animate-pulse' : ''}`} />
                    {savingPassword ? 'Mengubah...' : 'Ubah Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ─── Right Column ─── */}
        <div className="space-y-6">
          {/* ─── Notifikasi ─── */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-1.5">
                      <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Notifikasi</CardTitle>
                      <CardDescription className="text-xs">Preferensi notifikasi Anda</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-[11px] text-muted-foreground">Notifikasi via email</p>
                      </div>
                    </div>
                    <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Push</p>
                        <p className="text-[11px] text-muted-foreground">Notifikasi di browser</p>
                      </div>
                    </div>
                    <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">WhatsApp</p>
                        <p className="text-[11px] text-muted-foreground">Notifikasi via WhatsApp</p>
                      </div>
                    </div>
                    <Switch checked={whatsappNotif} onCheckedChange={setWhatsappNotif} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2.5">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Booking</p>
                        <p className="text-[11px] text-muted-foreground">Pemberitahuan booking baru</p>
                      </div>
                    </div>
                    <Switch checked={bookingAlerts} onCheckedChange={setBookingAlerts} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Pembayaran</p>
                        <p className="text-[11px] text-muted-foreground">Status pembayaran</p>
                      </div>
                    </div>
                    <Switch checked={paymentAlerts} onCheckedChange={setPaymentAlerts} />
                  </div>
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={savingNotif}
                    className="w-full gap-2 mt-2"
                  >
                    <Save className={`w-4 h-4 ${savingNotif ? 'animate-pulse' : ''}`} />
                    {savingNotif ? 'Menyimpan...' : 'Simpan Preferensi'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Aktivitas Terakhir ─── */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-1.5">
                    <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Aktivitas Terakhir</CardTitle>
                    <CardDescription className="text-xs">Riwayat aktivitas akun Anda</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-1">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-accent/50"
                    >
                      <div className={`rounded-lg p-1.5 ${activity.iconBg} shrink-0 mt-0.5`}>
                        <activity.icon className={`w-3.5 h-3.5 ${activity.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {activity.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
