import { buildWeeklyLineConfig } from './configs';

// สร้าง config สำหรับ donut distribution ของ onTime/late/missing
export const buildLogbookDistributionPie = (trend = []) => {
  const sum = trend.reduce((acc,w)=>{
    acc.onTime += w.onTime; acc.late += w.late; acc.missing += w.missing; return acc;
  }, { onTime:0, late:0, missing:0 });
  const rows = [
    { type:'On Time', value: sum.onTime },
    { type:'Late', value: sum.late },
    { type:'Missing', value: sum.missing }
  ].filter(r=>r.value>0);
  const data = rows.length ? rows : [{ type: 'No Data', value: 1 }];
  return {
    data,
    angleField: 'value',
    colorField: 'type',
    innerRadius: 0.6,
    height: 240,
    legend: { position: 'bottom' },
    label: { text: 'type', position: 'outside' },
    tooltip: { items: ['type', 'value'] }
  };
};

export { buildWeeklyLineConfig };
