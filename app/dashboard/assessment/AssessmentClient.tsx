"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabaseClient";
import Card from "../../../components/Card";

const TOTAL_STEPS = 7;

const MONTH_OPTIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type ElectricityMethod = "location-based" | "market-based";

type ProfileRow = {
  user_id: string;
  company_name: string | null;
  country: string | null;
  industry: string | null;
  employee_count: number | null;
};

function formatNumber(value: number, maximumFractionDigits = 2) {
  if (!Number.isFinite(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function getElectricityFactorGuidance(
  method: ElectricityMethod,
  factor: number | null
) {
  if (factor == null || !Number.isFinite(factor) || factor <= 0) {
    return {
      tone: "neutral",
      message:
        method === "location-based"
          ? "Enter a recognized location-based grid factor for the country or grid used in this reporting month."
          : "Enter a supplier-specific or contractual electricity factor used for this reporting month.",
    };
  }

  if (factor < 0.02) {
    return {
      tone: "warning",
      message:
        "This electricity factor looks unusually low. Recheck the source, unit, and whether it is in kg CO₂e per kWh.",
    };
  }

  if (factor > 1.5) {
    return {
      tone: "warning",
      message:
        "This electricity factor looks unusually high. Recheck the source, unit, and whether it is in kg CO₂e per kWh.",
    };
  }

  return {
    tone: "good",
    message:
      "Electricity factor entered. Make sure it matches the exact method and reporting basis used for this month.",
  };
}

function getFuelFactorGuidance(fuelType: string, factor: number | null) {
  if (factor == null || !Number.isFinite(factor) || factor <= 0) {
    return {
      tone: "neutral",
      message:
        "Enter a recognized fuel factor that matches the actual fuel type used in this reporting month.",
    };
  }

  if (factor < 0.5) {
    return {
      tone: "warning",
      message:
        "This fuel factor looks unusually low for most liquid fuels. Recheck the source, fuel type, and unit.",
    };
  }

  if (factor > 5) {
    return {
      tone: "warning",
      message:
        "This fuel factor looks unusually high for most common fuels. Recheck the source, fuel type, and unit.",
    };
  }

  return {
    tone: "good",
    message:
      fuelType.trim()
        ? `Fuel factor entered for ${fuelType.trim()}. Make sure the source matches this exact fuel.`
        : "Fuel factor entered. Make sure it matches the exact fuel type used.",
  };
}

export default function AssessmentClient() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);

  const currentDate = new Date();
  const defaultMonth = MONTH_OPTIONS[currentDate.getMonth()];
  const defaultYear = String(currentDate.getFullYear());

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profilePrefilled, setProfilePrefilled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    company_name: "",
    country: "",
    industry: "",
    employee_count: "",
    reporting_month: defaultMonth,
    reporting_year: defaultYear,
    electricity_kwh: "",
    electricity_method: "location-based" as ElectricityMethod,
    electricity_factor: "",
    fuel_liters: "",
    fuel_type: "",
    fuel_factor: "",
  });

  useEffect(() => {
    if (!errorMessage) return;

    const timer = window.setTimeout(() => {
      setErrorMessage("");
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  useEffect(() => {
    async function loadCompanyProfile() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user;

        if (user) {
          const { data, error } = await supabase
            .from("company_profiles")
            .select("user_id, company_name, country, industry, employee_count")
            .eq("user_id", user.id)
            .maybeSingle();

          if (!error && data) {
            const profile = data as ProfileRow;

            setFormData((current) => ({
              ...current,
              company_name: profile.company_name ?? "",
              country: profile.country ?? "",
              industry: profile.industry ?? "",
              employee_count:
                profile.employee_count != null
                  ? String(profile.employee_count)
                  : "",
            }));

            if (
              profile.company_name ||
              profile.country ||
              profile.industry ||
              profile.employee_count != null
            ) {
              setProfilePrefilled(true);
              return;
            }
          }
        }

        const { data: latestReport, error: latestReportError } = await supabase
          .from("report_results")
          .select("company_name, country, industry, employee_count")
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestReportError || !latestReport) {
          return;
        }

        setFormData((current) => ({
          ...current,
          company_name: latestReport.company_name ?? "",
          country: latestReport.country ?? "",
          industry: latestReport.industry ?? "",
          employee_count:
            latestReport.employee_count != null
              ? String(latestReport.employee_count)
              : "",
        }));

        if (
          latestReport.company_name ||
          latestReport.country ||
          latestReport.industry ||
          latestReport.employee_count != null
        ) {
          setProfilePrefilled(true);
        }
      } catch {
        return;
      }
    }

    loadCompanyProfile();
  }, [supabase]);

  const electricity = Number(formData.electricity_kwh || 0);
  const fuel = Number(formData.fuel_liters || 0);
  const employeeCount = Number(formData.employee_count || 0);
  const electricityFactor = Number(formData.electricity_factor || 0);
  const fuelFactor = Number(formData.fuel_factor || 0);

  const previewScope1 = fuel > 0 && fuelFactor > 0 ? fuel * fuelFactor : 0;
  const previewScope2 =
    electricity > 0 && electricityFactor > 0
      ? electricity * electricityFactor
      : 0;
  const previewTotal = previewScope1 + previewScope2;
  const previewPerEmployee =
    previewTotal > 0 && employeeCount > 0 ? previewTotal / employeeCount : null;

  const electricityGuidance = useMemo(() => {
    return getElectricityFactorGuidance(
      formData.electricity_method,
      Number.isFinite(electricityFactor) && electricityFactor > 0
        ? electricityFactor
        : null
    );
  }, [formData.electricity_method, electricityFactor]);

  const fuelGuidance = useMemo(() => {
    return getFuelFactorGuidance(
      formData.fuel_type,
      Number.isFinite(fuelFactor) && fuelFactor > 0 ? fuelFactor : null
    );
  }, [formData.fuel_type, fuelFactor]);

  function nextStep() {
    if (step < TOTAL_STEPS) setStep(step + 1);
  }

  function prevStep() {
    if (step > 1) setStep(step - 1);
  }

  function getStepTitle() {
    switch (step) {
      case 1:
        return "Company Information";
      case 2:
        return "Location";
      case 3:
        return "Industry";
      case 4:
        return "Workforce Size";
      case 5:
        return "Reporting Month";
      case 6:
        return "Electricity Usage & Factor";
      case 7:
        return "Fuel Usage & Factor";
      default:
        return "Assessment";
    }
  }

  function getStepHint() {
    switch (step) {
      case 1:
        return "Enter the organization name for this assessment.";
      case 2:
        return "Enter the country where the emissions activity applies.";
      case 3:
        return "Add the business sector for better future benchmarking.";
      case 4:
        return "Enter the total number of employees for this reporting month.";
      case 5:
        return "Choose the month and year this assessment represents.";
      case 6:
        return "Provide electricity usage and the exact electricity emission factor used for this reporting month.";
      case 7:
        return "Provide fuel usage and the exact fuel factor that matches the actual fuel used.";
      default:
        return "";
    }
  }

  function validateStep(currentStep: number) {
    if (currentStep === 1 && !formData.company_name.trim()) {
      setErrorMessage("Please enter the company name.");
      return false;
    }

    if (currentStep === 2 && !formData.country.trim()) {
      setErrorMessage("Please enter the country.");
      return false;
    }

    if (currentStep === 3 && !formData.industry.trim()) {
      setErrorMessage("Please enter the industry.");
      return false;
    }

    if (currentStep === 4) {
      if (!Number.isFinite(employeeCount) || employeeCount <= 0) {
        setErrorMessage("Please enter a valid employee count greater than 0.");
        return false;
      }
    }

    if (currentStep === 5) {
      const year = Number(formData.reporting_year);

      if (!Number.isFinite(year) || year < 2000 || year > 2100) {
        setErrorMessage("Please enter a valid reporting year.");
        return false;
      }
    }

    if (currentStep === 6) {
      if (!Number.isFinite(electricity) || electricity < 0) {
        setErrorMessage("Electricity usage cannot be negative.");
        return false;
      }

      if (electricity > 0) {
        if (!Number.isFinite(electricityFactor) || electricityFactor <= 0) {
          setErrorMessage(
            "Please enter a valid electricity factor when electricity usage is greater than 0."
          );
          return false;
        }

        if (electricityFactor < 0.001 || electricityFactor > 5) {
          setErrorMessage(
            "Electricity factor is outside a reasonable range. Recheck the source and unit before continuing."
          );
          return false;
        }
      }
    }

    if (currentStep === 7) {
      if (!Number.isFinite(fuel) || fuel < 0) {
        setErrorMessage("Fuel usage cannot be negative.");
        return false;
      }

      if (fuel > 0 && !formData.fuel_type.trim()) {
        setErrorMessage(
          "Please enter the fuel type when fuel usage is greater than 0."
        );
        return false;
      }

      if (fuel > 0) {
        if (!Number.isFinite(fuelFactor) || fuelFactor <= 0) {
          setErrorMessage(
            "Please enter a valid fuel factor when fuel usage is greater than 0."
          );
          return false;
        }

        if (fuelFactor < 0.05 || fuelFactor > 10) {
          setErrorMessage(
            "Fuel factor is outside a reasonable range. Recheck the source, fuel type, and unit before continuing."
          );
          return false;
        }
      }
    }

    setErrorMessage("");
    return true;
  }

  function handleNextStep() {
    if (!validateStep(step)) return;
    nextStep();
  }

  async function submitAssessment() {
    if (!validateStep(step)) return;

    try {
      setSubmitting(true);
      setErrorMessage("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      const scope1 = fuel * fuelFactor;
      const scope2 = electricity * electricityFactor;
      const total = scope1 + scope2;
      const periodLabel = `${formData.reporting_month} ${formData.reporting_year}`;

      if (user) {
        const { error: profileError } = await supabase
          .from("company_profiles")
          .upsert(
            {
              user_id: user.id,
              company_name: formData.company_name.trim(),
              country: formData.country.trim(),
              industry: formData.industry.trim(),
              employee_count: employeeCount,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

        if (profileError) {
          console.error("Failed to save company profile:", profileError);
        }
      }

      const { error } = await supabase
        .from("report_results")
        .insert({
          company_name: formData.company_name.trim(),
          country: formData.country.trim(),
          industry: formData.industry.trim(),
          period_label: periodLabel,
          reporting_period: periodLabel,
          employee_count: employeeCount,
          electricity_kwh: electricity,
          electricity_method: formData.electricity_method,
          electricity_factor: electricity > 0 ? electricityFactor : null,
          fuel_liters: fuel,
          fuel_type: fuel > 0 ? formData.fuel_type.trim() : null,
          fuel_factor: fuel > 0 ? fuelFactor : null,
          scope1_emissions: scope1,
          scope2_emissions: scope2,
          total_emissions: total,
        })
        .select()
        .single();

      if (error) {
        console.error("SUPABASE ERROR:", error);
        setErrorMessage(`Failed to submit assessment: ${error.message}`);
        setSubmitting(false);
        return;
      }

      router.push(`/dashboard?saved=1&month=${encodeURIComponent(periodLabel)}`);
    } catch (err) {
      console.error("Unexpected error:", err);
      setErrorMessage("Unexpected error occurred while submitting assessment.");
      setSubmitting(false);
    }
  }

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>New Assessment</h1>
          <p>Complete the seven-step flow to generate a fresh emissions report.</p>
        </div>

        <Link href="/dashboard" className="dashboard-btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="workflow-strip">
        <span className="workflow-strip-label">Quick navigation</span>
        <div className="workflow-strip-links">
          <Link href="/dashboard" className="workflow-strip-link">
            Dashboard
          </Link>
          <Link
            href="/dashboard/assessment"
            className="workflow-strip-link workflow-strip-link--current"
          >
            New Assessment
          </Link>
          <Link href="/dashboard/monthly-tracker" className="workflow-strip-link">
            Monthly Tracker
          </Link>
          <Link href="/dashboard/reports" className="workflow-strip-link">
            Reports
          </Link>
        </div>
      </div>

      <Card>
        <div className="insight-item">
          <strong>Methodology note</strong>
          <p>
            This assessment uses user-supplied emission factors instead of hardcoded
            defaults. Use a recognized electricity factor for the reporting method
            selected and a fuel factor that matches the exact fuel type used.
          </p>
        </div>
      </Card>

      <Card>
        <div className="insight-item">
          <strong>Monthly workflow</strong>
          <p>
            Complete one assessment for one reporting month. Submit a new
            assessment each month using the actual electricity and fuel factors
            that applied in that month so your dashboard trends and comparisons
            stay reliable.
          </p>
        </div>
      </Card>

      {profilePrefilled ? (
        <div className="status-banner status-banner-success">
          Company details were prefilled from your saved profile.
        </div>
      ) : null}

      {errorMessage && (
        <div className="status-banner status-banner-error">{errorMessage}</div>
      )}

      <Card title={getStepTitle()}>
        <p className="dashboard-insight-text">
          Step {step} of {TOTAL_STEPS}
        </p>

        <p className="dashboard-insight-text">{getStepHint()}</p>

        {step === 1 && (
          <input
            placeholder="Company Name"
            value={formData.company_name}
            onChange={(e) =>
              setFormData({ ...formData, company_name: e.target.value })
            }
            className="assessment-input"
          />
        )}

        {step === 2 && (
          <input
            placeholder="Country"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            className="assessment-input"
          />
        )}

        {step === 3 && (
          <input
            placeholder="Industry"
            value={formData.industry}
            onChange={(e) =>
              setFormData({ ...formData, industry: e.target.value })
            }
            className="assessment-input"
          />
        )}

        {step === 4 && (
          <input
            type="number"
            placeholder="Number of Employees"
            value={formData.employee_count}
            onChange={(e) =>
              setFormData({ ...formData, employee_count: e.target.value })
            }
            className="assessment-input"
          />
        )}

        {step === 5 && (
          <div className="assessment-period-grid">
            <div>
              <label className="assessment-label">Reporting Month</label>
              <select
                value={formData.reporting_month}
                onChange={(e) =>
                  setFormData({ ...formData, reporting_month: e.target.value })
                }
                className="assessment-input"
              >
                {MONTH_OPTIONS.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="assessment-label">Reporting Year</label>
              <input
                type="number"
                placeholder="2026"
                value={formData.reporting_year}
                onChange={(e) =>
                  setFormData({ ...formData, reporting_year: e.target.value })
                }
                className="assessment-input"
              />
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="assessment-period-grid">
            <div>
              <label className="assessment-label">Electricity Usage (kWh)</label>
              <input
                type="number"
                placeholder="Electricity kWh"
                value={formData.electricity_kwh}
                onChange={(e) =>
                  setFormData({ ...formData, electricity_kwh: e.target.value })
                }
                className="assessment-input"
              />
            </div>

            <div>
              <label className="assessment-label">Electricity Method</label>
              <select
                value={formData.electricity_method}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    electricity_method: e.target.value as ElectricityMethod,
                  })
                }
                className="assessment-input"
              >
                <option value="location-based">Location-based</option>
                <option value="market-based">
                  Market-based / supplier-specific
                </option>
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="assessment-label">
                Electricity Emission Factor (kg CO₂e / kWh)
              </label>
              <input
                type="number"
                step="0.000001"
                placeholder={
                  formData.electricity_method === "location-based"
                    ? "Enter recognized grid-average factor for this country/grid"
                    : "Enter supplier-specific or contractual factor"
                }
                value={formData.electricity_factor}
                onChange={(e) =>
                  setFormData({ ...formData, electricity_factor: e.target.value })
                }
                className="assessment-input"
              />
            </div>

            <p className="dashboard-insight-text">
              {electricityGuidance.message}
            </p>
          </div>
        )}

        {step === 7 && (
          <div className="assessment-period-grid">
            <div>
              <label className="assessment-label">Fuel Usage (liters)</label>
              <input
                type="number"
                placeholder="Fuel Liters"
                value={formData.fuel_liters}
                onChange={(e) =>
                  setFormData({ ...formData, fuel_liters: e.target.value })
                }
                className="assessment-input"
              />
            </div>

            <div>
              <label className="assessment-label">Fuel Type</label>
              <input
                placeholder="e.g. Diesel, Petrol, LPG"
                value={formData.fuel_type}
                onChange={(e) =>
                  setFormData({ ...formData, fuel_type: e.target.value })
                }
                className="assessment-input"
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="assessment-label">
                Fuel Emission Factor (kg CO₂e / liter)
              </label>
              <input
                type="number"
                step="0.000001"
                placeholder="Enter factor matching the actual fuel used"
                value={formData.fuel_factor}
                onChange={(e) =>
                  setFormData({ ...formData, fuel_factor: e.target.value })
                }
                className="assessment-input"
              />
            </div>

            <p className="dashboard-insight-text">{fuelGuidance.message}</p>

            <div style={{ gridColumn: "1 / -1" }}>
              <p className="dashboard-insight-text">
                Scope 1 preview: <strong>{formatNumber(previewScope1, 2)} kg CO₂e</strong>
              </p>
              <p className="dashboard-insight-text">
                Scope 2 preview: <strong>{formatNumber(previewScope2, 2)} kg CO₂e</strong>
              </p>
              <p className="dashboard-insight-text">
                Total preview: <strong>{formatNumber(previewTotal, 2)} kg CO₂e</strong>
              </p>
              <p className="dashboard-insight-text">
                Emissions / employee preview:{" "}
                <strong>
                  {previewPerEmployee == null
                    ? "—"
                    : `${formatNumber(previewPerEmployee, 2)} kg CO₂e`}
                </strong>
              </p>
            </div>
          </div>
        )}

        <div className="assessment-actions">
          {step > 1 && (
            <button
              onClick={prevStep}
              type="button"
              className="assessment-btn assessment-btn-secondary"
            >
              Back
            </button>
          )}

          {step < TOTAL_STEPS && (
            <button
              onClick={handleNextStep}
              type="button"
              className="assessment-btn assessment-btn-primary"
            >
              Next
            </button>
          )}

          {step === TOTAL_STEPS && (
            <button
              onClick={submitAssessment}
              type="button"
              disabled={submitting}
              className="assessment-btn assessment-btn-primary"
            >
              {submitting ? "Submitting..." : "Submit Assessment"}
            </button>
          )}
        </div>
      </Card>
    </main>
  );
}