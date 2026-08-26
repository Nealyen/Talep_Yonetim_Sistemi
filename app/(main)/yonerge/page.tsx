'use client';

import React from 'react';
import { Card } from 'primereact/card';

const YonergePage = () => {
    return (
        <div className="grid">
            <div className="col-12">
                <Card title="Kurumsal Arıza ve Talep Yönetim Yönergesi" subTitle="Resmi standartlar ve Hizmet Seviyesi Taahhütleri (SLA)">
                    <div className="line-height-3 text-700">
                        <h6 className="font-bold text-900">Madde 1: Aciliyet ve Müdahale Süreleri (SLA)</h6>
                        <ul className="mb-4">
                            <li><strong>Kritik Seviye:</strong> Tüm laboratuvar veya kurum operasyonunu durduran arızalara en geç <strong>2 saat</strong> içinde müdahale zorunludur.</li>
                            <li><strong>Yüksek Seviye:</strong> Birim çalışmasını aksatan problemlere <strong>8 iş saati</strong> içinde müdahale edilir.</li>
                            <li><strong>Normal / Düşük Seviye:</strong> Rutin işlemler <strong>3 iş günü</strong> içerisinde sonuçlandırılır.</li>
                        </ul>

                        <h6 className="font-bold text-900">Madde 2: Denetim ve Kayıt Zorunluluğu</h6>
                        <p className="mb-4">
                            Sistem üzerinden açılmayan hiçbir fiziki veya şifahi talep işleme alınmaz. Her müdahale operatör siciliyle zaman damgalı olarak denetim kütüğüne işlenir.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default YonergePage;