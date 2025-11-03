// หน้าแสดงรายงานเฉพาะโครงงาน (Project)
import React, { useMemo, useRef, useCallback } from 'react';
import { Card, Row, Col, Typography, Select, Space, Skeleton, Alert, Empty, Tabs } from 'antd';
import { SimplePieChart, CHART_COLORS } from './charts/RechartsComponents';
import { useProjectReport } from './hooks/useProjectReport';
import { academicYearOptions } from './constants';

const { Title } = Typography;

const currentAcademicYear = () => {
	const now = new Date();
	const buddhistYear = now.getFullYear() + 543;
	return now.getMonth() < 5 ? buddhistYear - 1 : buddhistYear;
};

const ProjectReport = () => {
	const initialYear = currentAcademicYear();
	const anchorYearRef = useRef(initialYear);
	const { year, setYear, loading, error, projectStatus, overview } = useProjectReport(initialYear);

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
			{ title:'โครงงานทั้งหมด', value: formatNumber(overview?.projectCount) },
			{ title:'ข้อเสนอส่งแล้ว', value: formatNumber(proposal.submitted) },
			{ title:'ข้อเสนออนุมัติ', value: formatNumber(proposal.approved) },
			{ title:'ข้อเสนอรอพิจารณา', value: formatNumber(proposal.pending) }
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
						<Card loading={loading} size="small" styles={{ body: {padding:12 }}}>
							<Space direction="vertical" size={4}>
								<span style={{color:'#888',fontSize:12}}>{k.title}</span>
								<span style={{fontSize:24,fontWeight:600}}>{k.value}</span>
								{k.extra && <span style={{color:'#8c8c8c',fontSize:12}}>{k.extra}</span>}
							</Space>
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
									<Card size="small" title="สถานะข้อเสนอโครงงาน" styles={{ body: {padding:12 }}}>
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
					}
				]}
			/>
		</Space>
		</div>
	);
};

export default ProjectReport;

