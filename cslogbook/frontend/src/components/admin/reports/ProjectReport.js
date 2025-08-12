// หน้าแสดงรายงานเฉพาะโครงงาน (Project)
import React, { useMemo } from 'react';
import { Card, Row, Col, Typography, Select, Space, Skeleton, Alert, Tabs, Table } from 'antd';
import { Pie, Bar } from '@ant-design/plots';
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
	const { year, setYear, loading, error, projectStatus, advisorLoad, overview } = useProjectReport(currentAcademicYear());

	const kpis = useMemo(() => {
		if(!projectStatus || !advisorLoad || !overview) return [];
		const proposal = projectStatus.proposal || {};
		const advisors = advisorLoad.advisors || [];
		const avgAdvisees = advisors.length ? (advisors.reduce((s,a)=>s + (a.adviseeCount||0),0)/advisors.length).toFixed(1) : '-';
		return [
			{ title:'Projects', value: overview.projectCount },
			{ title:'Submitted', value: proposal.submitted },
			{ title:'Approved', value: proposal.approved },
			{ title:'Advisors (Avg Advisee)', value: advisors.length + ' (' + avgAdvisees + ')' }
		];
	}, [projectStatus, advisorLoad, overview]);

	const yearOptions = academicYearOptions(year);

	const advisorColumns = [
		{ title:'อาจารย์', dataIndex:'name', key:'name' },
		{ title:'Advisee', dataIndex:'adviseeCount', key:'adviseeCount' },
		{ title:'AdvisorProj', dataIndex:'advisorProjectCount', key:'advisorProjectCount' },
		{ title:'CoAdvisorProj', dataIndex:'coAdvisorProjectCount', key:'coAdvisorProjectCount' }
	];
	const advisorData = (advisorLoad?.advisors || []).map((a,i)=>({ key:i, ...a }));

	return (
		<Space direction="vertical" style={{ width:'100%' }} size="large">
			<Row justify="space-between" align="middle">
				<Col><Title level={3}>Project Report</Title></Col>
				<Col>
					<Space>
						<span>ปี:</span>
						<Select value={year} style={{width:120}} onChange={setYear} options={yearOptions.map(y=>({value:y,label:y}))} />
					</Space>
				</Col>
			</Row>

			{error && <Alert type="error" message={error.message||'โหลดข้อมูลไม่สำเร็จ'} />}

			<Row gutter={[16,16]}>
				{kpis.map((k,i)=>(
					<Col xs={12} md={6} key={i}>
						<Card loading={loading}>
							<Space direction="vertical" size={0}>
								<span style={{color:'#888'}}>{k.title}</span>
								<span style={{fontSize:22,fontWeight:600}}>{k.value}</span>
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
						label:'Proposal Status',
						children: (
							<Row gutter={[16,16]}>
								<Col xs={24} md={12}>
									<Card size="small" title="Proposal Status">
										{loading ? <Skeleton active /> : <Pie {...buildProposalPieConfig(projectStatus?.proposal)} />}
									</Card>
								</Col>
								<Col xs={24} md={12}>
									<Card size="small" title="Advisor Load (Students)">
										{loading ? <Skeleton active /> : <Bar {...buildAdvisorLoadBar(advisorLoad?.advisors || [])} />}
									</Card>
								</Col>
								<Col span={24}>
									<Card size="small" title="Advisor Detail">
										<Table size="small" loading={loading} dataSource={advisorData} columns={advisorColumns} pagination={{pageSize:12}} />
									</Card>
								</Col>
							</Row>
						)
					}
				]}
			/>
		</Space>
	);
};

export default ProjectReport;

