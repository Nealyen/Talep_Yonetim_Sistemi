import { NextResponse } from 'next/server';
import { appendAuditLog, getTickets, getUsers, saveTickets, TicketRecord } from '@/lib/mock-db';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
    const ticket = (await getTickets()).find((item) => item.id === params.id);
    return ticket ? NextResponse.json(ticket) : NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const tickets = await getTickets();
    const current = tickets.find((item) => item.id === params.id);
    if (!current) return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });

    const patch = (await request.json()) as Partial<Pick<TicketRecord, 'status' | 'assignee'>> & { actorName?: string; actorRole?: string };
    const validRoles = ['TALEP_SAHIBI', 'TEKNIK_UZMAN', 'KOORDINATOR', 'ADMIN'];
    if (!patch.actorRole || !validRoles.includes(patch.actorRole)) {
        return NextResponse.json({ error: 'Geçerli aktör rolü zorunludur.' }, { status: 403 });
    }
    const actorName = patch.actorName?.trim() || '';
    const isCoordinator = patch.actorRole === 'ADMIN' || patch.actorRole === 'KOORDINATOR';
    const isRequester = patch.actorRole === 'TALEP_SAHIBI' && actorName && current.requester.toLocaleLowerCase('tr-TR').includes(actorName.toLocaleLowerCase('tr-TR'));
    const isAssignedTechnician = patch.actorRole === 'TEKNIK_UZMAN' && actorName && current.assignee?.toLocaleLowerCase('tr-TR').includes(actorName.toLocaleLowerCase('tr-TR'));
    const isSelfAssignment = patch.actorRole === 'TEKNIK_UZMAN' && actorName && patch.assignee?.split(' (')[0].trim().toLocaleLowerCase('tr-TR') === actorName.toLocaleLowerCase('tr-TR');
    const isAssignmentChange = Object.prototype.hasOwnProperty.call(patch, 'assignee');
    const isCompletion = patch.status === 'ONAY_BEKLİYOR';
    const isConfirmation = current.status === 'ONAY_BEKLİYOR' && ['KAPATILDI', 'İŞLEMDE'].includes(patch.status || '');
    if (isAssignmentChange && !isCoordinator && !isAssignedTechnician && !isSelfAssignment) {
        return NextResponse.json({ error: 'Bu rol uzman atama ilişkisini değiştiremez.' }, { status: 403 });
    }
    if (isCompletion && !isAssignedTechnician) {
        return NextResponse.json({ error: 'İşi yalnızca atanmış teknik uzman tamamlayabilir.' }, { status: 403 });
    }
    if (isConfirmation && !isRequester && !isCoordinator) {
        return NextResponse.json({ error: 'Çözüm onayını yalnızca talep sahibi veya koordinatör verebilir.' }, { status: 403 });
    }
    if (patch.actorRole === 'TEKNIK_UZMAN' && patch.actorName && patch.actorName.trim().length > 2 && current.requester.toLocaleLowerCase('tr-TR').includes(patch.actorName.toLocaleLowerCase('tr-TR'))) {
        return NextResponse.json({ error: 'Talep sahibi kendi talebini teknik iş olarak üzerine alamaz veya ilişiğini kesemez.' }, { status: 409 });
    }
    const validStatuses: TicketRecord['status'][] = ['YENİ', 'İNCELEMEDE', 'İŞLEMDE', 'ONAY_BEKLİYOR', 'KAPATILDI', 'REDDEDİLDİ'];
    if (patch.status && !validStatuses.includes(patch.status)) return NextResponse.json({ error: 'Geçersiz talep durumu.' }, { status: 400 });
    if (current.status === 'KAPATILDI' && patch.status && patch.status !== 'KAPATILDI') return NextResponse.json({ error: 'Kapatılmış talep yeniden açılamaz.' }, { status: 409 });
    if (patch.assignee) {
        const assignedUser = (await getUsers()).find((user) => user.name.toLocaleLowerCase('tr-TR') === patch.assignee?.split(' (')[0].trim().toLocaleLowerCase('tr-TR'));
        if (!assignedUser || assignedUser.role !== 'TEKNIK_UZMAN' || !assignedUser.expertiseCategories?.includes(current.category)) {
            return NextResponse.json({ error: 'Uzman bu talep kategorisi için yetkili değil.' }, { status: 409 });
        }
        const technicianKey = patch.assignee.split(' (')[0].trim();
        const hasAnotherActiveTicket = tickets.some(
            (item) => item.id !== params.id && item.assignee?.split(' (')[0].trim() === technicianKey && !['KAPATILDI', 'REDDEDİLDİ'].includes(item.status)
        );
        if (hasAnotherActiveTicket) return NextResponse.json({ error: 'Bu uzman başka bir aktif işle meşgul.' }, { status: 409 });
    }
        const action = patch.assignee === null
                ? 'UZMAN_ILISKISI_KESILDI'
                : patch.assignee && current.assignee
                    ? 'UZMAN_DEGISTIRILDI'
                    : patch.assignee
                        ? 'UZMAN_ATANDI'
                        : patch.status === 'ONAY_BEKLİYOR'
                            ? 'IS_TAMAMLANDI_ONAY_BEKLIYOR'
                            : patch.status === 'KAPATILDI'
                                ? 'TALEP_ONAYLANDI'
                                : patch.status === 'İŞLEMDE'
                                    ? 'TALEP_ISLEME_GERI_ALINDI'
                                    : 'TALEP_DURUMU_DEGISTIRILDI';
        const { actorName: _actorName, ...ticketPatch } = patch;
        const updated = { ...current, ...ticketPatch, history: [...current.history, { date: new Date().toLocaleString('tr-TR'), action, user: patch.actorName || 'Mock API' }] };
    await saveTickets(tickets.map((item) => (item.id === params.id ? updated : item)));
        await appendAuditLog({ action, userId: patch.actorName || 'MOCK_API', ticketId: params.id, detail: JSON.stringify(ticketPatch) });
    return NextResponse.json(updated);
}
