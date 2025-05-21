import React from 'react';

const SummaryWidget = ({ title, value, icon }) => {
  return (
    <div className="summary-widget">
      {icon && <div className="widget-icon">{icon}</div>}
      <div className="widget-content">
        <h3 className="widget-title">{title}</h3>
        <p className="widget-value">{value}</p>
      </div>
    </div>
  );
};

export default SummaryWidget;
