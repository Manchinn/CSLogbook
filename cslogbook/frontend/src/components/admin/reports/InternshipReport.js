// หน้าแสดงรายงานเฉพาะฝึกงาน (Internship)
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Select, Space, Skeleton, Alert, Table, Button, Modal, Form, Input, message, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { SimpleBarChart, SimplePieChart, CHART_COLORS } from './charts/RechartsComponents';
import { academicYearOptions } from './constants';
import { useInternshipProgressDashboard } from './hooks/useInternshipProgressDashboard';
import { getInternshipAcademicYears } from '../../../services/reportService';
import internshipAdminService from '../../../services/internshipAdminService';
import { formatThaiDate } from '../../../utils/dateUtils';

const { Title } = Typography;
const { TextArea } = Input;

const currentAcademicYear = () => {
	const now = new Date();
	const buddhistYear = now.getFullYear() + 543;
	return now.getMonth() < 5 ? buddhistYear - 1 : buddhistYear;
};

const InternshipReport = () => {
	// ใช้ hook ใหม่
	const initialYear = currentAcademicYear();
	const anchorYearRef = useRef(initialYear); // anchor คงที่
	const { year, setYear, semester, setSemester, loading, error, summary, evaluation, students } = useInternshipProgressDashboard(initialYear);

	// State สำหรับ modal
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [cancelModalVisible, setCancelModalVisible] = useState(false);
	const [selectedRecord, setSelectedRecord] = useState(null);
	const [submitting, setSubmitting] = useState(false);
	const [detailedStudents, setDetailedStudents] = useState([]);
	const [loadingDetails, setLoadingDetails] = useState(false);
	const [form] = Form.useForm();
	const [yearOptions, setYearOptions] = useState([]);

	// โหลดข้อมูลรายละเอียดนักศึกษา
	const loadDetailedStudents = async () => {
		setLoadingDetails(true);
		try {
			const result = await internshipAdminService.getAllInternshipStudents({
				academicYear: year,
				semester: semester
			});
			if (result.success) {
				setDetailedStudents(result.data);
			} else {
				message.error(result.error || 'ไม่สามารถโหลดข้อมูลได้');
			}
		} catch (err) {
			console.error('Error loading detailed students:', err);
			message.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
		} finally {
			setLoadingDetails(false);
		}
	};

	// โหลดข้อมูลเมื่อ year หรือ semester เปลี่ยน
	useEffect(() => {
		loadDetailedStudents();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [year, semester]);

	// จัดการการแก้ไข
	const handleEdit = (record) => {
		setSelectedRecord(record);
		form.setFieldsValue({
			companyName: record.companyName,
			internshipPosition: record.internshipPosition,
			supervisorName: record.supervisorName,
			internshipStatus: record.internshipStatus
		});
		setEditModalVisible(true);
	};

	// จัดการการยกเลิก
	const handleCancel = (record) => {
		setSelectedRecord(record);
		form.resetFields(['reason']);
		setCancelModalVisible(true);
	};

	// Submit การแก้ไข
	const handleEditSubmit = async () => {
		try {
			const values = await form.validateFields();
			setSubmitting(true);

			const result = await internshipAdminService.updateInternship(
				selectedRecord.internshipId,
				values
			);

			if (result.success) {
				message.success('อัพเดทข้อมูลสำเร็จ');
				setEditModalVisible(false);
				loadDetailedStudents(); // Reload data
			} else {
				message.error(result.error || 'ไม่สามารถอัพเดทข้อมูลได้');
			}
		} catch (err) {
			console.error('Error updating internship:', err);
			if (err.errorFields) {
				// Form validation error
				return;
			}
			message.error('เกิดข้อผิดพลาดในการอัพเดทข้อมูล');
		} finally {
			setSubmitting(false);
		}
	};

	// Submit การยกเลิก
	const handleCancelSubmit = async () => {
		try {
			const values = await form.validateFields(['reason']);
			
			Modal.confirm({
				title: 'ยืนยันการยกเลิกการฝึกงาน',
				icon: <ExclamationCircleOutlined />,
				content: `คุณแน่ใจหรือไม่ที่จะยกเลิกการฝึกงานของ ${selectedRecord.fullName}? การดำเนินการนี้ไม่สามารถย้อนกลับได้`,
				okText: 'ยืนยัน',
				okType: 'danger',
				cancelText: 'ยกเลิก',
				onOk: async () => {
					setSubmitting(true);
					try {
						const result = await internshipAdminService.cancelInternship(
							selectedRecord.internshipId,
							values.reason
						);

						if (result.success) {
							message.success('ยกเลิกการฝึกงานสำเร็จ');
							setCancelModalVisible(false);
							loadDetailedStudents(); // Reload data
						} else {
							message.error(result.error || 'ไม่สามารถยกเลิกได้');
						}
					} catch (err) {
						console.error('Error cancelling internship:', err);
						message.error('เกิดข้อผิดพลาดในการยกเลิก');
					} finally {
						setSubmitting(false);
					}
				}
			});
		} catch (err) {
			if (err.errorFields) {
				// Form validation error
				return;
			}
		}
	};

	// โหลดรายการปีการศึกษาจริงจาก backend (distinct academic_year) และ fallback เป็นช่วงจาก anchorYear
	useEffect(() => {
		let isMounted = true;
		const loadYears = async () => {
			try {
				const years = await getInternshipAcademicYears();
				if (!isMounted) return;
				if (Array.isArray(years) && years.length > 0) {
					setYearOptions(years);
				} else {
					setYearOptions(academicYearOptions(anchorYearRef.current));
				}
			} catch (e) {
				console.error('Error loading internship academic years', e);
				if (!isMounted) return;
				setYearOptions(academicYearOptions(anchorYearRef.current));
			}
		};
		loadYears();
		return () => { isMounted = false; };
	}, []);
	const semesterOptions = [
		{ value: 1, label: 'ภาค 1' },
		{ value: 2, label: 'ภาค 2' },
		{ value: 3, label: 'ภาคฤดูร้อน' }
	];

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
		'completed': 'เสร็จสิ้น',
		'cancelled': 'ยกเลิกการฝึกงาน'
	};

	// Filters สำหรับสถานะ
	const statusFilters = Object.entries(statusTH).map(([value,text])=>({ text, value }));

	// ตารางนักศึกษาแบบละเอียด: เพิ่มคอลัมน์และ action buttons
	const detailedStudentColumns = [
		{ 
			title: 'รหัส', 
			dataIndex: 'studentCode', 
			key: 'studentCode', 
			width: 150,
			fixed: 'left',
			sorter: (a,b) => (a.studentCode||'').localeCompare(b.studentCode||'')
		},
		{ 
			title: 'ชื่อ-นามสกุล', 
			dataIndex: 'fullName',
			key: 'fullName', 
			width: 180,
			fixed: 'left'
		},
		{ 
			title: 'ชั้นปี', 
			dataIndex: 'studentYear', 
			key: 'studentYear', 
			width: 70,
			align: 'center',
			sorter: (a,b) => (a.studentYear||0)-(b.studentYear||0)
		},
		{ 
			title: 'สถานะ', 
			dataIndex: 'internshipStatus', 
			key: 'internshipStatus',
			width: 130,
			filters: statusFilters,
			onFilter: (val, record) => record.internshipStatus === val,
			render: (val) => {
				const colors = {
					'not_started': 'default',
					'pending_approval': 'processing',
					'in_progress': 'warning',
					'completed': 'success',
					'cancelled': 'error'
				};
				return <Tag color={colors[val] || 'default'}>{statusTH[val] || val}</Tag>;
			}
		},
		{ 
			title: 'บริษัท', 
			dataIndex: 'companyName', 
			key: 'companyName',
			width: 200,
			ellipsis: { showTitle: false },
			render: (text) => (
				<Tooltip title={text}>
					{text || '-'}
				</Tooltip>
			)
		},
		{ 
			title: 'ตำแหน่ง', 
			dataIndex: 'internshipPosition', 
			key: 'internshipPosition',
			width: 150,
			ellipsis: { showTitle: false },
			render: (text) => (
				<Tooltip title={text}>
					{text || '-'}
				</Tooltip>
			)
		},
		{ 
			title: 'พี่เลี้ยง', 
			dataIndex: 'supervisorName', 
			key: 'supervisorName',
			width: 150,
			render: (text) => text || '-'
		},
		{ 
			title: 'วันเริ่ม', 
			dataIndex: 'startDate', 
			key: 'startDate',
			width: 120,
			render: (date) => date ? formatThaiDate(date, 'short') : '-'
		},
		{ 
			title: 'วันสิ้นสุด', 
			dataIndex: 'endDate', 
			key: 'endDate',
			width: 120,
			render: (date) => date ? formatThaiDate(date, 'short') : '-'
		},
		{ 
			title: 'ปี/ภาค', 
			key: 'academicInfo',
			width: 90,
			render: (_, record) => {
				if (record.academicYear && record.semester) {
					return `${record.academicYear}/${record.semester}`;
				}
				return '-';
			}
		},
		{
			title: 'จัดการ',
			key: 'action',
			width: 120,
			fixed: 'right',
			align: 'center',
			render: (_, record) => (
				<Space size="small">
					<Tooltip title="แก้ไข">
						<Button
							type="link"
							icon={<EditOutlined />}
							onClick={() => handleEdit(record)}
							disabled={!record.internshipId}
							size="small"
						/>
					</Tooltip>
					<Tooltip title="ยกเลิก">
						<Button
							type="link"
							danger
							icon={<DeleteOutlined />}
							onClick={() => handleCancel(record)}
							disabled={!record.internshipId || record.internshipStatus === 'completed'}
							size="small"
						/>
					</Tooltip>
				</Space>
			)
		}
	];

	// Map & filter detailed students data ให้แสดงเฉพาะปีการศึกษา / ภาคที่เลือก
	const detailedStudentData = useMemo(() => {
		return (detailedStudents || [])
			.filter((s) => {
				// filter ตามปีการศึกษา
				if (year && s.academicYear !== year) {
					return false;
				}
				// filter ตามภาคการศึกษา (ถ้าเลือก)
				if (semester && s.semester !== semester) {
					return false;
				}
				return true;
			})
			.map((s, i) => ({ key: i, ...s }));
	}, [detailedStudents, year, semester]);

	// เตรียมข้อมูลสำหรับ Bar Chart (คะแนนเฉลี่ยรายหัวข้อ)
	const criteriaBarData = useMemo(() => {
		return (evaluation?.criteriaAverages || []).map((item) => ({
			criteria: item.criteriaName || item.name || 'ไม่ระบุ',
			score: parseFloat(item.averageScore || item.score || 0)
		}));
	}, [evaluation]);

	// เตรียมข้อมูลสำหรับ Pie Chart (สัดส่วนสถานะ)
	const statusPieData = useMemo(() => {
		const enrolledCount = summary?.enrolledCount || 0;
		const completedVal = summary?.completed || 0;
		const inProgressVal = summary?.inProgress || 0;
		const notStartedVal = summary?.notStarted || Math.max(0, enrolledCount - completedVal - inProgressVal);
		
		return [
			{ name: 'เสร็จสิ้น', value: completedVal, fill: CHART_COLORS.success },
			{ name: 'อยู่ระหว่างดำเนินการ', value: inProgressVal, fill: CHART_COLORS.warning },
			{ name: 'ยังไม่เริ่ม', value: notStartedVal, fill: CHART_COLORS.danger }
		].filter(item => item.value > 0);
	}, [summary]);

	return (
	  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
		<Space direction="vertical" style={{ width:'100%' }} size="large">
			<Row justify="space-between" align="middle">
				<Col><Title level={3}>แผงควบคุมรายงานระบบฝึกงาน</Title></Col>
				<Col>
					<Space>
						<span>ปี:</span>
						<Select
							value={year}
							style={{ width:120 }}
							onChange={setYear}
							options={yearOptions.map(y=>({ value:y, label:y }))}
							placeholder="เลือกปีการศึกษา"
						/>
						<span>ภาค:</span>
						<Select
							allowClear
							placeholder="ทั้งหมด"
							value={semester}
							style={{ width:130 }}
							onChange={setSemester}
							options={semesterOptions}
						/>
					</Space>
				</Col>
			</Row>

			{error && <Alert type="error" message={error.message || 'โหลดข้อมูลไม่สำเร็จ'} />}

					<Row gutter={[16,16]}>
						{kpis.map((k,i)=>(
							<Col xs={12} md={6} key={i}>
								<Card loading={loading} size="small" styles={{ header: {minHeight:32}, body: {padding:12 }}}>
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
					<Card title="คะแนนเฉลี่ยรายหัวข้อ (ผู้ควบคุมงาน)" size="small" styles={{ body: {padding:12 }}}>
						{loading ? <Skeleton active /> : (
							<SimpleBarChart 
								data={criteriaBarData}
								xKey="criteria"
								yKey="score"
								height={300}
								barColor={CHART_COLORS.primary}
								yAxisFormatter={(value) => value.toFixed(1)}
							/>
						)}
					</Card>
				</Col>
				<Col xs={24} md={10}>
					<Card title="สัดส่วนสถานะการฝึกงาน" size="small" styles={{ body: {padding:12 }}}>
						{loading ? <Skeleton active /> : (
							<SimplePieChart 
								data={statusPieData}
								height={300}
								innerRadius={60}
								showLabel
								showLegend
							/>
						)}
					</Card>
				</Col>
			</Row>

			<Row gutter={[16,16]}>
				<Col span={24}>
					<Card 
						title="รายชื่อนักศึกษาฝึกงานทั้งหมด" 
						size="small"
						extra={
							<Button onClick={loadDetailedStudents} loading={loadingDetails}>
								รีเฟรช
							</Button>
						}
					>
						<Table 
							size="small" 
							loading={loadingDetails} 
							dataSource={detailedStudentData} 
							columns={detailedStudentColumns} 
							pagination={{ 
								pageSize: 20,
								showSizeChanger: true,
								showTotal: (total) => `ทั้งหมด ${total} รายการ`
							}} 
							scroll={{ x: 1500 }}
						/>
					</Card>
				</Col>
			</Row>

			{/* Modal แก้ไขข้อมูล */}
			<Modal
				title="แก้ไขข้อมูลการฝึกงาน"
				open={editModalVisible}
				onOk={handleEditSubmit}
				onCancel={() => {
					setEditModalVisible(false);
					form.resetFields();
				}}
				confirmLoading={submitting}
				width={600}
				okText="บันทึก"
				cancelText="ยกเลิก"
			>
				<Form form={form} layout="vertical">
					<Form.Item
						label="ชื่อบริษัท"
						name="companyName"
						rules={[{ required: true, message: 'กรุณากรอกชื่อบริษัท' }]}
					>
						<Input placeholder="ชื่อบริษัท" />
					</Form.Item>
					<Form.Item
						label="ตำแหน่ง"
						name="internshipPosition"
					>
						<Input placeholder="ตำแหน่งงาน" />
					</Form.Item>
					<Form.Item
						label="ชื่อพี่เลี้ยง"
						name="supervisorName"
					>
						<Input placeholder="ชื่อพี่เลี้ยง" />
					</Form.Item>
					<Form.Item
						label="สถานะการฝึกงาน"
						name="internshipStatus"
						rules={[{ required: true, message: 'กรุณาเลือกสถานะ' }]}
					>
						<Select placeholder="เลือกสถานะ">
							<Select.Option value="not_started">ยังไม่เริ่ม</Select.Option>
							<Select.Option value="pending_approval">รออนุมัติ</Select.Option>
							<Select.Option value="in_progress">อยู่ระหว่างฝึกงาน</Select.Option>
							<Select.Option value="completed">เสร็จสิ้น</Select.Option>
						</Select>
					</Form.Item>
				</Form>
			</Modal>

			{/* Modal ยกเลิกการฝึกงาน */}
			<Modal
				title="ยกเลิกการฝึกงาน"
				open={cancelModalVisible}
				onOk={handleCancelSubmit}
				onCancel={() => {
					setCancelModalVisible(false);
					form.resetFields(['reason']);
				}}
				confirmLoading={submitting}
				okText="ยืนยันยกเลิก"
				okButtonProps={{ danger: true }}
				cancelText="ปิด"
			>
				{selectedRecord && (
					<>
						<p><strong>นักศึกษา:</strong> {selectedRecord.fullName} ({selectedRecord.studentCode})</p>
						<p><strong>บริษัท:</strong> {selectedRecord.companyName || '-'}</p>
						<Form form={form} layout="vertical" style={{ marginTop: 16 }}>
							<Form.Item
								label="เหตุผลในการยกเลิก"
								name="reason"
								rules={[
									{ required: true, message: 'กรุณาระบุเหตุผล' },
									{ min: 10, message: 'กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร' }
								]}
							>
								<TextArea 
									rows={4} 
									placeholder="ระบุเหตุผลในการยกเลิกการฝึกงาน (เช่น นักศึกษาขอยกเลิกเพราะ...)" 
								/>
							</Form.Item>
						</Form>
					</>
				)}
			</Modal>
		</Space>
		</div>
	);
};

export default InternshipReport;

