import { create } from 'zustand';
import {
  ViewName,
  User,
  Vehicle,
  Booking,
  Driver,
  DashboardStats,
  AppNotification,
  VehicleStatus,
  VehicleCategory,
  BookingStatus,
} from './types';

interface AppState {
  // Navigation
  currentView: ViewName;
  setCurrentView: (view: ViewName) => void;

  // Auth
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isMobile: boolean;
  setIsMobile: (mobile: boolean) => void;

  // Data caching
  dashboardStats: DashboardStats | null;
  setDashboardStats: (stats: DashboardStats | null) => void;

  vehicles: Vehicle[];
  setVehicles: (vehicles: Vehicle[]) => void;

  bookings: Booking[];
  setBookings: (bookings: Booking[]) => void;

  drivers: Driver[];
  setDrivers: (drivers: Driver[]) => void;

  notifications: AppNotification[];
  setNotifications: (notifications: AppNotification[]) => void;

  // Filters
  vehicleFilter: { status: VehicleStatus | 'ALL'; category: VehicleCategory | 'ALL'; search: string };
  setVehicleFilter: (filter: { status: VehicleStatus | 'ALL'; category: VehicleCategory | 'ALL'; search: string }) => void;

  bookingFilter: { status: BookingStatus | 'ALL'; search: string };
  setBookingFilter: (filter: { status: BookingStatus | 'ALL'; search: string }) => void;

  // Chatbot
  chatMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  addChatMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  clearChatMessages: () => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),

  // Auth
  currentUser: null,
  login: (user) => set({ currentUser: user }),
  logout: () => set({ currentUser: null }),

  // UI State
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  isMobile: false,
  setIsMobile: (mobile) => set({ isMobile: mobile }),

  // Data caching
  dashboardStats: null,
  setDashboardStats: (stats) => set({ dashboardStats: stats }),

  vehicles: [],
  setVehicles: (vehicles) => set({ vehicles }),

  bookings: [],
  setBookings: (bookings) => set({ bookings }),

  drivers: [],
  setDrivers: (drivers) => set({ drivers }),

  notifications: [],
  setNotifications: (notifications) => set({ notifications }),

  // Filters
  vehicleFilter: { status: 'ALL', category: 'ALL', search: '' },
  setVehicleFilter: (filter) => set({ vehicleFilter: filter }),

  bookingFilter: { status: 'ALL', search: '' },
  setBookingFilter: (filter) => set({ bookingFilter: filter }),

  // Chatbot
  chatMessages: [],
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  clearChatMessages: () => set({ chatMessages: [] }),
  isChatOpen: false,
  setIsChatOpen: (open) => set({ isChatOpen: open }),
}));
