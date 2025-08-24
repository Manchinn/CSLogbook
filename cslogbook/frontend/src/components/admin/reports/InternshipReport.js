// หน้าแสดงรายงานเฉพาะฝึกงาน (Internship)
import React, { useMemo, Suspense } from 'react';
import { Card, Row, Col, Typography, Select, Space, Skeleton, Alert, Table } from 'antd';
// import { Pie, Bar } from '@ant-design/plots'; // เปลี่ยนเป็น lazy load เพื่อลด bundle
import { LazyPie as Pie, LazyBar as Bar } from './charts/LazyPlots';
import { academicYearOptions } from './constants';
import { useInternshipProgressDashboard } from './hooks/useInternshipProgressDashboard';
import { buildCriteriaBarConfig, buildInternshipCompletionPie } from './charts/internshipProgressConfigs';

const { Title } = Typography;

const currentAcademicYear = () => {
	const now = new Date();
	const buddhistYear = now.getFullYear() + 543;
	return now.getMonth() < 5 ? buddhistYear - 1 : buddhistYear;
};

const InternshipReport = () => {
	// ใช้ hook ใหม่
	const { year, setYear, loading, error, summary, evaluation, students } = useInternshipProgressDashboard(currentAcademicYear());

	const yearOptions = academicYearOptions(year);

	// KPI: ทั้งหมด / สำเร็จแล้ว / กำลังฝึกงาน
		const kpis = useMemo(() => {
			const enrolledCount = summary?.enrolledCount != null ? summary.enrolledCount : (students || []).length;
				// คำนวณเทียบจากสถานะจริงในรายการนักศึกษา (เฉพาะที่ลงทะเบียน)
				const statusCounts = (students || []).reduce((acc,s)=>{
					const st = s.internshipStatus; // not_started | pending_approval | in_progress | completed
					if (st) acc[st] = (acc[st]||0)+1; return acc; }, {});
				const completedFromList = statusCounts.completed || 0;
				const inProgressFromList = (statusCounts.in_progress||0) + (statusCounts.pending_approval||0); // รวมที่ยังไม่ complete
				// ใช้ summary เป็นแหล่งหลัก หากตัวเลข summary กับ list ต่างกันมาก (>1) อาจสะท้อน backend logic ต่าง -> เลือก summary แต่เก็บ listValue ไว้ tooltip
				const completedVal = summary?.completed ?? completedFromList;
				const inProgressVal = summary?.inProgress ?? inProgressFromList;
				const notStartedVal = summary?.notStarted ?? Math.max(0,(summary?.totalStudents||0)- (summary?.started||enrolledCount));
				return [
					{ title: 'ลงทะเบียนฝึกงาน', value: enrolledCount },
					{ title: 'ฝึกงานเสร็จแล้ว', value: completedVal },
					{ title: 'อยู่ระหว่างฝึกงาน', value: inProgressVal },
					{ title: 'ยังไม่เริ่ม', value: notStartedVal }
				];
		}, [summary, students]);

	// Mapping สถานะ -> ภาษาไทย
	const statusTH = {
		'not_started': 'ยังไม่เริ่ม',
		'pending_approval': 'รออนุมัติ',
		'in_progress': 'อยู่ระหว่างฝึกงาน',
		'completed': 'เสร็จสิ้น'
	};

	// Filters สำหรับสถานะ
	const statusFilters = Object.entries(statusTH).map(([value,text])=>({ text, value }));

	// ตารางนักศึกษา: เพิ่ม sorter + filters
	const studentColumns = [
		{ title:'รหัส', dataIndex:'studentCode', key:'studentCode', sorter:(a,b)=> (a.studentCode||'').localeCompare(b.studentCode||'') },
		{ title:'ชื่อ-นามสกุล', key:'name', render:(_,r)=> `${r.firstName || ''} ${r.lastName || ''}` },
		{ title:'ชั้นปี', dataIndex:'studentYear', key:'studentYear', width:90, sorter:(a,b)=> (a.studentYear||0)-(b.studentYear||0) },
		{ title:'สถานะฝึกงาน', dataIndex:'internshipStatus', key:'internshipStatus', filters: statusFilters, onFilter:(val,record)=> record.internshipStatus===val, render:(val)=> statusTH[val] || val }
	];

	// Map students (จาก studentService.getAllStudents) -> ตรวจชื่อฟิลด์ที่คาด: studentCode, firstName, lastName, internshipStatus, studentYear
			const studentData = useMemo(()=> (students || []).map((s,i)=>({ key:i, ...s })), [students]);

	// Memoize config objects ลด re-render ของ chart
	const criteriaConfig = useMemo(()=> buildCriteriaBarConfig(evaluation?.criteriaAverages || []), [evaluation]);
	const completionPieConfig = useMemo(()=> buildInternshipCompletionPie(summary), [summary]);

	return (
		<Space direction="vertical" style={{ width:'100%' }} size="large">
			<Row justify="space-between" align="middle">
				<Col><Title level={3}>Internship Progress Dashboard</Title></Col>
				<Col>
					<Space>
						<span>ปี:</span>
						<Select value={year} style={{ width:120 }} onChange={setYear} options={yearOptions.map(y=>({ value:y, label:y }))} />
					</Space>
				</Col>
			</Row>

			{error && <Alert type="error" message={error.message || 'โหลดข้อมูลไม่สำเร็จ'} />}

					<Row gutter={[16,16]}>
						{kpis.map((k,i)=>(
							<Col xs={12} md={6} key={i}>
								<Card loading={loading} size="small" headStyle={{minHeight:32}} bodyStyle={{padding:12}}>
									<Space direction="vertical" size={0}>
										<span style={{color:'#888'}}>{k.title}</span>
										<span style={{fontSize:26,fontWeight:600}}>{k.value}</span>
									</Space>
								</Card>
							</Col>
						))}
					</Row>

			<Row gutter={[16,16]}>
				<Col xs={24} md={14}>
					<Card title="คะแนนเฉลี่ยรายหัวข้อ (ผู้ควบคุมงาน)" size="small" bodyStyle={{padding:12}}>
						{loading ? <Skeleton active /> : (
							<Suspense fallback={<Skeleton active />}> 
								<Bar {...criteriaConfig} />
							</Suspense>
						)}
					</Card>
				</Col>
				<Col xs={24} md={10}>
					<Card title="สัดส่วนสถานะการฝึกงาน" size="small" bodyStyle={{padding:12}}>
						{loading ? <Skeleton active /> : (
							<Suspense fallback={<Skeleton active />}> 
								<Pie {...completionPieConfig} />
							</Suspense>
						)}
					</Card>
				</Col>
			</Row>

			<Row gutter={[16,16]}>
				<Col span={24}>
					<Card title="รายชื่อนักศึกษาฝึกงาน" size="small">
						<Table size="small" loading={loading} dataSource={studentData} columns={studentColumns} pagination={{ pageSize: 15 }} scroll={{ x: 600 }} />
					</Card>
				</Col>
			</Row>
		</Space>
	);
};

export default InternshipReport;

