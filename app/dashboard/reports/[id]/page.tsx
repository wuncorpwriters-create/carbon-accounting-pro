"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "../../../../lib/supabaseClient";
import Card from "../../../../components/Card";
import {
  formatNumber,
  formatCarbonExactKg,
} from "../../../../lib/carbonFormat";
import {
  type ReportRow,
  type IntensityTone,
  type SignalTone,
  formatDisplayDate,
  formatPeriodLabel,
  getElectricityMethodLabel,
  getIntensityBand,
  getPerEmployee,
  parseSortDate,
  compareReportsChronologically,
  buildReportIntelligence,
} from "../../../../lib/reportIntelligence";

function formatKgFull(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return formatCarbonExactKg(value);
}

function getIntensityToneClass(tone: IntensityTone) {
  if (tone === "low") return "intensity-badge intensity-badge--low";
  if (tone === "moderate") return "intensity-badge intensity-badge--moderate";
  if (tone === "high") return "intensity-badge intensity-badge--high";
  return "intensity-badge";
}

function getSignalToneClass(tone: SignalTone) {
  if (tone === "positive") return "signal-chip signal-chip--positive";
  if (tone === "negative") return "signal-chip signal-chip--negative";
  return "signal-chip signal-chip--neutral";
}

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatCountryDisplay(country?: string | null) {
  const raw = country?.trim();
  if (!raw) return "Not recorded";

  const normalized = raw.toLowerCase();

  const countryMap: Record<string, string> = {
    ke: "Kenya",
    ug: "Uganda",
    tz: "Tanzania",
    rw: "Rwanda",
    et: "Ethiopia",
    ng: "Nigeria",
    za: "South Africa",
    gh: "Ghana",
    uk: "United Kingdom",
    gb: "United Kingdom",
    us: "United States",
    ae: "United Arab Emirates",
  };

  return countryMap[normalized] || toTitleCase(raw);
}

function formatIndustryDisplay(industry?: string | null) {
  const raw = industry?.trim();
  if (!raw) return "Not recorded";
  return toTitleCase(raw);
}

function formatCompanyDisplay(company?: string | null) {
  const raw = company?.trim();
  if (!raw) return "Not recorded";
  return toTitleCase(raw);
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;

  const [report, setReport] = useState<ReportRow | null>(null);
  const [comparisonReports, setComparisonReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function loadReport() {
      const supabase = createSupabaseClient();

      const [reportResponse, comparisonResponse] = await Promise.all([
        supabase.from("report_results").select("*").eq("id", reportId).maybeSingle(),
        supabase
          .from("report_results")
          .select(
            "id, created_at, period_label, reporting_period, employee_count, electricity_kwh, fuel_liters, scope1_emissions, scope2_emissions, total_emissions"
          )
          .order("id", { ascending: false })
          .limit(36),
      ]);

      if (reportResponse.error) {
        console.error("Error loading report:", reportResponse.error);
        setErrorMessage("Failed to load report.");
        setLoading(false);
        return;
      }

      if (comparisonResponse.error) {
        console.error("Error loading comparison reports:", comparisonResponse.error);
        setErrorMessage("Failed to load comparison context.");
        setReport((reportResponse.data as ReportRow | null) ?? null);
        setLoading(false);
        return;
      }

      setReport((reportResponse.data as ReportRow | null) ?? null);
      setComparisonReports((comparisonResponse.data as ReportRow[]) || []);
      setLoading(false);
    }

    if (reportId) loadReport();
  }, [reportId]);

  useEffect(() => {
    if (!errorMessage) return;

    const timer = window.setTimeout(() => {
      setErrorMessage("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  const orderedReports = useMemo(() => {
    const prepared = comparisonReports.map((item) => ({
      report: item,
      parsedDate: parseSortDate(item),
    }));

    prepared.sort(compareReportsChronologically);

    return prepared.map((item) => item.report);
  }, [comparisonReports]);

  const previousComparableReport = useMemo(() => {
    if (!report) return null;

    const index = orderedReports.findIndex((item) => item.id === report.id);
    if (index <= 0) return null;

    return orderedReports[index - 1] ?? null;
  }, [orderedReports, report]);

  const isLatestReport = useMemo(() => {
    if (!report || orderedReports.length === 0) return false;
    return orderedReports[orderedReports.length - 1]?.id === report.id;
  }, [orderedReports, report]);

  const comparisonHistory = useMemo(() => {
    if (!report) return [];

    const currentIndex = orderedReports.findIndex((item) => item.id === report.id);
    if (currentIndex <= 0) return [];

    return orderedReports
      .slice(Math.max(0, currentIndex - 3), currentIndex)
      .filter((item) => item.total_emissions != null);
  }, [orderedReports, report]);

  const intelligence = useMemo(() => {
    return buildReportIntelligence(
      report,
      previousComparableReport,
      comparisonHistory
    );
  }, [report, previousComparableReport, comparisonHistory]);

  async function handleDelete() {
    if (!reportId || !report) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to delete report.");
      }

      router.push("/dashboard/reports?deleted=1");
      router.refresh();
    } catch (error) {
      console.error("Error deleting report:", error);
      setErrorMessage("Failed to delete report. Please try again.");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="page-header">
          <div>
            <h1>Report Detail</h1>
            <p>Loading report data.</p>
          </div>
        </div>

        <Card title="Loading">
          <p className="dashboard-insight-text">Loading report...</p>
        </Card>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="dashboard-page">
        <div className="page-header">
          <div>
            <h1>Report Detail</h1>
            <p>The requested report could not be found.</p>
          </div>
        </div>

        {errorMessage && (
          <div className="status-banner status-banner-error">{errorMessage}</div>
        )}

        <Card title="Report Not Found">
          <p className="dashboard-insight-text">
            This report could not be found.
          </p>

          <div className="dashboard-actions reports-actions-spacer">
            <Link href="/dashboard/reports" className="dashboard-btn-secondary">
              Back to Reports
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  const reportingPeriod = formatPeriodLabel(report);
  const totalEmissions = formatKgFull(report.total_emissions);
  const scope1 = formatKgFull(report.scope1_emissions);
  const scope2 = formatKgFull(report.scope2_emissions);
  const electricity = formatNumber(report.electricity_kwh);
  const fuel = formatNumber(report.fuel_liters);
  const createdDate = formatDisplayDate(report.created_at);
  const previousPeriodLabel = formatPeriodLabel(previousComparableReport);

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Report Detail</h1>
          <p>
            Detailed emissions summary, methodology basis, and performance
            interpretation for this month.
          </p>
        </div>

        <div className="report-header-actions">
          <a
            href={`/api/reports/${reportId}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="dashboard-btn-primary"
          >
            Download PDF
          </a>
          <Link href="/dashboard/reports" className="dashboard-btn-secondary">
            Back to Reports
          </Link>
        </div>
      </div>

      <div className="workflow-strip">
        <span className="workflow-strip-label">Quick navigation</span>
        <div className="workflow-strip-links">
          <Link href="/dashboard" className="workflow-strip-link">
            Dashboard
          </Link>
          <Link href="/dashboard/assessment" className="workflow-strip-link">
            New Assessment
          </Link>
          <Link href="/dashboard/monthly-tracker" className="workflow-strip-link">
            Monthly Tracker
          </Link>
          <Link href="/dashboard/reports" className="workflow-strip-link workflow-strip-link--current">
            Reports
          </Link>
        </div>
      </div>

      {errorMessage && (
        <div className="status-banner status-banner-error">{errorMessage}</div>
      )}

      {isLatestReport ? (
        <div className="latest-report-cue">
          <div className="latest-report-cue-copy">
            <p className="latest-report-cue-eyebrow">Latest monthly report</p>
            <h2>This is your newest monthly submission.</h2>
            <p>
              It is currently the freshest report reflected across Dashboard,
              Reports, and Monthly Tracker.
            </p>
          </div>

          <div className="latest-report-cue-actions">
            <Link
              href="/dashboard/monthly-tracker"
              className="button button-secondary"
            >
              Open Monthly Tracker
            </Link>
            <Link
              href="/dashboard/assessment"
              className="button button-primary"
            >
              Add Another Month
            </Link>
          </div>
        </div>
      ) : null}

      <div className="kpi-grid">
        <Card title="Total Emissions">
          <div className="kpi-value">{totalEmissions}</div>
          <div className="kpi-label">Full footprint</div>
        </Card>

        <Card title="Scope 1">
          <div className="kpi-value-dark">{scope1}</div>
          <div className="kpi-label">Direct emissions</div>
        </Card>

        <Card title="Scope 2">
          <div className="kpi-value-dark">{scope2}</div>
          <div className="kpi-label">Purchased electricity</div>
        </Card>
      </div>

      <div className="dashboard-panels-grid">
        <Card title="Report Summary">
          <div className="report-detail-list">
            <div className="report-detail-row">
              <span className="report-detail-label">Company</span>
              <span className="report-detail-value">
                {formatCompanyDisplay(report.company_name)}
              </span>
            </div>

            <div className="report-detail-row">
              <span className="report-detail-label">Country</span>
              <span className="report-detail-value">
                {formatCountryDisplay(report.country)}
              </span>
            </div>

            <div className="report-detail-row">
              <span className="report-detail-label">Industry</span>
              <span className="report-detail-value">
                {formatIndustryDisplay(report.industry)}
              </span>
            </div>

            <div className="report-detail-row">
              <span className="report-detail-label">Reporting Month</span>
              <span className="report-detail-value">{reportingPeriod}</span>
            </div>

            <div className="report-detail-row">
              <span className="report-detail-label">Created</span>
              <span className="report-detail-value">{createdDate}</span>
            </div>

            <div className="report-detail-row">
              <span className="report-detail-label">Employees</span>
              <span className="report-detail-value">
                {formatNumber(report.employee_count, 0)}
              </span>
            </div>

            <div className="report-detail-row">
              <span className="report-detail-label">Electricity Usage</span>
              <span className="report-detail-value">{electricity} kWh</span>
            </div>

            <div className="report-detail-row">
              <span className="report-detail-label">Fuel Usage</span>
              <span className="report-detail-value">{fuel} liters</span>
            </div>
          </div>
        </Card>

        <Card title="Methodology Basis">
          <div className="report-detail-list">
            <div className="report-detail-row">
              <span className="report-detail-label">Electricity Method</span>
              <span className="report-detail-value">
                {getElectricityMethodLabel(report.electricity_method)}
              </span>
            </div>

            <div className="report-detail-row">
              <span className="report-detail-label">Electricity Factor</span>
              <span className="report-detail-value">
                {report.electricity_factor == null
                  ? "Not recorded"
                  : `${formatNumber(report.electricity_factor, 6)} kg CO2e / kWh`}
              </span>
            </div>

            <div className="report-detail-row">
              <span className="report-detail-label">Fuel Type</span>
              <span className="report-detail-value">
                {formatIndustryDisplay(report.fuel_type)}
              </span>
            </div>

            <div className="report-detail-row">
              <span className="report-detail-label">Fuel Factor</span>
              <span className="report-detail-value">
                {report.fuel_factor == null
                  ? "Not recorded"
                  : `${formatNumber(report.fuel_factor, 6)} kg CO2e / liter`}
              </span>
            </div>

            <div className="summary-callout" style={{ marginTop: "12px" }}>
              <strong>Important note</strong>
              <p>
                This report should be interpreted using the recorded electricity
                and fuel factors shown above. Factors can differ by grid,
                supplier, fuel type, and reporting method.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="dashboard-panels-grid">
        <Card title="Performance Summary">
          <div className="insights-list">
            <div className="insight-item">
              <strong>Executive summary</strong>
              <p>{intelligence.executiveSummary}</p>
            </div>

            <div className="insight-item">
              <strong>
                Benchmark{" "}
                {intelligence.intensityBand ? (
                  <span
                    className={getIntensityToneClass(
                      intelligence.intensityBand.tone
                    )}
                  >
                    {intelligence.intensityBand.label}
                  </span>
                ) : null}
              </strong>
              <p>{intelligence.benchmarkSummary}</p>
            </div>

            <div className="insight-item">
              <strong>
                Trend{" "}
                <span className={getSignalToneClass(intelligence.trend.tone)}>
                  {intelligence.trend.label}
                </span>
              </strong>
              <p>{intelligence.trend.summary}</p>
            </div>

            <div className="insight-item">
              <strong>Dominant source</strong>
              <p>{intelligence.dominantSource.summary}</p>
            </div>

            <div className="insight-item">
              <strong>Recent baseline</strong>
              <p>{intelligence.baselineComparison.summary}</p>
            </div>

            <div className="insight-item">
              <strong>Coverage</strong>
              <p>{intelligence.coverage}</p>
            </div>
          </div>
        </Card>

        <Card title="Recommended Actions">
          <div className="summary-stack">
            <div className="summary-callout">
              <strong>Next best move</strong>
              <p>{intelligence.dominantSource.action}</p>
            </div>

            <div className="summary-callout">
              <strong>Trend response</strong>
              <p>{intelligence.trend.action}</p>
            </div>

            {previousComparableReport ? (
              <div className="summary-callout">
                <strong>Comparison month</strong>
                <p>
                  This report is being compared against{" "}
                  <strong>{previousPeriodLabel}</strong>.
                </p>
              </div>
            ) : null}

            <ul className="recommendation-list">
              {intelligence.recommendedActions.map((item, index) => (
                <li key={`detail-action-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="dashboard-panels-grid">
        <Card title="Manage report">
          <div className="dashboard-actions">
            <a
              href={`/api/reports/${reportId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="dashboard-btn-primary"
            >
              Download PDF
            </a>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="dashboard-btn-danger-outline"
            >
              {deleting ? "Deleting..." : "Delete Report"}
            </button>

            <div className="summary-callout">
              <strong>At a glance</strong>
              <p>
                {intelligence.perEmployee == null
                  ? "Benchmarking is limited until employee count is available."
                  : `This month recorded ${formatNumber(
                      intelligence.perEmployee
                    )} kg CO2e per employee.`}
              </p>
              <p>{formatKgFull(report.total_emissions)} total emissions recorded.</p>
            </div>
          </div>
        </Card>
      </div>

      {showDeleteModal && (
        <div
          className="app-modal-overlay"
          onClick={() => !deleting && setShowDeleteModal(false)}
        >
          <div className="app-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Delete Report</h3>
            <p>
              Delete report <strong>"{reportingPeriod}"</strong>?
            </p>
            <p className="app-modal-note">This action cannot be undone.</p>

            <div className="app-modal-actions">
              <button
                type="button"
                className="dashboard-btn-secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="dashboard-btn-danger-solid"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
