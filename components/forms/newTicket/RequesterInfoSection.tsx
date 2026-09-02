'use client';

import React from 'react';
import { InputText } from 'primereact/inputtext';
import { AppUser } from '@/layout/context/UserContext';

export interface RequesterInfoSectionProps {
    currentUser: AppUser;
}

export const RequesterInfoSection = ({ currentUser }: RequesterInfoSectionProps) => (
    <div className="surface-card p-4 border-round mb-4 border-1 surface-border">
        <div className="text-primary font-bold mb-3 text-lg pb-2 border-bottom-1 surface-border">TALEP EDEN BİLGİLERİ</div>
        <div className="formgrid grid">
            <div className="field col-12 md:col-6 lg:col-4">
                <label className="font-bold">Personelin Adı Soyadı</label>
                <InputText value={currentUser.fullName} readOnly disabled />
            </div>
            <div className="field col-12 md:col-6 lg:col-4">
                <label className="font-bold">Sicil No</label>
                <InputText value={currentUser.sicilNo} readOnly disabled />
            </div>
            <div className="field col-12 md:col-6 lg:col-4">
                <label className="font-bold">Ünvan</label>
                <InputText value={currentUser.title} readOnly disabled />
            </div>
            <div className="field col-12 md:col-6 lg:col-4">
                <label className="font-bold">E-Posta Adresi</label>
                <InputText value={currentUser.email} readOnly disabled />
            </div>
            <div className="field col-12 md:col-6 lg:col-4">
                <label className="font-bold">Dahili No</label>
                <InputText value={currentUser.dahili} readOnly disabled />
            </div>
            <div className="field col-12 md:col-6 lg:col-4">
                <label className="font-bold">Oluşturma Tarihi</label>
                <InputText
                    value={new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    readOnly
                    disabled
                />
            </div>
        </div>
    </div>
);

export default RequesterInfoSection;
