import React from "react";

type MonthlyTrackerHeaderProps = {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
};

const formatMonthLabel = (monthValue: string) => {
  if (!monthValue) {
    return "Monthly tracking snapshot";
  }

  const [year, month] = monthValue.split("-");
  const monthIndex = Number(month) - 1;

  if (!year || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return "Monthly tracking snapshot";
  }

  const date = new Date(Number(year), monthIndex, 1);

  return `${date.toLocaleString("default", {
    month: "long",
  })} ${date.getFullYear()} tracking snapshot`;
};

const MonthlyTrackerHeader: React.FC<MonthlyTrackerHeaderProps> = ({
  selectedMonth,
  onMonthChange,
}) => (
  <header className="monthly-carbon-tracker__header">
    <div>
      <p className="monthly-carbon-tracker__eyebrow">Monthly carbon tracker</p>
      <h1 id="monthly-tracker-title" className="monthly-carbon-tracker__title">
        {formatMonthLabel(selectedMonth)}
      </h1>
      <p className="monthly-carbon-tracker__subtitle">
        Complete the steps below to keep your Scope 1 and 2 reporting on track.
      </p>
    </div>
    <div>
      <label>
        <span className="monthly-carbon-tracker__eyebrow">Select month</span>
        <input
          type="month"
          value={selectedMonth}
          onChange={(event) => onMonthChange(event.target.value)}
          aria-label="Select tracking month"
        />
      </label>
      <button className="monthly-carbon-tracker__action" type="button">
        Download summary
      </button>
    </div>
  </header>
);

export default MonthlyTrackerHeader;
