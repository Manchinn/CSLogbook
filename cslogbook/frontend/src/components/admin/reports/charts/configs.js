// Chart config builders แยกออกเพื่อให้ UI component บางและ reusable

export const buildWeeklyLineConfig = (trend = []) => {
  const data = trend.flatMap(w => ([
    { category: 'On Time', week: String(w.week), value: w.onTime },
    { category: 'Late', week: String(w.week), value: w.late },
    { category: 'Missing', week: String(w.week), value: w.missing }
  ]));
  return {
    data,
    xField: 'week',
    yField: 'value',
    seriesField: 'category',
    smooth: true,
    height: 260,
    padding: 'auto',
    tooltip: { showMarkers: true },
    legend: { position: 'top' },
    point: { size: 4 },
    animation: false
  };
};

export const buildProposalPieConfig = (proposal) => {
  const rows = [
    { type: 'Draft', value: proposal?.draft || 0 },
    { type: 'Submitted', value: proposal?.submitted || 0 },
    { type: 'Approved', value: proposal?.approved || 0 },
    { type: 'Rejected', value: proposal?.rejected || 0 }
  ].filter(r => r.value > 0);
  const data = rows.length ? rows : [{ type: 'No Data', value: 1 }];
  return {
    data,
    angleField: 'value',
    colorField: 'type',
    height: 260,
    innerRadius: 0.6,
    label: { text: 'type', position: 'outside' },
    legend: { position: 'bottom' },
    tooltip: { items: ['type', 'value'] },
    interactions: [{ type: 'element-active' }]
  };
};
