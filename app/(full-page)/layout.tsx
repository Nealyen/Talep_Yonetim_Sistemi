/**
 * DOSYA: (full-page) Rota Grubu Layout'u
 * NE İŞE YARAR: /landing, /auth/access, /auth/error, /pages/notfound gibi "tam sayfa"
 * (kenar çubuğu/topbar olmayan) rotaların ortak sarmalayıcısı. Sadece AppConfig
 * (tema ayarları sidebar'ı) render eder, başka bir şey eklemez.
 */

import { Metadata } from 'next';
import AppConfig from '../../layout/AppConfig';
import React from 'react';

interface SimpleLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: 'PrimeReact Sakai',
    description: 'The ultimate collection of design-agnostic, flexible and accessible React UI Components.'
};

export default function SimpleLayout({ children }: SimpleLayoutProps) {
    return (
        <React.Fragment>
            {children}
            <AppConfig simple />
        </React.Fragment>
    );
}
