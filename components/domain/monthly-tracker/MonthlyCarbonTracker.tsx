import React, { useState } from "react";

import MonthlyTrackerHeader from "./MonthlyTrackerHeader";
import MonthlyTrackerStepCard, { StepCardProps } from "./MonthlyTrackerStepCard";
import MonthlyTrackerSummary from "./MonthlyTrackerSummary";
import { calculateMonthlyEmissions } from "../../../lib/emissions/calculateMonthlyEmissions";

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
  const [inputs, setInputs] = useState({
    electricityKwh: 1200,
    fuelLiters: 150,
    vehicleKm: 800,
  });
  const emissions = calculateMonthlyEmissions(inputs);

  return (
    <section className="monthly-carbon-tracker" aria-labelledby="monthly-tracker-title">
      <MonthlyTrackerHeader />

      <section className="monthly-inputs" aria-label="Monthly emissions inputs">
        <div className="monthly-inputs__grid">
          <label className="monthly-inputs__field">
            <span>Electricity (kWh)</span>
            <input
              type="number"
              value={inputs.electricityKwh}
              onChange={(event) =>
                setInputs((prev) => ({
                  ...prev,
                  electricityKwh: Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="monthly-inputs__field">
            <span>Fuel (liters)</span>
            <input
              type="number"
              value={inputs.fuelLiters}
              onChange={(event) =>
                setInputs((prev) => ({
                  ...prev,
                  fuelLiters: Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="monthly-inputs__field">
            <span>Vehicle travel (km)</span>
            <input
              type="number"
              value={inputs.vehicleKm}
              onChange={(event) =>
                setInputs((prev) => ({
                  ...prev,
                  vehicleKm: Number(event.target.value),
                }))
              }
            />
          </label>
        </div>
      </section>

      <MonthlyTrackerSummary
        {...(emissions as React.ComponentProps<typeof MonthlyTrackerSummary>)}
      />

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
