import React from 'react';

const LogEntry = ({ date, tasks, problems, solutions }) => {
  return (
    <div className="log-entry">
      <h4>Log Entry for: {date}</h4>
      <div>
        <h5>Tasks:</h5>
        <p>{tasks}</p>
      </div>
      <div>
        <h5>Problems:</h5>
        <p>{problems}</p>
      </div>
      <div>
        <h5>Solutions:</h5>
        <p>{solutions}</p>
      </div>
      {/* Add more details as needed */}
    </div>
  );
};

export default LogEntry;
