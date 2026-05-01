'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  MapPin,
  Car,
  Navigation,
  Clock,
  Gauge,
  Waypoints,
  Globe,
  Maximize2,
  RefreshCw,
  Eye,
  Crosshair,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Types ────────────────────────────────────────────────────────────

interface VehicleBasic {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
  status: string;
  year?: number;
  color?: string | null;
  category?: string;
}

interface SimulatedVehicle {
  vehicle: VehicleBasic;
  x: number;
  y: number;
  speed: number;
  heading: number;
  status: 'moving' | 'parked' | 'offline';
  location: string;
  lastUpdate: string;
  driverName: string | null;
  estimatedReturn: string | null;
}

interface TrackingData {
  vehicle: VehicleBasic;
  current: {
    latitude: number;
    longitude: number;
    speed: number;
    timestamp: string;
  } | null;
  stats: {
    totalPoints: number;
    averageSpeed: number;
    maxSpeed: number;
    period: string;
  };
  history: Array<{
    id: string;
    vehicleId: string;
    latitude: number;
    longitude: number;
    speed: number;
    timestamp: string;
  }>;
}

// ── Mock data ────────────────────────────────────────────────────────

const MOCK_LOCATIONS = [
  'Jl. Sudirman No. 45, Jakarta Pusat',
  'Jl. Gatot Subroto Kav. 36, Jakarta Selatan',
  'Jl. Thamrin No. 10, Jakarta Pusat',
  'Jl. Rasuna Said Blok X-2, Jakarta Selatan',
  'Jl. HR Rasuna Said, Jakarta Selatan',
  'Jl. Asia Afrika No. 8, Bandung',
  'Jl. Diponegoro No. 22, Semarang',
  'Jl. Pemuda No. 15, Surabaya',
];

const MOCK_DRIVERS = ['Pak Joko', 'Mas Andi', 'Pak Budi', 'Mas Dimas', null, null];

const MOCK_VEHICLES: SimulatedVehicle[] = [
  {
    vehicle: { id: 'v1', brand: 'Toyota', model: 'Avanza', plateNumber: 'B 1234 ABC', status: 'RENTED', year: 2023, color: 'Silver', category: 'MPV' },
    x: 35, y: 28, speed: 45, heading: 90, status: 'moving',
    location: 'Jl. Sudirman No. 45, Jakarta Pusat',
    lastUpdate: '2 menit lalu', driverName: 'Pak Joko', estimatedReturn: '28 Apr 2026',
  },
  {
    vehicle: { id: 'v2', brand: 'Honda', model: 'HR-V', plateNumber: 'B 5678 DEF', status: 'RENTED', year: 2024, color: 'Putih', category: 'SUV' },
    x: 60, y: 42, speed: 0, heading: 0, status: 'parked',
    location: 'Jl. Gatot Subroto Kav. 36, Jakarta Selatan',
    lastUpdate: '15 menit lalu', driverName: null, estimatedReturn: '29 Apr 2026',
  },
  {
    vehicle: { id: 'v3', brand: 'Toyota', model: 'Innova', plateNumber: 'B 9012 GHI', status: 'RENTED', year: 2023, color: 'Hitam', category: 'MPV' },
    x: 22, y: 65, speed: 60, heading: 180, status: 'moving',
    location: 'Jl. Thamrin No. 10, Jakarta Pusat',
    lastUpdate: '1 menit lalu', driverName: 'Mas Andi', estimatedReturn: '27 Apr 2026',
  },
  {
    vehicle: { id: 'v4', brand: 'Suzuki', model: 'Ertiga', plateNumber: 'D 3456 JKL', status: 'RENTED', year: 2022, color: 'Merah', category: 'MPV' },
    x: 78, y: 18, speed: 0, heading: 270, status: 'offline',
    location: 'Jl. Rasuna Said Blok X-2, Jakarta Selatan',
    lastUpdate: '2 jam lalu', driverName: 'Pak Budi', estimatedReturn: '30 Apr 2026',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_CONFIG = {
  moving: { label: 'Bergerak', color: 'bg-emerald-500', badgeStyle: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  parked: { label: 'Diparkir', color: 'bg-yellow-500', badgeStyle: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
  offline: { label: 'Offline', color: 'bg-red-500', badgeStyle: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800' },
} as const;

// ── Simulated Map Component ──────────────────────────────────────────

function SimulatedMap({
  vehicles,
  selectedId,
  onSelectVehicle,
  zoom,
  onZoomChange,
}: {
  vehicles: SimulatedVehicle[];
  selectedId: string | null;
  onSelectVehicle: (id: string) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapCenter, setMapCenter] = useState({ x: 50, y: 50 });

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMapCenter({ x, y });
  };

  const gridLines = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; type: 'major' | 'minor' }> = [];
    // Vertical lines
    for (let i = 0; i <= 100; i += (i % 20 === 0 ? 20 : 10)) {
      lines.push({ x1: i, y1: 0, x2: i, y2: 100, type: i % 20 === 0 ? 'major' : 'minor' });
    }
    // Horizontal lines
    for (let i = 0; i <= 100; i += (i % 20 === 0 ? 20 : 10)) {
      lines.push({ x1: 0, y1: i, x2: 100, y2: i, type: i % 20 === 0 ? 'major' : 'minor' });
    }
    return lines;
  }, []);

  // Simulated road names
  const roads = [
    { x: 20, y: 50, label: 'Jl. Sudirman', vertical: true },
    { x: 50, y: 30, label: 'Jl. Gatot Subroto', vertical: false },
    { x: 75, y: 60, label: 'Jl. Rasuna Said', vertical: true },
    { x: 40, y: 75, label: 'Jl. Thamrin', vertical: false },
    { x: 10, y: 20, label: 'Jl. Asia Afrika', vertical: false },
    { x: 85, y: 40, label: 'Jl. Kuningan', vertical: true },
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-xl border bg-slate-900" style={{ aspectRatio: '16/9' }}>
      {/* Map background with gradient */}
      <div
        ref={mapRef}
        className="absolute inset-0 cursor-crosshair"
        onClick={handleMapClick}
        style={{
          background: `
            radial-gradient(ellipse at 30% 40%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 60%, rgba(6, 182, 212, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(15, 23, 42, 1) 0%, rgba(15, 23, 42, 0.95) 100%)
          `,
        }}
      >
        {/* Water areas */}
        <div className="absolute rounded-full" style={{ left: '5%', top: '60%', width: '18%', height: '25%', background: 'rgba(6, 78, 112, 0.3)', filter: 'blur(20px)' }} />
        <div className="absolute rounded-full" style={{ right: '10%', bottom: '10%', width: '12%', height: '15%', background: 'rgba(6, 78, 112, 0.2)', filter: 'blur(15px)' }} />

        {/* Park/green areas */}
        <div className="absolute rounded-full" style={{ left: '60%', top: '15%', width: '14%', height: '12%', background: 'rgba(16, 185, 129, 0.1)', filter: 'blur(10px)' }} />
        <div className="absolute rounded-full" style={{ left: '15%', top: '35%', width: '10%', height: '8%', background: 'rgba(16, 185, 129, 0.08)', filter: 'blur(8px)' }} />

        {/* Grid lines - streets */}
        {gridLines.map((line, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: line.type === 'vertical' ? `${line.x1}%` : '0%',
              top: line.type === 'horizontal' ? `${line.y1}%` : '0%',
              width: line.type === 'vertical' ? (line.type === 'major' ? '2px' : '1px') : '100%',
              height: line.type === 'horizontal' ? (line.type === 'major' ? '2px' : '1px') : '100%',
              background: line.type === 'major'
                ? 'rgba(71, 85, 105, 0.5)'
                : 'rgba(51, 65, 85, 0.25)',
            }}
          />
        ))}

        {/* Road labels */}
        {roads.map((road, i) => (
          <div
            key={i}
            className="absolute text-[8px] font-medium text-slate-500/50 uppercase tracking-wider whitespace-nowrap select-none"
            style={{
              left: road.vertical ? `${road.x + 1.5}%` : `${road.x}%`,
              top: road.vertical ? `${road.y}%` : `${road.y + 1.5}%`,
              writingMode: road.vertical ? 'vertical-lr' : 'horizontal-tb',
              transform: road.vertical ? 'rotate(180deg)' : 'none',
            }}
          >
            {road.label}
          </div>
        ))}

        {/* Compass indicator */}
        <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 flex items-center justify-center">
          <div className="relative">
            <Crosshair className="w-5 h-5 text-cyan-400/60" />
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[6px] font-bold text-red-400">N</span>
          </div>
        </div>

        {/* Scale bar */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="flex flex-col items-start">
            <div className="h-0.5 w-16 bg-slate-500/60 relative">
              <div className="absolute left-0 -bottom-0.5 w-px h-1.5 bg-slate-500/60" />
              <div className="absolute right-0 -bottom-0.5 w-px h-1.5 bg-slate-500/60" />
              <div className="absolute left-1/2 -bottom-0.5 -translate-x-1/2 w-px h-1 bg-slate-500/40" />
            </div>
            <span className="text-[7px] text-slate-500/60 mt-0.5">500m</span>
          </div>
        </div>

        {/* Vehicle dots */}
        {vehicles.map((v) => {
          const isSelected = v.vehicle.id === selectedId;
          const statusCfg = STATUS_CONFIG[v.status];
          const offset = zoom * 0.5;

          return (
            <motion.div
              key={v.vehicle.id}
              className="absolute z-10 cursor-pointer group"
              style={{
                left: `${Math.max(5, Math.min(95, v.x + (mapCenter.x - 50) * (zoom - 1) * -0.3 + offset))}%`,
                top: `${Math.max(5, Math.min(95, v.y + (mapCenter.y - 50) * (zoom - 1) * -0.3 + offset))}%`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectVehicle(v.vehicle.id);
              }}
              animate={
                v.status === 'moving'
                  ? {
                      x: [0, 3, -2, 4, -1, 0],
                      y: [0, -2, 3, -1, 2, 0],
                    }
                  : {}
              }
              transition={
                v.status === 'moving'
                  ? {
                      duration: 8 + Math.random() * 4,
                      repeat: Infinity,
                      ease: 'linear',
                    }
                  : {}
              }
            >
              {/* Pulse ring for moving vehicles */}
              {v.status === 'moving' && (
                <motion.div
                  className="absolute -inset-3 rounded-full"
                  style={{ background: 'rgba(16, 185, 129, 0.2)' }}
                  animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Main dot */}
              <motion.div
                className={`relative rounded-full shadow-lg ${
                  isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white' : ''
                }`}
                style={{
                  width: isSelected ? '32px' : '24px',
                  height: isSelected ? '32px' : '24px',
                  background: statusCfg.color,
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Car className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" style={{ width: isSelected ? '16px' : '12px', height: isSelected ? '16px' : '12px' }} />
              </motion.div>

              {/* Label */}
              <div
                className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap transition-opacity ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{ top: isSelected ? '38px' : '30px' }}
              >
                <div className="bg-slate-800/90 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-1 rounded-md border border-slate-700/50 shadow-md">
                  {v.vehicle.plateNumber}
                  <span className="text-slate-400 ml-1">{v.speed > 0 ? `${v.speed} km/h` : ''}</span>
                </div>
              </div>

              {/* Direction indicator for moving vehicles */}
              {v.status === 'moving' && (
                <div
                  className="absolute -top-1 left-1/2 -translate-x-1/2"
                  style={{ transform: `translateX(-50%) rotate(${v.heading}deg)` }}
                >
                  <Navigation className="w-2 h-2 text-emerald-300" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Zoom controls */}
      <div className="absolute top-3 left-3 flex flex-col gap-1 z-20">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-slate-800/80 border-slate-700/50 hover:bg-slate-700 text-slate-300"
          onClick={(e) => {
            e.stopPropagation();
            onZoomChange(Math.min(zoom + 0.2, 2));
          }}
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-slate-800/80 border-slate-700/50 hover:bg-slate-700 text-slate-300"
          onClick={(e) => {
            e.stopPropagation();
            onZoomChange(Math.max(zoom - 0.2, 0.6));
          }}
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Satellite toggle */}
      <div className="absolute bottom-3 right-3 z-20">
        <Button
          variant="secondary"
          size="sm"
          className="h-7 gap-1.5 bg-slate-800/80 border-slate-700/50 hover:bg-slate-700 text-slate-300 text-[10px] px-2"
        >
          <Globe className="w-3 h-3" />
          Satelit
        </Button>
      </div>

      {/* Fullscreen hint */}
      <div className="absolute top-3 right-14 z-20">
        <Button
          variant="secondary"
          size="icon"
          className="h-8 w-8 bg-slate-800/80 border-slate-700/50 hover:bg-slate-700 text-slate-300"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Vehicle Info Panel ───────────────────────────────────────────────

function VehicleInfoPanel({
  vehicleData,
  trackingData,
  onClose,
}: {
  vehicleData: SimulatedVehicle | null;
  trackingData: TrackingData | null;
  onClose: () => void;
}) {
  if (!vehicleData) return null;

  const v = vehicleData;
  const statusCfg = STATUS_CONFIG[v.status];

  return (
    <Sheet open={!!vehicleData} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            {v.vehicle.brand} {v.vehicle.model}
          </SheetTitle>
          <SheetDescription>{v.vehicle.plateNumber}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${statusCfg.color} ${v.status === 'moving' ? 'animate-pulse' : ''}`} />
            <Badge className={`${statusCfg.badgeStyle} border text-xs`}>
              {statusCfg.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {v.vehicle.category || 'MPV'}
            </Badge>
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Lokasi Terkini
            </h4>
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm text-foreground font-medium">{v.location}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Update terakhir: {v.lastUpdate}
              </div>
            </div>
          </div>

          {/* Speed & Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-muted/50 rounded-xl text-center">
              <Gauge className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground">{v.speed}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">km/h</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-xl text-center">
              <Waypoints className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground">{trackingData?.stats.averageSpeed || v.speed}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">avg km/h</p>
            </div>
          </div>

          <Separator />

          {/* Driver info */}
          {v.driverName && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                Informasi Driver
              </h4>
              <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                  {v.driverName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{v.driverName}</p>
                  <p className="text-xs text-muted-foreground">Driver</p>
                </div>
              </div>
            </div>
          )}

          {/* Estimated Return */}
          {v.estimatedReturn && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Estimasi Pengembalian
              </h4>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-foreground">{v.estimatedReturn}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(() => {
                    const ret = new Date(v.estimatedReturn);
                    const now = new Date();
                    const diff = Math.ceil((ret.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    if (diff > 0) return `${diff} hari lagi`;
                    if (diff === 0) return 'Hari ini';
                    return `${Math.abs(diff)} hari yang lalu`;
                  })()}
                </p>
              </div>
            </div>
          )}

          <Separator />

          {/* Vehicle Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">Detail Kendaraan</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-muted-foreground">Merk</span>
                <span className="font-medium text-foreground">{v.vehicle.brand}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-muted-foreground">Model</span>
                <span className="font-medium text-foreground">{v.vehicle.model}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-muted-foreground">Tahun</span>
                <span className="font-medium text-foreground">{v.vehicle.year || '-'}</span>
              </div>
              <div className="flex justify-between p-2 bg-muted/30 rounded-lg">
                <span className="text-muted-foreground">Warna</span>
                <span className="font-medium text-foreground">{v.vehicle.color || '-'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <Button className="w-full" variant="outline">
              <Waypoints className="w-4 h-4 mr-2" />
              Lihat Riwayat Perjalanan
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Vehicle List Item ────────────────────────────────────────────────

function VehicleListItem({
  data,
  isSelected,
  onSelect,
}: {
  data: SimulatedVehicle;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const statusCfg = STATUS_CONFIG[data.status];

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        className={`p-3 cursor-pointer transition-all duration-200 ${
          isSelected ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-sm'
        }`}
        onClick={onSelect}
      >
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusCfg.color} ${data.status === 'moving' ? 'animate-pulse' : ''}`} />

          {/* Vehicle info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {data.vehicle.brand} {data.vehicle.model}
              </h3>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {data.vehicle.plateNumber}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                {data.location}
              </span>
            </div>
          </div>

          {/* Quick info */}
          <div className="text-right shrink-0">
            <Badge className={`${statusCfg.badgeStyle} border text-[10px]`}>
              {statusCfg.label}
            </Badge>
            {data.speed > 0 && (
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-0.5 justify-end">
                <Gauge className="w-3 h-3" />
                {data.speed} km/h
              </p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────

function MapSkeleton() {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border bg-slate-900" style={{ aspectRatio: '16/9' }}>
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="w-10 h-10 rounded-full mx-auto mb-2" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      </div>
    </div>
  );
}

function VehicleListSkeleton() {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-2.5 h-2.5 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </Card>
  );
}

// ── Main Tracking View ───────────────────────────────────────────────

export function TrackingView() {
  const [vehicles, setVehicles] = useState<SimulatedVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeVehicles, setActiveVehicles] = useState<VehicleBasic[]>([]);

  // ── Fetch vehicles ───────────────────────────────────────────
  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // Fetch active vehicles
      const vehicleRes = await fetch('/api/vehicles?status=RENTED&limit=100');
      const vehicleJson = await vehicleRes.json();

      if (vehicleJson.success && vehicleJson.data.length > 0) {
        setActiveVehicles(vehicleJson.data);
        // Try to get tracking data for each
        const trackingResults = await Promise.allSettled(
          vehicleJson.data.slice(0, 10).map(async (v: VehicleBasic) => {
            const tRes = await fetch(`/api/tracking?vehicleId=${v.id}&limit=1`);
            const tJson = await tRes.json();
            return { vehicle: v, tracking: tJson };
          }),
        );

        // Build simulated vehicles from real data + mock positions
        const simVehicles: SimulatedVehicle[] = vehicleJson.data.map((v: VehicleBasic, i: number) => {
          const result = trackingResults[i];
          let speed = 0;
          let status: 'moving' | 'parked' | 'offline' = 'parked';
          let location = MOCK_LOCATIONS[i % MOCK_LOCATIONS.length];
          let lastUpdate = '5 menit lalu';

          if (result?.status === 'fulfilled' && result.value.tracking.success) {
            const tData = result.value.tracking.data;
            speed = tData.current?.speed || 0;
            if (speed > 5) status = 'moving';
            if (tData.stats.totalPoints === 0) status = 'offline';
          } else {
            // Randomize status for visual variety
            const rand = Math.random();
            if (rand > 0.6) {
              status = 'moving';
              speed = Math.floor(Math.random() * 60) + 20;
              lastUpdate = `${Math.floor(Math.random() * 3) + 1} menit lalu`;
            } else if (rand > 0.3) {
              status = 'parked';
              lastUpdate = `${Math.floor(Math.random() * 30) + 5} menit lalu`;
            } else {
              status = 'offline';
              lastUpdate = `${Math.floor(Math.random() * 5) + 1} jam lalu`;
            }
          }

          return {
            vehicle: v,
            x: 15 + (i * 17) % 75,
            y: 15 + (i * 23) % 65,
            speed,
            heading: Math.floor(Math.random() * 360),
            status,
            location,
            lastUpdate,
            driverName: MOCK_DRIVERS[i % MOCK_DRIVERS.length],
            estimatedReturn: `0${27 + (i % 5)} Apr 2026`,
          };
        });

        setVehicles(simVehicles);
      } else {
        // Use mock data as fallback
        setVehicles(MOCK_VEHICLES);
        setActiveVehicles(MOCK_VEHICLES.map((v) => v.vehicle));
      }
    } catch {
      setVehicles(MOCK_VEHICLES);
      setActiveVehicles(MOCK_VEHICLES.map((v) => v.vehicle));
      setFetchError('Menggunakan data simulasi');
      toast.info('Menggunakan data simulasi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  // ── Animate vehicle positions ─────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.status !== 'moving') return v;
          const dx = (Math.random() - 0.5) * 2;
          const dy = (Math.random() - 0.5) * 2;
          return {
            ...v,
            x: Math.max(5, Math.min(95, v.x + dx)),
            y: Math.max(5, Math.min(95, v.y + dy)),
            speed: Math.max(10, Math.min(80, v.speed + (Math.random() - 0.5) * 10)),
            heading: (v.heading + (Math.random() - 0.5) * 20 + 360) % 360,
          };
        }),
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // ── Fetch tracking data for selected vehicle ──────────────────
  const handleSelectVehicle = useCallback(async (id: string) => {
    setSelectedVehicleId(id);
    try {
      const res = await fetch(`/api/tracking?vehicleId=${id}&limit=50`);
      const json = await res.json();
      if (json.success) {
        setTrackingData(json.data);
      } else {
        setTrackingData(null);
      }
    } catch {
      setTrackingData(null);
    }
  }, []);

  const selectedVehicle = vehicles.find((v) => v.vehicle.id === selectedVehicleId) || null;

  // ── Summary stats ────────────────────────────────────────────
  const movingCount = vehicles.filter((v) => v.status === 'moving').length;
  const parkedCount = vehicles.filter((v) => v.status === 'parked').length;
  const offlineCount = vehicles.filter((v) => v.status === 'offline').length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">GPS Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pantau lokasi kendaraan secara real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={selectedVehicleId || '_all'}
            onValueChange={(v) => {
              if (v === '_all') setSelectedVehicleId(null);
              else handleSelectVehicle(v);
            }}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <Car className="w-4 h-4 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Pilih Kendaraan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">Semua Kendaraan ({vehicles.length})</SelectItem>
              {vehicles.map((v) => (
                <SelectItem key={v.vehicle.id} value={v.vehicle.id}>
                  {v.vehicle.brand} {v.vehicle.model} ({v.vehicle.plateNumber})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchVehicles} className="shrink-0">
            <RefreshCw className="w-4 h-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

      {/* ── Status Summary ── */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{movingCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bergerak</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{parkedCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Diparkir</p>
              </div>
            </div>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <Eye className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{offlineCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Offline</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ── Simulated Map ── */}
      {loading ? (
        <MapSkeleton />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}
          >
            <SimulatedMap
              vehicles={vehicles}
              selectedId={selectedVehicleId}
              onSelectVehicle={handleSelectVehicle}
              zoom={zoom}
              onZoomChange={setZoom}
            />
            {isFullscreen && (
              <Button
                className="absolute top-4 right-4 z-60 bg-slate-800/90 hover:bg-slate-700 text-white"
                onClick={() => setIsFullscreen(false)}
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Keluar
              </Button>
            )}
          </motion.div>

          {fetchError && (
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <Globe className="w-3 h-3" />
              {fetchError}
            </p>
          )}
        </>
      )}

      {/* ── Vehicle List ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Daftar Kendaraan Aktif
          </h2>
          <span className="text-xs text-muted-foreground">
            {vehicles.length} kendaraan
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <VehicleListSkeleton key={i} />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <Card className="p-6 text-center">
            <Car className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Tidak ada kendaraan aktif untuk dilacak</p>
          </Card>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {vehicles.map((v, index) => (
                <motion.div
                  key={v.vehicle.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <VehicleListItem
                    data={v}
                    isSelected={v.vehicle.id === selectedVehicleId}
                    onSelect={() => handleSelectVehicle(v.vehicle.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Vehicle Info Sheet ── */}
      <VehicleInfoPanel
        vehicleData={selectedVehicle}
        trackingData={trackingData}
        onClose={() => {
          setSelectedVehicleId(null);
          setTrackingData(null);
        }}
      />
    </div>
  );
}
