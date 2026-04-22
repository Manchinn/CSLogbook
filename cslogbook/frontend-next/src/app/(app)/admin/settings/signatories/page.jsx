'use client';

import React, { useState } from 'react';
import { Plus, UserCheck, Settings, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import { useSignatories } from '@/hooks/useSignatories';
import SignatoryTable from './SignatoryTable';
import SignatoryModal from './SignatoryModal';
import styles from '../settings.module.css';
import btn from '@/styles/shared/buttons.module.css';

const SignatoriesPage = () => {
    const { 
        useSignatoriesList, 
        useCreateSignatory, 
        useUpdateSignatory, 
        useDeleteSignatory, 
        useUploadSignature 
    } = useSignatories();

    const { data: response, isLoading, isError } = useSignatoriesList();
    const createMutation = useCreateSignatory();
    const updateMutation = useUpdateSignatory();
    const deleteMutation = useDeleteSignatory();
    const uploadMutation = useUploadSignature();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedSignatory, setSelectedSignatory] = useState(null);

    const signatories = response?.data || [];

    const handleAdd = () => {
        setSelectedSignatory(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (sig) => {
        setSelectedSignatory(sig);
        setIsFormModalOpen(true);
    };

    const handleDelete = (sig) => {
        if (window.confirm(`คุณต้องการลบข้อมูลของ ${sig.name} ใช่หรือไม่?`)) {
            deleteMutation.mutate(sig.id);
        }
    };

    const handlePreview = (url) => {
        setPreviewUrl(url);
    };

    const handleSaveSignatory = async (formData, file) => {
        let savedSignatory;
        if (selectedSignatory) {
            const response = await updateMutation.mutateAsync({ id: selectedSignatory.id, data: formData });
            savedSignatory = response.data;
        } else {
            const response = await createMutation.mutateAsync(formData);
            savedSignatory = response.data;
        }

        // หากมีการเลือกไฟล์ ให้ทำการอัปโหลดต่อทันที
        if (file && savedSignatory?.id) {
            await uploadMutation.mutateAsync({ id: savedSignatory.id, file });
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.settingsTitle}>จัดการข้อมูลผู้ลงนาม</h1>
                <p className={styles.subtitle}>กำหนดและจัดการรายชื่อผู้ลงนาม ตำแหน่ง และลายเซ็นสำหรับใช้งานในเอกสารราชการต่างๆ</p>
            </div>

            {/* Stats/Highlight Area */}
            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardMeta}>ผู้ลงนามหลัก (Active)</div>
                    <div className={styles.cardTitle}>
                        {signatories.find(s => s.role === 'PRIMARY' && s.isActive)?.name || 'ยังไม่มีข้อมูล'}
                    </div>
                </div>
            </div>

            <section className={`${styles.section} ${styles.sectionAccent}`}>
                <div className={styles.sectionHeader}>
                    <strong>
                        <span className={styles.sectionIcon}>
                            <UserCheck size={16} />
                        </span> 
                        รายการผู้ลงนาม
                    </strong>
                    <div className={styles.actions}>
                        <button 
                            onClick={handleAdd}
                            className={`${btn.button} ${btn.buttonPrimary}`}
                        >
                            <Plus size={16} className={styles.btnIcon} />
                            <span>เพิ่มผู้ลงนาม</span>
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className={styles.emptyState}>
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <div className={styles.emptyStateText}>กำลังโหลดข้อมูล...</div>
                    </div>
                ) : isError ? (
                    <div className={styles.alertWarning}>
                        เกิดข้อผิดพลาดในการดึงข้อมูล
                    </div>
                ) : (
                    <SignatoryTable 
                        signatories={signatories}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onPreview={handlePreview}
                    />
                )}
                
                {!isLoading && !signatories.length && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyStateIcon}>✍️</div>
                        <div className={styles.emptyStateText}>ไม่พบข้อมูลผู้ลงนาม</div>
                        <div className={styles.emptyStateHint}>คลิกปุ่ม "เพิ่มผู้ลงนาม" เพื่อเริ่มเพิ่มข้อมูลการลงนาม</div>
                    </div>
                )}
            </section>

            {/* Form Modal (Drawer) */}
            <SignatoryModal 
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                signatory={selectedSignatory}
                onSave={handleSaveSignatory}
            />

            {/* Signature Preview Modal (Centered Popup) */}
            {previewUrl && (
                <div 
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-6 animate-in fade-in duration-300"
                    onClick={() => setPreviewUrl(null)}
                >
                    <div 
                        className="relative max-w-2xl w-full bg-white rounded-3xl p-3 shadow-2xl animate-in zoom-in-90 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.drawerHeader}>
                            <h3 className={styles.modalTitle}>ดูรูปลายเซ็น</h3>
                            <button 
                                onClick={() => setPreviewUrl(null)}
                                className={btn.button}
                                type="button"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="bg-gray-50 rounded-2xl overflow-hidden min-h-[300px] flex items-center justify-center border border-gray-100 shadow-inner">
                                <img
                                    src={previewUrl}
                                    alt="Signature Preview"
                                    className="max-w-full max-h-[60vh] object-contain drop-shadow-md p-4"
                                />
                            </div>
                            
                            <div className="mt-4 text-center">
                                <p className="text-sm text-gray-500 italic">"ลายเซ็นดิจิทัลสำหรับใช้งานในระบบเอกสาร"</p>
                            </div>
                        </div>

                        <div className="px-6 pb-6 flex justify-center">
                            <button 
                                onClick={() => setPreviewUrl(null)}
                                className={`${btn.button} min-w-[120px]`}
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SignatoriesPage;
