import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'popular', 'pricing', 'all'

    // Fetch current data from DB for AI context
    const [vehicles, recentBookings, maintenanceRecords] = await Promise.all([
      db.vehicle.findMany({
        select: { brand: true, model: true, category: true, dailyRate: true, status: true, _count: { select: { bookings: true } } },
      }),
      db.booking.findMany({
        where: { status: { in: ['COMPLETED', 'ACTIVE'] } },
        select: { vehicleId: true, startDate: true, endDate: true, totalPrice: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      db.maintenance.findMany({
        where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
        select: { vehicleId: true, type: true, cost: true, dueDate: true },
      }),
    ]);

    const zai = await ZAI.create();

    const prompt = `You are an AI analytics assistant for Qia Trans Manajemen, a transportation and car rental company in Indonesia. Analyze the following data and provide actionable insights.

Current vehicle fleet:
${vehicles.map((v) => `${v.brand} ${v.model} (${v.category}) - Rate: Rp ${v.dailyRate.toLocaleString('id-ID')}/day, Status: ${v.status}, Total Bookings: ${v._count.bookings}`).join('\n')}

Recent booking activity:
${recentBookings.map((b) => `Vehicle: ${b.vehicleId}, Period: ${b.startDate} to ${b.endDate}, Price: Rp ${b.totalPrice.toLocaleString('id-ID')}`).join('\n')}

Upcoming maintenance:
${maintenanceRecords.map((m) => `Vehicle: ${m.vehicleId}, Type: ${m.type}, Cost: Rp ${m.cost.toLocaleString('id-ID')}, Due: ${m.dueDate}`).join('\n')}

Please provide your analysis in the following JSON format (no markdown, just pure JSON):
{
  "popularVehicles": [
    { "vehicle": "Brand Model", "reason": "why it's popular", "recommendation": "what to do" }
  ],
  "pricingRecommendations": [
    { "vehicle": "Brand Model", "currentRate": number, "suggestedRate": number, "reason": "why adjust" }
  ],
  "businessInsights": [
    { "category": "fleet|revenue|maintenance|demand", "insight": "detailed insight", "action": "recommended action" }
  ],
  "demandForecast": {
    "trend": "increasing|decreasing|stable",
    "recommendation": "fleet expansion or reduction advice"
  }
}

Important: Respond with ONLY the JSON object, no additional text, no markdown formatting.`;

    const response = await zai.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    let aiContent = response.choices?.[0]?.message?.content || '';

    // Try to parse JSON from the response
    try {
      // Remove markdown code blocks if present
      aiContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(aiContent);

      return NextResponse.json({
        success: true,
        data: {
          type,
          predictions: parsed,
          generatedAt: new Date(),
        },
      });
    } catch {
      // If parsing fails, return the raw content
      return NextResponse.json({
        success: true,
        data: {
          type,
          rawAnalysis: aiContent,
          generatedAt: new Date(),
          note: 'AI response could not be parsed as structured JSON',
        },
      });
    }
  } catch (error) {
    console.error('AI Predict error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate predictions' },
      { status: 500 }
    );
  }
}
