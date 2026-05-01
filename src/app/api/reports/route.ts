import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/reports - Comprehensive report data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly'; // daily, weekly, monthly, yearly

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 86400000);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default: // monthly
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Run all queries in parallel
    const [
      totalIncome,
      totalExpenses,
      completedBookings,
      allPayments,
      popularVehicles,
      topCustomers,
      bookingStatusBreakdown,
      paymentMethodBreakdown,
      monthlyRevenue,
      vehicleUtilization,
    ] = await Promise.all([
      // Total income from successful payments
      db.payment.aggregate({
        where: {
          status: 'SUCCESS',
          paidAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),

      // Total expenses from maintenance
      db.maintenance.aggregate({
        where: {
          status: { in: ['COMPLETED', 'IN_PROGRESS'] },
          createdAt: { gte: startDate },
        },
        _sum: { cost: true },
      }),

      // Completed bookings count
      db.booking.count({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: startDate },
        },
      }),

      // All successful payments for the period
      db.payment.findMany({
        where: {
          status: 'SUCCESS',
          paidAt: { gte: startDate },
        },
        select: { amount: true, paidAt: true, method: true },
      }),

      // Most popular vehicles (by booking count)
      db.booking.groupBy({
        by: ['vehicleId'],
        where: { status: { in: ['COMPLETED', 'ACTIVE'] } },
        _count: { id: true },
        _sum: { totalPrice: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Top customers by spending
      db.booking.groupBy({
        by: ['customerId'],
        where: { status: 'COMPLETED' },
        _sum: { totalPrice: true },
        _count: { id: true },
        orderBy: { _sum: { totalPrice: 'desc' } },
        take: 10,
      }),

      // Booking status breakdown
      db.booking.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Payment method breakdown
      db.payment.groupBy({
        by: ['method'],
        where: { status: 'SUCCESS', paidAt: { gte: startDate } },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Monthly revenue (last 12 months)
      db.$queryRaw<Array<{ month: string; revenue: number }>>`
        SELECT
          to_char("paidAt", 'YYYY-MM') as month,
          SUM(amount) as revenue
        FROM "Payment"
        WHERE status = 'SUCCESS' AND paidAt IS NOT NULL
        GROUP BY to_char("paidAt", 'YYYY-MM')
        ORDER BY month DESC
        LIMIT 12
      `,

      // Vehicle utilization
      db.vehicle.findMany({
        select: {
          id: true,
          brand: true,
          model: true,
          plateNumber: true,
          status: true,
          dailyRate: true,
          _count: {
            select: { bookings: true },
          },
        },
      }),
    ]);

    const income = totalIncome._sum.amount || 0;
    const expenses = totalExpenses._sum.cost || 0;
    const profit = income - expenses;

    // Sort vehicle utilization by bookings count descending
    vehicleUtilization.sort((a, b) => b._count.bookings - a._count.bookings);

    // Enrich popular vehicles with vehicle details
    const popularVehiclesEnriched = await Promise.all(
      popularVehicles.map(async (pv) => {
        const vehicle = await db.vehicle.findUnique({
          where: { id: pv.vehicleId },
          select: { brand: true, model: true, plateNumber: true, category: true, imageUrl: true },
        });
        return {
          vehicle,
          bookingCount: pv._count.id,
          totalRevenue: pv._sum.totalPrice,
        };
      })
    );

    // Enrich top customers with user details
    const topCustomersEnriched = await Promise.all(
      topCustomers.map(async (tc) => {
        const user = await db.user.findUnique({
          where: { id: tc.customerId },
          select: { name: true, email: true, phone: true },
        });
        return {
          customer: user,
          totalSpent: tc._sum.totalPrice,
          bookingCount: tc._count.id,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          period,
          income,
          expenses,
          profit,
          completedBookings,
          profitMargin: income > 0 ? ((profit / income) * 100).toFixed(1) : '0',
        },
        popularVehicles: popularVehiclesEnriched,
        topCustomers: topCustomersEnriched,
        bookingStatusBreakdown,
        paymentMethodBreakdown,
        monthlyRevenue,
        vehicleUtilization,
        transactions: allPayments.length,
        averageTransactionValue: allPayments.length > 0
          ? income / allPayments.length
          : 0,
      },
    });
  } catch (error) {
    console.error('Reports GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report data' },
      { status: 500 }
    );
  }
}
