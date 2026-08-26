/* eslint-disable @next/next/no-img-element */
'use client';
import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import { Button } from 'primereact/button';
import { LayoutContext } from '../../../../layout/context/layoutcontext';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Message } from 'primereact/message';

const LoginPage = () => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [cardId, setCardId] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [demoCode, setDemoCode] = useState('');
    const [message, setMessage] = useState<{ severity: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const { layoutConfig } = useContext(LayoutContext);

    const router = useRouter();
    const containerClassName = classNames('surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden', { 'p-input-filled': layoutConfig.inputStyle === 'filled' });

    const submitAuth = async (action: 'request-otp' | 'login' | 'register') => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, cardId, phone, otp })
            });
            const data = await response.json();
            if (!response.ok) {
                setMessage({ severity: 'error', text: data.error || 'İşlem tamamlanamadı.' });
                return;
            }
            if (action === 'request-otp') {
                setOtpSent(true);
                setDemoCode(data.demoCode || '');
                setMessage({ severity: 'info', text: `Demo OTP gönderildi: ${data.demoCode}` });
                return;
            }
            localStorage.setItem('authUser', JSON.stringify(data.user));
            localStorage.setItem('activeRole', data.user.role);
            setMessage({ severity: 'success', text: data.message });
            setTimeout(() => router.push('/'), 500);
        } catch {
            setMessage({ severity: 'error', text: 'Sunucuya bağlanılamadı.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={containerClassName}>
            <div className="flex flex-column align-items-center justify-content-center">
                <img src={`/layout/images/logo-${layoutConfig.colorScheme === 'light' ? 'dark' : 'white'}.svg`} alt="Sakai logo" className="mb-5 w-6rem flex-shrink-0" />
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8" style={{ borderRadius: '53px' }}>
                        <div className="text-center mb-5">
                            <img src="/demo/images/login/avatar.png" alt="Image" height="50" className="mb-3" />
                            <div className="text-900 text-3xl font-medium mb-3">Kurumsal Talep Portalı</div>
                            <span className="text-600 font-medium">Kart ID ve telefon ile güvenli erişim</span>
                        </div>

                        <div>
                            <div className="flex gap-2 mb-4">
                                <Button label="Giriş Yap" outlined={mode !== 'login'} severity="info" onClick={() => { setMode('login'); setOtpSent(false); setMessage(null); }} className="flex-1" />
                                <Button label="Kayıt Ol" outlined={mode !== 'register'} severity="success" onClick={() => { setMode('register'); setOtpSent(false); setMessage(null); }} className="flex-1" />
                            </div>
                            <label htmlFor="cardId" className="block text-900 text-xl font-medium mb-2">
                                Personel Kart ID
                            </label>
                            <InputText id="cardId" value={cardId} onChange={(event) => setCardId(event.target.value)} placeholder="Örn: KRT-847291" className="w-full mb-4" style={{ padding: '1rem' }} />

                            <label htmlFor="phone" className="block text-900 font-medium text-xl mb-2">
                                Cep Telefonu
                            </label>
                            <InputText id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="05XXXXXXXXX" className="w-full mb-4" style={{ padding: '1rem' }} />

                            {otpSent && (
                                <>
                                    <label htmlFor="otp" className="block text-900 font-medium text-xl mb-2">SMS Doğrulama Kodu</label>
                                    <InputText id="otp" value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="6 haneli kod" className="w-full mb-3" style={{ padding: '1rem' }} />
                                    <small className="block text-600 mb-4">Prototip kodu: {demoCode}</small>
                                </>
                            )}
                            {message && <Message severity={message.severity} text={message.text} className="w-full mb-4" />}
                            {!otpSent ? (
                                <Button label="SMS Kodu Gönder" icon="pi pi-mobile" className="w-full p-3 text-xl" loading={loading} onClick={() => submitAuth('request-otp')} />
                            ) : (
                                <Button label={mode === 'register' ? 'Kaydı Tamamla' : 'Giriş Yap'} icon="pi pi-check" className="w-full p-3 text-xl" loading={loading} onClick={() => submitAuth(mode)} />
                            )}
                            <div className="text-center mt-4 text-600 text-sm">
                                Kart ID kurum personel kaydında bulunmalı ve telefon numarası eşleşmelidir.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
