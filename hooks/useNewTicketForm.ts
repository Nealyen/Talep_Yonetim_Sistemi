'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast } from 'primereact/toast';
import { useTickets } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { CATEGORY_DATA } from '@/constants/newTicketOptions';

/**
 * "Yeni Talep" formunun tüm state'i ve gönderim mantığı.
 * Önceden 370 satırlık page.tsx içine gömülüydü.
 */
export const useNewTicketForm = () => {
    const router = useRouter();
    const { addTicket } = useTickets();
    const { currentUser } = useUser();
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

    const categoryOptions = Object.keys(CATEGORY_DATA).map((key) => ({ label: key, value: key }));
    const subCategoryOptions = category ? CATEGORY_DATA[category].map((item) => ({ label: item, value: item })) : [];

    const isPrinterSelected = category === 'YAZICILAR/TARAYICILAR';

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
        const structuredDetails = `
Bilgisayar Adı: ${pcName}
IP Numarası: ${ipAddress}
Ulaşılacak Dahili: ${contactExt}
Cep Tel: ${mobile}
Oda No: ${roomNo}${isPrinterSelected && barcodeNo ? `\nCihaz Barkod No: ${barcodeNo}` : ''}

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
            requester: currentUser.fullName
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
