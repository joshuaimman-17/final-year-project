import { NextResponse } from 'next/server';

export async function GET() {
    // Ported mock logic from legacy backend
    return NextResponse.json({
        moisture: 45,
        temp: 26,
        humidity: 60,
        npk: { n: 140, p: 50, k: 90 },
        timestamp: new Date()
    });
}
