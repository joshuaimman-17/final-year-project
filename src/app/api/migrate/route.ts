import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    return NextResponse.json({
        message: 'The migration route has been disabled to prevent mixing data between Firestore and SQL. All community features now use Firestore, and Chat uses Neon.',
        status: 'DISABLED'
    });
}
