"use client";

import { useState } from "react";

const TOTAL_STEPS = 5;

export default function AssessmentPage() {
  const [step, setStep] = useState(1);

  const handleNext = () => {
    if (step === TOTAL_STEPS) {
      console.log("Assessment complete");
      return;
    }

    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const renderStepFields = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Company name
                <input
                  type="text"
                  placeholder="EcoWorks Ltd."
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Industry
                <select className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                  <option>Manufacturing</option>
                  <option>Technology</option>
                  <option>Retail</option>
                  <option>Logistics</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Headquarters location
                <input
                  type="text"
                  placeholder="Dublin, IE"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Number of employees
                <select className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                  <option>1-10</option>
                  <option>11-50</option>
                  <option>51-250</option>
                  <option>250+</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Primary business activities
              <textarea
                rows={3}
                placeholder="Describe your core products or services."
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Annual electricity usage (kWh)
                <input
                  type="number"
                  placeholder="120000"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Renewable energy share
                <select className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                  <option>0-10%</option>
                  <option>11-25%</option>
                  <option>26-50%</option>
                  <option>51%+</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Primary fuel sources</p>
              <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-600">
                {["Diesel", "Natural gas", "Petrol", "Propane", "Other"].map((fuel) => (
                  <label key={fuel} className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
                    {fuel}
                  </label>
                ))}
              </div>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Fuel usage notes
              <textarea
                rows={3}
                placeholder="Add any seasonal variations or major fuel consumers."
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Number of facilities
                <input
                  type="number"
                  placeholder="3"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Total floor area (sq. meters)
                <input
                  type="number"
                  placeholder="8500"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Water usage tracking
                <select className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                  <option>Yes, metered</option>
                  <option>Partially metered</option>
                  <option>No tracking</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Waste diversion rate
                <select className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                  <option>0-20%</option>
                  <option>21-50%</option>
                  <option>51-80%</option>
                  <option>81%+</option>
                </select>
              </label>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Operational highlights
              <textarea
                rows={3}
                placeholder="Describe any major operational initiatives or constraints."
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Workforce size
                <input
                  type="number"
                  placeholder="120"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Female workforce (%)
                <input
                  type="number"
                  placeholder="45"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Health & safety training
                <select className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                  <option>Annual</option>
                  <option>Quarterly</option>
                  <option>Onboarding only</option>
                  <option>No formal training</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Governance structure
                <select className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                  <option>Board + executive team</option>
                  <option>Founder-led</option>
                  <option>Partnership</option>
                </select>
              </label>
            </div>
            <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">Governance policies in place</p>
              <div className="grid gap-3 md:grid-cols-2 text-sm text-slate-600">
                {["Code of conduct", "Anti-corruption", "Whistleblower policy", "Data privacy"].map(
                  (policy) => (
                    <label key={policy} className="flex items-center gap-2">
                      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600" />
                      {policy}
                    </label>
                  )
                )}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900">
              <h3 className="text-base font-semibold">Review & confirmation</h3>
              <p className="mt-2 text-emerald-800">
                You are ready to finalize your ESG assessment. Review each section, ensure the details
                are accurate, and confirm before finishing.
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-emerald-800">
                <li>Company profile details and reporting scope.</li>
                <li>Energy, fuel, and emissions inputs.</li>
                <li>Facilities, operations, and waste metrics.</li>
                <li>Workforce and governance commitments.</li>
              </ul>
            </div>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600" />
              I confirm the information provided is accurate to the best of my knowledge.
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            ESG Assessment Wizard
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold text-slate-900">Complete your ESG baseline</h1>
            <span className="text-sm font-medium text-slate-500">Step {step} of 5</span>
          </div>
          <p className="text-sm text-slate-600">
            Provide a few key details to generate a structured ESG snapshot for your organization.
          </p>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </header>

        <section className="rounded-2xl bg-white p-8 shadow-lg shadow-slate-200/70">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              {step === 1 && "Company profile"}
              {step === 2 && "Energy & fuel usage"}
              {step === 3 && "Operations & facilities"}
              {step === 4 && "Workforce & governance"}
              {step === 5 && "Review & confirmation"}
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Step {step}
            </span>
          </div>

          {renderStepFields()}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500"
            >
              {step === TOTAL_STEPS ? "Finish" : "Next →"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
