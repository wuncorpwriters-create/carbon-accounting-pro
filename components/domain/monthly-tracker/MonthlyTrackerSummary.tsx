import React from "react";

type SummaryItemProps = {
  label: string;
  value: string;
  helper?: string;
};

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value, helper }) => (
  <div className="monthly-summary__item">
    <p className="monthly-summary__label">{label}</p>
    <p className="monthly-summary__value">{value}</p>
    {helper ? <p className="monthly-summary__helper">{helper}</p> : null}
  </div>
);

const MonthlyTrackerSummary: React.FC = () => (
  <section className="monthly-summary" aria-label="Monthly summary">
    <SummaryItem label="Reported to date" value="64%" helper="Target: 100%" />
    <SummaryItem label="Estimated emissions" value="12.4 tCO₂e" helper="Placeholder" />
    <SummaryItem label="Sites reporting" value="4 of 6" helper="2 remaining" />
    <SummaryItem label="Deadline" value="Oct 5" helper="10 days left" />
  </section>
);

export default MonthlyTrackerSummary;
