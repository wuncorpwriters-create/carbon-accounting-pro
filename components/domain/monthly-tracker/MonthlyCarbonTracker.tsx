import React from "react";

import MonthlyTrackerHeader from "./MonthlyTrackerHeader";
import MonthlyTrackerStepCard, { StepCardProps } from "./MonthlyTrackerStepCard";
import MonthlyTrackerSummary from "./MonthlyTrackerSummary";

const MonthlyCarbonTracker: React.FC = () => {
  const steps: StepCardProps[] = [
    {
      title: "Electricity",
      description: "Upload or enter your monthly electricity usage for facilities.",
      status: "complete",
      cta: "Review usage",
    },
    {
      title: "Fuel",
      description: "Track natural gas, propane, or other stationary combustion sources.",
      status: "in-progress",
      cta: "Continue entry",
    },
    {
      title: "Vehicles",
      description: "Capture mileage and fuel receipts for company vehicles.",
      status: "pending",
      cta: "Start tracking",
    },
  ];

  return (
    <section className="monthly-carbon-tracker" aria-labelledby="monthly-tracker-title">
      <MonthlyTrackerHeader />

      <MonthlyTrackerSummary />

      <section className="monthly-progress" aria-label="Progress indicator">
        <div className="monthly-progress__header">
          <h2 className="monthly-progress__title">Progress</h2>
          <p className="monthly-progress__value">2 of 3 steps completed</p>
        </div>
        <div className="monthly-progress__bar" role="progressbar" aria-valuenow={66} aria-valuemin={0} aria-valuemax={100}>
          <span className="monthly-progress__fill" style={{ width: "66%" }} />
        </div>
        <p className="monthly-progress__hint">You are one step away from being report-ready.</p>
      </section>

      <section className="monthly-steps" aria-label="Monthly tracking steps">
        <div className="monthly-steps__header">
          <h2 className="monthly-steps__title">Steps</h2>
          <p className="monthly-steps__subtitle">Prioritize the remaining activity data for this month.</p>
        </div>
        <div className="monthly-steps__grid">
          {steps.map((step) => (
            <MonthlyTrackerStepCard key={step.title} {...step} />
          ))}
        </div>
      </section>
    </section>
  );
};

export default MonthlyCarbonTracker;
