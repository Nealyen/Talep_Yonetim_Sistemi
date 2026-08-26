import { NextResponse } from 'next/server';
import { getAuditLog } from '@/lib/mock-db';

export async function GET() {
    return NextResponse.json(await getAuditLog());
}
