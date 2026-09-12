'use client';

/**
 * DOSYA: Kök (Root) Layout — Next.js App Router'ın zorunlu en üst seviye layout'u.
 * NE İŞE YARAR: PrimeReact'in global CSS'lerini (primereact.css, primeflex.css,
 * primeicons.css) ve projenin kendi SCSS dosyalarını (layout.scss, Demos.scss) yükler,
 * PrimeReactProvider ve LayoutProvider (tema/renk şeması state'i) ile sarmalar.
 * Kullanıcı/Ekip/Kategori/Ticket context'leri BURADA DEĞİL, layout/layout.tsx
 * içindedir (sadece (main) rota grubunda ihtiyaç duyulduğu için).
 */

import { LayoutProvider } from '../layout/context/layoutcontext';
import { PrimeReactProvider } from 'primereact/api';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
import '../styles/demo/Demos.scss';

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
               <link id="theme-css" href={`/themes/lara-dark-indigo/theme.css`} rel="stylesheet" />
            </head>
            <body>
                <PrimeReactProvider>
                    <LayoutProvider>{children}</LayoutProvider>
                </PrimeReactProvider>
            </body>
        </html>
    );
}
