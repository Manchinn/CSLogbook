// หน้าแสดงรายงานเฉพาะโครงงาน (Project) สำหรับงานธุรการ
import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Select, Space, Skeleton, Alert, Empty, Tabs, Statistic, Progress, Tag, Table, Button, Modal, Input, message, Tooltip } from 'antd';
import { 
	ProjectOutlined, 
	CheckCircleOutlined,
	ClockCircleOutlined,
	FileTextOutlined,
	TrophyOutlined,
	ExclamationCircleOutlined,
	BookOutlined,
	LineChartOutlined,
	UserOutlined,
	SettingOutlined,
	CloseCircleOutlined,
} from '@ant-design/icons';
import { SimplePieChart, SimpleLineChart, CHART_COLORS } from './charts/RechartsComponents';
import { useProjectReport } from './hooks/useProjectReport';
import { academicYearOptions } from './constants';
import { getProjectAcademicYears } from '../../../services/reportService';
import projectManagementService from '../../../services/admin/projectManagementService';

const { Title, Text } = Typography;

const currentAcademicYear = () => {
	const now = new Date();
	const buddhistYear = now.getFullYear() + 543;
	return now.getMonth() < 5 ? buddhistYear - 1 : buddhistYear;
};

const ProjectReport = () => {
	const initialYear = currentAcademicYear();
	const anchorYearRef = useRef(initialYear);
	const { year, setYear, loading, error, reportData, examTrends } = useProjectReport(initialYear);
	
	// State สำหรับจัดการโครงงาน
	const [projects, setProjects] = useState([]);
	const [projectsLoading, setProjectsLoading] = useState(false);
	const [cancelModalVisible, setCancelModalVisible] = useState(false);
	const [selectedProject, setSelectedProject] = useState(null);
	const [cancelReason, setCancelReason] = useState('');
	const [cancelling, setCancelling] = useState(false);
	const [projectPagination, setProjectPagination] = useState({
		current: 1,
		pageSize: 20,
		total: 0
	});
	const [projectFilters, setProjectFilters] = useState({
		status: undefined,
		academicYear: initialYear,
		semester: undefined,
		page: 1,
		limit: 20
	});
	const [yearOptionsFromData, setYearOptionsFromData] = useState([]);

	const numberFormatter = useMemo(() => new Intl.NumberFormat('th-TH'), []);
	const formatNumber = useCallback((value, fallback = '-') => {
		if (value == null || Number.isNaN(value)) return fallback;
		if (typeof value === 'number') return numberFormatter.format(value);
		return String(value);
	}, [numberFormatter]);

	// โหลดรายการปีการศึกษาจริงของโครงงานจาก backend และ fallback เป็นช่วงปีจาก anchorYear
	useEffect(() => {
		let isMounted = true;
		const loadYears = async () => {
			try {
				const years = await getProjectAcademicYears();
				if (!isMounted) return;
				if (Array.isArray(years) && years.length > 0) {
					setYearOptionsFromData(years);
				} else {
					setYearOptionsFromData(academicYearOptions(anchorYearRef.current));
				}
			} catch (e) {
				console.error('Error loading project academic years', e);
				if (!isMounted) return;
				setYearOptionsFromData(academicYearOptions(anchorYearRef.current));
			}
		};
		loadYears();
		return () => { isMounted = false; };
	}, []);

	const yearOptions = yearOptionsFromData.length > 0
		? yearOptionsFromData
		: academicYearOptions(anchorYearRef.current);

	// ดึงรายการโครงงาน
	const loadProjects = useCallback(async () => {
		setProjectsLoading(true);
		try {
			const result = await projectManagementService.getAllProjects(projectFilters);
			if (result.success) {
				setProjects(result.data?.projects || []);
				if (result.data?.pagination) {
					setProjectPagination({
						current: result.data.pagination.currentPage,
						pageSize: result.data.pagination.itemsPerPage,
						total: result.data.pagination.totalItems
					});
				}
			} else {
				message.error(result.message || 'ไม่สามารถดึงรายการโครงงานได้');
			}
		} catch (err) {
			message.error('เกิดข้อผิดพลาดในการดึงรายการโครงงาน');
			console.error(err);
		} finally {
			setProjectsLoading(false);
		}
	}, [projectFilters]);

	useEffect(() => {
		loadProjects();
	}, [loadProjects]);

	// จัดการยกเลิกโครงงาน
	const handleCancelProject = useCallback((project) => {
		setSelectedProject(project);
		setCancelReason('');
		setCancelModalVisible(true);
	}, []);

	const handleConfirmCancel = useCallback(async () => {
		if (!selectedProject) return;
		
		setCancelling(true);
		try {
			const result = await projectManagementService.cancelProject(
				selectedProject.projectId,
				cancelReason || 'ยกเลิกโดยเจ้าหน้าที่ภาควิชา'
			);
			
			if (result.success) {
				message.success('ยกเลิกโครงงานสำเร็จ');
				setCancelModalVisible(false);
				setSelectedProject(null);
				setCancelReason('');
				await loadProjects();
			} else {
				message.error(result.message || 'ไม่สามารถยกเลิกโครงงานได้');
			}
		} catch (err) {
			message.error('เกิดข้อผิดพลาดในการยกเลิกโครงงาน');
			console.error(err);
		} finally {
			setCancelling(false);
		}
	}, [selectedProject, cancelReason, loadProjects]);

	// คอลัมน์ตารางโครงงาน
	const projectColumns = useMemo(() => [
		{
			title: 'รหัสโครงงาน',
			dataIndex: 'projectCode',
			key: 'projectCode',
			width: 150,
		},
		{
			title: 'ชื่อโครงงาน',
			dataIndex: 'projectNameTh',
			key: 'projectNameTh',
			width: 300,
			ellipsis: true,
		},
		{
			title: 'ปีการศึกษา/เทอม',
			key: 'academic',
			width: 150,
			render: (_, record) => (
				<Text>{record.academicYear || '-'} / {record.semester || '-'}</Text>
			),
		},
		{
			title: 'สมาชิก',
			key: 'members',
			width: 250,
			render: (_, record) => {
				const members = record.members || [];
				return (
					<Space direction="vertical" size="small">
						{members.map((member, idx) => (
							<Text key={idx}>
								{member.student?.user?.firstName} {member.student?.user?.lastName} ({member.student?.studentCode})
							</Text>
						))}
					</Space>
				);
			},
		},
		{
			title: 'อาจารย์ที่ปรึกษา',
			key: 'advisor',
			width: 200,
			render: (_, record) => (
				<Text>
					{record.advisor?.user?.firstName} {record.advisor?.user?.lastName}
				</Text>
			),
		},
		{
			title: 'สถานะ',
			dataIndex: 'status',
			key: 'status',
			width: 120,
			render: (status) => {
				const statusMap = {
					draft: { color: 'default', text: 'ร่าง' },
					advisor_assigned: { color: 'blue', text: 'มีที่ปรึกษา' },
					in_progress: { color: 'processing', text: 'กำลังดำเนินการ' },
					completed: { color: 'success', text: 'เสร็จสิ้น' },
					archived: { color: 'default', text: 'เก็บแล้ว' },
					cancelled: { color: 'error', text: 'ยกเลิก' },
				};
				const statusInfo = statusMap[status] || { color: 'default', text: status };
				return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
			},
			filters: [
				{ text: 'ร่าง', value: 'draft' },
				{ text: 'มีที่ปรึกษา', value: 'advisor_assigned' },
				{ text: 'กำลังดำเนินการ', value: 'in_progress' },
				{ text: 'เสร็จสิ้น', value: 'completed' },
				{ text: 'เก็บแล้ว', value: 'archived' },
				{ text: 'ยกเลิก', value: 'cancelled' },
			],
			onFilter: (value, record) => record.status === value,
		},
		{
			title: 'การจัดการ',
			key: 'actions',
			width: 120,
			fixed: 'right',
			render: (_, record) => {
				const canCancel = !['completed', 'archived', 'cancelled'].includes(record.status);
				return (
					<Space size="small">
						{canCancel && (
							<Tooltip title="ยกเลิกโครงงาน">
								<Button
									danger
									size="small"
									icon={<CloseCircleOutlined />}
									onClick={(e) => {
										e.stopPropagation();
										handleCancelProject(record);
									}}
								/>
							</Tooltip>
						)}
					</Space>
				);
			},
		},
	], [handleCancelProject]);

	// KPI Cards หลัก
	const summaryKpis = useMemo(() => {
		if (!reportData?.summary) return [];
		const { summary } = reportData;
		return [
			{ 
				title: 'โครงงานทั้งหมด', 
				value: formatNumber(summary.totalProjects),
				icon: <ProjectOutlined />,
				color: '#1890ff'
			},
			{ 
				title: 'เสร็จสิ้นโครงงานพิเศษและปริญญานิพนธ์', 
				value: formatNumber(summary.completedProjects),
				icon: <TrophyOutlined />,
				color: '#52c41a',
			},
			{ 
				title: 'กำลังดำเนินการ', 
				value: formatNumber(summary.activeProjects),
				icon: <ClockCircleOutlined />,
				color: '#13c2c2'
			},
			{ 
				title: 'มีปัญหา/เกินกำหนด', 
				value: formatNumber(summary.criticalIssues),
				icon: <ExclamationCircleOutlined />,
				color: summary.criticalIssues > 0 ? '#ff4d4f' : '#52c41a'
			}
		];
	}, [reportData, formatNumber]);

	// ข้อมูล Project 1 Pie Chart
	const project1PieData = useMemo(() => {
		if (!reportData?.project1) return [];
		const { topicExamPassed, topicExamFailed, topicExamPending, inProgress } = reportData.project1;
		return [
			{ name: 'ผ่านสอบหัวข้อ', value: topicExamPassed || 0, fill: CHART_COLORS.success },
			{ name: 'รอสอบหัวข้อ', value: topicExamPending || 0, fill: CHART_COLORS.warning },
			{ name: 'กำลังดำเนินงาน', value: inProgress || 0, fill: CHART_COLORS.info },
			{ name: 'สอบไม่ผ่าน', value: topicExamFailed || 0, fill: CHART_COLORS.danger }
		].filter(item => item.value > 0);
	}, [reportData]);

	// ข้อมูล Project 2 Pie Chart
	const project2PieData = useMemo(() => {
		if (!reportData?.project2) return [];
		const { thesisExamPassed, thesisExamFailed, thesisExamPending, completed } = reportData.project2;
		return [
			{ name: 'ผ่านสอบปริญญานิพนธ์', value: thesisExamPassed || 0, fill: CHART_COLORS.success },
			{ name: 'รอสอบปริญญานิพนธ์', value: thesisExamPending || 0, fill: CHART_COLORS.warning },
			{ name: 'สำเร็จโครงงานปริญญานิพนธ์', value: completed || 0, fill: '#722ed1' },
			{ name: 'สอบไม่ผ่าน', value: thesisExamFailed || 0, fill: CHART_COLORS.danger }
		].filter(item => item.value > 0);
	}, [reportData]);

	// ข้อมูลแนวโน้มการสอบ
	const trendChartData = useMemo(() => {
		if (!examTrends || !Array.isArray(examTrends)) return [];
		return examTrends.map(trend => ({
			year: `${trend.academicYear}`,
			'Project1 ผ่าน': trend.project1.passed,
			'Project1 ไม่ผ่าน': trend.project1.failed,
			'Project2 ผ่าน': trend.project2.passed,
			'Project2 ไม่ผ่าน': trend.project2.failed
		}));
	}, [examTrends]);

	return (
		<div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
			<Space direction="vertical" style={{ width:'100%' }} size="large">
				<Row justify="space-between" align="middle">
					<Col><Title level={3}>แผงควบคุมรายงานระบบโครงงานพิเศษและปริญญานิพนธ์</Title></Col>
					<Col>
						<Space>
							<span>ปีการศึกษา:</span>
							<Select
								value={year}
								style={{width:120}}
								onChange={(value) => {
									setYear(value);
									// sync filter ของตารางจัดการโครงงานให้ใช้ปีเดียวกัน
									setProjectFilters(prev => ({
										...prev,
										academicYear: value,
										page: 1
									}));
								}}
								options={yearOptions.map(y=>({value:y,label:y}))}
							/>
						</Space>
					</Col>
				</Row>

				{error && <Alert type="error" message={error.message||'โหลดข้อมูลไม่สำเร็จ'} />}

				{/* KPI Cards */}
				<Row gutter={[16,16]}>
					{summaryKpis.map((k,i)=>(
						<Col xs={12} md={6} key={i}>
							<Card loading={loading} size="small">
								<Statistic
									title={k.title}
									value={k.value}
									suffix={k.suffix}
									prefix={k.icon}
									valueStyle={{ color: k.color }}
								/>
							</Card>
						</Col>
					))}
				</Row>

				{/* Tabs สำหรับข้อมูลรายละเอียด */}
				<Tabs
					defaultActiveKey="project1"
					items={[
						{
							key:'project1',
							label: <span><BookOutlined /> โครงงานพิเศษ (Project 1)</span>,
							children: loading ? <Skeleton active /> : (
								<Row gutter={[16,16]}>
									<Col xs={24} lg={12}>
										<Card size="small" title="สถิติโครงงานพิเศษ">
											{reportData?.project1 ? (
												<Space direction="vertical" style={{ width: '100%' }} size="middle">
													<Row gutter={[16,16]}>
														<Col span={12}>
															<Statistic 
																title="ยื่นหัวข้อแล้ว" 
																value={reportData.project1.topicSubmitted} 
																prefix={<FileTextOutlined />}
																valueStyle={{ color: '#13c2c2' }}
															/>
														</Col>
														<Col span={12}>
															<Statistic 
																title="รอสอบหัวข้อ" 
																value={reportData.project1.topicExamPending} 
																prefix={<ClockCircleOutlined />}
																valueStyle={{ color: '#faad14' }}
															/>
														</Col>
														<Col span={12}>
															<Statistic 
																title="ผ่านสอบหัวข้อ" 
																value={reportData.project1.topicExamPassed} 
																prefix={<CheckCircleOutlined />}
																valueStyle={{ color: '#52c41a' }}
															/>
														</Col>
														<Col span={12}>
															<Statistic 
																title="สอบไม่ผ่าน" 
																value={reportData.project1.topicExamFailed} 
																prefix={<ExclamationCircleOutlined />}
																valueStyle={{ color: '#ff4d4f' }}
															/>
														</Col>
													</Row>
													<div>
														<Text strong>อัตราการผ่านสอบหัวข้อ: </Text>
														<Progress 
															percent={reportData.project1.topicPassRate} 
															status={reportData.project1.topicPassRate >= 80 ? 'success' : 'normal'}
															format={percent => `${percent}%`}
														/>
														<Text type="secondary">
															({reportData.project1.topicExamPassed} / {reportData.project1.topicExamTotal} คน)
														</Text>
													</div>
												</Space>
											) : <Empty description="ยังไม่มีข้อมูล" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
										</Card>
									</Col>
									<Col xs={24} lg={12}>
										<Card size="small" title="สัดส่วนสถานะโครงงานพิเศษ1">
											{project1PieData.length > 0 ? (
												<SimplePieChart 
													data={project1PieData}
													height={320}
													innerRadius={60}
													showLabel
													showLegend
												/>
											) : <Empty description="ยังไม่มีข้อมูล" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
										</Card>
									</Col>
								</Row>
							)
						},
						{
							key:'project2',
							label: <span><TrophyOutlined /> ปริญญานิพนธ์ (Project 2)</span>,
							children: loading ? <Skeleton active /> : (
								<Row gutter={[16,16]}>
									<Col xs={24} lg={12}>
										<Card size="small" title="สถิติปริญญานิพนธ์">
											{reportData?.project2 ? (
												<Space direction="vertical" style={{ width: '100%' }} size="middle">
													<Row gutter={[16,16]}>
														<Col span={12}>
															<Statistic 
																title="มีสิทธิ์สอบปริญญานิพนธ์" 
																value={reportData.project2.eligibleForThesis} 
																prefix={<UserOutlined />}
																valueStyle={{ color: '#1890ff' }}
															/>
														</Col>
														<Col span={12}>
															<Statistic 
																title="ยื่นสอบแล้ว" 
																value={reportData.project2.thesisSubmitted} 
																prefix={<FileTextOutlined />}
																valueStyle={{ color: '#13c2c2' }}
															/>
														</Col>
														<Col span={12}>
															<Statistic 
																title="ผ่านสอบปริญญานิพนธ์" 
																value={reportData.project2.thesisExamPassed} 
																prefix={<CheckCircleOutlined />}
																valueStyle={{ color: '#52c41a' }}
															/>
														</Col>
														<Col span={12}>
															<Statistic 
																title="สอบไม่ผ่าน" 
																value={reportData.project2.thesisExamFailed} 
																prefix={<ExclamationCircleOutlined />}
																valueStyle={{ color: '#ff4d4f' }}
															/>
														</Col>
													</Row>
													<div>
														<Text strong>อัตราการผ่านสอบปริญญานิพนธ์: </Text>
														<Progress 
															percent={reportData.project2.thesisPassRate} 
															status={reportData.project2.thesisPassRate >= 80 ? 'success' : 'normal'}
															format={percent => `${percent}%`}
														/>
														<Text type="secondary">
															({reportData.project2.thesisExamPassed} / {reportData.project2.thesisExamTotal} คน)
														</Text>
													</div>
												</Space>
											) : <Empty description="ยังไม่มีข้อมูล" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
										</Card>
									</Col>
									<Col xs={24} lg={12}>
										<Card size="small" title="สัดส่วนสถานะปริญญานิพนธ์">
											{project2PieData.length > 0 ? (
												<SimplePieChart 
													data={project2PieData}
													height={320}
													innerRadius={60}
													showLabel
													showLegend
												/>
											) : <Empty description="ยังไม่มีข้อมูล" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
										</Card>
									</Col>
								</Row>
							)
						},
						{
							key:'management',
							label: <span><SettingOutlined /> จัดการโครงงานพิเศษ</span>,
							children: (
								<Card size="small" title="รายการโครงงานพิเศษ">
									<Space direction="vertical" style={{ width: '100%' }} size="middle">
										<Row gutter={[16, 16]}>
											<Col xs={24} sm={12} md={8}>
												<Select
													style={{ width: '100%' }}
													placeholder="กรองตามสถานะ"
													allowClear
													value={projectFilters.status}
													onChange={(value) => setProjectFilters(prev => ({ ...prev, status: value, page: 1 }))}
													options={[
														{ label: 'ร่าง', value: 'draft' },
														{ label: 'มีที่ปรึกษา', value: 'advisor_assigned' },
														{ label: 'กำลังดำเนินการ', value: 'in_progress' },
														{ label: 'เสร็จสิ้น', value: 'completed' },
														{ label: 'เก็บแล้ว', value: 'archived' },
														{ label: 'ยกเลิก', value: 'cancelled' },
													]}
												/>
											</Col>
											<Col xs={24} sm={12} md={8}>
												<Select
													style={{ width: '100%' }}
													placeholder="กรองตามปีการศึกษา"
													allowClear
													value={projectFilters.academicYear}
													onChange={(value) => setProjectFilters(prev => ({ ...prev, academicYear: value, page: 1 }))}
													options={yearOptions.map(y => ({ value: y, label: y }))}
												/>
											</Col>
											<Col xs={24} sm={12} md={8}>
												<Select
													style={{ width: '100%' }}
													placeholder="กรองตามเทอม"
													allowClear
													value={projectFilters.semester}
													onChange={(value) => setProjectFilters(prev => ({ ...prev, semester: value, page: 1 }))}
													options={[
														{ label: 'เทอม 1', value: 1 },
														{ label: 'เทอม 2', value: 2 },
													]}
												/>
											</Col>
										</Row>
										<Table
											columns={projectColumns}
											dataSource={projects}
											rowKey="projectId"
											loading={projectsLoading}
											pagination={{
												...projectPagination,
												showSizeChanger: true,
												showTotal: (total) => `ทั้งหมด ${total} รายการ`,
												onChange: (page, pageSize) => {
													setProjectFilters(prev => ({ ...prev, page, limit: pageSize }));
												},
											}}
											scroll={{ x: 'max-content' }}
											locale={{
												emptyText: <Empty description="ไม่พบข้อมูลโครงงาน" image={Empty.PRESENTED_IMAGE_SIMPLE} />
											}}
										/>
									</Space>
								</Card>
							)
						},
						{
							key:'additional',
							label: <span><LineChartOutlined /> สถิติเพิ่มเติม</span>,
							children: loading ? <Skeleton active /> : (
								<Row gutter={[16,16]}>
									<Col xs={24}>
										<Card size="small" title="แนวโน้มการสอบผ่าน/ไม่ผ่าน (3 ปีย้อนหลัง)">
											{trendChartData.length > 0 ? (
												<SimpleLineChart 
													data={trendChartData}
													height={300}
													xKey="year"
													lines={[
														{ dataKey: 'Project1 ผ่าน', stroke: CHART_COLORS.success, name: 'Project1 ผ่าน' },
														{ dataKey: 'Project1 ไม่ผ่าน', stroke: CHART_COLORS.danger, name: 'Project1 ไม่ผ่าน' },
														{ dataKey: 'Project2 ผ่าน', stroke: '#13c2c2', name: 'Project2 ผ่าน' },
														{ dataKey: 'Project2 ไม่ผ่าน', stroke: '#ff7875', name: 'Project2 ไม่ผ่าน' }
													]}
													showLegend
												/>
											) : <Empty description="ยังไม่มีข้อมูลแนวโน้ม" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
										</Card>
									</Col>
									<Col xs={24} md={12}>
										<Card size="small" title="ข้อมูลเพิ่มเติม">
											{reportData?.additional ? (
												<Space direction="vertical" style={{ width: '100%' }}>
													<Row justify="space-between">
														<Text>โครงงานที่ล่าช้าเกินกำหนด:</Text>
														<Tag color={reportData.additional.overdueProjects > 0 ? 'error' : 'success'}>
															{reportData.additional.overdueProjects} โครงงาน
														</Tag>
													</Row>
													<Row justify="space-between">
														<Text>โครงงานที่มีปัญหา/ติดขัด:</Text>
														<Tag color={reportData.additional.blockedProjects > 0 ? 'warning' : 'success'}>
															{reportData.additional.blockedProjects} โครงงาน
														</Tag>
													</Row>
													<Row justify="space-between">
														<Text>ระยะเวลาเฉลี่ยในการทำโครงงาน:</Text>
														<Tag color="blue">
															{reportData.additional.avgDurationDays} วัน
														</Tag>
													</Row>
													<Row justify="space-between">
														<Text>อัตราความสำเร็จโดยรวม:</Text>
														<Tag color={reportData.additional.overallSuccessRate >= 80 ? 'success' : 'warning'}>
															{reportData.additional.overallSuccessRate}%
														</Tag>
													</Row>
												</Space>
											) : <Empty description="ยังไม่มีข้อมูล" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
										</Card>
									</Col>
									<Col xs={24} md={12}>
										<Card size="small" title="สรุปตามเฟส (Phase Breakdown)">
											{reportData?.additional?.phaseBreakdown ? (
												<Space direction="vertical" style={{ width: '100%', fontSize: '12px' }}>
													{Object.entries(reportData.additional.phaseBreakdown).map(([phase, count]) => (
														<Row key={phase} justify="space-between" style={{ padding: '4px 0' }}>
															<Text style={{ fontSize: '12px' }}>{phase}:</Text>
															<Text strong>{count}</Text>
														</Row>
													))}
												</Space>
											) : <Empty description="ยังไม่มีข้อมูล" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
										</Card>
									</Col>
								</Row>
							)
						}
					]}
				/>

				{/* Modal ยกเลิกโครงงาน */}
				<Modal
					title="ยกเลิกโครงงานพิเศษ"
					open={cancelModalVisible}
					onOk={handleConfirmCancel}
					onCancel={() => {
						setCancelModalVisible(false);
						setSelectedProject(null);
						setCancelReason('');
					}}
					confirmLoading={cancelling}
					okText="ยืนยันยกเลิก"
					cancelText="ยกเลิก"
					okButtonProps={{ danger: true }}
				>
					{selectedProject && (
						<Space direction="vertical" style={{ width: '100%' }} size="middle">
							<Alert
								message="คำเตือน"
								description="การยกเลิกโครงงานจะทำให้สถานะโครงงานเป็น 'cancelled' และนักศึกษาทั้งสองคนสามารถส่งเสนอหัวข้อโครงงานพิเศษใหม่ได้ในภาคการศึกษาถัดไป"
								type="warning"
								showIcon
							/>
							<div>
								<Text strong>รหัสโครงงาน: </Text>
								<Text>{selectedProject.projectCode}</Text>
							</div>
							<div>
								<Text strong>ชื่อโครงงาน: </Text>
								<Text>{selectedProject.projectNameTh}</Text>
							</div>
							<div>
								<Text strong>สมาชิก: </Text>
								<Space direction="vertical" size="small">
									{selectedProject.members?.map((member, idx) => (
										<Text key={idx}>
											{member.student?.user?.firstName} {member.student?.user?.lastName} ({member.student?.studentCode})
										</Text>
									))}
								</Space>
							</div>
							<div>
								<Text strong>เหตุผลในการยกเลิก (ไม่บังคับ):</Text>
								<Input.TextArea
									rows={4}
									value={cancelReason}
									onChange={(e) => setCancelReason(e.target.value)}
									placeholder="ระบุเหตุผลในการยกเลิกโครงงาน (ถ้ามี)"
									style={{ marginTop: 8 }}
								/>
							</div>
						</Space>
					)}
				</Modal>
			</Space>
		</div>
	);
};

export default ProjectReport;

