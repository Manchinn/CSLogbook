'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import styles from '../settings.module.css';
import btn from '@/styles/shared/buttons.module.css';

const SignatoryModal = ({ isOpen, onClose, signatory, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        role: 'PRIMARY',
        isActive: true
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const getBaseUrl = () => {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
            return apiUrl.replace(/\/api$/, '');
        };

        if (signatory) {
            setFormData({
                name: signatory.name || '',
                title: signatory.title || '',
                role: signatory.role || 'PRIMARY',
                isActive: signatory.isActive !== undefined ? signatory.isActive : true
            });
            // หากมีรูปลูกศรเดิม ให้แสดงเป็น preview (ถ้ามี URL)
            setPreviewUrl(signatory.signatureUrl ? `${getBaseUrl()}/${signatory.signatureUrl}` : null);
        } else {
            setFormData({
                name: '',
                title: '',
                role: 'PRIMARY',
                isActive: true
            });
            setPreviewUrl(null);
        }
        setSelectedFile(null);
    }, [signatory, isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
            alert('รองรับเฉพาะไฟล์ PNG หรือ JPEG เท่านั้น');
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(formData, selectedFile);
            onClose();
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.drawerOverlay} onClick={onClose}>
            <aside 
                className={styles.drawer} 
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={signatory ? 'แก้ไขข้อมูลผู้ลงนาม' : 'เพิ่มผู้ลงนามใหม่'}
            >
                {/* Header */}
                <header className={styles.drawerHeader}>
                    <h3 className={styles.modalTitle}>
                        {signatory ? 'แก้ไขข้อมูลผู้ลงนาม' : 'เพิ่มผู้ลงนามใหม่'}
                    </h3>
                    <button 
                        onClick={onClose}
                        className={btn.button}
                        type="button"
                    >
                        <X size={18} />
                    </button>
                </header>

                {/* Body */}
                <div className={styles.drawerBody}>
                    <form id="signatory-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className={styles.field}>
                            <label>ชื่อ-นามสกุล</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={styles.input}
                                placeholder="ระบุชื่อ-นามสกุล"
                            />
                        </div>

                        <div className={styles.field}>
                            <label>ตำแหน่ง (สำหรับลงในเอกสาร)</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className={styles.input}
                                placeholder="ระบุตำแหน่ง เช่น หัวหน้าภาควิชาคอมพิวเตอร์"
                            />
                        </div>

                        <div className={styles.fieldGrid2}>
                            <div className={styles.field}>
                                <label>บทบาท</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className={styles.select}
                                >
                                    <option value="PRIMARY">ผู้ลงนามหลัก</option>
                                    <option value="DEPUTY">รอง(รักษาการฯ)</option>
                                    <option value="ACTING">ผู้ได้รับมอบหมาย</option>
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label>สถานะ</label>
                                <select
                                    value={formData.isActive ? 'true' : 'false'}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                                    className={styles.select}
                                >
                                    <option value="true">เปิดใช้งาน</option>
                                    <option value="false">ปิดการใช้งาน</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label>รูปภาพลายเซ็น</label>
                            <p className={styles.fieldHint}>ไฟล์ควรเป็น PNG พื้นหลังโปร่งใส (Transparent)</p>
                            
                            <div className="mt-3">
                                {previewUrl ? (
                                    <div className="relative w-full aspect-[3/1] bg-white rounded-xl overflow-hidden border-2 border-dashed border-blue-500/50 group">
                                        <img src={previewUrl} alt="Signature Preview" className="w-full h-full object-contain p-2" />
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                        >
                                            <div className="flex flex-col items-center text-white text-xs">
                                                <Upload size={20} className="mb-1" />
                                                <span>คลิกเพื่อเปลี่ยนไฟล์</span>
                                            </div>
                                        </div>
                                        <button 
                                            type="button"
                                            onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <div 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full aspect-[3/1] bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 hover:border-blue-400 transition-all group"
                                    >
                                        
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-gray-700">คลิกเพื่อเลือกไฟล์ เช่น PNG, JPEG</p>
                                            <p className="text-sm font-medium text-gray-700">ขนาดไม่เกิน 500KB</p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/png,image/jpeg"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        {formData.role === 'PRIMARY' && formData.isActive && (
                            <div className={styles.alertWarning}>
                                <p className="text-xs">หากบันทึกเป็น "Active" ระบบจะปิดการใช้งานผู้ลงนามหลักตัวอื่นอัตโนมัติ</p>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <footer className={styles.drawerFooter}>
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className={btn.button}
                            disabled={isSubmitting}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            form="signatory-form"
                            disabled={isSubmitting}
                            className={`${btn.button} ${btn.buttonPrimary} flex-1`}
                        >
                            {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                        </button>
                    </div>
                </footer>
            </aside>
        </div>
    );
};

export default SignatoryModal;
