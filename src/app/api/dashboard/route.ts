import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 86400000);
    const monthAgo = new Date(today.getTime() - 30 * 86400000);

    // Run all queries in parallel for performance
    const [
      totalVehicles,
      availableVehicles,
      rentedVehicles,
      maintenanceVehicles,
      todayBookings,
      activeBookings,
      pendingBookings,
      completedPayments,
      dailyPayments,
      weeklyPayments,
      monthlyPayments,
      upcomingMaintenance,
      totalCustomers,
      totalDrivers,
    ] = await Promise.all([
      // Total vehicles
      db.vehicle.count(),
      // Available vehicles
      db.vehicle.count({ where: { status: 'AVAILABLE' } }),
      // Rented vehicles
      db.vehicle.count({ where: { status: 'RENTED' } }),
      // Maintenance vehicles
      db.vehicle.count({ where: { status: 'MAINTENANCE' } }),
      // Today's bookings
      db.booking.count({
        where: {
          startDate: { lte: new Date(today.getTime() + 86400000) },
          endDate: { gte: today },
        },
      }),
      // Active bookings
      db.booking.count({ where: { status: 'ACTIVE' } }),
      // Pending bookings
      db.booking.count({ where: { status: 'PENDING' } }),
      // All completed payments (total revenue)
      db.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      // Today's revenue
      db.payment.aggregate({
        where: { status: 'SUCCESS', paidAt: { gte: today } },
        _sum: { amount: true },
      }),
      // Weekly revenue
      db.payment.aggregate({
        where: { status: 'SUCCESS', paidAt: { gte: weekAgo } },
        _sum: { amount: true },
      }),
      // Monthly revenue
      db.payment.aggregate({
        where: { status: 'SUCCESS', paidAt: { gte: monthAgo } },
        _sum: { amount: true },
      }),
      // Upcoming maintenance alerts (within 7 days or overdue)
      db.maintenance.findMany({
        where: {
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          dueDate: {
            lte: new Date(today.getTime() + 7 * 86400000),
          },
        },
        include: {
          vehicle: { select: { brand: true, model: true, plateNumber: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),
      // Total customers
      db.user.count({ where: { role: 'CUSTOMER' } }),
      // Total drivers
      db.driver.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        vehicles: {
          total: totalVehicles,
          available: availableVehicles,
          rented: rentedVehicles,
          maintenance: maintenanceVehicles,
        },
        bookings: {
          today: todayBookings,
          active: activeBookings,
          pending: pendingBookings,
        },
        revenue: {
          total: completedPayments._sum.amount || 0,
          daily: dailyPayments._sum.amount || 0,
          weekly: weeklyPayments._sum.amount || 0,
          monthly: monthlyPayments._sum.amount || 0,
        },
        maintenanceAlerts: upcomingMaintenance,
        customers: { total: totalCustomers },
        drivers: { total: totalDrivers },
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
