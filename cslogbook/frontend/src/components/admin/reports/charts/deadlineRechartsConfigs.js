// charts/deadlineRechartsConfigs.js
// ใช้ Recharts แทน @ant-design/plots เพื่อความง่ายและเสถียร

/**
 * สีสำหรับ Deadline Charts
 */
export const DEADLINE_COLORS = {
  onTime: '#52c41a',
  late: '#faad14',
  notSubmitted: '#ff4d4f',
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  danger: '#ff4d4f'
};

/**
 * ฟังก์ชันกำหนดสีตามอัตราปฏิบัติตาม
 */
export const getComplianceColor = (rate) => {
  if (rate >= 80) return DEADLINE_COLORS.success;
  if (rate >= 60) return DEADLINE_COLORS.warning;
  return DEADLINE_COLORS.danger;
};

/**
 * Format เปอร์เซ็นต์
 */
export const formatPercent = (value) => `${value?.toFixed(1) || 0}%`;

/**
 * Custom Label สำหรับ Bar Chart
 */
export const renderBarLabel = (props) => {
  const { x, y, width, value } = props;
  return (
    <text 
      x={x + width / 2} 
      y={y - 5} 
      fill="#000" 
      textAnchor="middle" 
      fontSize={12}
    >
      {formatPercent(value)}
    </text>
  );
};

/**
 * Custom Tooltip สำหรับ Bar Chart
 */
export const BarChartTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  
  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      padding: '12px',
      border: '1px solid #d9d9d9',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{data.deadline}</div>
      <div>อัตราส่งตรงเวลา: <strong style={{ color: getComplianceColor(data.rate) }}>
        {formatPercent(data.rate)}
      </strong></div>
      <div>ส่งตรงเวลา: {data.onTime}/{data.total} คน</div>
    </div>
  );
};

/**
 * Custom Tooltip สำหรับ Line Chart
 */
export const LineChartTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  
  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      padding: '12px',
      border: '1px solid #d9d9d9',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>สัปดาห์: {data.week}</div>
      <div>อัตราปฏิบัติตาม: <strong style={{ color: DEADLINE_COLORS.primary }}>
        {formatPercent(data.complianceRate)}
      </strong></div>
      <div>ส่งตรงเวลา: {data.onTime}/{data.total} คน</div>
    </div>
  );
};

/**
 * Custom Tooltip สำหรับ Pie Chart
 */
export const PieChartTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0];
  
  return (
    <div style={{
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      padding: '12px',
      border: '1px solid #d9d9d9',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: '8px', color: data.payload.fill }}>
        {data.name}
      </div>
      <div>จำนวน: <strong>{data.value}</strong> คน</div>
      <div>เปอร์เซ็นต์: <strong>{data.payload.percent}%</strong></div>
    </div>
  );
};

/**
 * Custom Label สำหรับ Pie Chart
 */
export const renderPieLabel = (entry) => {
  return `${entry.percent}%`;
};

/**
 * เตรียมข้อมูลสำหรับ Pie Chart
 */
export const preparePieData = (summary) => {
  const data = [
    { 
      name: 'ส่งตรงเวลา', 
      value: summary.onTimeSubmissions || 0,
      fill: DEADLINE_COLORS.onTime
    },
    { 
      name: 'ส่งล่าช้า', 
      value: summary.lateSubmissions || 0,
      fill: DEADLINE_COLORS.late
    },
    { 
      name: 'ยังไม่ส่ง', 
      value: summary.notSubmitted || 0,
      fill: DEADLINE_COLORS.notSubmitted
    }
  ].filter(item => item.value > 0);

  // คำนวณเปอร์เซ็นต์
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return data.map(item => ({
    ...item,
    percent: total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
  }));
};
