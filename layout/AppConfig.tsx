'use client';

import { PrimeReactContext } from 'primereact/api';
import { RadioButton, RadioButtonChangeEvent } from 'primereact/radiobutton';
import { Sidebar } from 'primereact/sidebar';
import React, { useContext, useEffect } from 'react';
import { AppConfigProps, LayoutConfig, LayoutState } from '@/types';
import { LayoutContext } from './context/layoutcontext';

const themeCookieName = 'selectedTheme';

const saveThemeCookie = (theme: string, colorScheme: string) => {
    document.cookie = `${themeCookieName}=${encodeURIComponent(JSON.stringify({ theme, colorScheme }))}; path=/; max-age=31536000; SameSite=Lax`;
};

const readThemeCookie = () => {
    const cookie = document.cookie.split('; ').find((item) => item.startsWith(`${themeCookieName}=`));
    if (!cookie) return null;

    try {
        return JSON.parse(decodeURIComponent(cookie.substring(themeCookieName.length + 1))) as { theme: string; colorScheme: string };
    } catch {
        return null;
    }
};

const AppConfig = (props: AppConfigProps) => {
    const { layoutConfig, setLayoutConfig, layoutState, setLayoutState } = useContext(LayoutContext);
    const { setRipple, changeTheme } = useContext(PrimeReactContext);

    const onConfigButtonClick = () => {
        setLayoutState((prevState: LayoutState) => ({ ...prevState, configSidebarVisible: true }));
    };

    const onConfigSidebarHide = () => {
        setLayoutState((prevState: LayoutState) => ({ ...prevState, configSidebarVisible: false }));
    };

    const changeMenuMode = (e: RadioButtonChangeEvent) => {
        setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, menuMode: e.value }));
    };

    const _changeTheme = (theme: string, colorScheme: string) => {
        saveThemeCookie(theme, colorScheme);
        changeTheme?.(layoutConfig.theme, theme, 'theme-css', () => {
            setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, theme, colorScheme }));
        });
    };

    useEffect(() => {
        setRipple?.(true);
        setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, inputStyle: 'outlined', ripple: true }));

        const savedTheme = readThemeCookie();
        if (savedTheme?.theme && savedTheme.colorScheme) {
            changeTheme?.(layoutConfig.theme, savedTheme.theme, 'theme-css', () => {
                setLayoutConfig((prevState: LayoutConfig) => ({ ...prevState, theme: savedTheme.theme, colorScheme: savedTheme.colorScheme }));
            });
        }
    }, [setLayoutConfig, setRipple]);

    return (
        <>
            <button className="layout-config-button config-link" type="button" onClick={onConfigButtonClick}>
                <i className="pi pi-cog"></i>
            </button>

            <Sidebar visible={layoutState.configSidebarVisible} onHide={onConfigSidebarHide} position="right" className="layout-config-sidebar w-20rem">
                {!props.simple && (
                    <>
                        <h5>Menu Type</h5>
                        <div className="flex">
                            <div className="field-radiobutton flex-1">
                                <RadioButton name="menuMode" value={'static'} checked={layoutConfig.menuMode === 'static'} onChange={(e) => changeMenuMode(e)} inputId="mode1"></RadioButton>
                                <label htmlFor="mode1">Static</label>
                            </div>
                            <div className="field-radiobutton flex-1">
                                <RadioButton name="menuMode" value={'overlay'} checked={layoutConfig.menuMode === 'overlay'} onChange={(e) => changeMenuMode(e)} inputId="mode2"></RadioButton>
                                <label htmlFor="mode2">Overlay</label>
                            </div>
                        </div>

                    </>
                )}
                <h5>PrimeOne Design</h5>
                <small className="block text-600 mb-2">Lara temaları: açık ve koyu renk seçenekleri</small>
                <div className="grid">
                    <div className="col-3 flex flex-column align-items-center gap-1">
                        <button title="Lara Indigo - Açık" aria-label="Lara Indigo - Açık" className="p-link w-2rem h-2rem" onClick={() => _changeTheme('lara-light-indigo', 'light')}>
                            <img src="/layout/images/themes/lara-light-indigo.png" className="w-2rem h-2rem" alt="Lara Light Indigo" />
                        </button>
                        <small className="text-center text-600">Indigo Açık</small>
                    </div>
                    <div className="col-3 flex flex-column align-items-center gap-1">
                        <button title="Lara Mavi - Açık" aria-label="Lara Mavi - Açık" className="p-link w-2rem h-2rem" onClick={() => _changeTheme('lara-light-blue', 'light')}>
                            <img src="/layout/images/themes/lara-light-blue.png" className="w-2rem h-2rem" alt="Lara Light Blue" />
                        </button>
                        <small className="text-center text-600">Mavi Açık</small>
                    </div>
                    <div className="col-3 flex flex-column align-items-center gap-1">
                        <button title="Lara Mor - Açık" aria-label="Lara Mor - Açık" className="p-link w-2rem h-2rem" onClick={() => _changeTheme('lara-light-purple', 'light')}>
                            <img src="/layout/images/themes/lara-light-purple.png" className="w-2rem h-2rem" alt="Lara Light Purple" />
                        </button>
                        <small className="text-center text-600">Mor Açık</small>
                    </div>
                    <div className="col-3 flex flex-column align-items-center gap-1">
                        <button title="Lara Turkuaz - Açık" aria-label="Lara Turkuaz - Açık" className="p-link w-2rem h-2rem" onClick={() => _changeTheme('lara-light-teal', 'light')}>
                            <img src="/layout/images/themes/lara-light-teal.png" className="w-2rem h-2rem" alt="Lara Light Teal" />
                        </button>
                        <small className="text-center text-600">Turkuaz Açık</small>
                    </div>
                    <div className="col-3 flex flex-column align-items-center gap-1">
                        <button title="Lara Indigo - Koyu" aria-label="Lara Indigo - Koyu" className="p-link w-2rem h-2rem" onClick={() => _changeTheme('lara-dark-indigo', 'dark')}>
                            <img src="/layout/images/themes/lara-dark-indigo.png" className="w-2rem h-2rem" alt="Lara Dark Indigo" />
                        </button>
                        <small className="text-center text-600">Indigo Koyu</small>
                    </div>
                    <div className="col-3 flex flex-column align-items-center gap-1">
                        <button title="Lara Mavi - Koyu" aria-label="Lara Mavi - Koyu" className="p-link w-2rem h-2rem" onClick={() => _changeTheme('lara-dark-blue', 'dark')}>
                            <img src="/layout/images/themes/lara-dark-blue.png" className="w-2rem h-2rem" alt="Lara Dark Blue" />
                        </button>
                        <small className="text-center text-600">Mavi Koyu</small>
                    </div>
                </div>
            </Sidebar>
        </>
    );
};

export default AppConfig;
