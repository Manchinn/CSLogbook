import React from 'react';
import { CATEGORY_MAP } from '../../internship/evaluation/evaluationConfig';
import { Card, Descriptions, Space, Tag, Progress, Tooltip, Divider, Table, Skeleton } from 'antd';
import dayjs from '../../../utils/dayjs';

/**
 * แสดงรายละเอียดคำขอหนังสือรับรอง (ใช้ภายใน Drawer)
 * data shape ดูจาก service getCertificateRequestDetail
 */
const CertificateRequestReview = ({ data, loading, onOpenSummary, onApprove, onReject }) => {
  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;
  if (!data) return <div>ไม่พบข้อมูล</div>;

  const { student, internship, eligibility, evaluationDetail, status } = data;
  const hourPct = Math.min(100, Math.round((eligibility.hours.current / eligibility.hours.required) * 100));
  const hasScore = typeof evaluationDetail.overallScore === 'number';

  // ปรับคอลัมน์ตามคำขอ: แสดงเฉพาะ หมวด (เฉพาะรายการแรกของแต่ละหมวด), หัวข้อ, คะแนน
  const breakdownColumns = [
    { title: 'หมวด', dataIndex: 'displayCategory', key: 'displayCategory', width: 180 },
    { title: 'หัวข้อ', dataIndex: 'label', key: 'label' },
    { title: 'คะแนน', key: 'score', width: 110, align: 'center', render: (_, r) => r.max != null ? `${r.score}/${r.max}` : (r.score ?? '-') }
  ];

  // ฟังก์ชันย่อที่อยู่ และให้ tooltip แสดงเต็ม
  const summarizeAddress = (address, maxLen = 60) => {
    if (!address) return '-';
    const parts = address.split(/\n|,/).map(p=>p.trim()).filter(Boolean);
    let core = address;
    for (let i = parts.length - 1; i >= 0; i--) {
      if (/จังหวัด|อำเภอ|เขต|เขต |แขวง|กรุงเทพ|เชียงใหม่|นครราชสีมา|ชลบุรี|สงขลา/i.test(parts[i])) { // heuristic
        core = parts[i];
        break;
      }
    }
    if (core.length > maxLen) core = core.slice(0, maxLen - 1) + '…';
    return core;
  };

  const formatDate = (d) => d ? dayjs(d).format('DD MMM BBBB') : '-';

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card size="small" title="ข้อมูลนักศึกษา">
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="ชื่อ">{student?.fullName || '-'}</Descriptions.Item>
          <Descriptions.Item label="รหัสนักศึกษา">{student?.studentCode || '-'}</Descriptions.Item>
          <Descriptions.Item label="อีเมล">{student?.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="ตำแหน่งที่ฝึกงาน" span={2}>{student?.internshipPosition || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card size="small" title="ข้อมูลการฝึกงาน">
        <Descriptions column={2} size="small" bordered>
          <Descriptions.Item label="สถานประกอบการ">{internship.companyName || '-'}</Descriptions.Item>
          <Descriptions.Item label="ที่ตั้ง">
            {internship.location ? (
              <Tooltip title={<pre style={{ margin:0, whiteSpace:'pre-wrap' }}>{internship.location}</pre>}>
                {summarizeAddress(internship.location)}
              </Tooltip>
            ) : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="ช่วงฝึก">{formatDate(internship.startDate)} - {formatDate(internship.endDate)}</Descriptions.Item>
          <Descriptions.Item label="ชั่วโมงรวม">{internship.totalHours}</Descriptions.Item>
        </Descriptions>
        <Divider style={{ margin: '12px 0' }} />
        <Space>
          <Tooltip title={`${hourPct}%`}>
            <Progress type="circle" width={70} percent={hourPct} status={eligibility.hours.passed ? 'success' : 'active'} />
          </Tooltip>
          <Tag color={eligibility.hours.passed ? 'green' : 'orange'}>
            ชั่วโมง {eligibility.hours.current}/{eligibility.hours.required}
          </Tag>
          <Tag color={eligibility.evaluation.passed ? 'green' : (eligibility.evaluation.status === 'pending' ? 'blue' : 'red')}>
            ประเมิน {eligibility.evaluation.status}{hasScore && ` (${eligibility.evaluation.overallScore}/${eligibility.evaluation.passScore})`}
          </Tag>
          {eligibility.summary?.available && (
            <Tag color="geekblue" onClick={onOpenSummary} style={{ cursor: 'pointer' }}>ดูสรุปผล</Tag>
          )}
        </Space>
      </Card>

      <Card
        size="small"
        title="รายละเอียดการประเมิน"
        extra={
          <Space>
            {hasScore && <Tag color={evaluationDetail.passed ? 'green' : 'red'}>{evaluationDetail.overallScore}/{evaluationDetail.passScore}</Tag>}
            {!hasScore && <Tag color="blue">{eligibility.evaluation.status}</Tag>}
            {['pending'].includes(status) && (
              <Space>
                <button type="button" onClick={onApprove} style={{ border: '1px solid #52c41a', background: '#52c41a', color: '#fff', padding: '2px 8px', borderRadius: 4, cursor: 'pointer' }}>อนุมัติ</button>
                <button type="button" onClick={onReject} style={{ border: '1px solid #ff4d4f', background: '#ff4d4f', color: '#fff', padding: '2px 8px', borderRadius: 4, cursor: 'pointer' }}>ปฏิเสธ</button>
              </Space>
            )}
          </Space>
        }
      >
        <Descriptions size="small" column={3} bordered>
          <Descriptions.Item label="คะแนนรวม">{hasScore ? `${evaluationDetail.overallScore}/${evaluationDetail.passScore}` : '-'}</Descriptions.Item>
          <Descriptions.Item label="ผู้ประเมิน">{evaluationDetail.evaluatorName || '-'}</Descriptions.Item>
          <Descriptions.Item label="สถานะ">{evaluationDetail.passed ? <Tag color="green">ผ่าน</Tag> : (hasScore ? <Tag color="red">ไม่ผ่าน</Tag> : <Tag color="blue">รอดำเนินการ</Tag>)}</Descriptions.Item>
          <Descriptions.Item label="ส่งเมื่อ">{formatDate(evaluationDetail.submittedAt)}</Descriptions.Item>
          <Descriptions.Item label="อัปเดตล่าสุด">{formatDate(evaluationDetail.updatedAt)}</Descriptions.Item>
        </Descriptions>
        {hasScore && (
          <>
            <Divider style={{ margin: '12px 0' }} />
            <Table
              size="small"
              pagination={false}
              dataSource={(evaluationDetail.breakdown || []).map((b,i)=>({
                ...b,
                _row:i,
                // แสดงชื่อหมวดเฉพาะ sequence แรกของหมวดนั้น ถ้าไม่มี sequence ให้ fallback ด้วย logic index
                displayCategory: b.sequence === 1 || b.sequence == null ? b.categoryLabel : '',
                // บังคับหัวข้อให้ตรงกับ CATEGORY_CONFIG ถ้ามี category + sequence
                label: (b.category && b.sequence && CATEGORY_MAP[b.category]?.items?.[b.sequence-1])
                  ? CATEGORY_MAP[b.category].items[b.sequence-1]
                  : b.label
              }))}
              columns={breakdownColumns}
              rowKey={(r) => r.key || r._row}
              summary={(data)=>{
                const totalScore = data.reduce((acc, r)=> acc + (typeof r.score === 'number' ? r.score : 0), 0);
                // กรณีมี max ทุก/บางข้อ แสดงผลรวม max (เฉพาะข้อที่มี max เป็นตัวเลข)
                const hasAnyMax = data.some(r => typeof r.max === 'number');
                const totalMax = hasAnyMax ? data.reduce((acc,r)=> acc + (typeof r.max === 'number' ? r.max : 0), 0) : null;
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2} style={{ textAlign:'right', fontWeight:'bold' }}>รวมคะแนนทั้งหมด</Table.Summary.Cell>
                    <Table.Summary.Cell index={2} style={{ fontWeight:'bold', textAlign:'center' }}>
                      {totalMax ? `${totalScore}/${totalMax}` : totalScore}
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </>
        )}
      </Card>

      {/* Card แยกสำหรับข้อเสนอแนะ / จุดเด่น / ควรพัฒนา */}
      <Card size="small" title="ข้อเสนอแนะจากผู้ควบคุมงาน">
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label="จุดเด่นของนักศึกษา">{evaluationDetail.strengths || '-'}</Descriptions.Item>
          <Descriptions.Item label="ควรพัฒนา">{evaluationDetail.weaknessesToImprove || '-'}</Descriptions.Item>
          <Descriptions.Item label="หมายเหตุเพิ่มเติม">{evaluationDetail.additionalComments || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>
    </Space>
  );
};

export default CertificateRequestReview;
