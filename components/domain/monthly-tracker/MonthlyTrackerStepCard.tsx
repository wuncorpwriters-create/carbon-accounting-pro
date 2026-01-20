import React from "react";

type StepStatus = "complete" | "in-progress" | "pending";

export type StepCardProps = {
  title: string;
  description: string;
  status: StepStatus;
  cta: string;
};

const MonthlyTrackerStepCard: React.FC<StepCardProps> = ({ title, description, status, cta }) => {
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

export default MonthlyTrackerStepCard;
