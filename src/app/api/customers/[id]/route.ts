import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/customers/[id] - Get single customer details
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await db.user.findUnique({
      where: { id, role: 'CUSTOMER' },
      include: {
        bookings: {
          include: {
            vehicle: { select: { id: true, brand: true, model: true, plateNumber: true, imageUrl: true } },
            driver: { select: { id: true, name: true } },
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          include: {
            booking: {
              select: {
                vehicle: { select: { brand: true, model: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { notifications: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate stats
    const completedBookings = customer.bookings.filter((b) => b.status === 'COMPLETED');
    const totalSpent = completedBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalRentals = completedBookings.length;

    let loyaltyStatus = 'Bronze';
    let loyaltyDiscount = 0;
    if (totalRentals >= 10 || totalSpent >= 20000000) {
      loyaltyStatus = 'Platinum';
      loyaltyDiscount = 15;
    } else if (totalRentals >= 5 || totalSpent >= 10000000) {
      loyaltyStatus = 'Gold';
      loyaltyDiscount = 10;
    } else if (totalRentals >= 3 || totalSpent >= 5000000) {
      loyaltyStatus = 'Silver';
      loyaltyDiscount = 5;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...customer,
        stats: {
          totalSpent,
          totalRentals,
          loyaltyStatus,
          loyaltyDiscount,
          unreadNotifications: customer._count.notifications,
        },
      },
    });
  } catch (error) {
    console.error('Customer GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}
