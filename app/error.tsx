'use client';

import React from 'react';
import { Button } from 'primereact/button';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang="tr">
            <body>
                <main className="surface-ground min-h-screen flex align-items-center justify-content-center p-4">
                    <section className="surface-card p-5 border-round text-center shadow-2" role="alert">
                        <i className="pi pi-exclamation-triangle text-orange-500 text-4xl mb-3" />
                        <h1 className="text-900">Uygulama bağlantısı kesildi</h1>
                        <p className="text-600">Sayfa yüklenirken beklenmeyen bir hata oluştu. Tekrar deneyin.</p>
                        <Button label="Tekrar Dene" icon="pi pi-refresh" onClick={() => reset()} />
                    </section>
                </main>
            </body>
        </html>
    );
}