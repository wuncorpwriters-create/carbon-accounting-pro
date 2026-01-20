import React from "react";

type StepStatus = "complete" | "in-progress" | "pending";

type StepCardProps = {
  title: string;
  description: string;
  status: StepStatus;
  cta: string;
};

type SummaryItemProps = {
  label: string;
  value: string;
  helper?: string;
};

const StepCard: React.FC<StepCardProps> = ({ title, description, status, cta }) => {
  const statusLabel =
    status === "complete"
      ? "Complete"
      : status === "in-progress"
      ? "In progress"
      : "Not started";

  return (
    <article className={`step-card step-card--${status}`} aria-label={`${title} step`}>
      <header className="step-card__header">
        <div>
          <p className="step-card__eyebrow">{statusLabel}</p>
          <h3 className="step-card__title">{title}</h3>
        </div>
        <span className="step-card__status" aria-hidden="true">
          {status === "complete" ? "✓" : status === "in-progress" ? "•" : "○"}
        </span>
      </header>
      <p className="step-card__description">{description}</p>
      <button className="step-card__cta" type="button">
        {cta}
      </button>
    </article>
  );
};

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value, helper }) => (
  <div className="monthly-summary__item">
    <p className="monthly-summary__label">{label}</p>
    <p className="monthly-summary__value">{value}</p>
    {helper ? <p className="monthly-summary__helper">{helper}</p> : null}
  </div>
);

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

      <section className="monthly-summary" aria-label="Monthly summary">
        <SummaryItem label="Reported to date" value="64%" helper="Target: 100%" />
        <SummaryItem label="Estimated emissions" value="12.4 tCO₂e" helper="Placeholder" />
        <SummaryItem label="Sites reporting" value="4 of 6" helper="2 remaining" />
        <SummaryItem label="Deadline" value="Oct 5" helper="10 days left" />
      </section>

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
            <StepCard key={step.title} {...step} />
          ))}
        </div>
      </section>
    </section>
  );
};

export default MonthlyCarbonTracker;
