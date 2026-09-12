'use client';

/**
 * SAYFA: Kategori Yönetimi — Rota: "/kategori-yonetimi"
 * KİMLER GÖREBİLİR: ADMIN.
 * NE İŞE YARAR: "Yeni Talep Oluştur" formunun besleneceği Üst Başlık / Alt Başlık kataloğu
 * ve her alt başlığın otomatik yönlendirileceği ekibin tanımlandığı sayfa. Sol panelde Üst
 * Başlıklar (klasör mantığı), sağda seçili Üst Başlığın Alt Başlıkları listelenir.
 * DİKKAT: Alt Başlık artık serbest metin değil — constants/newTicketOptions.ts içindeki
 * resmî katalogdan (CATEGORY_DATA) seçilen bir dropdown'dır. Aynı üst başlıkta başka bir
 * satırda zaten kullanılan katalog değeri tekrar seçilemez (mükerrer kayıt önlenir).
 * Değişiklik confirmDialog ile onay ister. Süreç Ölçüm ve Pasif checkbox'ları vardır; Pasif
 * işaretlenen alt başlık "Yeni Talep Oluştur" formunda görünmez.
 * NOT: CATEGORY_DATA sadece SEED/başlangıç + katalog referans verisidir; asıl çalışan veri
 * CategoryContext üzerinden localStorage'da tutulur.
 */

import React from 'react';
import { Card } from 'primereact/card';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import { useKategoriYonetimi } from './hooks/useKategoriYonetimi';
import { UstBaslikListesi } from './components/UstBaslikListesi';
import { AltBaslikTablosu } from './components/AltBaslikTablosu';

const KategoriYonetimiPage = () => {
    const {
        teams,
        ustBaslikListesi,
        selectedUstBaslik,
        filteredItems,
        getAltBaslikOptions,
        newUstBaslikName,
        setNewUstBaslikName,
        ustBaslikError,
        newAltBaslikName,
        setNewAltBaslikName,
        altBaslikError,
        handleSelectUstBaslik,
        handleAddUstBaslik,
        handleDeleteUstBaslik,
        handleAddAltBaslik,
        handleAltBaslikSelect,
        handleTeamChange,
        handleToggleSurecOlcum,
        handleTogglePasif,
        handleDeleteAltBaslik
    } = useKategoriYonetimi();

    return (
        <RoleRouteGuard allowedRoles={['ADMIN']}>
            <div className="grid">
                <ConfirmDialog />
                <div className="col-12">
                    <Card
                        title="Kategori Yönetimi"
                        subTitle="Talep formundaki Üst Başlık / Alt Başlık listesi ve her alt başlığın otomatik yönlendirileceği ekip. Yalnızca Admin rolündeki hesaplar bu sayfayı görebilir."
                    >
                        <div className="grid">
                            <div className="col-12 lg:col-4">
                                <UstBaslikListesi
                                    items={ustBaslikListesi}
                                    selected={selectedUstBaslik}
                                    onSelect={handleSelectUstBaslik}
                                    newName={newUstBaslikName}
                                    onNewNameChange={setNewUstBaslikName}
                                    error={ustBaslikError}
                                    onAdd={handleAddUstBaslik}
                                    onDelete={handleDeleteUstBaslik}
                                />
                            </div>
                            <div className="col-12 lg:col-8">
                                <AltBaslikTablosu
                                    selectedUstBaslik={selectedUstBaslik}
                                    items={filteredItems}
                                    teams={teams}
                                    getAltBaslikOptions={getAltBaslikOptions}
                                    newAltBaslikName={newAltBaslikName}
                                    onNewAltBaslikNameChange={setNewAltBaslikName}
                                    error={altBaslikError}
                                    onAddAltBaslik={handleAddAltBaslik}
                                    onAltBaslikSelect={handleAltBaslikSelect}
                                    onTeamChange={handleTeamChange}
                                    onToggleSurecOlcum={handleToggleSurecOlcum}
                                    onTogglePasif={handleTogglePasif}
                                    onDeleteAltBaslik={handleDeleteAltBaslik}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </RoleRouteGuard>
    );
};

export default KategoriYonetimiPage;
