import React from "react";

const MonthlyTrackerHeader: React.FC = () => (
  <header className="monthly-carbon-tracker__header">
    <div>
      <p className="monthly-carbon-tracker__eyebrow">Monthly carbon tracker</p>
      <h1 id="monthly-tracker-title" className="monthly-carbon-tracker__title">
        September 2024 tracking snapshot
      </h1>
      <p className="monthly-carbon-tracker__subtitle">
        Complete the steps below to keep your Scope 1 and 2 reporting on track.
      </p>
    </div>
    <button className="monthly-carbon-tracker__action" type="button">
      Download summary
    </button>
  </header>
);

export default MonthlyTrackerHeader;
