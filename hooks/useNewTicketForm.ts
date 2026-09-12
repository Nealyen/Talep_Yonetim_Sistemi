'use client';

/**
 * HOOK: Yeni Talep Oluştur formunun TÜM state ve gönderim mantığı.
 * NE İŞE YARAR: Form alanlarının state'i, CategoryContext'ten kategori/alt kategori
 * seçeneklerinin çekilmesi, gönderim sırasında seçilen alt başlığın Kategori
 * Yönetimi'nde atanmış olduğu ekibe talebin otomatik yönlendirilmesi.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { useTickets } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { useCategories } from '@/layout/context/CategoryContext';

/**
 * "Yeni Talep" formunun tüm state'i ve gönderim mantığı.
 * Önceden 370 satırlık page.tsx içine gömülüydü.
 */
export const useNewTicketForm = () => {
    const router = useRouter();
    const { addTicket } = useTickets();
    const { currentUser } = useUser();
    const { ustBasliklar, items } = useCategories();
    const toast = useRef<Toast>(null);

    const [category, setCategory] = useState<string>('');
    const [subCategory, setSubCategory] = useState<string>('');

    const [pcName, setPcName] = useState('MAM-1907SV.MAM.GOV.TR');
    const [ipAddress, setIpAddress] = useState('09.9.3.07');
    const [contactExt, setContactExt] = useState(currentUser.dahili);
    const [mobile, setMobile] = useState('');
    const [roomNo, setRoomNo] = useState('');
    const [barcodeNo, setBarcodeNo] = useState('');
    const [description, setDescription] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitLock = useRef(false);

    // Aktif kullanıcı değiştiğinde formdaki dahili numarasını senkronize et
    useEffect(() => {
        setContactExt(currentUser.dahili);
    }, [currentUser]);

    // KURAL: Kategori listesi artık statik değil, Kategori Yönetimi sayfasından (Admin)
    // canlı olarak yönetiliyor. "Pasif" işaretlenen alt başlıklar (ve tamamı pasif olan
    // üst başlıklar) bu formda hiç görünmez.
    const activeItemsByUstBaslik = (ust: string) => items.filter((item) => item.ustBaslik === ust && !item.pasif);

    const categoryOptions = ustBasliklar.filter((ust) => activeItemsByUstBaslik(ust).length > 0).map((ust) => ({ label: ust, value: ust }));

    const subCategoryOptions = category ? activeItemsByUstBaslik(category).map((item) => ({ label: item.altBaslik, value: item.altBaslik })) : [];

    const isPrinterSelected = /YAZICI/i.test(category);

    const onCategoryChange = (value: string) => {
        setCategory(value);
        setSubCategory('');
        setBarcodeNo('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (submitLock.current) return;

        if (!category || !subCategory) {
            toast.current?.show({ severity: 'warn', summary: 'Eksik Seçim', detail: 'Ana kategori ve alt tür seçimi zorunludur.', life: 3000 });
            return;
        }

        if (isPrinterSelected && !barcodeNo) {
            toast.current?.show({ severity: 'warn', summary: 'Eksik Barkod', detail: 'Lütfen işlem yapılacak cihazın barkod numarasını seçiniz.', life: 3000 });
            return;
        }

        submitLock.current = true;
        setIsSubmitting(true);

        const generatedTitle = `[${category}] ${subCategory}`;

        // KURAL: Kategori Yönetimi sayfasında bu alt başlığa bir ekip atanmışsa, bu bilgi
        // talep detayına "Önerilen Ekip" olarak ekleniyor. Bu, henüz otomatik bir atama
        // motoru değil (talepler hâlâ havuzdan elle üstlenilir/atanır) — sadece koordinatörün
        // "bu iş hangi ekibe ait" bilgisini talebi açar açmaz görebilmesi içindir.
        const matchedItem = items.find((item) => item.ustBaslik === category && item.altBaslik === subCategory);
        const onerilenEkipLine = matchedItem?.ekip ? `\nÖnerilen Ekip: ${matchedItem.ekip}` : '';

        const structuredDetails = `
Bilgisayar Adı: ${pcName}
IP Numarası: ${ipAddress}
Ulaşılacak Dahili: ${contactExt}
Cep Tel: ${mobile}
Oda No: ${roomNo}${isPrinterSelected && barcodeNo ? `\nCihaz Barkod No: ${barcodeNo}` : ''}${onerilenEkipLine}

Açıklamalar:
${description}
        `.trim();

        const mappedCategory = ['Donanım/Arıza', 'Yazılım/Erişim', 'İdari Hizmet', 'Güvenlik'].includes(category) ? category : 'Donanım/Arıza';

        const created = await addTicket({
            title: generatedTitle,
            category: mappedCategory as any,
            priority: 'Normal',
            description: structuredDetails,
            location: roomNo,
            requester: currentUser.fullName,
            team: matchedItem?.ekip || undefined
        });

        if (!created) {
            submitLock.current = false;
            setIsSubmitting(false);
            toast.current?.show({ severity: 'error', summary: 'Talep Oluşturulamadı', detail: 'İşlem başarısız oldu.', life: 3000 });
            return;
        }

        toast.current?.show({ severity: 'success', summary: 'Kayıt Oluşturuldu', detail: 'Talebiniz başarıyla iletildi.', life: 2000 });
        setTimeout(() => router.push('/taleplerim'), 1200);
    };

    return {
        toast,
        currentUser,
        category,
        setCategory: onCategoryChange,
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
        goToMyTickets: () => router.push('/taleplerim')
    };
};

export default useNewTicketForm;
