'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Accordion, AccordionTab } from 'primereact/accordion';

const SSSPage = () => {
    return (
        <div className="grid">
            <div className="col-12">
                <Card title="Sıkça Sorulan Sorular (SSS) & Kullanıcı Rehberi">
                    <Accordion activeIndex={0}>
                        <AccordionTab header="Talep açtıktan sonra süreç nasıl ilerler?">
                            <p className="m-0 line-height-3">
                                Açılan her talep doğrudan Süreç Koordinatörü havuzuna düşer. Talep türüne göre ilgili teknik personele atanır veya teknik personel işi havuzdan üzerine alır. İşlem tamamlandığında talep sahibine doğrulama onayı gönderilir.
                            </p>
                        </AccordionTab>
                        <AccordionTab header="Karşılıklı Onay (Two-Way Handshake) nedir?">
                            <p className="m-0 line-height-3">
                                Teknik personelin işi &quot;Tamamlandı&quot; olarak bildirmesi talebi kapatmaz. Talep sahibi &apos;Taleplerim&apos; ekranından çözümü bizzat test edip yeşil onay butonuna basana kadar işlem resmi olarak kapanmış sayılmaz.
                            </p>
                        </AccordionTab>
                        <AccordionTab header="Sorun çözülmediyse ne yapmalıyım?">
                            <p className="m-0 line-height-3">
                                Talep onay beklerken kırmızı &apos;Sorun Sürüyor&apos; butonuna basarak gerekçe belirtebilirsiniz. Bu durumda talep otomatik olarak yeniden işlem statüsüne alınır ve koordinatörün dikkatine sunulur.
                            </p>
                        </AccordionTab>
                    </Accordion>
                </Card>
            </div>
        </div>
    );
};

export default SSSPage;