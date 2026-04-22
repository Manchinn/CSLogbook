import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { signatoryApi } from '@/lib/api/signatory';
import { toast } from 'react-hot-toast';

export const useSignatories = (filters = {}) => {
    const queryClient = useQueryClient();

    // ดึงข้อมูลผู้ลงนามทั้งหมด
    const useSignatoriesList = () => {
        return useQuery({
            queryKey: ['signatories', filters],
            queryFn: () => signatoryApi.getAll(filters),
        });
    };

    // ดึงข้อมูลผู้ลงนามตาม ID
    const useSignatory = (id) => {
        return useQuery({
            queryKey: ['signatories', id],
            queryFn: () => signatoryApi.getById(id),
            enabled: !!id,
        });
    };

    // Mutation สำหรับเพิ่มผู้ลงนาม
    const useCreateSignatory = () => {
        return useMutation({
            mutationFn: (data) => signatoryApi.create(data),
            onSuccess: () => {
                queryClient.invalidateQueries(['signatories']);
                toast.success('เพิ่มข้อมูลผู้ลงนามเรียบร้อยแล้ว');
            },
            onError: (error) => {
                toast.error(error?.response?.data?.message || 'ไม่สามารถเพิ่มข้อมูลได้');
            },
        });
    };

    // Mutation สำหรับอัปเดตผู้ลงนาม
    const useUpdateSignatory = () => {
        return useMutation({
            mutationFn: ({ id, data }) => signatoryApi.update(id, data),
            onSuccess: () => {
                queryClient.invalidateQueries(['signatories']);
                toast.success('อัปเดตข้อมูลผู้ลงนามเรียบร้อยแล้ว');
            },
            onError: (error) => {
                toast.error(error?.response?.data?.message || 'ไม่สามารถอัปเดตข้อมูลได้');
            },
        });
    };

    // Mutation สำหรับลบผู้ลงนาม
    const useDeleteSignatory = () => {
        return useMutation({
            mutationFn: (id) => signatoryApi.delete(id),
            onSuccess: () => {
                queryClient.invalidateQueries(['signatories']);
                toast.success('ลบข้อมูลผู้ลงนามเรียบร้อยแล้ว');
            },
            onError: (error) => {
                toast.error(error?.response?.data?.message || 'ไม่สามารถลบข้อมูลได้');
            },
        });
    };

    // Mutation สำหรับอัปโหลดลายเซ็น
    const useUploadSignature = () => {
        return useMutation({
            mutationFn: ({ id, file }) => signatoryApi.uploadSignature(id, file),
            onSuccess: () => {
                queryClient.invalidateQueries(['signatories']);
                toast.success('อัปโหลดรูปลายเซ็นเรียบร้อยแล้ว');
            },
            onError: (error) => {
                toast.error(error?.response?.data?.message || 'ไม่สามารถอัปโหลดรูปได้');
            },
        });
    };

    return {
        useSignatoriesList,
        useSignatory,
        useCreateSignatory,
        useUpdateSignatory,
        useDeleteSignatory,
        useUploadSignature,
    };
};
