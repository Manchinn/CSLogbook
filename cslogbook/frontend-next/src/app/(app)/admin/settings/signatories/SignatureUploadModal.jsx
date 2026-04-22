'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import styles from '../settings.module.css';
import btn from '@/styles/shared/buttons.module.css';

const SignatureUploadModal = ({ isOpen, onClose, signatory, onUpload }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedFile(null);
            setPreviewUrl(null);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate type
        if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
            setError('รองรับเฉพาะไฟล์ PNG หรือ JPEG เท่านั้น');
            return;
        }

        // Validate size (500KB)
        if (file.size > 500 * 1024) {
            setError('ขนาดไฟล์ต้องไม่เกิน 500KB');
            return;
        }

        setError(null);
        setSelectedFile(file);
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        try {
            await onUpload(signatory.id, selectedFile);
            onClose();
        } catch (err) {
            setError('การอัปโหลดล้มเหลว กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={`${styles.modal} max-w-sm`}>
                <div className={styles.modalHeader}>
                    <h3 className={styles.modalTitle}>อัปโหลดลายเซ็น</h3>
                    <button onClick={onClose} className={styles.modalCloseBtn} type="button">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-2 space-y-4">
                    <div className={styles.field}>
                        <label>เลือกไฟล์รูปภาพลายเซ็น</label>
                        <p className={styles.fieldHint}>ไฟล์ควรเป็น PNG พื้นหลังโปร่งใส (Transparent) เพื่อความสวยงามในเอกสาร PDF</p>
                    </div>

                    {previewUrl ? (
                        <div className="relative w-full aspect-[3/1] bg-white rounded-xl overflow-hidden border-2 border-dashed border-blue-500/50">
                            <img src={previewUrl} alt="preview" className="w-full h-full object-contain p-2" />
                            <button 
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
                            <ImageIcon size={32} className="text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" />
                            <span className="text-xs text-gray-500 text-center px-4">คลิกเพื่อเลือกไฟล์<br/>(PNG, JPEG, Max 500KB)</span>
                        </div>
                    )}

                    <input 
                        type="file" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFileChange}
                        accept="image/png,image/jpeg"
                    />

                    {error && (
                        <div className={`${styles.alertWarning} !py-2 !px-3`}>
                            <AlertTriangle size={14} className="shrink-0" />
                            <span className="text-xs">{error}</span>
                        </div>
                    )}

                    <div className="flex space-x-3 pt-2">
                        <button
                            onClick={onClose}
                            className={`${btn.button} flex-1`}
                            type="button"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                            className={`${btn.button} ${btn.buttonPrimary} flex-1`}
                        >
                            {isUploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignatureUploadModal;
