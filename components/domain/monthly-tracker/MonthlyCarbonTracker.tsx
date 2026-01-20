"use client";

import React, { useMemo, useState } from "react";

type ReportInputs = {
  companyName: string;
  country: string;
  industry: string;
  employeeRange: string;
  reportingPeriod: string;
  consumesFuel: string;
  fuelTypes: string[];
  totalFuelLiters: string;
  primaryFuelUse: string;
  usesGridElectricity: string;
  electricityUsageKwh: string;
  electricityUsagePeriod: string;
  facilityCount: string;
  usesBackupPower: string;
  tracksWaterUsage: string;
  estimatedWaterUsage: string;
  healthSafetyPractices: string;
  trainingProvided: string;
  femaleWorkforcePercent: string;
  businessRegistered: string;
  managementStructure: string;
  writtenPolicies: string[];
  dataConfidence: string;
};

type EmissionsResult = {
  fuelEmissions: number;
  electricityEmissions: number;
  totalEmissions: number;
  primaryDriver: string;
};

type ScoreResult = {
  environmentalScore: number;
  environmentalGrade: string;
  socialScore: number;
  socialGrade: string;
  governanceScore: number;
  governanceGrade: string;
};

const countries = ["Ireland", "United Kingdom", "Germany", "France", "Spain", "Netherlands", "Other"];
const industries = ["Manufacturing", "Construction", "Retail", "Professional Services", "Logistics", "Technology", "Other"];

const emissionCalculation = (inputs: ReportInputs): EmissionsResult => {
  const fuelLiters = Number(inputs.totalFuelLiters) || 0;
  const electricityKwh = Number(inputs.electricityUsageKwh) || 0;
  const electricityMultiplier = inputs.electricityUsagePeriod === "monthly" ? 12 : 1;
  const totalElectricityKwh = electricityKwh * electricityMultiplier;
  const fuelEmissions = inputs.consumesFuel === "yes" ? Math.round((fuelLiters * 2.7) / 1000) : 0;
  const electricityEmissions =
    inputs.usesGridElectricity === "yes" ? Math.round(totalElectricityKwh * 0.0005) : 0;
  const totalEmissions = Math.round(fuelEmissions + electricityEmissions);
  const primaryDriver =
    totalEmissions === 0
      ? "No emissions data"
      : fuelEmissions > electricityEmissions
        ? "Fuel consumption"
        : electricityEmissions > fuelEmissions
          ? "Electricity usage"
          : "Fuel and electricity";

  return {
    fuelEmissions,
    electricityEmissions,
    totalEmissions,
    primaryDriver,
  };
};

const getGrade = (score: number, tiers: { a: number; b: number }) => {
  if (score >= tiers.a) return "A";
  if (score >= tiers.b) return "B";
  return "C";
};

const scoreCalculation = (inputs: ReportInputs): ScoreResult => {
  const fuelDataProvided = inputs.consumesFuel === "yes" && Number(inputs.totalFuelLiters) > 0;
  const electricityDataProvided =
    inputs.usesGridElectricity === "yes" && Number(inputs.electricityUsageKwh) > 0;
  const waterTracked = inputs.tracksWaterUsage === "yes" || inputs.tracksWaterUsage === "estimate";
  const completeEnergyData =
    (inputs.consumesFuel === "no" || fuelDataProvided) &&
    (inputs.usesGridElectricity === "no" || electricityDataProvided);
  const confidenceScore =
    inputs.dataConfidence === "high" ? 2 : inputs.dataConfidence === "medium" ? 1 : 0;

  const environmentalScore =
    (fuelDataProvided ? 2 : 0) +
    (electricityDataProvided ? 2 : 0) +
    (waterTracked ? 1 : 0) +
    (completeEnergyData ? 1 : 0) +
    confidenceScore;

  const employeeCountProvided = inputs.employeeRange !== "";
  const healthSafetyScore = inputs.healthSafetyPractices === "yes" ? 2 : 0;
  const trainingScore = inputs.trainingProvided === "yes" ? 2 : 0;
  const genderDiversityScore = inputs.femaleWorkforcePercent !== "" ? 1 : 0;
  const socialScore =
    (employeeCountProvided ? 1 : 0) + healthSafetyScore + trainingScore + genderDiversityScore;

  const governanceScore =
    (inputs.businessRegistered === "yes" ? 2 : 0) +
    (inputs.managementStructure !== "" ? 2 : 0) +
    (inputs.writtenPolicies.some((policy) => policy !== "none") ? 2 : 0);

  return {
    environmentalScore,
    environmentalGrade: getGrade(environmentalScore, { a: 7, b: 4 }),
    socialScore,
    socialGrade: getGrade(socialScore, { a: 5, b: 3 }),
    governanceScore,
    governanceGrade: getGrade(governanceScore, { a: 5, b: 3 }),
  };
};

const escapePdfText = (value: string) => value.replace(/[()\\]/g, "\\$&");

const buildPdf = (title: string, pages: string[][]) => {
  const pageCount = pages.length;
  const fontObjectNumber = 3 + pageCount * 2;
  const objects: { number: number; content: string }[] = [];

  objects.push({
    number: 1,
    content: "<< /Type /Catalog /Pages 2 0 R >>",
  });

  const pageRefs = Array.from({ length: pageCount }, (_, index) => `${3 + index} 0 R`).join(" ");
  objects.push({
    number: 2,
    content: `<< /Type /Pages /Count ${pageCount} /Kids [${pageRefs}] >>`,
  });

  pages.forEach((lines, index) => {
    const pageNumber = 3 + index;
    const contentNumber = 3 + pageCount + index;
    objects.push({
      number: pageNumber,
      content: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentNumber} 0 R >>`,
    });

    const textLines = [title, ...lines].map(escapePdfText);
    const stream = textLines
      .map((line, lineIndex) =>
        lineIndex === 0
          ? `BT /F1 18 Tf 72 740 Td (${line}) Tj`
          : `T* /F1 12 Tf (${line}) Tj`
      )
      .join("\n");

    const contentStream = `${stream}\nET`;
    objects.push({
      number: contentNumber,
      content: `<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`,
    });
  });

  objects.push({
    number: fontObjectNumber,
    content: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  });

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  objects.forEach((obj) => {
    offsets.push(pdf.length);
    pdf += `${obj.number} 0 obj\n${obj.content}\nendobj\n`;
  });

  const xrefPosition = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
};

const MonthlyCarbonTracker: React.FC = () => {
  const reportId = useMemo(() => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `report-${Date.now()}`;
  }, []);

  const [inputs, setInputs] = useState<ReportInputs>({
    companyName: "",
    country: "",
    industry: "",
    employeeRange: "",
    reportingPeriod: "",
    consumesFuel: "",
    fuelTypes: [],
    totalFuelLiters: "",
    primaryFuelUse: "",
    usesGridElectricity: "",
    electricityUsageKwh: "",
    electricityUsagePeriod: "annual",
    facilityCount: "",
    usesBackupPower: "",
    tracksWaterUsage: "",
    estimatedWaterUsage: "",
    healthSafetyPractices: "",
    trainingProvided: "",
    femaleWorkforcePercent: "",
    businessRegistered: "",
    managementStructure: "",
    writtenPolicies: [],
    dataConfidence: "",
  });

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [activeModal, setActiveModal] = useState<"signup" | "payment" | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("one-off");
  const [hasSaved, setHasSaved] = useState(false);

  const emissions = emissionCalculation(inputs);
  const scores = scoreCalculation(inputs);
  const reportDate = new Date().toLocaleDateString();
  const reportVersion = "v1.0";

  const reportPayload = useMemo(
    () => ({
      report_id: reportId,
      inputs,
    }),
    [inputs, reportId]
  );

  const handleTogglePolicy = (value: string) => {
    setInputs((prev) => {
      const exists = prev.writtenPolicies.includes(value);
      const next = exists
        ? prev.writtenPolicies.filter((policy) => policy !== value)
        : [...prev.writtenPolicies.filter((policy) => policy !== "none"), value];
      if (value === "none" && !exists) {
        return { ...prev, writtenPolicies: ["none"] };
      }
      return { ...prev, writtenPolicies: next };
    });
  };

  const handleToggleFuelType = (value: string) => {
    setInputs((prev) => {
      const exists = prev.fuelTypes.includes(value);
      const next = exists
        ? prev.fuelTypes.filter((fuel) => fuel !== value)
        : [...prev.fuelTypes, value];
      return { ...prev, fuelTypes: next };
    });
  };

  const handleSaveReport = () => {
    if (!isSignedIn) {
      setActiveModal("signup");
      return;
    }
    setHasSaved(true);
  };

  const handleDownloadPdf = () => {
    if (!isSignedIn) {
      setActiveModal("signup");
      return;
    }
    if (!isPaid) {
      setActiveModal("payment");
      return;
    }

    const pdfPages = [
      [
        "Cover",
        `Report ID: ${reportId}`,
        `Prepared for: ${inputs.companyName || "Company"}`,
        `Date: ${reportDate}`,
        `Version: ${reportVersion}`,
      ],
      [
        "Executive summary",
        `Total emissions: ${emissions.totalEmissions} tCO2e`,
        `Primary driver: ${emissions.primaryDriver}`,
        `Environmental grade: ${scores.environmentalGrade}`,
        `Social grade: ${scores.socialGrade}`,
        `Governance grade: ${scores.governanceGrade}`,
      ],
      [
        "Environmental overview",
        "Charts: emissions by activity, fuel vs electricity",
        `Fuel emissions: ${emissions.fuelEmissions} tCO2e`,
        `Electricity emissions: ${emissions.electricityEmissions} tCO2e`,
      ],
      [
        "Scope & boundary",
        "Scope 1 fuel usage and Scope 2 grid electricity.",
        "Self-reported baseline for the reporting period.",
      ],
      [
        "ESG snapshot",
        `Environmental score: ${scores.environmentalScore}/8 (${scores.environmentalGrade})`,
        `Social score: ${scores.socialScore}/6 (${scores.socialGrade})`,
        `Governance score: ${scores.governanceScore}/6 (${scores.governanceGrade})`,
        `Data confidence: ${inputs.dataConfidence || "Not specified"}`,
      ],
      [
        "Data inputs summary",
        `Company: ${inputs.companyName || "Not provided"}`,
        `Industry: ${inputs.industry || "Not provided"}`,
        `Employees: ${inputs.employeeRange || "Not provided"}`,
        `Reporting period: ${inputs.reportingPeriod || "Not provided"}`,
      ],
      [
        "Methodology & assumptions",
        "Conservative emissions factors applied for fuel and electricity.",
        "Rounded to whole tCO2e values.",
        "No third-party verification.",
      ],
      [
        "Recommendations & targets",
        "Prioritize efficiency on the primary emission driver.",
        "Monitor electricity usage monthly where possible.",
        "Strengthen ESG practices based on scorecard outcomes.",
        `Self-reported data; not audited or certified. Version ${reportVersion}.`,
      ],
    ];

    const pdfBlob = buildPdf("ESG & Emissions Snapshot", pdfPages);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `esg-emissions-report-${reportId}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const interpretationText =
    emissions.totalEmissions === 0
      ? "Add fuel or electricity data to generate emissions insights."
      : `${emissions.primaryDriver} is the largest contributor at ${
          emissions.primaryDriver === "Fuel consumption"
            ? emissions.fuelEmissions
            : emissions.electricityEmissions
        } tCO2e. Focus efficiency actions here to reduce total emissions.`;

  const maxEmission = Math.max(emissions.fuelEmissions, emissions.electricityEmissions, 1);
  const fuelShare =
    emissions.totalEmissions === 0 ? 0 : (emissions.fuelEmissions / emissions.totalEmissions) * 100;

  const actions = [
    "Identify efficiency opportunities tied to your primary emission driver.",
    "Set a quarterly review to capture energy use and emissions trends.",
    "Document ESG practices and update policies annually.",
  ];

  return (
    <section className="esg-snapshot" aria-labelledby="esg-snapshot-title">
      <header className="esg-snapshot__header">
        <p className="esg-snapshot__eyebrow">ESG & Emissions Snapshot</p>
        <h1 id="esg-snapshot-title" className="esg-snapshot__title">
          Self-reported ESG baseline report
        </h1>
        <p className="esg-snapshot__subtitle">
          Complete the guided questionnaire in 5–7 minutes to generate your ESG & emissions report.
        </p>
        <div className="esg-snapshot__meta">
          <span>Report ID: {reportId}</span>
          <span>Version {reportVersion}</span>
          <span>Prepared {reportDate}</span>
        </div>
        <div className="esg-snapshot__actions">
          <button className="esg-snapshot__button" type="button" onClick={handleSaveReport}>
            Save report
          </button>
          <button className="esg-snapshot__button esg-snapshot__button--primary" type="button" onClick={handleDownloadPdf}>
            Download PDF (€15 / €59)
          </button>
          {hasSaved ? <span className="esg-snapshot__saved">Report saved.</span> : null}
        </div>
      </header>

      <section className="esg-snapshot__form" aria-label="ESG questionnaire">
        <div className="esg-snapshot__section">
          <h2>Section 1: Company profile</h2>
          <div className="esg-snapshot__grid">
            <label>
              Company name
              <input
                type="text"
                value={inputs.companyName}
                onChange={(event) => setInputs({ ...inputs, companyName: event.target.value })}
              />
            </label>
            <label>
              Country
              <select
                value={inputs.country}
                onChange={(event) => setInputs({ ...inputs, country: event.target.value })}
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Industry
              <select
                value={inputs.industry}
                onChange={(event) => setInputs({ ...inputs, industry: event.target.value })}
              >
                <option value="">Select industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Number of employees
              <select
                value={inputs.employeeRange}
                onChange={(event) => setInputs({ ...inputs, employeeRange: event.target.value })}
              >
                <option value="">Select range</option>
                <option value="1-10">1–10</option>
                <option value="11-50">11–50</option>
                <option value="51-250">51–250</option>
                <option value="250+">250+</option>
              </select>
            </label>
            <label>
              Reporting period
              <input
                type="text"
                placeholder="Year or last 12 months"
                value={inputs.reportingPeriod}
                onChange={(event) => setInputs({ ...inputs, reportingPeriod: event.target.value })}
              />
            </label>
          </div>
        </div>

        <div className="esg-snapshot__section">
          <h2>Section 2: Fuel consumption (Scope 1)</h2>
          <label>
            Does the company consume fuel?
            <select
              value={inputs.consumesFuel}
              onChange={(event) => setInputs({ ...inputs, consumesFuel: event.target.value })}
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          {inputs.consumesFuel === "yes" ? (
            <div className="esg-snapshot__grid">
              <fieldset>
                <legend>Fuel types</legend>
                {[
                  { value: "petrol", label: "Petrol" },
                  { value: "diesel", label: "Diesel" },
                  { value: "lpg", label: "LPG" },
                  { value: "other", label: "Other" },
                ].map((option) => (
                  <label key={option.value}>
                    <input
                      type="checkbox"
                      checked={inputs.fuelTypes.includes(option.value)}
                      onChange={() => handleToggleFuelType(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </fieldset>
              <label>
                Total fuel consumed (litres)
                <input
                  type="number"
                  value={inputs.totalFuelLiters}
                  onChange={(event) => setInputs({ ...inputs, totalFuelLiters: event.target.value })}
                />
              </label>
              <label>
                Primary fuel use
                <select
                  value={inputs.primaryFuelUse}
                  onChange={(event) => setInputs({ ...inputs, primaryFuelUse: event.target.value })}
                >
                  <option value="">Select</option>
                  <option value="vehicles">Vehicles</option>
                  <option value="machinery">Machinery</option>
                  <option value="generators">Generators</option>
                  <option value="logistics">Logistics</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>

        <div className="esg-snapshot__section">
          <h2>Section 3: Electricity usage (Scope 2)</h2>
          <label>
            Uses grid electricity?
            <select
              value={inputs.usesGridElectricity}
              onChange={(event) => setInputs({ ...inputs, usesGridElectricity: event.target.value })}
            >
              <option value="">Select</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          {inputs.usesGridElectricity === "yes" ? (
            <div className="esg-snapshot__grid">
              <label>
                Electricity consumption (kWh)
                <input
                  type="number"
                  value={inputs.electricityUsageKwh}
                  onChange={(event) =>
                    setInputs({ ...inputs, electricityUsageKwh: event.target.value })
                  }
                />
              </label>
              <label>
                Consumption period
                <select
                  value={inputs.electricityUsagePeriod}
                  onChange={(event) =>
                    setInputs({ ...inputs, electricityUsagePeriod: event.target.value })
                  }
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </label>
              <label>
                Number of facilities
                <select
                  value={inputs.facilityCount}
                  onChange={(event) => setInputs({ ...inputs, facilityCount: event.target.value })}
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2-5">2–5</option>
                  <option value="6+">6+</option>
                </select>
              </label>
              <label>
                Uses backup power?
                <select
                  value={inputs.usesBackupPower}
                  onChange={(event) => setInputs({ ...inputs, usesBackupPower: event.target.value })}
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>
          ) : null}
        </div>

        <div className="esg-snapshot__section">
          <h2>Section 4: Water usage (Light ESG)</h2>
          <div className="esg-snapshot__grid">
            <label>
              Tracks water usage?
              <select
                value={inputs.tracksWaterUsage}
                onChange={(event) => setInputs({ ...inputs, tracksWaterUsage: event.target.value })}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
                <option value="estimate">Estimate</option>
              </select>
            </label>
            <label>
              Estimated water usage (optional)
              <input
                type="text"
                value={inputs.estimatedWaterUsage}
                onChange={(event) =>
                  setInputs({ ...inputs, estimatedWaterUsage: event.target.value })
                }
              />
            </label>
          </div>
        </div>

        <div className="esg-snapshot__section">
          <h2>Section 5: Social</h2>
          <div className="esg-snapshot__grid">
            <label>
              Employee count (auto-filled)
              <input type="text" value={inputs.employeeRange || "Not specified"} readOnly />
            </label>
            <label>
              Health & safety practices in place?
              <select
                value={inputs.healthSafetyPractices}
                onChange={(event) =>
                  setInputs({ ...inputs, healthSafetyPractices: event.target.value })
                }
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label>
              Training provided to employees?
              <select
                value={inputs.trainingProvided}
                onChange={(event) => setInputs({ ...inputs, trainingProvided: event.target.value })}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label>
              Female workforce % (optional)
              <input
                type="number"
                value={inputs.femaleWorkforcePercent}
                onChange={(event) =>
                  setInputs({ ...inputs, femaleWorkforcePercent: event.target.value })
                }
              />
            </label>
          </div>
        </div>

        <div className="esg-snapshot__section">
          <h2>Section 6: Governance</h2>
          <div className="esg-snapshot__grid">
            <label>
              Business legally registered?
              <select
                value={inputs.businessRegistered}
                onChange={(event) => setInputs({ ...inputs, businessRegistered: event.target.value })}
              >
                <option value="">Select</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label>
              Management structure
              <select
                value={inputs.managementStructure}
                onChange={(event) =>
                  setInputs({ ...inputs, managementStructure: event.target.value })
                }
              >
                <option value="">Select</option>
                <option value="owner-managed">Owner-managed</option>
                <option value="management-team">Management team</option>
                <option value="board">Board</option>
              </select>
            </label>
            <fieldset>
              <legend>Written policies</legend>
              {[
                { value: "ethics", label: "Ethics" },
                { value: "anti-corruption", label: "Anti-corruption" },
                { value: "none", label: "None" },
              ].map((option) => (
                <label key={option.value}>
                  <input
                    type="checkbox"
                    checked={inputs.writtenPolicies.includes(option.value)}
                    onChange={() => handleTogglePolicy(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </fieldset>
          </div>
        </div>

        <div className="esg-snapshot__section">
          <h2>Section 7: Data confidence</h2>
          <label>
            Data confidence
            <select
              value={inputs.dataConfidence}
              onChange={(event) => setInputs({ ...inputs, dataConfidence: event.target.value })}
            >
              <option value="">Select</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>
      </section>

      <section className="esg-report" aria-label="ESG report viewer">
        <h2>ESG & emissions report</h2>
        <p className="esg-report__subtitle">Read-only report viewer generated from your inputs.</p>

        <div className="esg-report__kpis">
          <div className="esg-report__kpi">
            <h3>Total emissions</h3>
            <p>{emissions.totalEmissions} tCO2e</p>
          </div>
          <div className="esg-report__kpi">
            <h3>Primary emission driver</h3>
            <p>{emissions.primaryDriver}</p>
          </div>
          <div className="esg-report__kpi">
            <h3>ESG grades</h3>
            <p>
              E: {scores.environmentalGrade} · S: {scores.socialGrade} · G: {scores.governanceGrade}
            </p>
          </div>
          <div className="esg-report__kpi">
            <h3>Data confidence</h3>
            <p>{inputs.dataConfidence ? inputs.dataConfidence : "Not specified"}</p>
          </div>
        </div>

        <div className="esg-report__charts">
          <div className="esg-report__chart">
            <h3>Emissions by activity</h3>
            <div className="esg-report__bar-chart">
              <div className="esg-report__bar">
                <span>Fuel</span>
                <div className="esg-report__bar-track">
                  <div
                    className="esg-report__bar-fill"
                    style={{ width: `${(emissions.fuelEmissions / maxEmission) * 100}%` }}
                  />
                </div>
                <strong>{emissions.fuelEmissions} tCO2e</strong>
              </div>
              <div className="esg-report__bar">
                <span>Electricity</span>
                <div className="esg-report__bar-track">
                  <div
                    className="esg-report__bar-fill esg-report__bar-fill--alt"
                    style={{ width: `${(emissions.electricityEmissions / maxEmission) * 100}%` }}
                  />
                </div>
                <strong>{emissions.electricityEmissions} tCO2e</strong>
              </div>
            </div>
          </div>
          <div className="esg-report__chart">
            <h3>Fuel vs electricity</h3>
            <div
              className="esg-report__donut"
              style={{
                background:
                  emissions.totalEmissions === 0
                    ? "#dfe6f3"
                    : `conic-gradient(#1b3a57 ${fuelShare}%, #7aa7c7 ${fuelShare}% 100%)`,
              }}
            >
              <span>{Math.round(fuelShare)}% fuel</span>
            </div>
            <p className="esg-report__legend">Electricity share: {Math.round(100 - fuelShare)}%</p>
          </div>
          <div className="esg-report__chart">
            <h3>Interpretation</h3>
            <p>{interpretationText}</p>
          </div>
        </div>

        <div className="esg-report__lower">
          <div className="esg-report__scorecard">
            <h3>ESG scorecard</h3>
            <ul>
              <li>
                Environmental: {scores.environmentalScore}/8 ({scores.environmentalGrade})
              </li>
              <li>
                Social: {scores.socialScore}/6 ({scores.socialGrade})
              </li>
              <li>
                Governance: {scores.governanceScore}/6 ({scores.governanceGrade})
              </li>
            </ul>
          </div>
          <div className="esg-report__actions">
            <h3>Targets & actions</h3>
            <ul>
              {actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="esg-report__expandables">
          <details>
            <summary>Data inputs summary</summary>
            <pre>{JSON.stringify(reportPayload, null, 2)}</pre>
          </details>
          <details>
            <summary>Methodology & assumptions</summary>
            <ul>
              <li>Conservative emissions assumptions are applied for fuel and electricity.</li>
              <li>Results are rounded to whole numbers.</li>
              <li>This is a self-reported, non-audited ESG baseline.</li>
            </ul>
          </details>
        </div>

        <div className="esg-report__disclaimer">
          <p>Self-reported data only. Not audited or certified.</p>
          <p>
            Version {reportVersion} · {reportDate}
          </p>
        </div>
      </section>

      {activeModal === "signup" ? (
        <div className="esg-modal" role="dialog" aria-modal="true">
          <div className="esg-modal__content">
            <h3>Sign up to save your report</h3>
            <p>Saving requires a free signup to attach your report to your account.</p>
            <button
              type="button"
              onClick={() => {
                setIsSignedIn(true);
                setActiveModal(null);
              }}
            >
              Continue signup
            </button>
            <button type="button" onClick={() => setActiveModal(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {activeModal === "payment" ? (
        <div className="esg-modal" role="dialog" aria-modal="true">
          <div className="esg-modal__content">
            <h3>Unlock PDF export</h3>
            <p>Choose a payment option to download the report as a PDF.</p>
            <div className="esg-modal__plans">
              <label>
                <input
                  type="radio"
                  name="plan"
                  value="one-off"
                  checked={selectedPlan === "one-off"}
                  onChange={() => setSelectedPlan("one-off")}
                />
                One-off PDF (€15)
              </label>
              <label>
                <input
                  type="radio"
                  name="plan"
                  value="annual"
                  checked={selectedPlan === "annual"}
                  onChange={() => setSelectedPlan("annual")}
                />
                Annual access (€59)
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsPaid(true);
                setActiveModal(null);
              }}
            >
              Confirm payment
            </button>
            <button type="button" onClick={() => setActiveModal(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default MonthlyCarbonTracker;
