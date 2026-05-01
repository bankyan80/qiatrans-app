import { NextRequest, NextResponse } from 'next/server'
import { getById } from '@/lib/firestore'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('qia-trans-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Tidak ada sesi' },
        { status: 401 }
      )
    }

    const payload = await verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Sesi tidak valid' },
        { status: 401 }
      )
    }

    const user = await getById('users', payload.userId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Pengguna tidak ditemukan' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}