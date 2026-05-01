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
  ZoomIn,
  ZoomOut,
  Satellite,
  Map as MapIcon,
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
  lat: number;
  lng: number;
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

// Mock vehicle positions around Jakarta area (real coordinates)
const MOCK_VEHICLES: SimulatedVehicle[] = [
  {
    vehicle: { id: 'v1', brand: 'Toyota', model: 'Avanza', plateNumber: 'B 1234 ABC', status: 'RENTED', year: 2023, color: 'Silver', category: 'MPV' },
    lat: -6.2088, lng: 106.8456, speed: 45, heading: 90, status: 'moving',
    location: 'Jl. Sudirman No. 45, Jakarta Pusat',
    lastUpdate: '2 menit lalu', driverName: 'Pak Joko', estimatedReturn: '28 Apr 2026',
  },
  {
    vehicle: { id: 'v2', brand: 'Honda', model: 'HR-V', plateNumber: 'B 5678 DEF', status: 'RENTED', year: 2024, color: 'Putih', category: 'SUV' },
    lat: -6.2277, lng: 106.8125, speed: 0, heading: 0, status: 'parked',
    location: 'Jl. Gatot Subroto Kav. 36, Jakarta Selatan',
    lastUpdate: '15 menit lalu', driverName: null, estimatedReturn: '29 Apr 2026',
  },
  {
    vehicle: { id: 'v3', brand: 'Toyota', model: 'Innova', plateNumber: 'B 9012 GHI', status: 'RENTED', year: 2023, color: 'Hitam', category: 'MPV' },
    lat: -6.1947, lng: 106.8229, speed: 60, heading: 180, status: 'moving',
    location: 'Jl. Thamrin No. 10, Jakarta Pusat',
    lastUpdate: '1 menit lalu', driverName: 'Mas Andi', estimatedReturn: '27 Apr 2026',
  },
  {
    vehicle: { id: 'v4', brand: 'Suzuki', model: 'Ertiga', plateNumber: 'D 3456 JKL', status: 'RENTED', year: 2022, color: 'Merah', category: 'MPV' },
    lat: -6.2349, lng: 106.8321, speed: 0, heading: 270, status: 'offline',
    location: 'Jl. Rasuna Said Blok X-2, Jakarta Selatan',
    lastUpdate: '2 jam lalu', driverName: 'Pak Budi', estimatedReturn: '30 Apr 2026',
  },
];

// Real-ish positions around Jakarta for additional vehicles
const JAKARTA_COORDS = [
  { lat: -6.1753, lng: 106.8272 },
  { lat: -6.2000, lng: 106.8160 },
  { lat: -6.2400, lng: 106.7980 },
  { lat: -6.1520, lng: 106.8450 },
  { lat: -6.2100, lng: 106.8550 },
  { lat: -6.2600, lng: 106.8100 },
  { lat: -6.1850, lng: 106.8350 },
  { lat: -6.2250, lng: 106.8400 },
  { lat: -6.1950, lng: 106.8050 },
  { lat: -6.2450, lng: 106.8250 },
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

// ── Real Map Component (Leaflet) ─────────────────────────────────────

function MapWrapper({
  vehicles,
  selectedId,
  onSelectVehicle,
  satelliteView,
}: {
  vehicles: SimulatedVehicle[];
  selectedId: string | null;
  onSelectVehicle: (id: string) => void;
  satelliteView: boolean;
}) {
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [tileLayer, setTileLayer] = useState<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamically import Leaflet (only on client)
  useEffect(() => {
    import('leaflet').then((L) => {
      setLeafletLoaded(true);

      // Fix default marker icon issue
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !containerRef.current || mapInstance) return;

    import('leaflet').then((L) => {
      const map = L.map(containerRef.current!, {
        center: [-6.2088, 106.8456],
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
      });

      // Add zoom control to top-left
      L.control.zoom({ position: 'topleft' }).addTo(map);

      // Add tile layer
      const tiles = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      setTileLayer(tiles);
      setMapInstance(map);

      // Fix map size after mount
      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [leafletLoaded]);

  // Toggle satellite / normal view
  useEffect(() => {
    if (!mapInstance || !leafletLoaded) return;

    import('leaflet').then((L) => {
      if (tileLayer) {
        mapInstance.removeLayer(tileLayer);
      }

      const newTileUrl = satelliteView
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const newTiles = L.tileLayer(newTileUrl, {
        attribution: satelliteView
          ? '&copy; <a href="https://www.esri.com/">Esri</a>'
          : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(mapInstance);

      setTileLayer(newTiles);
    });
  }, [satelliteView, mapInstance, leafletLoaded]);

  // Update markers when vehicles change
  useEffect(() => {
    if (!mapInstance || !leafletLoaded) return;

    import('leaflet').then((L) => {
      // Remove existing markers
      mapInstance.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          mapInstance.removeLayer(layer);
        }
      });

      vehicles.forEach((v) => {
        const isSelected = v.vehicle.id === selectedId;
        const statusCfg = STATUS_CONFIG[v.status];

        // Create custom icon
        const iconHtml = `
          <div style="position:relative; width:${isSelected ? 40 : 32}px; height:${isSelected ? 40 : 32}px;">
            ${v.status === 'moving' ? `<div style="position:absolute; inset:-6px; border-radius:50%; background:rgba(16,185,129,0.3); animation: pulse-ring 2s infinite;"></div>` : ''}
            <div style="
              width:${isSelected ? 40 : 32}px;
              height:${isSelected ? 40 : 32}px;
              border-radius:50%;
              background:${statusCfg.color};
              display:flex;
              align-items:center;
              justify-content:center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              ${isSelected ? 'border: 3px solid white; box-shadow: 0 0 0 2px rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.3);' : ''}
              transition: all 0.2s;
            ">
              <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? 18 : 14}" height="${isSelected ? 18 : 14}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
                <circle cx="6.5" cy="16.5" r="2.5"/>
                <circle cx="16.5" cy="16.5" r="2.5"/>
              </svg>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-vehicle-marker',
          iconSize: [isSelected ? 40 : 32, isSelected ? 40 : 32],
          iconAnchor: [isSelected ? 20 : 16, isSelected ? 20 : 16],
        });

        const marker = L.marker([v.lat, v.lng], { icon: customIcon })
          .addTo(mapInstance)
          .on('click', () => onSelectVehicle(v.vehicle.id));

        // Add popup
        marker.bindPopup(`
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 180px; padding: 4px 0;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 4px;">${v.vehicle.brand} ${v.vehicle.model}</div>
            <div style="font-size: 11px; color: #666; margin-bottom: 6px;">${v.vehicle.plateNumber}</div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${statusCfg.color};"></span>
              <span style="font-size: 11px; font-weight: 600; color:${v.status === 'moving' ? '#059669' : v.status === 'parked' ? '#d97706' : '#dc2626'}">${statusCfg.label}</span>
              ${v.speed > 0 ? `<span style="font-size: 11px; color: #888;">${v.speed} km/h</span>` : ''}
            </div>
            <div style="font-size: 10px; color: #999;">${v.location}</div>
            <div style="font-size: 10px; color: #bbb; margin-top: 2px;">Update: ${v.lastUpdate}</div>
          </div>
        `);

        // Open popup if selected
        if (isSelected) {
          marker.openPopup();
        }
      });

      // Add pulse animation style if not exists
      if (!document.getElementById('leaflet-pulse-style')) {
        const style = document.createElement('style');
        style.id = 'leaflet-pulse-style';
        style.textContent = `
          @keyframes pulse-ring {
            0% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.8); opacity: 0; }
            100% { transform: scale(1); opacity: 0.6; }
          }
          .custom-vehicle-marker { background: none !important; border: none !important; }
        `;
        document.head.appendChild(style);
      }
    });
  }, [vehicles, selectedId, mapInstance, leafletLoaded]);

  // Invalidate size on container resize
  useEffect(() => {
    if (!mapInstance) return;
    const observer = new ResizeObserver(() => {
      mapInstance.invalidateSize();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [mapInstance]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border" style={{ aspectRatio: '16/9' }}>
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Loading state */}
      {!leafletLoaded && (
        <div className="absolute inset-0 z-10 bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-400">Memuat peta...</p>
          </div>
        </div>
      )}
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
  const [satelliteView, setSatelliteView] = useState(false);
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

        // Build simulated vehicles from real data + real Jakarta coordinates
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

          const coord = JAKARTA_COORDS[i % JAKARTA_COORDS.length];

          return {
            vehicle: v,
            lat: coord.lat + (Math.random() - 0.5) * 0.02,
            lng: coord.lng + (Math.random() - 0.5) * 0.02,
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

  // ── Animate vehicle positions slightly ───────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) => {
          if (v.status !== 'moving') return v;
          const dlat = (Math.random() - 0.5) * 0.0005;
          const dlng = (Math.random() - 0.5) * 0.0005;
          return {
            ...v,
            lat: v.lat + dlat,
            lng: v.lng + dlng,
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

      {/* ── Map Container ── */}
      {loading ? (
        <MapSkeleton />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' as const }}
            className="relative"
          >
            <MapWrapper
              vehicles={vehicles}
              selectedId={selectedVehicleId}
              onSelectVehicle={handleSelectVehicle}
              satelliteView={satelliteView}
            />

            {/* Satellite toggle button */}
            <div className="absolute bottom-3 right-3 z-[1000]">
              <Button
                variant={satelliteView ? 'default' : 'secondary'}
                size="sm"
                className={`h-8 gap-1.5 shadow-lg text-xs px-3 ${
                  satelliteView
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                onClick={() => setSatelliteView(!satelliteView)}
              >
                {satelliteView ? (
                  <>
                    <MapIcon className="w-3.5 h-3.5" />
                    Peta Normal
                  </>
                ) : (
                  <>
                    <Satellite className="w-3.5 h-3.5" />
                    Satelit
                  </>
                )}
              </Button>
            </div>
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
