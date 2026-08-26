import { NextResponse } from 'next/server';
import { appendAuditLog, getEmployeeRegistry, getUsers, normalizeCardId, normalizePhone, saveUsers, MockUser } from '@/lib/mock-db';

type AuthAction = 'request-otp' | 'register' | 'login';

interface AuthRequest {
    action: AuthAction;
    cardId?: string;
    phone?: string;
    otp?: string;
}

const DEMO_OTP = '123456';
const otpStore = new Map<string, { code: string; expiresAt: number }>();

const getIdentity = (body: AuthRequest) => ({
    cardId: normalizeCardId(body.cardId || ''),
    phone: normalizePhone(body.phone || '')
});

const findUser = async (body: AuthRequest) => {
    const { cardId, phone } = getIdentity(body);
    const users = await getUsers();
    const registry = await getEmployeeRegistry();
    const employee = registry.find((item) => item.cardId === cardId && normalizePhone(item.phone) === phone && item.active);
    const user = employee ? users.find((item) => item.id === employee.employeeId) : undefined;
    return { user, users, cardId, phone };
};

const responseForUser = (user: MockUser) => ({
    id: user.id,
    cardId: user.cardId,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    department: user.department
});

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as AuthRequest;
        const { user, users, cardId, phone } = await findUser(body);
        const key = `${cardId}:${phone}`;

        if (!cardId || phone.length < 10) {
            return NextResponse.json({ error: 'Kart ID ve geçerli telefon numarası zorunludur.' }, { status: 400 });
        }

        if (body.action === 'request-otp') {
            if (!user) {
                return NextResponse.json({ error: 'Kart ID ve telefon bilgileri eşleşen personel bulunamadı.' }, { status: 404 });
            }
            if (user.status !== 'AKTIF') {
                return NextResponse.json({ error: 'Personel kaydı aktif değil.' }, { status: 403 });
            }
            if (body.action === 'request-otp' && user.registered && body.otp !== 'login') {
                otpStore.set(key, { code: DEMO_OTP, expiresAt: Date.now() + 5 * 60 * 1000 });
                return NextResponse.json({ message: 'Doğrulama kodu gönderildi.', demoCode: DEMO_OTP, registered: true });
            }
            otpStore.set(key, { code: DEMO_OTP, expiresAt: Date.now() + 5 * 60 * 1000 });
            return NextResponse.json({ message: 'Kayıt doğrulama kodu gönderildi.', demoCode: DEMO_OTP, registered: user.registered });
        }

        if (body.otp !== DEMO_OTP) {
            return NextResponse.json({ error: 'Doğrulama kodu hatalı veya süresi dolmuş.' }, { status: 401 });
        }

        const storedOtp = otpStore.get(key);
        if (!storedOtp || storedOtp.code !== body.otp || storedOtp.expiresAt < Date.now()) {
            return NextResponse.json({ error: 'Doğrulama kodu hatalı veya süresi dolmuş.' }, { status: 401 });
        }

        if (!user) {
            return NextResponse.json({ error: 'Kart ID ve telefon bilgileri eşleşen personel bulunamadı.' }, { status: 404 });
        }

        if (body.action === 'register') {
            if (user.registered) {
                return NextResponse.json({ error: 'Bu personel kaydı daha önce aktive edilmiş. Giriş yapmayı deneyin.' }, { status: 409 });
            }
            const updatedUsers = users.map((item) => (item.id === user.id ? { ...item, registered: true } : item));
            await saveUsers(updatedUsers);
            await appendAuditLog({ action: 'KULLANICI_KAYDI_AKTIFLESTIRILDI', userId: user.id, detail: 'Kart ID ve telefon OTP doğrulaması tamamlandı.' });
            otpStore.delete(key);
            return NextResponse.json({ user: responseForUser({ ...user, registered: true }), message: 'Kayıt tamamlandı.' });
        }

        if (body.action === 'login') {
            if (!user.registered) {
                return NextResponse.json({ error: 'Bu personel henüz kayıt olmamış. Önce kayıt olun.' }, { status: 403 });
            }
            await appendAuditLog({ action: 'KULLANICI_GIRIS_YAPTI', userId: user.id, detail: 'Kart ID ve telefon OTP doğrulamasıyla giriş yapıldı.' });
            otpStore.delete(key);
            return NextResponse.json({ user: responseForUser(user), message: 'Giriş başarılı.' });
        }

        return NextResponse.json({ error: 'Geçersiz auth aksiyonu.' }, { status: 400 });
    } catch {
        return NextResponse.json({ error: 'İstek işlenemedi.' }, { status: 500 });
    }
}
