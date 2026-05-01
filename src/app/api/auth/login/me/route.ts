import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('qia-trans-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak valid' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isVerified: true,
      },
    });

    if (!user) {
      const response = NextResponse.json(
        { success: false, error: 'User tidak ditemukan' },
        { status: 401 }
      );
      response.cookies.set('qia-trans-token', '', {
        httpOnly: true,
        maxAge: 0,
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
