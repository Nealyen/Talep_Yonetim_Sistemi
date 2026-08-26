import { NextResponse } from 'next/server';
import { appendAuditLog, getTickets, getUsers, saveTickets, TicketRecord } from '@/lib/mock-db';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const userName = url.searchParams.get('userName')?.trim() || '';
    const normalizeName = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('tr-TR');
    const normalizedUserName = normalizeName(userName);
    const tickets = await getTickets();

    if (role === 'ADMIN' || role === 'KOORDINATOR') return NextResponse.json(tickets);
    if (role === 'TEKNIK_UZMAN') {
        const technician = (await getUsers()).find((user) => user.role === 'TEKNIK_UZMAN' && normalizeName(user.name) === normalizedUserName);
        const categories = technician?.expertiseCategories || [];
        return NextResponse.json(tickets.filter((ticket) => normalizeName(ticket.assignee || '').includes(normalizedUserName) || (!ticket.assignee && categories.includes(ticket.category))));
    }
    if (role === 'TALEP_SAHIBI' && userName) {
        return NextResponse.json(tickets.filter((ticket) => normalizeName(ticket.requester).includes(normalizedUserName)));
    }
    return NextResponse.json([]);
}

export async function POST(request: Request) {
    try {
        const data = (await request.json()) as Omit<TicketRecord, 'id' | 'createdAt' | 'history' | 'status' | 'assignee'>;
        if (!data.title?.trim() || !data.description?.trim() || !data.requester?.trim()) {
            return NextResponse.json({ error: 'Başlık, açıklama ve talep sahibi zorunludur.' }, { status: 400 });
        }

        const tickets = await getTickets();
        const nextNumber = Math.max(0, ...tickets.map((ticket) => Number(ticket.id.match(/^TLP-\d+-(\d+)$/)?.[1]) || 0)) + 1;
        const createdAt = new Date().toLocaleString('tr-TR');
        const ticket: TicketRecord = {
            ...data,
            id: `TLP-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`,
            status: 'YENİ',
            assignee: null,
            createdAt,
            history: [{ date: createdAt, action: 'Talep oluşturuldu.', user: data.requester }]
        };
        await saveTickets([ticket, ...tickets]);
        await appendAuditLog({ action: 'TALEP_OLUSTURULDU', userId: data.requester, ticketId: ticket.id, detail: 'Talep oluşturuldu.' });
        return NextResponse.json(ticket, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Talep oluşturulamadı.' }, { status: 500 });
    }
}
