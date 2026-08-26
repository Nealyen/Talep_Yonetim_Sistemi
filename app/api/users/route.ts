import { NextResponse } from 'next/server';
import { appendAuditLog, getUsers, MockUser, saveUsers } from '@/lib/mock-db';

export async function GET(request: Request) {
    const role = new URL(request.url).searchParams.get('role');
    const users = await getUsers();
    if (role === 'ADMIN' || role === 'KOORDINATOR') return NextResponse.json(users);
    return NextResponse.json(users.filter((user) => user.role === 'TEKNIK_UZMAN').map(({ cardId: _cardId, phone: _phone, email: _email, ...safeUser }) => safeUser));
}

export async function PATCH(request: Request) {
    const { userId, role, actorRole } = (await request.json()) as { userId?: string; role?: MockUser['role']; actorRole?: MockUser['role'] };
    const validRoles: MockUser['role'][] = ['TALEP_SAHIBI', 'TEKNIK_UZMAN', 'KOORDINATOR'];
    if (actorRole !== 'ADMIN') return NextResponse.json({ error: 'Yalnızca admin rolü kullanıcı rolü değiştirebilir.' }, { status: 403 });
    if (!userId || !role || !validRoles.includes(role)) {
        return NextResponse.json({ error: 'Geçerli kullanıcı ve rol zorunludur.' }, { status: 400 });
    }
    const users = await getUsers();
    const user = users.find((item) => item.id === userId);
    if (!user || user.role === 'ADMIN') return NextResponse.json({ error: 'Kullanıcı bulunamadı veya admin rolü değiştirilemez.' }, { status: 404 });
    const updated = { ...user, role };
    await saveUsers(users.map((item) => (item.id === userId ? updated : item)));
    await appendAuditLog({ action: 'KULLANICI_ROLU_DEGISTIRILDI', userId: 'ADMIN', detail: `${userId}: ${user.role} -> ${role}` });
    return NextResponse.json(updated);
}
