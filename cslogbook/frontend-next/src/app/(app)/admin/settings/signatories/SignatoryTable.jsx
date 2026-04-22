'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, X, Search } from 'lucide-react';
import styles from '../settings.module.css';
import btn from '@/styles/shared/buttons.module.css';

const SignatoryTable = ({ signatories, onEdit, onDelete, onPreview }) => {
    const getBaseUrl = () => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        return apiUrl.replace(/\/api$/, '');
    };

    const getImageUrl = (path) => {
        if (!path) return '';
        return `${getBaseUrl()}/${path}`;
    };

    return (
        <div className={styles.tableWrap}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>ผู้ลงนาม</th>
                        <th>บทบาท</th>
                        <th className="text-center">สถานะ</th>
                        <th className="text-center">จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {signatories && signatories.length > 0 ? (
                        signatories.map((sig) => (
                            <tr key={sig.id}>
                                <td>
                                    <div className={styles.cardTitle}>{sig.name}</div>
                                    <div className={styles.cardMeta}>{sig.title}</div>
                                </td>
                                <td>
                                    <span className={sig.role === 'PRIMARY' ? styles.badge : styles.badgeMuted}>
                                        {sig.role}
                                    </span>
                                </td>

                                <td className="text-center">
                                    <span className={`${styles.badge} ${sig.isActive ? styles.badgeSuccess : styles.badgeMuted}`}>
                                        {sig.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="text-center">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => onEdit(sig)}
                                            className={btn.button}
                                            title="แก้ไขข้อมูลและลายเซ็น"
                                        >
                                            แก้ไข
                                        </button>
                                        <button
                                            onClick={() => onDelete(sig)}
                                            className={`${btn.button} ${btn.buttonDanger}`}
                                            title="ลบ"
                                        >
                                            ลบ
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : null}
                </tbody>
            </table>
        </div>
    );
};

export default SignatoryTable;
