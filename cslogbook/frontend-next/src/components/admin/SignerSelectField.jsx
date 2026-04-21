'use client';

import React from 'react';
import { useSignatories } from '@/hooks/useSignatories';
import styles from '@/styles/shared/admin-queue.module.css';

const SignerSelectField = ({ value, onChange }) => {
    const { useSignatoriesList } = useSignatories({ isActive: true });
    const { data: response, isLoading } = useSignatoriesList();
    const signatories = response?.data || [];

    return (
        <div className={styles.field}>
            <label>ผู้ลงนามในเอกสาร</label>
            <select
                className={styles.select}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={isLoading}
            >
                <option value="">-- ใช้ค่าเริ่มต้น (หัวหน้าภาค) --</option>
                {signatories.map((sig) => (
                    <option key={sig.id} value={sig.id}>
                        {sig.name} ({sig.title})
                    </option>
                ))}
            </select>
            {isLoading && <p className={styles.subText}>กำลังโหลดรายชื่อผู้ลงนาม...</p>}
        </div>
    );
};

export default SignerSelectField;
