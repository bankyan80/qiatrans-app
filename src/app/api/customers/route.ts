import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/customers - List customers with rental history and loyalty status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = { role: 'CUSTOMER' };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const orderBy: Record<string, string> = { [sortBy]: sortOrder };

    const [customers, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: { bookings: true, reviews: true },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    // Enrich with rental stats
    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const rentalStats = await db.booking.aggregate({
          where: { customerId: customer.id, status: 'COMPLETED' },
          _sum: { totalPrice: true },
          _count: true,
        });

        const totalSpent = rentalStats._sum.totalPrice || 0;
        const totalRentals = rentalStats._count;

        // Determine loyalty status
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

        const avgRating = await db.review.aggregate({
          where: { customerId: customer.id },
          _avg: { rating: true },
        });

        return {
          ...customer,
          totalSpent,
          totalRentals,
          loyaltyStatus,
          loyaltyDiscount,
          averageRating: avgRating._avg.rating || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enrichedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Customers GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
