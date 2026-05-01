'use client';

import React, { useEffect, useSyncExternalStore, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  CalendarCheck,
  Car,
  Wallet,
  UserCircle,
  UserCog,
  Users,
  MapPin,
  BarChart3,
  Settings,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  Home,
  MessageCircle,
  Send,
  LogOut,
  ChevronRight,
  LogIn,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';
import type { ViewName } from '@/lib/types';
import { BookingView } from '@/components/views/booking-view';
import { CustomersView } from '@/components/views/customers-view';
import { DashboardView } from '@/components/views/dashboard-view';
import { FleetView } from '@/components/views/fleet-view';
import { TrackingView } from '@/components/views/tracking-view';
import { ReportsView } from '@/components/views/reports-view';
import { SettingsView } from '@/components/views/settings-view';
import { AccountView } from '@/components/views/account-view';
import { FinanceView } from '@/components/views/finance-view';
import { DriversView } from '@/components/views/drivers-view';

// ── Menu configuration ──────────────────────────────────────────────

type UserRole = 'OWNER' | 'ADMIN' | 'DRIVER' | 'CUSTOMER' | null;

interface MenuItem {
  label: string;
  view: ViewName;
  icon: React.ElementType;
}

// Admin/Owner: full access
const adminMenuItems: MenuItem[] = [
  { label: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
  { label: 'Booking', view: 'booking', icon: CalendarCheck },
  { label: 'Armada', view: 'fleet', icon: Car },
  { label: 'Keuangan', view: 'finance', icon: Wallet },
  { label: 'Akun', view: 'account', icon: UserCircle },
];

const adminSecondaryItems: MenuItem[] = [
  { label: 'Driver', view: 'drivers', icon: UserCog },
  { label: 'Pelanggan', view: 'customers', icon: Users },
  { label: 'Tracking', view: 'tracking', icon: MapPin },
  { label: 'Laporan', view: 'reports', icon: BarChart3 },
  { label: 'Pengaturan', view: 'settings', icon: Settings },
];

// Customer: limited
const customerMenuItems: MenuItem[] = [
  { label: 'Beranda', view: 'dashboard', icon: LayoutDashboard },
  { label: 'Booking', view: 'booking', icon: CalendarCheck },
  { label: 'Tracking', view: 'tracking', icon: MapPin },
  { label: 'Akun', view: 'account', icon: UserCircle },
];

// Driver: limited
const driverMenuItems: MenuItem[] = [
  { label: 'Beranda', view: 'dashboard', icon: LayoutDashboard },
  { label: 'Booking', view: 'booking', icon: CalendarCheck },
  { label: 'Tracking', view: 'tracking', icon: MapPin },
  { label: 'Akun', view: 'account', icon: UserCircle },
];

// Bottom nav per role
const adminBottomNav: MenuItem[] = [
  { label: 'Beranda', view: 'dashboard', icon: Home },
  { label: 'Booking', view: 'booking', icon: CalendarCheck },
  { label: 'Armada', view: 'fleet', icon: Car },
  { label: 'Keuangan', view: 'finance', icon: Wallet },
  { label: 'Akun', view: 'account', icon: UserCircle },
];

const customerBottomNav: MenuItem[] = [
  { label: 'Beranda', view: 'dashboard', icon: Home },
  { label: 'Booking', view: 'booking', icon: CalendarCheck },
  { label: 'Tracking', view: 'tracking', icon: MapPin },
  { label: 'Akun', view: 'account', icon: UserCircle },
];

const driverBottomNav: MenuItem[] = [
  { label: 'Beranda', view: 'dashboard', icon: Home },
  { label: 'Booking', view: 'booking', icon: CalendarCheck },
  { label: 'Tracking', view: 'tracking', icon: MapPin },
  { label: 'Akun', view: 'account', icon: UserCircle },
];

function getMenuByRole(role: UserRole) {
  if (role === 'OWNER' || role === 'ADMIN') {
    return { primary: adminMenuItems, secondary: adminSecondaryItems, bottom: adminBottomNav };
  }
  if (role === 'CUSTOMER') {
    return { primary: customerMenuItems, secondary: [], bottom: customerBottomNav };
  }
  if (role === 'DRIVER') {
    return { primary: driverMenuItems, secondary: [], bottom: driverBottomNav };
  }
  return { primary: [], secondary: [], bottom: [] };
}

// ── Placeholder view ────────────────────────────────────────────────

const viewLabels: Record<ViewName, string> = {
  dashboard: 'Dashboard',
  booking: 'Booking',
  fleet: 'Armada',
  finance: 'Keuangan',
  account: 'Akun',
  drivers: 'Driver',
  customers: 'Pelanggan',
  tracking: 'Tracking',
  reports: 'Laporan',
  settings: 'Pengaturan',
};

const viewDescriptions: Record<ViewName, string> = {
  dashboard: 'Ringkasan aktivitas bisnis rental Anda',
  booking: 'Kelola pemesanan dan reservasi kendaraan',
  fleet: 'Kelola armada kendaraan Anda',
  finance: 'Pantau keuangan dan pembayaran',
  account: 'Informasi akun dan profil Anda',
  drivers: 'Kelola data driver Anda',
  customers: 'Daftar pelanggan dan statistik mereka',
  tracking: 'Lacak posisi kendaraan secara real-time',
  reports: 'Laporan bisnis dan analitik',
  settings: 'Pengaturan aplikasi',
};

function PlaceholderView({ view }: { view: ViewName }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        {view === 'dashboard' && <LayoutDashboard className="w-8 h-8 text-primary" />}
        {view === 'booking' && <CalendarCheck className="w-8 h-8 text-primary" />}
        {view === 'fleet' && <Car className="w-8 h-8 text-primary" />}
        {view === 'finance' && <Wallet className="w-8 h-8 text-primary" />}
        {view === 'account' && <UserCircle className="w-8 h-8 text-primary" />}
        {view === 'drivers' && <UserCog className="w-8 h-8 text-primary" />}
        {view === 'customers' && <Users className="w-8 h-8 text-primary" />}
        {view === 'tracking' && <MapPin className="w-8 h-8 text-primary" />}
        {view === 'reports' && <BarChart3 className="w-8 h-8 text-primary" />}
        {view === 'settings' && <Settings className="w-8 h-8 text-primary" />}
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">{viewLabels[view]}</h2>
      <p className="text-muted-foreground max-w-sm">{viewDescriptions[view]}</p>
      <Badge variant="secondary" className="mt-4">
        Segera Hadir
      </Badge>
    </div>
  );
}

// ── Notification icon ───────────────────────────────────────────────

function NotificationIcon({ type }: { type: string }) {
  const iconClass = 'w-4 h-4 text-muted-foreground';
  switch (type) {
    case 'BOOKING': return <CalendarCheck className={iconClass} />;
    case 'PAYMENT': return <Wallet className={iconClass} />;
    case 'MAINTENANCE': return <Settings className={iconClass} />;
    default: return <Bell className={iconClass} />;
  }
}

// ── Sidebar content (reused in Sheet on mobile) ─────────────────────

function SidebarContent({ role, onSelectView, onCloseMobile }: { role: UserRole; onSelectView: (v: ViewName) => void; onCloseMobile?: () => void }) {
  const currentView = useAppStore((s) => s.currentView);
  const { primary, secondary } = getMenuByRole(role);

  const handleSelect = (view: ViewName) => {
    onSelectView(view);
    onCloseMobile?.();
  };

  const roleLabels: Record<string, string> = {
    OWNER: 'Pemilik',
    ADMIN: 'Admin',
    DRIVER: 'Driver',
    CUSTOMER: 'Pelanggan',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 py-5">
        <img
          src="/logo.png"
          alt="Qia Trans Manajemen"
          className="w-9 h-9 rounded-xl object-cover"
        />
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">Qia Trans Manajemen</h1>
          <p className="text-[11px] text-muted-foreground leading-tight">Manajemen Transportasi</p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Menu Utama
          </p>
          {primary.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => handleSelect(item.view)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {item.label}
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />
                )}
              </button>
            );
          })}
        </div>

        {secondary.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Lainnya
              </p>
              {secondary.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => handleSelect(item.view)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                      ${isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }
                    `}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" />
                    {item.label}
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </ScrollArea>

      {/* User role badge at bottom */}
      {role && (
        <div className="border-t px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{roleLabels[role] || role}</p>
              <p className="text-[10px] text-muted-foreground">Mode {roleLabels[role]}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main App Shell ──────────────────────────────────────────────────

export function AppShell() {
  const {
    currentView,
    setCurrentView,
    sidebarOpen,
    setSidebarOpen,
    isMobile,
    setIsMobile,
    notifications,
    isChatOpen,
    setIsChatOpen,
    chatMessages,
    addChatMessage,
    clearChatMessages,
    login,
    logout,
  } = useAppStore();

  const { theme, setTheme } = useTheme();
  const [chatInput, setChatInput] = useState('');
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const mounted = useSyncExternalStore(
    (_onStoreChange) => () => {},
    () => true,
    () => false,
  );
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentUser = useAppStore((s) => s.currentUser);
  const userRole: UserRole = currentUser?.role || null;
  const isLoggedIn = !!currentUser;

  // Redirect to dashboard if not logged in and trying to access other views
  useEffect(() => {
    if (!isLoggedIn && currentView !== 'dashboard') {
      setCurrentView('dashboard');
    }
  }, [isLoggedIn, currentView, setCurrentView]);

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  // Fetch current user on mount (optional — dashboard works without login)
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (json.success && json.data) {
          login(json.data);
        }
      } catch {
        // Not logged in — that's OK, user can still browse
      }
    }
    fetchUser();
  }, [login]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleSendChat = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    addChatMessage({ role: 'user', content: trimmed });
    setChatInput('');
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();
      addChatMessage({ role: 'assistant', content: data.reply || data.message || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.' });
    } catch {
      addChatMessage({ role: 'assistant', content: 'Maaf, terjadi kesalahan koneksi. Silakan coba lagi dalam beberapa saat.' });
    }
  };

  const handleLogin = async () => {
    const { email, password } = loginForm;
    if (!email.trim() || !password.trim()) {
      setLoginError('Email dan password wajib diisi');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      if (!res.ok) {
        let msg = 'Server error ' + res.status;
        try {
          const errBody = await res.json();
          msg = errBody.error || msg;
        } catch { /* not JSON */ }
        setLoginError(msg);
        setLoginLoading(false);
        return;
      }

      const json = await res.json();
      if (!json.success) {
        setLoginError(json.error || 'Login gagal');
        setLoginLoading(false);
        return;
      }
      login(json.data);
      setLoginDialogOpen(false);
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      console.error('Login fetch error:', err);
      setLoginError('Terjadi kesalahan koneksi. Periksa jaringan dan coba lagi.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    logout();
    setCurrentView('dashboard');
    setLoggingOut(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Get user initials
  const userInitials = currentUser
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '??';

  const roleLabels: Record<string, string> = {
    OWNER: 'Pemilik',
    ADMIN: 'Admin',
    DRIVER: 'Driver',
    CUSTOMER: 'Pelanggan',
  };

  const { bottom: bottomNavItems } = getMenuByRole(userRole);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-gradient-to-r from-[#0c1a3a] via-[#122050] to-[#0c1a3a] shadow-lg shadow-blue-950/30">
        <div className="flex h-14 items-center gap-2 px-4 lg:px-6">
          {/* Mobile menu button — only when logged in */}
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0 hover:bg-white/10 text-white/80 hover:text-white"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
              <span className="sr-only">Buka menu</span>
            </Button>
          )}

          {/* Logo (mobile) */}
          <div className="flex items-center gap-2 lg:hidden">
            <img
              src="/logo.png"
              alt="Qia Trans Manajemen"
              className="w-7 h-7 rounded-lg object-cover"
            />
            <span className="text-sm font-bold text-white">Qia Trans Manajemen</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            {/* Dark mode toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-white/80 hover:bg-white/10 hover:text-white">
                  {mounted && theme === 'dark' ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                  <span className="sr-only">Toggle tema</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {mounted && theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
              </TooltipContent>
            </Tooltip>

            {/* Notification bell — only when logged in */}
            {isLoggedIn && (
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-white/80 hover:bg-white/10 hover:text-white">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4.5 h-4.5 rounded-full bg-destructive text-[10px] font-bold text-white">
                          {unreadCount}
                        </span>
                      )}
                      <span className="sr-only">Notifikasi</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Notifikasi</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifikasi</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {unreadCount} baru
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="max-h-72">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      Belum ada notifikasi
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notif) => (
                        <DropdownMenuItem
                          key={notif.id}
                          className="flex items-start gap-3 p-3 cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                            <NotificationIcon type={notif.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {notif.title}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notif.message}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
            )}

            {/* User avatar dropdown OR Login button */}
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={currentUser.avatar || ''} alt={currentUser.name || 'User'} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                      {currentUser.role && (
                        <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded w-fit mt-0.5">
                          {roleLabels[currentUser.role] || currentUser.role}
                        </span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setCurrentView('account')}>
                      <UserCircle className="w-4 h-4" />
                      Profil
                    </DropdownMenuItem>
                    {(userRole === 'OWNER' || userRole === 'ADMIN') && (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setCurrentView('settings')}
                      >
                        <Settings className="w-4 h-4" />
                        Pengaturan
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={toggleTheme}>
                    {mounted && theme === 'dark' ? (
                      <Sun className="w-4 h-4" />
                    ) : (
                      <Moon className="w-4 h-4" />
                    )}
                    {mounted && theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                    <div className="ml-auto">
                      <Switch
                        checked={mounted ? theme === 'dark' : false}
                        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                      />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={handleLogout}
                    disabled={loggingOut}
                  >
                    <LogOut className="w-4 h-4" />
                    {loggingOut ? 'Keluar...' : 'Keluar'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 bg-white text-[#0c1a3a] hover:bg-white/90 font-semibold"
                onClick={() => setLoginDialogOpen(true)}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ─── Body (sidebar + content) ─── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar — only when logged in */}
        {isLoggedIn && (
          <motion.aside
            initial={false}
            className="hidden lg:flex w-60 flex-col border-r bg-sidebar shrink-0"
          >
            <SidebarContent role={userRole} onSelectView={setCurrentView} />
          </motion.aside>
        )}

        {/* Mobile sidebar (Sheet) — only when logged in */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu Navigasi</SheetTitle>
              <SheetDescription>Pilih halaman untuk ditampilkan</SheetDescription>
            </SheetHeader>
            <SidebarContent
              role={userRole}
              onSelectView={setCurrentView}
              onCloseMobile={() => setSidebarOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* ─── Main content ─── */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-4 lg:p-6 pb-24 lg:pb-6"
            >
              {currentView === 'dashboard' ? <DashboardView /> : currentView === 'booking' ? <BookingView /> : currentView === 'fleet' ? <FleetView /> : currentView === 'customers' ? <CustomersView /> : currentView === 'tracking' ? <TrackingView /> : currentView === 'finance' ? <FinanceView /> : currentView === 'drivers' ? <DriversView /> : currentView === 'reports' ? <ReportsView /> : currentView === 'settings' ? <SettingsView /> : currentView === 'account' ? <AccountView /> : <PlaceholderView view={currentView} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ─── Bottom nav (mobile) — only when logged in ─── */}
      {isLoggedIn && (
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden">
        <div className="glass border-t">
          <div className="flex items-center justify-around h-16 px-2 pb-[env(safe-area-inset-bottom)]">
            {bottomNavItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => setCurrentView(item.view)}
                  className={`
                    flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-150 min-w-[56px]
                    ${isActive
                      ? 'text-primary'
                      : 'text-muted-foreground'
                    }
                  `}
                >
                  <div className="relative">
                    <item.icon className={`w-5 h-5 transition-all duration-150 ${isActive ? 'scale-110' : ''}`} />
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavIndicator"
                        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium transition-all duration-150 ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      )}

      {/* ─── Chatbot floating button ─── */}
      <div className={`fixed ${isLoggedIn ? 'bottom-20 right-4 lg:bottom-6' : 'bottom-6 right-6'} z-50`}>
        <AnimatePresence>
          {!isChatOpen && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsChatOpen(true)}
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:shadow-xl hover:shadow-primary/30 transition-shadow duration-200"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="sr-only">Buka chatbot</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Chatbot panel ─── */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`fixed ${isLoggedIn ? 'bottom-20 right-4 lg:bottom-6' : 'bottom-6 right-6'} z-50 w-[calc(100vw-2rem)] sm:w-96 h-[28rem] rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden`}
          >
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">AI Assistant</p>
                  <p className="text-[10px] opacity-80">Qia Trans Assistant</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-white/20"
                onClick={() => {
                  setIsChatOpen(false);
                  clearChatMessages();
                }}
              >
                <X className="w-4 h-4" />
                <span className="sr-only">Tutup chat</span>
              </Button>
            </div>

            {/* Chat messages */}
            <ScrollArea className="flex-1 p-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">Halo! 👋</p>
                  <p className="text-xs text-muted-foreground">
                    Saya asisten AI Qia Trans. Tanyakan apa saja tentang layanan transportasi kami.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed
                          ${msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-muted-foreground rounded-bl-md'
                          }
                        `}
                      >
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Chat input */}
            <div className="border-t p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChat();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 h-9 rounded-full bg-muted text-sm px-4 outline-none border-0 focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 rounded-full shrink-0"
                  disabled={!chatInput.trim()}
                >
                  <Send className="w-4 h-4" />
                  <span className="sr-only">Kirim pesan</span>
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Login Dialog ─── */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Masuk ke Akun</DialogTitle>
            <DialogDescription className="text-center">
              Masukkan email dan password untuk melanjutkan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {loginError && (
              <Alert variant="destructive">
                <AlertDescription className="text-sm">{loginError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="admin@qiatrans.id"
                value={loginForm.email}
                onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
                disabled={loginLoading}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  disabled={loginLoading}
                  className="h-10 pr-10"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              onClick={handleLogin}
              disabled={loginLoading}
              className="w-full h-10"
            >
              {loginLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Memproses...</>
              ) : (
                <><span>Masuk</span><ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
            <div className="grid grid-cols-1 gap-1.5">
              <div className="p-2.5 rounded-lg bg-muted/50 border text-center">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-medium">Admin:</span> admin@qiatrans.id / admin123
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50 border text-center">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-medium">Customer:</span> customer@qiatrans.id / customer123
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/50 border text-center">
                <p className="text-[10px] text-muted-foreground">
                  <span className="font-medium">Driver:</span> driver1@qiatrans.id / driver123
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
