'use client';

import React from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { BARCODE_OPTIONS } from '@/constants/newTicketOptions';

export interface TicketDetailsSectionProps {
    pcName: string;
    onPcNameChange: (value: string) => void;
    ipAddress: string;
    onIpAddressChange: (value: string) => void;
    contactExt: string;
    onContactExtChange: (value: string) => void;
    mobile: string;
    onMobileChange: (value: string) => void;
    roomNo: string;
    onRoomNoChange: (value: string) => void;
    barcodeNo: string;
    onBarcodeNoChange: (value: string) => void;
    description: string;
    onDescriptionChange: (value: string) => void;
    isPrinterSelected: boolean;
}

const labelStyle: React.CSSProperties = { minHeight: '2.5rem', display: 'flex', alignItems: 'flex-end', paddingBottom: '0.25rem' };

export const TicketDetailsSection = ({
    pcName,
    onPcNameChange,
    ipAddress,
    onIpAddressChange,
    contactExt,
    onContactExtChange,
    mobile,
    onMobileChange,
    roomNo,
    onRoomNoChange,
    barcodeNo,
    onBarcodeNoChange,
    description,
    onDescriptionChange,
    isPrinterSelected
}: TicketDetailsSectionProps) => (
    <div className="surface-card p-4 border-round mb-4 border-1 surface-border">
        <div className="text-primary font-bold mb-3 text-lg pb-2 border-bottom-1 surface-border">TALEP BİLGİLERİ</div>
        <div className="formgrid grid">
            <div className={`field col-12 md:col-4 ${isPrinterSelected ? 'lg:col-2' : 'lg:col-3'}`}>
                <label className="font-bold block" style={labelStyle}>
                    Bilgisayar Adı
                </label>
                <InputText value={pcName} onChange={(e) => onPcNameChange(e.target.value)} required />
            </div>
            <div className={`field col-12 md:col-4 ${isPrinterSelected ? 'lg:col-2' : 'lg:col-3'}`}>
                <label className="font-bold block" style={labelStyle}>
                    IP Numarası
                </label>
                <InputText value={ipAddress} onChange={(e) => onIpAddressChange(e.target.value)} required />
            </div>
            <div className={`field col-12 md:col-4 ${isPrinterSelected ? 'lg:col-2' : 'lg:col-2'}`}>
                <label className="font-bold block" style={labelStyle}>
                    Ulaşılacak Dahil No
                </label>
                <InputText value={contactExt} onChange={(e) => onContactExtChange(e.target.value)} required />
            </div>
            <div className={`field col-12 md:col-4 ${isPrinterSelected ? 'lg:col-2' : 'lg:col-2'}`}>
                <label className="font-bold block" style={labelStyle}>
                    Cep Tel No
                </label>
                <InputText value={mobile} onChange={(e) => onMobileChange(e.target.value)} required />
            </div>
            <div className={`field col-12 md:col-4 ${isPrinterSelected ? 'lg:col-2' : 'lg:col-2'}`}>
                <label className="font-bold block" style={labelStyle}>
                    İşin Yapılacağı Oda No
                </label>
                <InputText value={roomNo} onChange={(e) => onRoomNoChange(e.target.value)} required />
            </div>

            {isPrinterSelected && (
                <div className="field col-12 md:col-4 lg:col-2 relative">
                    <label className="font-bold block text-primary" style={labelStyle}>
                        Cihaz Barkod No
                    </label>
                    <Dropdown
                        value={barcodeNo}
                        options={BARCODE_OPTIONS}
                        onChange={(e) => onBarcodeNoChange(e.value)}
                        placeholder="Barkod Seçiniz"
                        filter
                        filterPlaceholder="Barkod Ara..."
                        emptyFilterMessage="Eşleşen barkod bulunamadı"
                        emptyMessage="Kayıtlı barkod yok"
                        panelClassName="always-bottom-panel"
                        appendTo="self"
                    />
                    <input
                        tabIndex={-1}
                        autoComplete="off"
                        style={{ opacity: 0, width: '100%', height: '1px', position: 'absolute', bottom: 0, left: 0, pointerEvents: 'none' }}
                        value={barcodeNo}
                        required
                        onChange={() => {}}
                    />
                </div>
            )}

            <div className="field col-12 mt-3">
                <label className="font-bold block text-center mb-2">
                    Talebe İlişkin Açıklamalar (Talebinize ilişkin ayrıntıları ve açıklamaları buraya yazınız.)
                </label>
                <InputTextarea value={description} onChange={(e) => onDescriptionChange(e.target.value)} rows={6} />
            </div>

            <div className="field col-12 mt-3">
                <div className="flex align-items-center">
                    <label className="font-bold mr-3">Dosyalar</label>
                    <FileUpload
                        mode="basic"
                        name="demo[]"
                        url="/api/upload"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        maxFileSize={30000000}
                        chooseLabel="Ekle"
                    />
                </div>
                <small className="text-red-500 font-bold block mt-2">* Dosya boyutu en fazla 30 Megabyte olmalıdır.</small>
            </div>
        </div>
    </div>
);

export default TicketDetailsSection;
