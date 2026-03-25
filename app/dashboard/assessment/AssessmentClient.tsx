"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabaseClient";
import Card from "../../../components/Card";
import {
  buildReportingPeriodFromParts,
  formatReportingPeriodLabel,
  normalizeReportingPeriod,
} from "../../../lib/reportPeriod";

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

type EditableReportRow = {
  id: string;
  company_name: string | null;
  country: string | null;
  industry: string | null;
  employee_count: number | null;
  reporting_period: string | null;
  electricity_kwh: number | null;
  electricity_method: ElectricityMethod | null;
  electricity_factor: number | null;
  fuel_liters: number | null;
  fuel_type: string | null;
  fuel_factor: number | null;
};

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
  const searchParams = useSearchParams();
  const editReportId = searchParams.get("edit");
  const isEditMode = Boolean(editReportId);
  const supabase = useMemo(() => createSupabaseClient(), []);

  const currentDate = new Date();
  const defaultMonth = MONTH_OPTIONS[currentDate.getMonth()];
  const defaultYear = String(currentDate.getFullYear());

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editLoaded, setEditLoaded] = useState(false);
  const [profilePrefilled, setProfilePrefilled] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [duplicatePeriodMessage, setDuplicatePeriodMessage] = useState("");
  const [duplicatePeriodReportId, setDuplicatePeriodReportId] = useState("");
  const [hasExistingReports, setHasExistingReports] = useState(false);

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
        let profilePrefillApplied = false;

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
              profilePrefillApplied = true;
            }
          }
        }

        const { data: latestReport, error: latestReportError } = await supabase
          .from("report_results")
          .select("company_name, country, industry, employee_count")
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();

        setHasExistingReports(Boolean(latestReport));

        if (latestReportError || !latestReport) {
          return;
        }

        if (!profilePrefillApplied) {
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
        }
      } catch {
        return;
      }
    }

    loadCompanyProfile();
  }, [supabase]);
  useEffect(() => {
    if (!editReportId || editLoaded) return;

    let cancelled = false;

    async function loadEditRecord() {
      try {
        setIsEditLoading(true);
        setErrorMessage("");
        setDuplicatePeriodMessage("");
        setDuplicatePeriodReportId("");

        const { data, error } = await supabase
          .from("report_results")
          .select(
            [
              "id",
              "company_name",
              "country",
              "industry",
              "employee_count",
              "reporting_period",
              "electricity_kwh",
              "electricity_method",
              "electricity_factor",
              "fuel_liters",
              "fuel_type",
              "fuel_factor",
            ].join(", ")
          )
          .eq("id", editReportId)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.error(error);
          setErrorMessage("Could not load the selected report for editing.");
          setIsEditLoading(false);
          return;
        }

        if (!data) {
          setErrorMessage("That report could not be found.");
          setIsEditLoading(false);
          return;
        }

        const reportRow = data as unknown as EditableReportRow;
        const normalizedPeriod = normalizeReportingPeriod(reportRow.reporting_period);
        const [yearPart, monthPart] = normalizedPeriod
          ? normalizedPeriod.split("-")
          : ["", ""];
        const monthIndex = monthPart ? Number(monthPart) - 1 : -1;
        const safeMonth =
          monthIndex >= 0 && monthIndex < MONTH_OPTIONS.length
            ? MONTH_OPTIONS[monthIndex]
            : formData.reporting_month;

        setFormData((current) => ({
          ...current,
          company_name: reportRow.company_name ?? "",
          country: reportRow.country ?? "",
          industry: reportRow.industry ?? "",
          employee_count:
            reportRow.employee_count == null ? "" : String(reportRow.employee_count),
          reporting_month: safeMonth,
          reporting_year: yearPart || current.reporting_year,
          electricity_kwh:
            reportRow.electricity_kwh == null ? "" : String(reportRow.electricity_kwh),
          electricity_method:
            (reportRow.electricity_method as ElectricityMethod | null) ??
            current.electricity_method,
          electricity_factor:
            reportRow.electricity_factor == null ? "" : String(reportRow.electricity_factor),
          fuel_liters: reportRow.fuel_liters == null ? "" : String(reportRow.fuel_liters),
          fuel_type: reportRow.fuel_type ?? "",
          fuel_factor: reportRow.fuel_factor == null ? "" : String(reportRow.fuel_factor),
        }));

        setEditLoaded(true);
        setIsEditLoading(false);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setErrorMessage("Could not load the selected report for editing.");
          setIsEditLoading(false);
        }
      }
    }

    loadEditRecord();

    return () => {
      cancelled = true;
    };
  }, [editLoaded, editReportId, formData.reporting_month, supabase]);


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
      setDuplicatePeriodMessage("");
      setDuplicatePeriodReportId("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      const scope1 = fuel * fuelFactor;
      const scope2 = electricity * electricityFactor;
      const total = scope1 + scope2;

      const canonicalReportingPeriod = buildReportingPeriodFromParts(
        formData.reporting_month,
        formData.reporting_year
      );

      if (!canonicalReportingPeriod) {
        setErrorMessage("Please select a valid reporting month and year.");
        setSubmitting(false);
        return;
      }

      const periodLabel = formatReportingPeriodLabel(canonicalReportingPeriod);

      let existingPeriodQuery = supabase
        .from("report_results")
        .select("id, reporting_period, period_label")
        .eq("reporting_period", canonicalReportingPeriod);

      if (editReportId) {
        existingPeriodQuery = existingPeriodQuery.neq("id", editReportId);
      }

      const { data: existingPeriodRow, error: existingPeriodError } =
        await existingPeriodQuery.maybeSingle();

      if (existingPeriodError) {
        throw existingPeriodError;
      }

      if (existingPeriodRow) {
        setDuplicatePeriodMessage(
          `${periodLabel} already has a saved assessment. Open the existing report instead of creating a duplicate month entry.`
        );
        setDuplicatePeriodReportId(existingPeriodRow.id);
        setSubmitting(false);
        return;
      }

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

      const payload = {
        company_name: formData.company_name.trim(),
        country: formData.country.trim(),
        industry: formData.industry.trim(),
        period_label: periodLabel,
        reporting_period: canonicalReportingPeriod,
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
      };

      if (editReportId) {
        const { error: updateError } = await supabase
          .from("report_results")
          .update(payload)
          .eq("id", editReportId);

        if (updateError) {
          throw updateError;
        }

        router.push(`/dashboard/reports/${editReportId}?updated=1`);
        return;
      }

      const { error } = await supabase.from("report_results").insert(payload);

      if (error) {
        throw error;
      }

      router.push(`/dashboard?saved=1&month=${encodeURIComponent(periodLabel)}`);
    } catch (err) {
      console.error("Unexpected error:", err);

      const message =
        err instanceof Error ? err.message : typeof err === "string" ? err : "";

      const isDuplicatePeriodConstraint =
        message.includes("report_results_reporting_period_key") ||
        message.includes("duplicate key value violates unique constraint");

      if (isDuplicatePeriodConstraint) {
        const canonicalReportingPeriod = buildReportingPeriodFromParts(
          formData.reporting_month,
          formData.reporting_year
        );
        const periodLabel = canonicalReportingPeriod
          ? formatReportingPeriodLabel(canonicalReportingPeriod)
          : `${formData.reporting_month} ${formData.reporting_year}`;

        setDuplicatePeriodMessage(
          `${periodLabel} already has a saved assessment. Open the existing report instead of creating a duplicate month entry.`
        );
        setDuplicatePeriodReportId(editReportId ?? "");
        setErrorMessage("");
      } else {
        setErrorMessage("Unexpected error occurred while submitting assessment.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>{isEditMode ? "Edit Assessment" : "New Assessment"}</h1>
          <p>
            {isEditMode
              ? "Update an existing monthly emissions report."
              : "Create one monthly emissions report at a time."}
          </p>
        </div>

        <Link href="/dashboard" className="dashboard-btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      {isEditMode ? (
        <div className="status-banner status-banner--warning">
          <div className="status-banner-copy">
            You are editing an existing monthly assessment. Saving will update this report instead of creating a new month entry.
          </div>
          <div className="status-banner-actions">
            {editReportId ? (
              <Link
                href={`/dashboard/reports/${editReportId}`}
                className="button button-secondary button-small"
              >
                Back to Report
              </Link>
            ) : null}
            <Link href="/dashboard/reports" className="button button-secondary button-small">
              View Reports
            </Link>
          </div>
        </div>
      ) : null}

      {duplicatePeriodMessage ? (
        <div className="status-banner status-banner--warning">
          <div className="status-banner-copy">{duplicatePeriodMessage}</div>
          <div className="status-banner-actions">
            {duplicatePeriodReportId ? (
              <Link
                href={`/dashboard/reports/${duplicatePeriodReportId}`}
                className="button button-secondary button-small"
              >
                Open Existing Report
              </Link>
            ) : null}
            <Link href="/dashboard/reports" className="button button-secondary button-small">
              View Reports
            </Link>
          </div>
        </div>
      ) : null}

      {isEditMode ? (
        <div className="card" style={{ marginBottom: "1rem" }}>
          <div className="card-body">
            <p className="eyebrow">Edit mode</p>
            <h2 style={{ marginTop: "0.35rem" }}>Editing monthly assessment</h2>
            <p className="dashboard-insight-text" style={{ marginTop: "0.5rem" }}>
              Review the saved values, make any corrections you need, and update this month when ready.
            </p>
          </div>
        </div>
      ) : null}

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
{isEditMode ? "Edit Assessment" : "New Assessment"}
          </Link>
          <Link href="/dashboard/monthly-tracker" className="workflow-strip-link">
            Monthly Tracker
          </Link>
          <Link href="/dashboard/reports" className="workflow-strip-link">
            Reports
          </Link>
        </div>
      </div>

      {!hasExistingReports ? (
        <section className="dashboard-onboarding-hero assessment-onboarding-hero">
        <div className="dashboard-onboarding-copy">
          <p className="dashboard-onboarding-eyebrow">Assessment flow</p>
          <h2>Enter one reporting month at a time to generate a fresh carbon report.</h2>
          <p className="dashboard-onboarding-lead">
            This guided assessment captures company details, workforce size,
            reporting period, electricity use, and fuel use. When you submit,
            Carbon Accounting Pro calculates Scope 1 and Scope 2 emissions,
            stores the month in your reporting history, and updates Dashboard,
            Reports, and Monthly Tracker.
          </p>

          <div className="dashboard-onboarding-actions">
            <Link href="/dashboard" className="dashboard-btn-secondary">
              Back to Dashboard
            </Link>
            <Link href="/dashboard/reports" className="dashboard-btn-secondary">
              View Reports
            </Link>
          </div>
        </div>

        <div className="dashboard-onboarding-checklist">
          <div className="dashboard-onboarding-checklist-card">
            <strong>What you need before starting</strong>
            <ul className="recommendation-list recommendation-list--compact">
              <li>Company name, country, and industry</li>
              <li>Employee count for the reporting month</li>
              <li>Electricity usage and the factor used</li>
              <li>Fuel usage, fuel type, and matching factor</li>
            </ul>
          </div>

          <div className="dashboard-onboarding-checklist-card">
            <strong>What happens after submit</strong>
            <ul className="recommendation-list recommendation-list--compact">
              <li>A new report is created for that month</li>
              <li>Dashboard KPIs update to the latest month</li>
              <li>The report becomes available for PDF export</li>
              <li>Monthly Tracker gets stronger as history grows</li>
            </ul>
          </div>
        </div>
        </section>
      ) : (
        <section className="dashboard-onboarding-hero assessment-onboarding-hero assessment-onboarding-hero--returning">
          <div className="dashboard-onboarding-copy assessment-onboarding-copy">
            <p className="dashboard-onboarding-eyebrow assessment-onboarding-eyebrow">NEW ASSESSMENT</p>
            <h2>Add the next reporting month to keep your carbon history current.</h2>
            <p className="dashboard-onboarding-lead assessment-onboarding-lead">
              Enter the next reporting month below to generate a fresh carbon report.
              Your latest saved month remains available in Dashboard, Reports, and
              Monthly Tracker.
            </p>

            <div className="dashboard-onboarding-actions assessment-onboarding-actions">
              <Link href="/dashboard" className="button button-secondary">
                Back to Dashboard
              </Link>
              <Link href="/dashboard/reports" className="button button-secondary">
                View Reports
              </Link>
            </div>
          </div>
        </section>
      )}

      {!hasExistingReports ? (
      <div className="dashboard-onboarding-steps assessment-onboarding-steps">
        <div className="dashboard-onboarding-step">
          <span className="dashboard-onboarding-step-number">1</span>
          <div>
            <strong>Enter business context</strong>
            <p>
              Add company information, location, industry, and employee count
              for the month being assessed.
            </p>
          </div>
        </div>

        <div className="dashboard-onboarding-step">
          <span className="dashboard-onboarding-step-number">2</span>
          <div>
            <strong>Enter activity data</strong>
            <p>
              Add electricity and fuel usage together with the exact factors
              used for that reporting month.
            </p>
          </div>
        </div>

        <div className="dashboard-onboarding-step">
          <span className="dashboard-onboarding-step-number">3</span>
          <div>
            <strong>Submit one clean month</strong>
            <p>
              Save the month, generate the report, and repeat monthly to build
              stronger trends and comparisons.
            </p>
          </div>
        </div>
      </div>

      ) : null}

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
              disabled={submitting || isEditLoading}
              className="assessment-btn assessment-btn-primary"
            >
              {submitting ? "Saving..." : isEditMode ? "Update Assessment" : "Submit Assessment"}
            </button>
          )}
        </div>
      </Card>
    </main>
  );
}