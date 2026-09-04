'use client';

import { useContext, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import AppTopbar from './AppTopbar';
import AppSidebar from './AppSidebar';
import AppFooter from './AppFooter';
import AppConfig from './AppConfig';
import { LayoutContext } from './context/layoutcontext';
import { UserProvider } from '@/layout/context/UserContext';
import { TeamProvider } from '@/layout/context/TeamContext';
import { TicketProvider } from '@/layout/context/TicketContext'; // EKSİK OLAN PROVIDER EKLENDİ
import { PrimeReactContext } from 'primereact/api';
import { useEventListener } from 'primereact/hooks';
import { classNames } from 'primereact/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
    const { layoutConfig, layoutState, setLayoutState } = useContext(LayoutContext);
    const { setRipple } = useContext(PrimeReactContext);
    
    const topbarRef = useRef<any>(null);
    const sidebarRef = useRef<any>(null);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [bindMenuListener, unbindMenuListener] = useEventListener({
        type: 'click',
        listener: (event: any) => {
            const isOutsideClicked = !(
                sidebarRef.current?.isSameNode(event.target) ||
                sidebarRef.current?.contains(event.target) ||
                topbarRef.current?.menubutton?.isSameNode(event.target) ||
                topbarRef.current?.menubutton?.contains(event.target)
            );

            if (isOutsideClicked) {
                hideMenu();
            }
        }
    });

    const hideMenu = () => {
        setLayoutState((prevLayoutState: any) => ({
            ...prevLayoutState,
            overlayMenuActive: false,
            staticMenuMobileActive: false,
            menuHoverActive: false
        }));
        unbindMenuListener();
    };

    useEffect(() => {
        hideMenu();
    }, [pathname, searchParams]);

    const containerClass = classNames('layout-wrapper', {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive,
        'p-input-filled': layoutConfig.inputStyle === 'filled',
        'p-ripple-disabled': !layoutConfig.ripple
    });

    return (
        <UserProvider>
            <TeamProvider>
            <TicketProvider> {/* TICKET PROVIDER SİSTEME GERİ DAHİL EDİLDİ */}
                <div className={containerClass}>
                    <AppTopbar ref={topbarRef} />
                    <div ref={sidebarRef} className="layout-sidebar">
                        <AppSidebar />
                    </div>
                    <div className="layout-main-container">
                        <div className="layout-main">{children}</div>
                        <AppFooter />
                    </div>
                    <AppConfig />
                    <div className="layout-mask"></div>
                </div>
            </TicketProvider>
            </TeamProvider>
        </UserProvider>
    );
}