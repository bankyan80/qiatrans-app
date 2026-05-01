export type UserRole = 'OWNER' | 'ADMIN' | 'DRIVER' | 'CUSTOMER';
export type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
export type VehicleCategory = 'SUV' | 'SEDAN' | 'MPV' | 'HATCHBACK' | 'VAN' | 'PICKUP' | 'LUXURY';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'QRIS' | 'BANK_TRANSFER' | 'E_WALLET' | 'CASH';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export type MaintenanceType = 'SERVICE' | 'REPAIR' | 'INSURANCE' | 'TAX' | 'STNK';
export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type DriverStatus = 'ONLINE' | 'OFFLINE' | 'BUSY';
export type NotificationType = 'BOOKING' | 'PAYMENT' | 'MAINTENANCE' | 'PROMO';
export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  avatar: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  category: VehicleCategory;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  status: VehicleStatus;
  fuelType: string;
  transmission: string;
  seats: number;
  imageUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
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
  customer?: User;
  vehicle?: Vehicle;
  driver?: Driver;
  payments?: Payment[];
  createdAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseImage: string | null;
  address: string | null;
  status: DriverStatus;
  rating: number;
  totalTrips: number;
  user?: User;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  isDownPayment: boolean;
  transactionId: string | null;
  paidAt: string | null;
  booking?: Booking;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  type: MaintenanceType;
  description: string;
  cost: number;
  dueDate: string;
  completedDate: string | null;
  status: MaintenanceStatus;
  vehicle?: Vehicle;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  todayBookings: number;
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  upcomingMaintenance: MaintenanceRecord[];
  recentBookings: Booking[];
}

export interface ReportData {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  monthlyStats: Array<{ month: string; income: number; expenses: number; profit: number }>;
  popularVehicles: Array<{ vehicle: Vehicle; bookingCount: number; revenue: number }>;
  topCustomers: Array<{ customer: User; totalBookings: number; totalSpent: number }>;
  categoryDistribution: Array<{ category: string; count: number; percentage: number }>;
}

export type ViewName = 'dashboard' | 'booking' | 'fleet' | 'finance' | 'account' | 'drivers' | 'customers' | 'tracking' | 'reports' | 'settings';
