/**
 * API ROUTE: GET /api/audit
 * NE İŞE YARAR: lib/mock-db.ts içindeki dosya tabanlı sahte denetim kaydını döner.
 * hooks/useAuditLogs.ts tarafından çağrılıyor ve ticket geçmişiyle birleştiriliyor.
 * NOT: Gerçek backend gelene kadar geçici bir mock katmandır.
 */

import { NextResponse } from 'next/server';
import { getAuditLog } from '@/lib/mock-db';

export async function GET() {
    return NextResponse.json(await getAuditLog());
}
