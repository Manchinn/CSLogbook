// หน้าแสดงรายงานเฉพาะฝึกงาน (Internship)
import React, { useMemo } from 'react';
import { Card, Row, Col, Typography, Select, Space, Skeleton, Alert, Tabs } from 'antd';
import { Line, Pie } from '@ant-design/plots';
import { useInternshipReport } from './hooks/useInternshipReport';
import { academicYearOptions } from './constants';
import { buildWeeklyLineConfig } from './charts/configs';
import { buildLogbookDistributionPie } from './charts/internshipConfigs';

const { Title } = Typography;

const currentAcademicYear = () => {
	const now = new Date();
	const buddhistYear = now.getFullYear() + 543;
	return now.getMonth() < 5 ? buddhistYear - 1 : buddhistYear;
};

const InternshipReport = () => {
	const { year, setYear, loading, error, logbookCompliance } = useInternshipReport(currentAcademicYear());

	const kpis = useMemo(() => {
		if (!logbookCompliance) return [];
		const { rate, weeklyTrend } = logbookCompliance;
		const totalEntries = weeklyTrend.reduce((s,w)=> s + w.onTime + w.late + w.missing, 0);
		return [
			{ title:'On Time %', value: rate.onTimePct + '%' },
			{ title:'Late %', value: rate.latePct + '%' },
			{ title:'Missing %', value: rate.missingPct + '%' },
			{ title:'รวม Log Entries', value: totalEntries }
		];
	}, [logbookCompliance]);

	const yearOptions = academicYearOptions(year);

	return (
		<Space direction="vertical" style={{ width:'100%' }} size="large">
			<Row justify="space-between" align="middle">
				<Col><Title level={3}>Internship Report</Title></Col>
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
				defaultActiveKey="trend"
				items={[{
					key:'trend',
					label:'Weekly Trend',
					children: (
						<Row gutter={[16,16]}>
							<Col xs={24} md={14}>
								<Card size="small" title="Logbook Trend">
									{loading ? <Skeleton active /> : <Line {...buildWeeklyLineConfig(logbookCompliance?.weeklyTrend || [])} />}
								</Card>
							</Col>
							<Col xs={24} md={10}>
								<Card size="small" title="Distribution (OnTime/Late/Missing)">
									{loading ? <Skeleton active /> : <Pie {...buildLogbookDistributionPie(logbookCompliance?.weeklyTrend || [])} />}
								</Card>
							</Col>
						</Row>
					)
				}]}
			/>
		</Space>
	);
};

export default InternshipReport;

