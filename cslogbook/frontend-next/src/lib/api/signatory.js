import { apiFetch } from '@/lib/api/client';

/**
 * Service สำหรับจัดการผู้ลงนาม (Signatories)
 */
export const signatoryApi = {
    // ดึงข้อมูลผู้ลงนามทั้งหมด
    getAll: async (filters = {}) => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.set(key, String(value));
            }
        });
        const qs = params.toString();
        return apiFetch(`/admin/signatories${qs ? `?${qs}` : ''}`);
    },

    // ดึงข้อมูลผู้ลงนามตาม ID
    getById: async (id) => {
        return apiFetch(`/admin/signatories/${id}`);
    },

    // เพิ่มผู้ลงนามใหม่
    create: async (data) => {
        return apiFetch('/admin/signatories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // อัปเดตข้อมูลผู้ลงนาม
    update: async (id, data) => {
        return apiFetch(`/admin/signatories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // ลบผู้ลงนาม
    delete: async (id) => {
        return apiFetch(`/admin/signatories/${id}`, {
            method: 'DELETE',
        });
    },

    // อัปโหลดรูปลายเซ็น
    uploadSignature: async (id, file) => {
        const formData = new FormData();
        formData.append('signature', file);
        return apiFetch(`/admin/signatories/${id}/signature`, {
            method: 'POST',
            body: formData,
            // Header Content-Type จะถูกละเว้นอัตโนมัติเมื่อเป็น FormData ใน apiFetch
        });
    },
};
