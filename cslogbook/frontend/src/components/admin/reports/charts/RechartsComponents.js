// RechartsComponents.js
// Common Recharts Components พร้อม default config และ styling

import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

/**
 * สีมาตรฐานสำหรับ charts
 */
export const CHART_COLORS = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  danger: '#ff4d4f',
  info: '#13c2c2',
  purple: '#722ed1',
  cyan: '#13c2c2',
  orange: '#fa8c16',
  // สีสำหรับ Pie chart
  colors: ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#fa8c16', '#eb2f96']
};

/**
 * Default Tooltip Style
 */
const defaultTooltipStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  padding: '12px',
  border: '1px solid #d9d9d9',
  borderRadius: '4px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
};

/**
 * Simple Bar Chart Component
 */
export const SimpleBarChart = ({ 
  data, 
  xKey, 
  yKey, 
  height = 300,
  barColor = CHART_COLORS.primary,
  showLabel = true,
  tooltipFormatter,
  labelFormatter,
  yAxisFormatter
}) => {
  const renderLabel = (props) => {
    const { x, y, width, value } = props;
    const displayValue = labelFormatter ? labelFormatter(value) : value;
    return (
      <text x={x + width / 2} y={y - 5} fill="#000" textAnchor="middle" fontSize={12}>
        {displayValue}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    
    if (tooltipFormatter) {
      return tooltipFormatter(data);
    }

    return (
      <div style={defaultTooltipStyle}>
        <div><strong>{data[xKey]}</strong></div>
        <div>{yKey}: {data[yKey]}</div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} angle={-45} textAnchor="end" height={100} interval={0} style={{ fontSize: 11 }} />
        <YAxis tickFormatter={yAxisFormatter} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={yKey} fill={barColor} label={showLabel ? renderLabel : false} />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * Multi-Bar Chart Component
 */
export const MultiBarChart = ({ 
  data, 
  xKey, 
  bars = [], // [{ key: 'value1', name: 'Name', color: '#xxx' }]
  height = 300,
  showLegend = true,
  tooltipFormatter,
  yAxisFormatter
}) => {
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    if (tooltipFormatter) {
      return tooltipFormatter(payload);
    }

    return (
      <div style={defaultTooltipStyle}>
        <div><strong>{payload[0].payload[xKey]}</strong></div>
        {payload.map((entry, index) => (
          <div key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} angle={-45} textAnchor="end" height={100} interval={0} style={{ fontSize: 11 }} />
        <YAxis tickFormatter={yAxisFormatter} />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        {bars.map((bar, index) => (
          <Bar key={index} dataKey={bar.key} name={bar.name} fill={bar.color || CHART_COLORS.colors[index]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * Simple Line Chart Component
 */
export const SimpleLineChart = ({ 
  data, 
  xKey, 
  yKey,
  height = 250,
  lineColor = CHART_COLORS.primary,
  showLabel = true,
  tooltipFormatter,
  labelFormatter,
  yAxisFormatter
}) => {
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    
    if (tooltipFormatter) {
      return tooltipFormatter(data);
    }

    return (
      <div style={defaultTooltipStyle}>
        <div><strong>{data[xKey]}</strong></div>
        <div>{yKey}: {data[yKey]}</div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} style={{ fontSize: 11 }} />
        <YAxis tickFormatter={yAxisFormatter} />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey={yKey} 
          stroke={lineColor}
          strokeWidth={2}
          dot={{ fill: lineColor, r: 4 }}
          label={showLabel ? { 
            position: 'top',
            formatter: labelFormatter || ((value) => value),
            style: { fontSize: 11 }
          } : false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * Simple Pie Chart Component
 */
export const SimplePieChart = ({ 
  data, // [{ name: 'Name', value: 100, fill: '#xxx' }]
  height = 300,
  innerRadius = 0, // 0 = Pie, >0 = Donut
  showLabel = true,
  showLegend = true,
  tooltipFormatter,
  labelFormatter
}) => {
  const renderLabel = (entry) => {
    if (labelFormatter) {
      return labelFormatter(entry);
    }
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const percent = ((entry.value / total) * 100).toFixed(1);
    return `${percent}%`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    if (tooltipFormatter) {
      return tooltipFormatter(payload[0]);
    }

    const data = payload[0];
    const total = payload[0].payload.total || data.value;
    const percent = ((data.value / total) * 100).toFixed(1);
    
    return (
      <div style={defaultTooltipStyle}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: data.payload.fill }}>
          {data.name}
        </div>
        <div>จำนวน: <strong>{data.value}</strong></div>
        <div>เปอร์เซ็นต์: <strong>{percent}%</strong></div>
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={showLabel ? renderLabel : false}
          outerRadius={innerRadius > 0 ? 100 : 80}
          innerRadius={innerRadius}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill || CHART_COLORS.colors[index % CHART_COLORS.colors.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );
};

/**
 * Helper: Format เปอร์เซ็นต์
 */
export const formatPercent = (value) => `${value?.toFixed?.(1) || 0}%`;

/**
 * Helper: Format ตัวเลข
 */
export const formatNumber = (value) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

/**
 * Helper: กำหนดสีตามค่า threshold
 */
export const getColorByThreshold = (value, thresholds = { good: 80, warning: 60 }) => {
  if (value >= thresholds.good) return CHART_COLORS.success;
  if (value >= thresholds.warning) return CHART_COLORS.warning;
  return CHART_COLORS.danger;
};
