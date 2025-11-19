// charts/workflowChartConfigs.js

/**
 * Funnel Chart Configuration for Workflow Progress
 */
export const buildFunnelConfig = (funnelData = []) => {
  return {
    data: funnelData.map(item => ({
      stage: item.stepTitle,
      number: item.total,
      completed: item.completed,
      inProgress: item.inProgress,
      pending: item.pending
    })),
    xField: 'stage',
    yField: 'number',
    legend: false,
    label: {
      formatter: (datum) => `${datum.number} คน`,
    },
    tooltip: {
      customContent: (title, items) => {
        if (!items || items.length === 0) return '';
        const data = items[0]?.data;
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${title}</div>
            <div>ทั้งหมด: ${data.number} คน</div>
            <div style="color: #52c41a;">เสร็จสิ้น: ${data.completed || 0} คน</div>
            <div style="color: #1890ff;">กำลังดำเนินการ: ${data.inProgress || 0} คน</div>
            <div style="color: #faad14;">รอดำเนินการ: ${data.pending || 0} คน</div>
          </div>
        `;
      }
    },
    conversionTag: {
      formatter: (datum) => {
        const idx = funnelData.findIndex(f => f.stepTitle === datum.stage);
        if (idx === 0 || idx === -1) return '';
        const prev = funnelData[idx - 1];
        const rate = ((datum.number / prev.total) * 100).toFixed(1);
        return `${rate}%`;
      }
    },
    height: 400
  };
};

/**
 * Bar Chart Configuration for Bottlenecks
 */
export const buildBottleneckBarConfig = (bottlenecks = []) => {
  return {
    data: bottlenecks.slice(0, 10).map(item => ({
      step: item.stepTitle,
      value: parseFloat(item.stuckPercentage) || 0,
      count: item.stuckCount
    })),
    xField: 'value',
    yField: 'step',
    seriesField: 'step',
    legend: false,
    label: {
      position: 'right',
      formatter: (datum) => `${datum.value}% (${datum.count} คน)`
    },
    color: (datum) => {
      const value = datum.value;
      if (value >= 50) return '#ff4d4f';
      if (value >= 30) return '#faad14';
      return '#1890ff';
    },
    xAxis: {
      label: {
        formatter: (v) => `${v}%`
      }
    },
    tooltip: {
      formatter: (datum) => ({
        name: 'นักศึกษาที่ติดอยู่',
        value: `${datum.value}% (${datum.count} คน)`
      })
    },
    height: 300
  };
};

/**
 * Pie Chart Configuration for Overall Status
 */
export const buildOverallStatusPieConfig = (overallStats = []) => {
  const colorMap = {
    not_started: '#d9d9d9',
    eligible: '#52c41a',
    enrolled: '#1890ff',
    in_progress: '#faad14',
    completed: '#52c41a',
    blocked: '#ff4d4f',
    failed: '#ff4d4f'
  };

  const labelMap = {
    not_started: 'ยังไม่เริ่ม',
    eligible: 'มีสิทธิ์',
    enrolled: 'ลงทะเบียนแล้ว',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น',
    blocked: 'ติดขัด',
    failed: 'ไม่ผ่าน'
  };

  return {
    data: overallStats.map(stat => ({
      type: labelMap[stat.status] || stat.status,
      value: stat.count
    })),
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      position: 'outside',
      text: 'type'
    },
    color: overallStats.map(stat => colorMap[stat.status] || '#1890ff'),
    interactions: [{ type: 'element-active' }],
    legend: {
      position: 'bottom'
    },
    height: 300
  };
};
