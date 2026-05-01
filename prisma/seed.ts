import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.trackingLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.user.deleteMany();

  // ==========================================
  // USERS (3: 1 owner, 1 admin, 1 customer)
  // ==========================================
  const owner = await prisma.user.create({
    data: {
      email: 'owner@qiatrans.id',
      name: 'Budi Santoso',
      phone: '+62812345678',
      password: 'owner123',
      role: 'OWNER',
      avatar: null,
      isVerified: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@qiatrans.id',
      name: 'Sari Dewi',
      phone: '+62823456789',
      password: 'admin123',
      role: 'ADMIN',
      avatar: null,
      isVerified: true,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'customer@qiatrans.id',
      name: 'Andi Pratama',
      phone: '+62834567890',
      password: 'customer123',
      role: 'CUSTOMER',
      avatar: null,
      isVerified: true,
    },
  });

  // Extra customers for bookings
  const customer2 = await prisma.user.create({
    data: {
      email: 'rina@mail.com',
      name: 'Rina Wati',
      phone: '+62845678901',
      password: 'rina123',
      role: 'CUSTOMER',
      avatar: null,
      isVerified: true,
    },
  });

  const customer3 = await prisma.user.create({
    data: {
      email: 'doni@mail.com',
      name: 'Doni Saputra',
      phone: '+62856789012',
      password: 'doni123',
      role: 'CUSTOMER',
      avatar: null,
      isVerified: false,
    },
  });

  console.log('✅ Users created');

  // ==========================================
  // DRIVERS (2)
  // ==========================================
  const driverUser1 = await prisma.user.create({
    data: {
      email: 'driver1@qiatrans.id',
      name: 'Hendra Wijaya',
      phone: '+62867890123',
      password: 'driver123',
      role: 'DRIVER',
      avatar: null,
      isVerified: true,
    },
  });

  const driverUser2 = await prisma.user.create({
    data: {
      email: 'driver2@qiatrans.id',
      name: 'Joko Susilo',
      phone: '+62878901234',
      password: 'driver123',
      role: 'DRIVER',
      avatar: null,
      isVerified: true,
    },
  });

  const driver1 = await prisma.driver.create({
    data: {
      userId: driverUser1.id,
      licenseNumber: 'SIM-A1-1234567',
      licenseExpiry: new Date('2027-06-15'),
      licenseImage: '/licenses/driver1.jpg',
      address: 'Jl. Merdeka No. 45, Surabaya',
      status: 'ONLINE',
      rating: 4.8,
      totalTrips: 156,
    },
  });

  const driver2 = await prisma.driver.create({
    data: {
      userId: driverUser2.id,
      licenseNumber: 'SIM-A1-7654321',
      licenseExpiry: new Date('2026-12-30'),
      licenseImage: '/licenses/driver2.jpg',
      address: 'Jl. Sudirman No. 78, Jakarta',
      status: 'OFFLINE',
      rating: 4.5,
      totalTrips: 89,
    },
  });

  console.log('✅ Drivers created');

  // ==========================================
  // VEHICLES (10)
  // ==========================================
  const vehicles = await Promise.all([
    prisma.vehicle.create({
      data: {
        brand: 'Toyota',
        model: 'Avanza',
        year: 2024,
        color: 'Silver',
        plateNumber: 'B 1234 XYZ',
        category: 'MPV',
        dailyRate: 350000,
        weeklyRate: 2100000,
        monthlyRate: 7500000,
        status: 'AVAILABLE',
        fuelType: 'BENSIN',
        transmission: 'AUTOMATIC',
        seats: 7,
        imageUrl: '/vehicles/toyota-avanza.jpg',
        notes: 'Low km, AC dingin, ban baru',
      },
    }),
    prisma.vehicle.create({
      data: {
        brand: 'Honda',
        model: 'HR-V',
        year: 2024,
        color: 'Black',
        plateNumber: 'B 5678 ABC',
        category: 'SUV',
        dailyRate: 450000,
        weeklyRate: 2700000,
        monthlyRate: 9500000,
        status: 'RENTED',
        fuelType: 'BENSIN',
        transmission: 'CVT',
        seats: 5,
        imageUrl: '/vehicles/honda-hrv.jpg',
        notes: 'Tipe RS, sunroof, cruise control',
      },
    }),
    prisma.vehicle.create({
      data: {
        brand: 'Toyota',
        model: 'Innova',
        year: 2023,
        color: 'White',
        plateNumber: 'B 9012 DEF',
        category: 'MPV',
        dailyRate: 500000,
        weeklyRate: 3000000,
        monthlyRate: 10500000,
        status: 'AVAILABLE',
        fuelType: 'DIESEL',
        transmission: 'AUTOMATIC',
        seats: 8,
        imageUrl: '/vehicles/toyota-innova.jpg',
        notes: 'Tipe G, diesel turbo, spacious',
      },
    }),
    prisma.vehicle.create({
      data: {
        brand: 'Suzuki',
        model: 'Ertiga',
        year: 2023,
        color: 'Red',
        plateNumber: 'L 3456 GHI',
        category: 'MPV',
        dailyRate: 300000,
        weeklyRate: 1800000,
        monthlyRate: 6500000,
        status: 'AVAILABLE',
        fuelType: 'BENSIN',
        transmission: 'AUTOMATIC',
        seats: 7,
        imageUrl: '/vehicles/suzuki-ertiga.jpg',
        notes: 'Tipe GX, irit BBM',
      },
    }),
    prisma.vehicle.create({
      data: {
        brand: 'Honda',
        model: 'Brio',
        year: 2024,
        color: 'Yellow',
        plateNumber: 'D 7890 JKL',
        category: 'HATCHBACK',
        dailyRate: 200000,
        weeklyRate: 1200000,
        monthlyRate: 4500000,
        status: 'AVAILABLE',
        fuelType: 'BENSIN',
        transmission: 'CVT',
        seats: 5,
        imageUrl: '/vehicles/honda-brio.jpg',
        notes: 'Tipe RS, sporty, cocok untuk kota',
      },
    }),
    prisma.vehicle.create({
      data: {
        brand: 'Toyota',
        model: 'Fortuner',
        year: 2024,
        color: 'Gray',
        plateNumber: 'B 2345 MNO',
        category: 'SUV',
        dailyRate: 800000,
        weeklyRate: 4800000,
        monthlyRate: 16000000,
        status: 'RENTED',
        fuelType: 'DIESEL',
        transmission: 'AUTOMATIC',
        seats: 7,
        imageUrl: '/vehicles/toyota-fortuner.jpg',
        notes: 'Tipe VRZ, 4x4, premium',
      },
    }),
    prisma.vehicle.create({
      data: {
        brand: 'Mitsubishi',
        model: 'Xpander',
        year: 2023,
        color: 'White',
        plateNumber: 'H 6789 PQR',
        category: 'MPV',
        dailyRate: 400000,
        weeklyRate: 2400000,
        monthlyRate: 8500000,
        status: 'MAINTENANCE',
        fuelType: 'BENSIN',
        transmission: 'AUTOMATIC',
        seats: 7,
        imageUrl: '/vehicles/mitsubishi-xpander.jpg',
        notes: 'Tipe Cross, ground clearance tinggi',
      },
    }),
    prisma.vehicle.create({
      data: {
        brand: 'Daihatsu',
        model: 'Xenia',
        year: 2024,
        color: 'Silver',
        plateNumber: 'F 0123 STU',
        category: 'MPV',
        dailyRate: 275000,
        weeklyRate: 1650000,
        monthlyRate: 6000000,
        status: 'AVAILABLE',
        fuelType: 'BENSIN',
        transmission: 'CVT',
        seats: 7,
        imageUrl: '/vehicles/daihatsu-xenia.jpg',
        notes: 'Tipe R, 1.5L, AC double blower',
      },
    }),
    prisma.vehicle.create({
      data: {
        brand: 'Honda',
        model: 'CR-V',
        year: 2024,
        color: 'Blue',
        plateNumber: 'B 4567 VWX',
        category: 'SUV',
        dailyRate: 650000,
        weeklyRate: 3900000,
        monthlyRate: 13500000,
        status: 'AVAILABLE',
        fuelType: 'BENSIN',
        transmission: 'CVT',
        seats: 5,
        imageUrl: '/vehicles/honda-crv.jpg',
        notes: 'Tipe 1.5 Turbo, sunroof, sensor parking',
      },
    }),
    prisma.vehicle.create({
      data: {
        brand: 'Toyota',
        model: 'Calya',
        year: 2023,
        color: 'Red',
        plateNumber: 'AB 8901 YZA',
        category: 'MPV',
        dailyRate: 225000,
        weeklyRate: 1350000,
        monthlyRate: 5000000,
        status: 'AVAILABLE',
        fuelType: 'BENSIN',
        transmission: 'AUTOMATIC',
        seats: 7,
        imageUrl: '/vehicles/toyota-calya.jpg',
        notes: 'Tipe G, irit, cocok untuk keluarga kecil',
      },
    }),
  ]);

  console.log('✅ Vehicles created');

  // ==========================================
  // BOOKINGS (8 - mix of statuses)
  // ==========================================
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const bookings = await Promise.all([
    // Booking 1: Active, with driver
    prisma.booking.create({
      data: {
        customerId: customer.id,
        vehicleId: vehicles[1].id, // Honda HR-V
        driverId: driverUser1.id,
        startDate: new Date(today.getTime() - 2 * 86400000),
        endDate: new Date(today.getTime() + 3 * 86400000),
        totalPrice: 2250000,
        status: 'ACTIVE',
        withDriver: true,
        pickupLocation: 'Bandara Juanda, Surabaya',
        returnLocation: 'Hotel Majapahit, Surabaya',
        notes: 'Include child seat',
      },
    }),
    // Booking 2: Active
    prisma.booking.create({
      data: {
        customerId: customer2.id,
        vehicleId: vehicles[5].id, // Toyota Fortuner
        startDate: new Date(today.getTime() - 1 * 86400000),
        endDate: new Date(today.getTime() + 5 * 86400000),
        totalPrice: 4800000,
        status: 'ACTIVE',
        withDriver: false,
        pickupLocation: 'Kantor, Jakarta',
        returnLocation: 'Kantor, Jakarta',
        notes: 'Trip ke Bromo',
      },
    }),
    // Booking 3: Completed
    prisma.booking.create({
      data: {
        customerId: customer.id,
        vehicleId: vehicles[0].id, // Toyota Avanza
        driverId: driverUser1.id,
        startDate: new Date(today.getTime() - 15 * 86400000),
        endDate: new Date(today.getTime() - 10 * 86400000),
        totalPrice: 1750000,
        status: 'COMPLETED',
        withDriver: true,
        pickupLocation: 'Stasiun Surabaya',
        returnLocation: 'Stasiun Surabaya',
        notes: null,
      },
    }),
    // Booking 4: Pending
    prisma.booking.create({
      data: {
        customerId: customer3.id,
        vehicleId: vehicles[3].id, // Suzuki Ertiga
        startDate: new Date(today.getTime() + 3 * 86400000),
        endDate: new Date(today.getTime() + 7 * 86400000),
        totalPrice: 1200000,
        status: 'PENDING',
        withDriver: false,
        pickupLocation: 'Malang',
        returnLocation: 'Malang',
        notes: 'Waiting for confirmation',
      },
    }),
    // Booking 5: Confirmed
    prisma.booking.create({
      data: {
        customerId: customer2.id,
        vehicleId: vehicles[2].id, // Toyota Innova
        driverId: driverUser2.id,
        startDate: new Date(today.getTime() + 1 * 86400000),
        endDate: new Date(today.getTime() + 5 * 86400000),
        totalPrice: 2000000,
        status: 'CONFIRMED',
        withDriver: true,
        pickupLocation: 'Bandara Soekarno-Hatta',
        returnLocation: 'Bandara Soekarno-Hatta',
        notes: 'Airport transfer + tour',
      },
    }),
    // Booking 6: Completed
    prisma.booking.create({
      data: {
        customerId: customer.id,
        vehicleId: vehicles[4].id, // Honda Brio
        startDate: new Date(today.getTime() - 30 * 86400000),
        endDate: new Date(today.getTime() - 28 * 86400000),
        totalPrice: 400000,
        status: 'COMPLETED',
        withDriver: false,
        pickupLocation: 'Outlet Qia Trans',
        returnLocation: 'Outlet Qia Trans',
        notes: null,
      },
    }),
    // Booking 7: Cancelled
    prisma.booking.create({
      data: {
        customerId: customer3.id,
        vehicleId: vehicles[6].id, // Mitsubishi Xpander (in maintenance now)
        startDate: new Date(today.getTime() - 5 * 86400000),
        endDate: new Date(today.getTime() - 2 * 86400000),
        totalPrice: 1200000,
        status: 'CANCELLED',
        withDriver: false,
        pickupLocation: 'Surabaya',
        returnLocation: 'Surabaya',
        notes: 'Customer cancelled due to schedule change',
      },
    }),
    // Booking 8: Completed, another customer
    prisma.booking.create({
      data: {
        customerId: customer2.id,
        vehicleId: vehicles[8].id, // Honda CR-V
        driverId: driverUser2.id,
        startDate: new Date(today.getTime() - 20 * 86400000),
        endDate: new Date(today.getTime() - 16 * 86400000),
        totalPrice: 2600000,
        status: 'COMPLETED',
        withDriver: true,
        pickupLocation: 'Bali Airport',
        returnLocation: 'Bali Airport',
        notes: 'Bali trip with family',
      },
    }),
  ]);

  console.log('✅ Bookings created');

  // ==========================================
  // PAYMENTS (5)
  // ==========================================
  await Promise.all([
    prisma.payment.create({
      data: {
        bookingId: bookings[0].id,
        amount: 1125000,
        method: 'QRIS',
        status: 'SUCCESS',
        isDownPayment: true,
        transactionId: 'QRIS-20240428001',
        paidAt: new Date(today.getTime() - 3 * 86400000),
      },
    }),
    prisma.payment.create({
      data: {
        bookingId: bookings[0].id,
        amount: 1125000,
        method: 'BANK_TRANSFER',
        status: 'SUCCESS',
        isDownPayment: false,
        transactionId: 'BNK-20240428001',
        paidAt: new Date(today.getTime() - 2 * 86400000),
      },
    }),
    prisma.payment.create({
      data: {
        bookingId: bookings[1].id,
        amount: 4800000,
        method: 'BANK_TRANSFER',
        status: 'SUCCESS',
        isDownPayment: false,
        transactionId: 'BNK-20240428002',
        paidAt: new Date(today.getTime() - 2 * 86400000),
      },
    }),
    prisma.payment.create({
      data: {
        bookingId: bookings[3].id,
        amount: 1200000,
        method: 'E_WALLET',
        status: 'PENDING',
        isDownPayment: true,
        transactionId: null,
        paidAt: null,
      },
    }),
    prisma.payment.create({
      data: {
        bookingId: bookings[4].id,
        amount: 1000000,
        method: 'QRIS',
        status: 'SUCCESS',
        isDownPayment: true,
        transactionId: 'QRIS-20240428003',
        paidAt: new Date(today.getTime() - 1 * 86400000),
      },
    }),
  ]);

  console.log('✅ Payments created');

  // ==========================================
  // MAINTENANCE RECORDS (3)
  // ==========================================
  await Promise.all([
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[6].id, // Mitsubishi Xpander (MAINTENANCE status)
        type: 'SERVICE',
        description: 'Service berkala 30.000 km, ganti oli, filter udara, filter AC',
        cost: 1500000,
        dueDate: new Date(today.getTime() - 2 * 86400000),
        completedDate: null,
        status: 'IN_PROGRESS',
      },
    }),
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[0].id, // Toyota Avanza
        type: 'TAX',
        description: 'Bayar pajak tahunan',
        cost: 3500000,
        dueDate: new Date(today.getTime() + 15 * 86400000),
        completedDate: null,
        status: 'SCHEDULED',
      },
    }),
    prisma.maintenance.create({
      data: {
        vehicleId: vehicles[2].id, // Toyota Innova
        type: 'STNK',
        description: 'Perpanjangan STNK 5 tahun',
        cost: 250000,
        dueDate: new Date(today.getTime() + 30 * 86400000),
        completedDate: null,
        status: 'SCHEDULED',
      },
    }),
  ]);

  console.log('✅ Maintenance records created');

  // ==========================================
  // NOTIFICATIONS (5)
  // ==========================================
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: customer.id,
        title: 'Booking Baru',
        message: 'Booking Anda untuk Honda HR-V telah aktif. Selamat menikmati perjalanan!',
        type: 'BOOKING',
        isRead: true,
      },
    }),
    prisma.notification.create({
      data: {
        userId: owner.id,
        title: 'Pembayaran Diterima',
        message: 'Pembayaran Rp 4.800.000 dari Rina Wati telah berhasil diterima.',
        type: 'PAYMENT',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Maintenance Alert',
        message: 'Mitsubishi Xpander (H 6789 PQR) sedang dalam perbaikan.',
        type: 'MAINTENANCE',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: customer2.id,
        title: 'Promo Spesial',
        message: 'Diskon 20% untuk rental weekend! Gunakan kode WEEKEND20.',
        type: 'PROMO',
        isRead: false,
      },
    }),
    prisma.notification.create({
      data: {
        userId: owner.id,
        title: 'Booking Baru',
        message: 'Doni Saputra membuat booking baru untuk Suzuki Ertiga. Menunggu konfirmasi.',
        type: 'BOOKING',
        isRead: false,
      },
    }),
  ]);

  console.log('✅ Notifications created');

  // ==========================================
  // REVIEWS (for completed bookings)
  // ==========================================
  await Promise.all([
    prisma.review.create({
      data: {
        bookingId: bookings[2].id, // Completed Avanza booking
        customerId: customer.id,
        rating: 5,
        comment: 'Sangat puas! Mobil bersih, supir ramah dan on time. Pasti rental lagi!',
      },
    }),
    prisma.review.create({
      data: {
        bookingId: bookings[5].id, // Completed Brio booking
        customerId: customer.id,
        rating: 4,
        comment: 'Mobil ok, proses cepat. AC kurang dingin sedikit.',
      },
    }),
    prisma.review.create({
      data: {
        bookingId: bookings[7].id, // Completed CR-V booking
        customerId: customer2.id,
        rating: 5,
        comment: 'Perfect trip ke Bali! Mobil nyaman, supir sangat helpful.',
      },
    }),
  ]);

  console.log('✅ Reviews created');

  // ==========================================
  // TRACKING LOGS (simulated GPS data)
  // ==========================================
  const trackingData: Array<{
    vehicleId: string;
    lat: number;
    lng: number;
    speed: number;
    minutesAgo: number;
  }> = [
    // Honda HR-V (booked, active)
    { vehicleId: vehicles[1].id, lat: -7.2575, lng: 112.7521, speed: 60, minutesAgo: 5 },
    { vehicleId: vehicles[1].id, lat: -7.2600, lng: 112.7500, speed: 45, minutesAgo: 10 },
    { vehicleId: vehicles[1].id, lat: -7.2650, lng: 112.7480, speed: 30, minutesAgo: 15 },
    { vehicleId: vehicles[1].id, lat: -7.2700, lng: 112.7450, speed: 55, minutesAgo: 20 },
    { vehicleId: vehicles[1].id, lat: -7.2750, lng: 112.7420, speed: 0, minutesAgo: 25 },

    // Toyota Fortuner (booked, active)
    { vehicleId: vehicles[5].id, lat: -6.2088, lng: 106.8456, speed: 40, minutesAgo: 8 },
    { vehicleId: vehicles[5].id, lat: -6.2100, lng: 106.8480, speed: 65, minutesAgo: 16 },
    { vehicleId: vehicles[5].id, lat: -6.2150, lng: 106.8500, speed: 0, minutesAgo: 30 },
  ];

  await Promise.all(
    trackingData.map((entry) =>
      prisma.trackingLog.create({
        data: {
          vehicleId: entry.vehicleId,
          latitude: entry.lat,
          longitude: entry.lng,
          speed: entry.speed,
          timestamp: new Date(now.getTime() - entry.minutesAgo * 60000),
        },
      })
    )
  );

  console.log('✅ Tracking logs created');

  // ==========================================
  // DOCUMENTS (sample)
  // ==========================================
  await Promise.all([
    prisma.document.create({
      data: {
        bookingId: bookings[0].id,
        type: 'CONTRACT',
        content: JSON.stringify({
          contractNo: 'RC-2024-0001',
          terms: 'Perjanjian sewa mobil antara Qia Trans Manajemen dan Andi Pratama...',
          signedAt: new Date(today.getTime() - 2 * 86400000).toISOString(),
        }),
        digitalSignature: null,
      },
    }),
    prisma.document.create({
      data: {
        bookingId: bookings[0].id,
        type: 'CHECKLIST',
        content: JSON.stringify({
          items: [
            { item: 'Bensin', condition: 'Penuh' },
            { item: 'Ban', condition: 'Baik' },
            { item: 'AC', condition: 'Dingin' },
            { item: 'Body', condition: 'Tidak ada lecet' },
          ],
          checkedAt: new Date(today.getTime() - 2 * 86400000).toISOString(),
        }),
        digitalSignature: null,
      },
    }),
  ]);

  console.log('✅ Documents created');
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
