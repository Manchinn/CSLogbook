import { buildProposalPieConfig } from './configs';

// Bar chart แสดง advisor load (จำนวน advisee ต่ออาจารย์)
export const buildAdvisorLoadBar = (advisors = []) => {
  const data = advisors.map(a => ({ advisor: a.name || a.teacherId, students: a.adviseeCount || 0 }));
  return {
    data,
    xField: 'students',
    yField: 'advisor',
    seriesField: undefined,
    legend: false,
    height: 300,
    label: { text: 'students', position: 'right' },
    tooltip: { items: ['advisor','students'] },
    scrollbar: { y: { ratio: 0.5 } }
  };
};

export { buildProposalPieConfig };
