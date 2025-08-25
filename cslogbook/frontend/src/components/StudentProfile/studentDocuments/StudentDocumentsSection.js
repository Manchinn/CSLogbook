import React, { useEffect, useState, useCallback } from 'react';
import { Card, Table, Tag, Space, Button, message, Tooltip } from 'antd';
import { EyeOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from '../../../utils/dayjs';
import { studentDocumentService } from './studentDocumentService';
import PDFViewerModal from '../../PDFViewerModal';
// ✅ นำเข้า service และ helper สำหรับสร้าง PDF แบบเดียวกับหน้า SubmissionResultStep
import internshipService from '../../../services/internshipService';
import { prepareFormDataForPDF } from '../../internship/register/helpers/pdfHelper';
import officialDocumentService from '../../../services/PDFServices/OfficialDocumentService';

// หมายเหตุ: หน้านี้ไม่มี formData / studentData จาก props จึงต้องดึง CS05 ปัจจุบันมาใช้เป็นแหล่งข้อมูล

// แปลงชื่อเอกสารเป็นภาษาไทย
const mapDocName = (name) => {
  if (!name) return 'ไม่ระบุ';
  const n = name.toUpperCase();
  switch (n) {
    case 'CS05': return 'คำร้องขอฝึกงาน (คพ.05)';
    case 'REQUEST_LETTER': return 'หนังสือขอความอนุเคราะห์';
    case 'ACCEPTANCE_LETTER': return 'หนังสือตอบรับการฝึกงาน (Template)';
    case 'REFERRAL_LETTER': return 'หนังสือส่งตัวนักศึกษาฝึกงาน';
    default: return name;
  }
};

const statusTag = (status) => {
  const map = {
    draft: { color: 'default', text: 'ร่าง' },
    pending: { color: 'orange', text: 'รอตรวจ' },
    approved: { color: 'green', text: 'อนุมัติ' },
    rejected: { color: 'red', text: 'ปฏิเสธ' },
    supervisor_evaluated: { color: 'blue', text: 'หัวหน้าฝึกงานประเมิน' },
    acceptance_approved: { color: 'purple', text: 'ตอบรับแล้ว' },
    referral_ready: { color: 'cyan', text: 'พร้อมหนังสือส่งตัว' },
    referral_downloaded: { color: 'geekblue', text: 'ดาวน์โหลดส่งตัวแล้ว' },
    completed: { color: 'success', text: 'เสร็จสิ้น' }
  };
  const cfg = map[status] || { color: 'default', text: status || 'ไม่ระบุ' };
  return <Tag color={cfg.color}>{cfg.text}</Tag>;
};

const formatDate = (d) => {
  if (!d) return '-';
  const date = dayjs(d);
  if (!date.isValid()) return '-';
  return date.format('DD/MM/') + (date.year() + 543);
};

const StudentDocumentsSection = () => {
  const [loading, setLoading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [pdfModal, setPdfModal] = useState({ open: false, url: null });
  const [cs05Data, setCs05Data] = useState(null); // เก็บข้อมูล CS05 เพื่อใช้ generate PDF
  const [genLoadingId, setGenLoadingId] = useState(null); // track เอกสารที่กำลัง generate

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      // 1) โหลดรายการเอกสาร
      const data = await studentDocumentService.listMyDocuments({ type: 'internship', lettersOnly: 1 });
      const docs = data.documents || [];
      setDocuments(docs);

      // 2) โหลดข้อมูล CS05 (ครั้งแรกหรือเมื่อยังไม่มี)
      if (!cs05Data) {
        try {
          const cs05Res = await internshipService.getCurrentCS05();
          if (cs05Res?.data) {
            setCs05Data(cs05Res.data);
          }
        } catch (err) {
          console.info('ไม่มีข้อมูล CS05 สำหรับการ prepare PDF');
        }
      }
    } catch (e) {
      console.error(e);
      message.error('โหลดรายการเอกสารไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [cs05Data]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  // ✅ เตรียมข้อมูลพื้นฐานสำหรับ PDF (บางไฟล์เป็น template ไม่ต้องใช้ข้อมูลเต็ม)
  const buildPdfData = useCallback(() => {
    // ไม่มี studentData แยกต่างหากใน context นี้ ข้อมูลนักศึกษา (studentData array) มักถูกฝังใน cs05Data อยู่แล้ว
    if (!cs05Data) return null;
    try {
      return prepareFormDataForPDF(cs05Data, cs05Data, cs05Data); // ส่ง cs05Data ทุกช่องว่างเพื่อให้ helper เลือกใช้
    } catch (e) {
      console.error('prepare PDF data failed', e);
      return null;
    }
  }, [cs05Data]);

  const openBlobInModal = (blob) => {
    const url = URL.createObjectURL(blob);
    setPdfModal({ open: true, url });
  };

  const fetchAndOpenExisting = async (record) => {
    const res = await fetch(`/api/documents/${record.documentId || record.id}/view`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (!res.ok) throw new Error('view failed');
    const blob = await res.blob();
    openBlobInModal(blob);
  };

  // ✅ View: ถ้าไม่มีไฟล์ -> generate สดแล้วให้บราวเซอร์ดาวน์โหลด/แสดง (ไม่บันทึก server)
  const handleView = async (record) => {
    try {
      if (record.filePath) {
        await fetchAndOpenExisting(record);
        return;
      }
      // ไม่มีไฟล์ ต้อง generate ตามชนิดเอกสาร
      setGenLoadingId(record.documentId || record.id);
      const pdfData = buildPdfData();
      if (!pdfData && record.name !== 'ACCEPTANCE_LETTER') {
        message.warning('ยังไม่พร้อมสร้างเอกสาร (ไม่มีข้อมูล CS05)');
        return;
      }
      if (record.name === 'REQUEST_LETTER') {
        await officialDocumentService.previewPDF('official_letter', pdfData);
      } else if (record.name === 'ACCEPTANCE_LETTER') {
        // แบบฟอร์มตอบรับ (template ว่าง) -> preview
        await officialDocumentService.previewAcceptanceForm(null, true);
      } else if (record.name === 'REFERRAL_LETTER') {
        await officialDocumentService.previewPDF('referral_letter', pdfData);
      } else {
        message.info('ยังไม่รองรับการเปิดเอกสารชนิดนี้');
      }
    } catch (e) {
      console.error(e);
      message.error('ไม่สามารถสร้าง/เปิดเอกสารได้');
    } finally {
      setGenLoadingId(null);
    }
  };

  const triggerBrowserDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (record) => {
    try {
      if (record.filePath) {
        const res = await fetch(`/api/documents/${record.documentId || record.id}/download`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (!res.ok) throw new Error('download failed');
        const blob = await res.blob();
        triggerBrowserDownload(blob, (record.fileName || record.name || 'document') + '.pdf');
        message.success('ดาวน์โหลดแล้ว');
        return;
      }
      // ไม่มีไฟล์ -> generate แล้วดาวน์โหลด (ไม่บันทึก server ณ ตอนนี้)
      setGenLoadingId(record.documentId || record.id);
      const pdfData = buildPdfData();
      if (!pdfData && record.name !== 'ACCEPTANCE_LETTER') {
        message.warning('ยังไม่พร้อมสร้างเอกสาร (ไม่มีข้อมูล CS05)');
        return;
      }
      if (record.name === 'REQUEST_LETTER') {
        await officialDocumentService.generateOfficialLetterPDF(pdfData, { saveToServer: false });
      } else if (record.name === 'ACCEPTANCE_LETTER') {
        await officialDocumentService.generateAcceptanceFormPDF(null, true); // blank template
      } else if (record.name === 'REFERRAL_LETTER') {
        await officialDocumentService.generateReferralLetterPDF(pdfData, { saveToServer: false });
      } else {
        message.info('ยังไม่รองรับการดาวน์โหลดชนิดนี้');
      }
    } catch (e) {
      console.error(e);
      message.error('ไม่สามารถสร้าง/ดาวน์โหลดเอกสารได้');
    } finally {
      setGenLoadingId(null);
    }
  };

  const columns = [
    {
      title: 'ชื่อเอกสาร',
      dataIndex: 'name',
      key: 'name',
      render: (text, rec) => mapDocName(text || rec.documentName)
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: statusTag
    },
    {
      title: 'วันที่สร้าง',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: formatDate
    },
    {
      title: 'การจัดการ',
      key: 'actions',
      render: (_, rec) => {
        const loadingThis = genLoadingId === (rec.documentId || rec.id);
        return (
          <Space size={4}>
            <Tooltip title="แสดงตัวอย่าง">
              <Button
                icon={<EyeOutlined />}
                loading={loadingThis}
                onClick={() => handleView(rec)}
                size="small"
              ></Button>
            </Tooltip>
            <Tooltip title="ดาวน์โหลด">
              <Button
                icon={<DownloadOutlined />}
                loading={loadingThis}
                onClick={() => handleDownload(rec)}
                size="small"
              ></Button>
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  return (
  <Card title={<span>เอกสารฝึกงานของฉัน <Button size="small" icon={<ReloadOutlined />} onClick={fetchDocs} /> </span>}>
      <Table
        rowKey={r => r.documentId || r.id}
        dataSource={documents}
        columns={columns}
        loading={loading}
        pagination={false}
        locale={{ emptyText: 'ยังไม่มีเอกสารฝึกงาน' }}
        size="small"
      />
      {pdfModal.open && (
        <PDFViewerModal
          visible={pdfModal.open}
          pdfUrl={pdfModal.url}
          onClose={() => {
            if (pdfModal.url) URL.revokeObjectURL(pdfModal.url);
            setPdfModal({ open: false, url: null });
          }}
        />
      )}
    </Card>
  );
};

export default StudentDocumentsSection;
