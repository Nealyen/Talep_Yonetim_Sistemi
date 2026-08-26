/* eslint-disable @next/next/no-img-element */

import React, { useContext } from 'react';
import { LayoutContext } from './context/layoutcontext';

const AppFooter = () => {
    const { layoutConfig } = useContext(LayoutContext);

    return (
        <div className="layout-footer">
            <span className="font-medium ml-2">
                Kurumsal Arıza ve Talep Yönetim Portalı &copy; 2026 | ISO 20000 & ITIL Standartlarına Uygundur
            </span>
        </div>
    );
};

export default AppFooter;