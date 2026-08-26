import { promises as fs } from 'fs';
import path from 'path';

export type MockUserRole = 'TALEP_SAHIBI' | 'TEKNIK_UZMAN' | 'KOORDINATOR' | 'ADMIN';

export interface MockUser {
    id: string;
    cardId: string;
    name: string;
    phone: string;
    email: string;
    role: MockUserRole;
    department: string;
    status: 'AKTIF' | 'PASIF';
    registered: boolean;
    expertiseCategories?: ('Donanım/Arıza' | 'Yazılım/Erişim' | 'İdari Hizmet' | 'Güvenlik')[];
}

export interface EmployeeRegistryEntry {
    employeeId: string;
    cardId: string;
    phone: string;
    name: string;
    department: string;
    active: boolean;
}

export interface TicketHistoryRecord {
    date: string;
    action: string;
    user: string;
}

export interface TicketRecord {
    id: string;
    title: string;
    category: 'Donanım/Arıza' | 'Yazılım/Erişim' | 'İdari Hizmet' | 'Güvenlik';
    priority: 'Düşük' | 'Normal' | 'Yüksek' | 'Kritik';
    status: 'YENİ' | 'İNCELEMEDE' | 'İŞLEMDE' | 'ONAY_BEKLİYOR' | 'KAPATILDI' | 'REDDEDİLDİ';
    requester: string;
    assignee: string | null;
    description: string;
    location?: string;
    serialNo?: string;
    createdAt: string;
    history: TicketHistoryRecord[];
}

export interface AuditEntry {
    id: string;
    action: string;
    userId: string;
    ticketId?: string;
    date: string;
    detail: string;
}

const dataDirectory = path.join(process.cwd(), 'data');
let writeQueue = Promise.resolve();

const readJson = async <T>(fileName: string, fallback: T): Promise<T> => {
    try {
        const content = await fs.readFile(path.join(dataDirectory, fileName), 'utf8');
        return JSON.parse(content) as T;
    } catch {
        return fallback;
    }
};

const writeJson = async (fileName: string, data: unknown) => {
    const operation = writeQueue.then(async () => {
        await fs.mkdir(dataDirectory, { recursive: true });
        await fs.writeFile(path.join(dataDirectory, fileName), JSON.stringify(data, null, 2), 'utf8');
    });
    writeQueue = operation.catch(() => undefined);
    await operation;
};

export const getUsers = () => readJson<MockUser[]>('users.json', []);
export const saveUsers = (users: MockUser[]) => writeJson('users.json', users);
export const getEmployeeRegistry = () => readJson<EmployeeRegistryEntry[]>('employee-registry.json', []);
export const getTickets = () => readJson<TicketRecord[]>('tickets.json', []);
export const saveTickets = (tickets: TicketRecord[]) => writeJson('tickets.json', tickets);
export const getAuditLog = () => readJson<AuditEntry[]>('audit-log.json', []);

export const appendAuditLog = async (entry: Omit<AuditEntry, 'id' | 'date'>) => {
    const entries = await getAuditLog();
    const auditEntry: AuditEntry = {
        ...entry,
        id: `AUD-${Date.now()}`,
        date: new Date().toISOString()
    };
    await writeJson('audit-log.json', [auditEntry, ...entries]);
    return auditEntry;
};

export const normalizePhone = (phone: string) => phone.replace(/\D/g, '').replace(/^90/, '0');
export const normalizeCardId = (cardId: string) => cardId.trim().toUpperCase();
