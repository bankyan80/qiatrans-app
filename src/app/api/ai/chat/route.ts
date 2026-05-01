import { NextRequest, NextResponse } from 'next/server'
import { getAll, getById, create } from '@/lib/firestore'

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json()
    if (!message) {
      return NextResponse.json({ success: false, error: 'Pesan wajib diisi' }, { status: 400 })
    }

    const [vehicles, bookings] = await Promise.all([
      getAll('vehicles', { where: { status: ['==', 'AVAILABLE'] } }),
      getAll('bookings'),
    ])

    const categoryCount: Record<string, number> = {}
    bookings.forEach((b: Record<string, unknown>) => {
      const booking = vehicles.find((v: Record<string, unknown>) => v.id === b.vehicleId)
      if (booking) {
        const cat = booking.category as string || 'Other'
        categoryCount[cat] = (categoryCount[cat] || 0) + 1
      }
    })

    const availableCategories = [...new Set(vehicles.map((v: Record<string, unknown>) => v.category))]
    const contextInfo = `Tersedia ${vehicles.length} kendaraan dari ${availableCategories.length} kategori (${availableCategories.join(', ')}). Total ${bookings.length} booking tercatat.`

    const { default: ZAI } = await import('z-ai-web-dev-sdk')
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: `Kamu adalah asisten AI untuk Qia Trans Manajemen, sistem manajemen transportasi. ${contextInfo} Jawab dalam bahasa Indonesia dengan singkat dan membantu.` },
        { role: 'user', content: message },
      ],
    })

    const reply = completion.choices[0]?.message?.content || 'Maaf, saya tidak dapat menjawab saat ini.'

    if (userId) {
      try {
        await create('notifications', { userId, title: 'Pesan AI', message: `Anda bertanya: ${message.substring(0, 50)}...`, type: 'PROMO', isRead: false })
      } catch {}
    }

    return NextResponse.json({ success: true, data: { reply } })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ success: false, error: 'Gagal memproses pesan' }, { status: 500 })
  }
}