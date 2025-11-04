// หน้าแสดงรายงานเฉพาะโครงงาน (Project)
import React, { useMemo, useRef, useCallback } from 'react';
import { Card, Row, Col, Typography, Select, Space, Skeleton, Alert, Empty, Tabs, Statistic } from 'antd';
import { 
	ProjectOutlined, 
	CheckCircleOutlined,
	ClockCircleOutlined,
	FileTextOutlined 
} from '@ant-design/icons';
import { SimplePieChart, CHART_COLORS } from './charts/RechartsComponents';
import { useProjectReport } from './hooks/useProjectReport';
import { academicYearOptions } from './constants';

const { Title, Text } = Typography;

const currentAcademicYear = () => {
	const now = new Date();
	const buddhistYear = now.getFullYear() + 543;
	return now.getMonth() < 5 ? buddhistYear - 1 : buddhistYear;
};

const ProjectReport = () => {
	const initialYear = currentAcademicYear();
	const anchorYearRef = useRef(initialYear);
	const { year, setYear, loading, error, projectStatus, advisorLoad, overview } = useProjectReport(initialYear);

	const numberFormatter = useMemo(() => new Intl.NumberFormat('th-TH'), []);
	const formatNumber = useCallback((value, fallback = '-') => {
		if (value == null || Number.isNaN(value)) return fallback;
		if (typeof value === 'number') return numberFormatter.format(value);
		return String(value);
	}, [numberFormatter]);

	const yearOptions = academicYearOptions(anchorYearRef.current);

	// เตรียมข้อมูลสำหรับ Pie Chart (ข้อเสนอโครงงาน)
	const proposalPieData = useMemo(() => {
		const proposal = projectStatus?.proposal || {};
		return [
			{ name: 'อนุมัติ', value: proposal.approved || 0, fill: CHART_COLORS.success },
			{ name: 'รอพิจารณา', value: proposal.pending || 0, fill: CHART_COLORS.warning },
			{ name: 'ปฏิเสธ', value: proposal.rejected || 0, fill: CHART_COLORS.danger },
			{ name: 'ยังไม่ส่ง', value: proposal.notSubmitted || 0, fill: CHART_COLORS.info }
		].filter(item => item.value > 0);
	}, [projectStatus]);

	const kpis = useMemo(() => {
		if(!projectStatus && !overview) return [];
		const proposal = projectStatus?.proposal || {};
		return [
			{ 
				title:'โครงงานทั้งหมด', 
				value: formatNumber(overview?.projectCount),
				icon: <ProjectOutlined />,
				color: '#1890ff'
			},
			{ 
				title:'ข้อเสนอส่งแล้ว', 
				value: formatNumber(proposal.submitted),
				icon: <FileTextOutlined />,
				color: '#13c2c2'
			},
			{ 
				title:'ข้อเสนออนุมัติ', 
				value: formatNumber(proposal.approved),
				icon: <CheckCircleOutlined />,
				color: '#52c41a'
			},
			{ 
				title:'ข้อเสนอรอพิจารณา', 
				value: formatNumber(proposal.pending),
				icon: <ClockCircleOutlined />,
				color: '#faad14'
			}
		];
	}, [projectStatus, overview, formatNumber]);

	const hasProposalData = useMemo(() => {
		return proposalPieData.length > 0;
	}, [proposalPieData]);

	return (
	  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
		<Space direction="vertical" style={{ width:'100%' }} size="large">
			<Row justify="space-between" align="middle">
				<Col><Title level={3}>แผงควบคุมรายงานระบบโครงงานพิเศษ</Title></Col>
				<Col>
					<Space>
						<span>ปีการศึกษา:</span>
						<Select value={year} style={{width:120}} onChange={setYear} options={yearOptions.map(y=>({value:y,label:y}))} />
					</Space>
				</Col>
			</Row>

			{error && <Alert type="error" message={error.message||'โหลดข้อมูลไม่สำเร็จ'} />}

			<Row gutter={[16,16]}>
				{kpis.map((k,i)=>(
					<Col xs={12} md={6} key={i}>
						<Card loading={loading} size="small">
							<Statistic
								title={k.title}
								value={k.value}
								prefix={k.icon}
								valueStyle={{ color: k.color }}
							/>
						</Card>
					</Col>
				))}
			</Row>

			<Tabs
				defaultActiveKey="proposal"
				items={[
					{
						key:'proposal',
						label:'ข้อเสนอโครงงาน',
						children: (
							<Row gutter={[16,16]}>
								<Col xs={24}>
									<Card size="small" title="สถานะข้อเสนอโครงงาน">
										{loading ? <Skeleton active /> : (
											hasProposalData ? (
												<SimplePieChart 
													data={proposalPieData}
													height={300}
													innerRadius={60}
													showLabel
													showLegend
												/>
											) : <Empty description="ยังไม่มีข้อมูลข้อเสนอโครงงาน" image={Empty.PRESENTED_IMAGE_SIMPLE} />
										)}
									</Card>
								</Col>
							</Row>
						)
					},
					{
						key:'advisor',
						label:'ภาระงานอาจารย์',
						children: (
							<Row gutter={[16,16]}>
								<Col xs={24}>
									<Card size="small" title="จำนวนโครงงานที่ดูแลต่ออาจารย์">
										{loading ? <Skeleton active /> : (
											advisorLoad && advisorLoad.length > 0 ? (
												<Space direction="vertical" style={{ width: '100%', gap: 12 }}>
													{advisorLoad.slice(0, 15).map((advisor, index) => (
														<Row key={index} justify="space-between" align="middle" style={{ 
															padding: '8px 12px',
															backgroundColor: advisor.count > 8 ? '#fff1f0' : '#f6ffed',
															borderRadius: 4,
															border: `1px solid ${advisor.count > 8 ? '#ffccc7' : '#b7eb8f'}`
														}}>
															<Col flex="auto">
																<Space direction="vertical" size={0}>
																	<Text strong>{advisor.name || 'ไม่ระบุ'}</Text>
																	<Text type="secondary" style={{ fontSize: 12 }}>
																		ที่ปรึกษาหลัก: {advisor.advisorProjectCount || 0} | 
																		ที่ปรึกษาร่วม: {advisor.coAdvisorProjectCount || 0}
																	</Text>
																</Space>
															</Col>
															<Col>
																<Text strong style={{ 
																	color: advisor.count > 8 ? '#ff4d4f' : '#52c41a',
																	fontSize: 18
																}}>
																	{advisor.count || 0}
																</Text>
															</Col>
														</Row>
													))}
													{advisorLoad.length > 15 && (
														<Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
															แสดง 15 จาก {advisorLoad.length} อาจารย์
														</Text>
													)}
												</Space>
											) : <Empty description="ไม่มีข้อมูลภาระงานอาจารย์" image={Empty.PRESENTED_IMAGE_SIMPLE} />
										)}
									</Card>
								</Col>
							</Row>
						)
					}
				]}
			/>
		</Space>
		</div>
	);
};

export default ProjectReport;

