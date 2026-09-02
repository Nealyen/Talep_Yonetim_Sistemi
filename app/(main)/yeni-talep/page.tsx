'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { useNewTicketForm } from '@/hooks/useNewTicketForm';
import { RequesterInfoSection } from '@/components/forms/newTicket/RequesterInfoSection';
import { CategorySelectionSection } from '@/components/forms/newTicket/CategorySelectionSection';
import { TicketDetailsSection } from '@/components/forms/newTicket/TicketDetailsSection';

const YeniTalepPage = () => {
    const {
        toast,
        currentUser,
        category,
        setCategory,
        subCategory,
        setSubCategory,
        pcName,
        setPcName,
        ipAddress,
        setIpAddress,
        contactExt,
        setContactExt,
        mobile,
        setMobile,
        roomNo,
        setRoomNo,
        barcodeNo,
        setBarcodeNo,
        description,
        setDescription,
        isSubmitting,
        categoryOptions,
        subCategoryOptions,
        isPrinterSelected,
        handleSubmit,
        goToMyTickets
    } = useNewTicketForm();

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12 lg:col-10 lg:col-offset-1">
                <Card title="İş Talep Sistemi" subTitle="BİLGİ TEKNOLOJİLERİ MÜDÜRLÜĞÜ (BTM)">
                    <form onSubmit={handleSubmit} className="p-fluid">
                        <RequesterInfoSection currentUser={currentUser} />

                        <CategorySelectionSection
                            category={category}
                            subCategory={subCategory}
                            categoryOptions={categoryOptions}
                            subCategoryOptions={subCategoryOptions}
                            onCategoryChange={setCategory}
                            onSubCategoryChange={setSubCategory}
                        />

                        <TicketDetailsSection
                            pcName={pcName}
                            onPcNameChange={setPcName}
                            ipAddress={ipAddress}
                            onIpAddressChange={setIpAddress}
                            contactExt={contactExt}
                            onContactExtChange={setContactExt}
                            mobile={mobile}
                            onMobileChange={setMobile}
                            roomNo={roomNo}
                            onRoomNoChange={setRoomNo}
                            barcodeNo={barcodeNo}
                            onBarcodeNoChange={setBarcodeNo}
                            description={description}
                            onDescriptionChange={setDescription}
                            isPrinterSelected={isPrinterSelected}
                        />

                        <div className="flex justify-content-start gap-3 mt-4">
                            <Button label="Talebi Gönder" icon="pi pi-check" type="submit" severity="success" outlined loading={isSubmitting} className="w-auto px-5" />
                            <Button label="İptal" icon="pi pi-times" type="button" severity="danger" outlined onClick={goToMyTickets} className="w-auto px-5" />
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default YeniTalepPage;
