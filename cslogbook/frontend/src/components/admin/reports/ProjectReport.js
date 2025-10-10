// หน้าแสดงรายงานเฉพาะโครงงาน (Project)
import React, { useMemo, Suspense, useRef, useCallback } from 'react';
import { Card, Row, Col, Typography, Select, Space, Skeleton, Alert, Tabs, Table, Empty } from 'antd';
// import { Pie, Bar } from '@ant-design/plots'; // ใช้ lazy แทน
import { LazyPie as Pie, LazyBar as Bar } from './charts/LazyPlots';
import { useProjectReport } from './hooks/useProjectReport';
import { academicYearOptions } from './constants';
import { buildProposalPieConfig } from './charts/configs';
import { buildAdvisorLoadBar } from './charts/projectConfigs';

const { Title } = Typography;

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

	// Memo configs
	const proposalPieConfig = useMemo(()=> buildProposalPieConfig(projectStatus?.proposal), [projectStatus]);
	const advisorLoadBarConfig = useMemo(()=> buildAdvisorLoadBar(advisorLoad?.advisors || []), [advisorLoad]);

	const kpis = useMemo(() => {
		if(!projectStatus && !advisorLoad && !overview) return [];
		const proposal = projectStatus?.proposal || {};
		const advisors = advisorLoad?.advisors || [];
		const totalAdvisees = advisors.reduce((sum,a)=> sum + (a.adviseeCount || 0), 0);
		const totalAdvisorProjects = advisors.reduce((sum,a)=> sum + (a.advisorProjectCount || 0) + (a.coAdvisorProjectCount || 0), 0);
		const advisorCount = advisors.length;
		const avgAdvisees = advisorCount ? (totalAdvisees / advisorCount).toFixed(1) : '-';
		const avgProjects = advisorCount ? (totalAdvisorProjects / advisorCount).toFixed(1) : '-';
		return [
			{ title:'โครงงานทั้งหมด', value: formatNumber(overview?.projectCount) },
			{ title:'ข้อเสนอส่งแล้ว', value: formatNumber(proposal.submitted) },
			{ title:'ข้อเสนออนุมัติ', value: formatNumber(proposal.approved) },
			{ title:'อาจารย์ที่ปรึกษา', value: formatNumber(advisorCount), extra: advisorCount ? `นศ.เฉลี่ย ${avgAdvisees} | โครงงานเฉลี่ย ${avgProjects}` : 'ไม่มีข้อมูล' }
		];
	}, [projectStatus, advisorLoad, overview, formatNumber]);

	const advisorColumns = [
		{ title:'อาจารย์', dataIndex:'name', key:'name', render:(val,record)=> val || (record.teacherId ? `อ.${record.teacherId}` : '-') },
		{ title:'นักศึกษาที่ดูแล', dataIndex:'adviseeCount', key:'adviseeCount', align:'right', render:(val)=> val == null ? '-' : formatNumber(val) },
		{ title:'โครงงาน (ที่ปรึกษาหลัก)', dataIndex:'advisorProjectCount', key:'advisorProjectCount', align:'right', render:(val)=> val == null ? '-' : formatNumber(val) },
		{ title:'โครงงาน (ที่ปรึกษาร่วม)', dataIndex:'coAdvisorProjectCount', key:'coAdvisorProjectCount', align:'right', render:(val)=> val == null ? '-' : formatNumber(val) }
	];
	const advisorData = (advisorLoad?.advisors || []).map((a,i)=>({ key:i, ...a }));
	const advisorSummary = useMemo(()=>{
		// รวมตัวเลขสำคัญของภาระงานอาจารย์เพื่อใช้แสดงสรุปแบบรวดเร็ว
		const advisors = advisorLoad?.advisors || [];
		if (!advisors.length) return null;
		const totalAdvisees = advisors.reduce((sum,a)=> sum + (a.adviseeCount || 0), 0);
		const totalAdvisorProjects = advisors.reduce((sum,a)=> sum + (a.advisorProjectCount || 0), 0);
		const totalCoAdvisorProjects = advisors.reduce((sum,a)=> sum + (a.coAdvisorProjectCount || 0), 0);
		const advisorCount = advisors.length;
		return {
			advisorCount,
			totalAdvisees,
			totalAdvisorProjects,
			totalCoAdvisorProjects,
			avgAdvisee: advisorCount ? totalAdvisees / advisorCount : null,
			avgProjects: advisorCount ? (totalAdvisorProjects + totalCoAdvisorProjects) / advisorCount : null
		};
	}, [advisorLoad]);
	const hasProposalData = useMemo(() => {
		const proposal = projectStatus?.proposal;
		if (!proposal) return false;
		return Object.values(proposal).some(v => (v || 0) > 0);
	}, [projectStatus]);
	const hasAdvisorChartData = useMemo(() => (advisorLoadBarConfig?.data || []).some(d => d.value > 0), [advisorLoadBarConfig]);

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
								<Col xs={24} md={12}>
									<Card size="small" title="สถานะข้อเสนอโครงงาน" styles={{ body: {padding:12 }}}>
										{loading ? <Skeleton active /> : (
											hasProposalData ? (
												<Suspense fallback={<Skeleton active />}> 
													<Pie {...proposalPieConfig} />
												</Suspense>
											) : <Empty description="ยังไม่มีข้อมูลข้อเสนอโครงงาน" image={Empty.PRESENTED_IMAGE_SIMPLE} />
										)}
									</Card>
								</Col>
								<Col xs={24} md={12}>
									<Card size="small" title="ภาระงานอาจารย์" styles={{ body: {padding:12 }}}>
										<Space direction="vertical" style={{width:'100%'}} size="small">
											{advisorSummary && (
												<Space wrap size={[12,4]} style={{fontSize:12,color:'#595959'}}>
													<span>จำนวนอาจารย์: <strong>{formatNumber(advisorSummary.advisorCount)}</strong> คน</span>
													<span>นักศึกษาที่ดูแลรวม: <strong>{formatNumber(advisorSummary.totalAdvisees)}</strong> คน</span>
													<span>โครงงาน (ที่ปรึกษาหลัก): <strong>{formatNumber(advisorSummary.totalAdvisorProjects)}</strong></span>
													<span>โครงงาน (ที่ปรึกษาร่วม): <strong>{formatNumber(advisorSummary.totalCoAdvisorProjects)}</strong></span>
													<span>เฉลี่ยนักศึกษาต่ออาจารย์: <strong>{advisorSummary.avgAdvisee != null ? advisorSummary.avgAdvisee.toFixed(1) : '-'}</strong></span>
													<span>เฉลี่ยโครงงานต่ออาจารย์: <strong>{advisorSummary.avgProjects != null ? advisorSummary.avgProjects.toFixed(1) : '-'}</strong></span>
												</Space>
											)}
											{loading ? <Skeleton active /> : (
												hasAdvisorChartData ? (
													<Suspense fallback={<Skeleton active />}> 
														<Bar {...advisorLoadBarConfig} />
													</Suspense>
												) : <Empty description="ยังไม่มีข้อมูลภาระงานอาจารย์" image={Empty.PRESENTED_IMAGE_SIMPLE} />
											)}
										</Space>
									</Card>
								</Col>
								<Col span={24}>
									<Card size="small" title="รายละเอียดภาระงานอาจารย์">
										<Table
											size="small"
											loading={loading}
											dataSource={advisorData}
											columns={advisorColumns}
											pagination={{pageSize:12}}
											scroll={{ x: 720 }}
											locale={{ emptyText: <Empty description="ยังไม่มีข้อมูลภาระงานอาจารย์" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
										/>
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

