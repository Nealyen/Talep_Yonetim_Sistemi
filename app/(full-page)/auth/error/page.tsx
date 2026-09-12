/* eslint-disable @next/next/no-img-element */
'use client';

/**
 * SAYFA: Genel Hata Sayfası (Error) — Rota: "/auth/error"
 * KİMLER GÖREBİLİR: Herkes (bir hata durumunda yönlendirilebilecek statik sayfa).
 * NE İŞE YARAR: PrimeReact "Sakai" şablonundan gelen HAZIR bir genel hata sayfası. Şu an
 * projenin geri kalanında HİÇBİR YERDEN bu rotaya link/redirect verilmiyor — yani kodda
 * bağlı/kullanılan bir sayfa DEĞİL, ileride bir hata senaryosu için kullanılmaya hazır
 * bekleyen bir kalıp (template). "Go to Dashboard" butonu "/" ye yönlendirir. İçerik
 * tamamen statiktir, context/state kullanmaz.
 */

import { useRouter } from 'next/navigation';
import React from 'react';
import { Button } from 'primereact/button';

const ErrorPage = () => {
    const router = useRouter();

    return (
        <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
            <div className="flex flex-column align-items-center justify-content-center">
                <img src="/demo/images/error/logo-error.svg" alt="Sakai logo" className="mb-5 w-6rem flex-shrink-0" />
                <div
                    style={{
                        borderRadius: '56px',
                        padding: '0.3rem',
                        background: 'linear-gradient(180deg, rgba(233, 30, 99, 0.4) 10%, rgba(33, 150, 243, 0) 30%)'
                    }}
                >
                    <div className="w-full surface-card py-8 px-5 sm:px-8 flex flex-column align-items-center" style={{ borderRadius: '53px' }}>
                        <div className="flex justify-content-center align-items-center bg-pink-500 border-circle" style={{ height: '3.2rem', width: '3.2rem' }}>
                            <i className="pi pi-fw pi-exclamation-circle text-2xl text-white"></i>
                        </div>
                        <h1 className="text-900 font-bold text-5xl mb-2">Error Occured</h1>
                        <div className="text-600 mb-5">Something went wrong.</div>
                        <img src="/demo/images/error/asset-error.svg" alt="Error" className="mb-5" width="80%" />
                        <Button icon="pi pi-arrow-left" label="Go to Dashboard" text onClick={() => router.push('/')} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;
