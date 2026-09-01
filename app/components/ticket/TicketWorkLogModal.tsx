import React, { useEffect, useMemo, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Ticket, WorkLog } from '@/layout/context/TicketContext';
import { calculateBusinessTime, parseTurkishDate } from '@/utils/ticketHelpers';

export interface TicketWorkLogUser {
  fullName: string;
  role?: string;
}

export interface TicketWorkLogModalProps {
  visible: boolean;
  ticket: Ticket | null;
  currentUser: { fullName: string };
  eligibleTechnicians: TicketWorkLogUser[];
  onHide: () => void;
  onAction: (action: 'addWorkLog' | 'requestApproval' | 'close', payload?: { workLog?: WorkLog; ticketId?: string | null }) => void;
}

export const TicketWorkLogModal = ({
  visible,
  ticket,
  currentUser,
  eligibleTechnicians,
  onHide,
  onAction,
}: TicketWorkLogModalProps) => {
  const [isDifferentUser, setIsDifferentUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TicketWorkLogUser>(currentUser as TicketWorkLogUser);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [manualDays, setManualDays] = useState(0);
  const [manualHours, setManualHours] = useState(0);
  const [manualMins, setManualMins] = useState(0);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!visible || !ticket) return;

    const history = ticket.history || [];
    const userHistory = history.filter((h) => h.user === currentUser.fullName);
    const assignmentDate = userHistory.length > 0 ? parseTurkishDate(userHistory[0].date) : parseTurkishDate(ticket.createdAt);
    const calculatedEndDate = new Date();
    const calc = calculateBusinessTime(assignmentDate, calculatedEndDate);

    setIsDifferentUser(false);
    setSelectedUser(currentUser as TicketWorkLogUser);
    setStartDate(assignmentDate);
    setEndDate(calculatedEndDate);
    setManualDays(calc.days);
    setManualHours(calc.hours);
    setManualMins(calc.mins);
    setDescription('');
  }, [visible, ticket, currentUser]);

  const durationParts = useMemo(() => {
    const parts: string[] = [];
    if (manualDays > 0) parts.push(`${manualDays} Gün`);
    if (manualHours > 0) parts.push(`${manualHours} Saat`);
    if (manualMins > 0) parts.push(`${manualMins} Dk`);
    return parts;
  }, [manualDays, manualHours, manualMins]);

  const visibleTechnicians = useMemo(
    () => eligibleTechnicians.filter((person) => person.fullName !== currentUser.fullName),
    [eligibleTechnicians, currentUser.fullName]
  );

  const handleDateChange = (field: 'startDate' | 'endDate', value: Date | null) => {
    if (field === 'startDate') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }

    if (startDate && endDate) {
      const effectiveStart = field === 'startDate' ? value : startDate;
      const effectiveEnd = field === 'endDate' ? value : endDate;

      if (effectiveStart && effectiveEnd) {
        const calc = calculateBusinessTime(effectiveStart, effectiveEnd);
        setManualDays(calc.days);
        setManualHours(calc.hours);
        setManualMins(calc.mins);
      }
    }
  };

  const handleSave = () => {
    if (!startDate || !endDate) return;
    if (endDate.getTime() <= startDate.getTime()) return;

    const targetUser = isDifferentUser ? selectedUser : currentUser;
    const newLog: WorkLog = {
      id: `${Date.now()}`,
      fullName: targetUser.fullName,
      sicilNo: '',
      startDate: startDate.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      endDate: endDate.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      durationStr: durationParts.join(' ') || '0 Dk',
      description: description.trim() || undefined,
      status: isDifferentUser ? 'PENDING' : undefined,
      requestedBy: isDifferentUser ? currentUser.fullName : undefined,
    };

    if (isDifferentUser) {
      onAction('requestApproval', { workLog: newLog, ticketId: ticket?.id ?? null });
      return;
    }

    onAction('addWorkLog', { workLog: newLog, ticketId: ticket?.id ?? null });
  };

  return (
    <Dialog
      header="Mesai / Çalışma Kaydı Ekle"
      visible={visible}
      style={{ width: '480px', maxWidth: '95vw' }}
      dismissableMask
      onHide={onHide}
    >
      <div className="flex flex-column gap-3">
        <div className="flex align-items-center gap-2">
          <Checkbox
            inputId="diffUser"
            checked={isDifferentUser}
            onChange={(e) => setIsDifferentUser(e.checked ?? false)}
          />
          <label htmlFor="diffUser" className="font-medium">Başka bir kullanıcı için ekle</label>
        </div>

        {isDifferentUser && (
          <div>
            <label className="font-bold mb-2 block">Personel Seçimi</label>
            <Dropdown
              value={selectedUser.fullName}
              options={visibleTechnicians}
              optionLabel="fullName"
              optionValue="fullName"
              onChange={(e) => setSelectedUser({ fullName: e.value })}
              placeholder="Personel Seçin"
              className="w-full"
            />
          </div>
        )}

        <div className="grid">
          <div className="col-12 md:col-6">
            <label className="font-bold block mb-2">Başlangıç</label>
            <Calendar
              value={startDate}
              onChange={(e) => handleDateChange('startDate', e.value as Date | null)}
              showTime
              hourFormat="24"
              showIcon
              className="w-full"
            />
          </div>

          <div className="col-12 md:col-6">
            <label className="font-bold block mb-2">Bitiş</label>
            <Calendar
              value={endDate}
              onChange={(e) => handleDateChange('endDate', e.value as Date | null)}
              showTime
              hourFormat="24"
              showIcon
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="font-bold mb-2 block">Manuel Süre Girişi</label>
          <div className="grid">
            <div className="col-4">
              <InputNumber value={manualDays} onValueChange={(e) => setManualDays(e.value || 0)} showButtons min={0} />
            </div>
            <div className="col-4">
              <InputNumber value={manualHours} onValueChange={(e) => setManualHours(e.value || 0)} showButtons min={0} />
            </div>
            <div className="col-4">
              <InputNumber value={manualMins} onValueChange={(e) => setManualMins(e.value || 0)} showButtons min={0} max={59} />
            </div>
          </div>
        </div>

        <div>
          <label className="font-bold mb-2 block">Yapılan İşlem / Açıklama (Information)</label>
          <InputTextarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            autoResize
            className="w-full"
            placeholder="Yapılan işlem, yapılan inceleme veya not..."
          />
        </div>

        <div className="flex justify-content-end gap-2 mt-2">
          <Button label="İptal" severity="secondary" onClick={onHide} />
          <Button label="Listeye Ekle" severity="success" icon="pi pi-plus" onClick={handleSave} />
        </div>
      </div>
    </Dialog>
  );
};

export default TicketWorkLogModal;
