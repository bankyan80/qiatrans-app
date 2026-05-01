import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

const SYSTEM_PROMPT = `You are a helpful customer service chatbot for Qua Trans Manajemen, a transportation and car rental company in Indonesia. Help customers with booking inquiries, vehicle information, pricing, and general questions. Always respond in Indonesian unless the customer uses another language.

Key information about Qua Trans Manajemen:
- We offer various vehicle categories: SUV, SEDAN, MPV, HATCHBACK, VAN, PICKUP, LUXURY
- Popular brands: Toyota, Honda, Mitsubishi, Suzuki, Daihatsu
- We provide both self-drive and with-driver options
- Payment methods: QRIS, Bank Transfer, E-Wallet, Cash
- We offer daily, weekly, and monthly rental rates
- All vehicles are well-maintained and insured

When asked about pricing, mention that rates vary by vehicle type and duration. Suggest customers check our website for current rates or contact our team.
When asked about availability, suggest checking online or contacting customer service.
Be friendly, professional, and concise.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory = [], userId } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Fetch some context from the database (available vehicles, popular ones)
    let contextInfo = '';
    try {
      const [availableVehicles, popularCategories] = await Promise.all([
        db.vehicle.findMany({
          where: { status: 'AVAILABLE' },
          select: { brand: true, model: true, category: true, dailyRate: true, seats: true },
          take: 10,
        }),
        db.booking.groupBy({
          by: ['vehicleId'],
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5,
        }),
      ]);

      if (availableVehicles.length > 0) {
        contextInfo += `\n\nKendaraan yang tersedia saat ini:\n`;
        availableVehicles.forEach((v) => {
          contextInfo += `- ${v.brand} ${v.model} (${v.category}) - Rp ${v.dailyRate.toLocaleString('id-ID')}/hari, ${v.seats} kursi\n`;
        });
      }
    } catch {
      // If DB query fails, continue without context
    }

    const zai = await ZAI.create();

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + contextInfo,
      },
      // Add conversation history (limit to last 10 messages)
      ...conversationHistory.slice(-10),
      {
        role: 'user',
        content: message,
      },
    ];

    const response = await zai.chat.completions.create({
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantMessage = response.choices?.[0]?.message?.content || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini. Silakan coba lagi.';

    // Log the chat for analytics (optional)
    if (userId) {
      try {
        await db.notification.create({
          data: {
            userId,
            title: 'Chat AI',
            message: `Pertanyaan: ${message.substring(0, 100)}`,
            type: 'BOOKING',
            isRead: true,
          },
        });
      } catch {
        // Ignore logging errors
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: assistantMessage,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
