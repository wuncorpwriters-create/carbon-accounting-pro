"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
  buildReportIntelligence,
  getChronologicalNeighbors,
  buildComparisonMetrics,
  getComparisonSummary,
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

function formatMetricValue(
  value: number | null | undefined,
  unit?: string,
  digits = 1
) {
  if (value == null || Number.isNaN(value)) return "—";
  const formatted = formatNumber(value, digits);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatMetricDelta(
  delta: number | null | undefined,
  unit?: string,
  digits = 1
) {
  if (delta == null || Number.isNaN(delta)) return "—";
  const absolute = Math.abs(delta);
  const formatted = formatNumber(absolute, digits);
  return unit ? `${formatted} ${unit}` : formatted;
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;

  const [report, setReport] = useState<ReportRow | null>(null);
  const [comparisonReports, setComparisonReports] = useState<ReportRow[]>([]);
  const [selectedComparisonId, setSelectedComparisonId] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const searchParams = useSearchParams();
  const wasUpdated = searchParams.get("updated") === "1";

  useEffect(() => {
    async function loadReport() {
      const supabase = createSupabaseClient();

      const [reportResponse, comparisonResponse] = await Promise.all([
        supabase.from("report_results").select("*").eq("id", reportId).maybeSingle(),
        supabase
          .from("report_results")
          .select(
            "id, created_at, company_name, country, industry, period_label, reporting_period, employee_count, electricity_kwh, electricity_method, electricity_factor, fuel_liters, fuel_type, fuel_factor, scope1_emissions, scope2_emissions, total_emissions"
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

  const chronologicalContext = useMemo(() => {
    if (!report) {
      return {
        previous: null as ReportRow | null,
        current: null as ReportRow | null,
        next: null as ReportRow | null,
        sorted: [] as ReportRow[],
        index: -1,
      };
    }

    return getChronologicalNeighbors(comparisonReports, report.id);
  }, [comparisonReports, report]);

  const orderedReports = chronologicalContext.sorted;
  const previousComparableReport = chronologicalContext.previous;

  const comparisonOptions = useMemo(() => {
    if (!report) return [];

    return [...orderedReports]
      .filter((item) => item.id !== report.id)
      .reverse()
      .map((item) => ({
        id: item.id,
        label: formatPeriodLabel(item),
      }));
  }, [orderedReports, report]);

  useEffect(() => {
    if (!report) {
      setSelectedComparisonId("");
      return;
    }

    if (!comparisonOptions.length) {
      setSelectedComparisonId("");
      return;
    }

    const hasCurrentSelection = comparisonOptions.some(
      (item) => item.id === selectedComparisonId
    );

    if (hasCurrentSelection) return;

    if (previousComparableReport?.id) {
      setSelectedComparisonId(previousComparableReport.id);
      return;
    }

    setSelectedComparisonId(comparisonOptions[0]?.id ?? "");
  }, [
    report,
    comparisonOptions,
    previousComparableReport,
    selectedComparisonId,
  ]);

  const activeComparisonReport = useMemo(() => {
    if (!selectedComparisonId) return previousComparableReport ?? null;

    return (
      orderedReports.find((item) => item.id === selectedComparisonId) ??
      previousComparableReport ??
      null
    );
  }, [selectedComparisonId, orderedReports, previousComparableReport]);

  const isLatestReport = useMemo(() => {
    if (!report || orderedReports.length === 0) return false;
    return orderedReports[orderedReports.length - 1]?.id === report.id;
  }, [orderedReports, report]);

  const comparisonHistory = useMemo(() => {
    if (!report) return [];

    const currentIndex = orderedReports.findIndex((item) => item.id === report.id);
    if (currentIndex <= 0) return [];

    return orderedReports
      .slice(Math.max(0, currentIndex - 6), currentIndex)
      .filter((item) => item.total_emissions != null);
  }, [orderedReports, report]);

  const intelligence = useMemo(() => {
    return buildReportIntelligence(
      report,
      previousComparableReport,
      comparisonHistory
    );
  }, [report, previousComparableReport, comparisonHistory]);

  const comparisonMetrics = useMemo(() => {
    return buildComparisonMetrics(report, activeComparisonReport);
  }, [report, activeComparisonReport]);

  const comparisonSummary = useMemo(() => {
    return getComparisonSummary(report, activeComparisonReport);
  }, [report, activeComparisonReport]);

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
  const electricity =
    report.electricity_kwh == null ? "—" : formatNumber(report.electricity_kwh);
  const fuel =
    report.fuel_liters == null ? "—" : formatNumber(report.fuel_liters);
  const createdDate = formatDisplayDate(report.created_at);
  const activeComparisonLabel = formatPeriodLabel(activeComparisonReport);
  const pdfHref = activeComparisonReport
    ? `/api/reports/${reportId}/pdf?compareId=${encodeURIComponent(activeComparisonReport.id)}`
    : `/api/reports/${reportId}/pdf`;

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
            href={pdfHref}
            target="_blank"
            rel="noopener noreferrer"
            className="dashboard-btn-primary"
          >
            Download PDF
          </a>
          <Link
            href={`/dashboard/assessment?edit=${report.id}`}
            className="dashboard-btn-secondary"
          >
            Edit Assessment
          </Link>
          <Link href="/dashboard/reports" className="dashboard-btn-secondary">
            Back to Reports
          </Link>
        </div>
      </div>

      {wasUpdated ? (
        <div className="status-banner status-banner--success">
          Report updated successfully. Your saved changes are now reflected in this monthly report.
        </div>
      ) : null}

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
          <Link
            href="/dashboard/reports"
            className="workflow-strip-link workflow-strip-link--current"
          >
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
                {report.employee_count == null
                  ? "—"
                  : formatNumber(report.employee_count, 0)}
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
                  : `${formatNumber(report.electricity_factor, 2)} kg CO₂e / kWh`}
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
                  : `${formatNumber(report.fuel_factor, 2)} kg CO₂e / liter`}
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

      {comparisonMetrics && comparisonSummary ? (
        <div className="dashboard-panels-grid report-comparison-grid">
          <Card title="Comparison Snapshot">
            <div className="summary-stack">
              {comparisonOptions.length > 0 ? (
                <div className="summary-callout">
                  <strong>Compare against</strong>
                  <div style={{ marginTop: "10px" }}>
                    <select
                      value={selectedComparisonId}
                      onChange={(event) => setSelectedComparisonId(event.target.value)}
                      className="app-input"
                    >
                      {comparisonOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}

              <div className="summary-callout">
                <strong>{comparisonSummary.title}</strong>
                <p>{comparisonSummary.summary}</p>
                <p>{comparisonSummary.action}</p>
              </div>

              <div className="summary-callout">
                <strong>
                  Normal vs unusual{" "}
                  <span className={getSignalToneClass(intelligence.anomalySignal.tone)}>
                    {intelligence.anomalySignal.label}
                  </span>
                </strong>
                <p>{intelligence.anomalySignal.summary}</p>
                <p>{intelligence.anomalySignal.action}</p>
              </div>

              <div className="summary-callout">
                <strong>Main watchout</strong>
                <p>{intelligence.sourceWatchout.summary}</p>
                <p>{intelligence.sourceWatchout.action}</p>
              </div>

              <div className="summary-callout">
                <strong>
                  Management read{" "}
                  <span className={getSignalToneClass(intelligence.managementSignal.tone)}>
                    {intelligence.managementSignal.label}
                  </span>
                </strong>
                <p>{intelligence.managementSignal.summary}</p>
                <p>{intelligence.managementSignal.action}</p>
              </div>

              <div className="summary-callout">
                <strong>
                  Recent pattern{" "}
                  <span className={getSignalToneClass(intelligence.consistencySignal.tone)}>
                    {intelligence.consistencySignal.label}
                  </span>
                </strong>
                <p>{intelligence.consistencySignal.summary}</p>
                <p>{intelligence.consistencySignal.action}</p>
              </div>

              <div className="summary-callout">
                <strong>
                  Recent position{" "}
                  <span className={getSignalToneClass(intelligence.recentPositionSignal.tone)}>
                    {intelligence.recentPositionSignal.label}
                  </span>
                </strong>
                <p>{intelligence.recentPositionSignal.summary}</p>
                <p>{intelligence.recentPositionSignal.action}</p>
              </div>

              <div className="summary-callout">
                <strong>
                  Benchmark depth{" "}
                  <span className={getSignalToneClass(intelligence.benchmarkDepthSignal.tone)}>
                    {intelligence.benchmarkDepthSignal.label}
                  </span>
                </strong>
                <p>{intelligence.benchmarkDepthSignal.summary}</p>
                <p>{intelligence.benchmarkDepthSignal.action}</p>
              </div>

              <div className="summary-callout">
                <strong>
                  Benchmark Position{" "}
                  <span className={getSignalToneClass(intelligence.benchmarkPositionSignal.tone)}>
                    {intelligence.benchmarkPositionSignal.label}
                  </span>
                </strong>
                <p>{intelligence.benchmarkPositionSignal.summary}</p>
                <p>
                  <strong>Rank in history:</strong>{" "}
                  {intelligence.benchmarkPositionSignal.rank != null
                    ? `${intelligence.benchmarkPositionSignal.rank} of ${intelligence.benchmarkPositionSignal.totalCount}`
                    : "Not enough data"}
                </p>
                <p>
                  <strong>Gap to best:</strong>{" "}
                  {intelligence.benchmarkPositionSignal.deltaToBest != null
                    ? formatKgFull(intelligence.benchmarkPositionSignal.deltaToBest)
                    : "Not enough data"}
                </p>
                <p>
                  <strong>Gap to average:</strong>{" "}
                  {intelligence.benchmarkPositionSignal.deltaToAverage != null
                    ? formatKgFull(intelligence.benchmarkPositionSignal.deltaToAverage)
                    : "Not enough data"}
                </p>
                <p>{intelligence.benchmarkPositionSignal.action}</p>
              </div>

              <div className="summary-callout">
                <strong>
                  Vs Best Month{" "}
                  <span className={getSignalToneClass(intelligence.bestMonthReference.gapSignal.tone)}>
                    {intelligence.bestMonthReference.gapSignal.label}
                  </span>
                </strong>
                <p>{intelligence.bestMonthReference.summary}</p>
                <p>
                  <strong>Best recent month:</strong>{" "}
                  {intelligence.bestMonthReference.bestMonthLabel}
                </p>
                <p>
                  <strong>Gap vs best:</strong>{" "}
                  {intelligence.bestMonthReference.gapKg != null
                    ? formatKgFull(intelligence.bestMonthReference.gapKg)
                    : "Not enough data"}
                </p>
                <p>
                  <strong>Driver:</strong>{" "}
                  {intelligence.bestMonthReference.driverSignal.label}
                </p>
                <p>{intelligence.bestMonthReference.nextStep}</p>
              </div>

              <div className="summary-callout">
                <strong>
                  Performance streak{" "}
                  <span className={getSignalToneClass(intelligence.deteriorationStreakSignal.tone)}>
                    {intelligence.deteriorationStreakSignal.label}
                  </span>
                </strong>
                <p>{intelligence.deteriorationStreakSignal.summary}</p>
                <p>{intelligence.deteriorationStreakSignal.action}</p>
              </div>

              <div className="summary-callout">
                <strong>
                  Persistent source pattern{" "}
                  <span className={getSignalToneClass(intelligence.persistentSourceSignal.tone)}>
                    {intelligence.persistentSourceSignal.label}
                  </span>
                </strong>
                <p>{intelligence.persistentSourceSignal.summary}</p>
                <p>{intelligence.persistentSourceSignal.action}</p>
              </div>

              <div className="summary-callout">
                <strong>
                  Recent trajectory{" "}
                  <span className={getSignalToneClass(intelligence.recentTrajectorySignal.tone)}>
                    {intelligence.recentTrajectorySignal.label}
                  </span>
                </strong>
                <p>{intelligence.recentTrajectorySignal.summary}</p>
                <p>{intelligence.recentTrajectorySignal.action}</p>
              </div>

              <div className="summary-callout">
                <strong>
                  Recovery Progress{" "}
                  <span className={getSignalToneClass(intelligence.recoveryProgressSignal.tone)}>
                    {intelligence.recoveryProgressSignal.label}
                  </span>
                </strong>
                <p>{intelligence.recoveryProgressSignal.summary}</p>
                <p>{intelligence.recoveryProgressSignal.action}</p>
              </div>

              <div className="summary-callout">
                <strong>
                  Change driver{" "}
                  <span className={getSignalToneClass(intelligence.changeDriverSignal.tone)}>
                    {intelligence.changeDriverSignal.label}
                  </span>
                </strong>
                <p>{intelligence.changeDriverSignal.summary}</p>
                <p>{intelligence.changeDriverSignal.action}</p>
              </div>

              <div className="report-detail-list">
                <div className="report-detail-row">
                  <span className="report-detail-label">Comparison month</span>
                  <span className="report-detail-value">
                    {comparisonMetrics.baselineLabel}
                  </span>
                </div>

                <div className="report-detail-row">
                  <span className="report-detail-label">Total emissions</span>
                  <span className="report-detail-value">
                    <span className={getSignalToneClass(comparisonMetrics.totalEmissions.tone)}>
                      {comparisonMetrics.totalEmissions.changeLabel}
                    </span>
                    {" · "}
                    {formatMetricDelta(
                      comparisonMetrics.totalEmissions.delta,
                      "kg CO₂e",
                      1
                    )}
                  </span>
                </div>

                <div className="report-detail-row">
                  <span className="report-detail-label">Scope 1</span>
                  <span className="report-detail-value">
                    <span className={getSignalToneClass(comparisonMetrics.scope1.tone)}>
                      {comparisonMetrics.scope1.changeLabel}
                    </span>
                    {" · "}
                    {formatMetricDelta(
                      comparisonMetrics.scope1.delta,
                      "kg CO₂e",
                      1
                    )}
                  </span>
                </div>

                <div className="report-detail-row">
                  <span className="report-detail-label">Scope 2</span>
                  <span className="report-detail-value">
                    <span className={getSignalToneClass(comparisonMetrics.scope2.tone)}>
                      {comparisonMetrics.scope2.changeLabel}
                    </span>
                    {" · "}
                    {formatMetricDelta(
                      comparisonMetrics.scope2.delta,
                      "kg CO₂e",
                      1
                    )}
                  </span>
                </div>

                <div className="report-detail-row">
                  <span className="report-detail-label">Emissions per employee</span>
                  <span className="report-detail-value">
                    <span
                      className={getSignalToneClass(
                        comparisonMetrics.emissionsPerEmployee.tone
                      )}
                    >
                      {comparisonMetrics.emissionsPerEmployee.changeLabel}
                    </span>
                    {" · "}
                    {formatMetricDelta(
                      comparisonMetrics.emissionsPerEmployee.delta,
                      "kg CO₂e / employee",
                      1
                    )}
                  </span>
                </div>

                <div className="report-detail-row">
                  <span className="report-detail-label">Electricity use</span>
                  <span className="report-detail-value">
                    <span
                      className={getSignalToneClass(
                        comparisonMetrics.electricity.tone
                      )}
                    >
                      {comparisonMetrics.electricity.changeLabel}
                    </span>
                    {" · "}
                    {formatMetricDelta(comparisonMetrics.electricity.delta, "kWh", 1)}
                  </span>
                </div>

                <div className="report-detail-row">
                  <span className="report-detail-label">Fuel use</span>
                  <span className="report-detail-value">
                    <span className={getSignalToneClass(comparisonMetrics.fuel.tone)}>
                      {comparisonMetrics.fuel.changeLabel}
                    </span>
                    {" · "}
                    {formatMetricDelta(comparisonMetrics.fuel.delta, "liters", 1)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

        <Card>
          <div className="stack-sm">
            <h3>Priority Actions</h3>

            {intelligence.priorityActions?.length ? (
              intelligence.priorityActions.map((action, index) => (
                <div key={`${action.title}-${index}`} className="insight-row">
                  <strong>{action.title}</strong>
                  <p>{action.summary}</p>
                </div>
              ))
            ) : (
              <p>No priority actions yet.</p>
            )}

            {intelligence.biggestOpportunity ? (
              <p>
                <strong>Biggest opportunity:</strong> {intelligence.biggestOpportunity}
              </p>
            ) : null}

            {intelligence.nextBestStep ? (
              <p>
                <strong>Next best step:</strong> {intelligence.nextBestStep}
              </p>
            ) : null}
          </div>
        </Card>


          <Card title="Comparison Context">
            <div className="insights-list">
              <div className="insight-item">
                <strong>Current month</strong>
                <p>{comparisonMetrics.currentLabel}</p>
              </div>

              <div className="insight-item">
                <strong>Compared against</strong>
                <p>{comparisonMetrics.baselineLabel}</p>
              </div>

              <div className="insight-item">
                <strong>Normal vs unusual</strong>
                <p>{intelligence.anomalySignal.label}</p>
              </div>

              <div className="insight-item">
                <strong>Main watchout</strong>
                <p>{intelligence.sourceWatchout.label}</p>
              </div>

              <div className="insight-item">
                <strong>Management read</strong>
                <p>{intelligence.managementSignal.label}</p>
              </div>

              <div className="insight-item">
                <strong>Recent pattern</strong>
                <p>{intelligence.consistencySignal.label}</p>
              </div>

              <div className="insight-item">
                <strong>Total emissions now</strong>
                <p>
                  {formatMetricValue(
                    comparisonMetrics.totalEmissions.current,
                    "kg CO₂e",
                    1
                  )}
                </p>
              </div>

              <div className="insight-item">
                <strong>Total emissions then</strong>
                <p>
                  {formatMetricValue(
                    comparisonMetrics.totalEmissions.baseline,
                    "kg CO₂e",
                    1
                  )}
                </p>
              </div>

              <div className="insight-item">
                <strong>Electricity now</strong>
                <p>
                  {formatMetricValue(
                    comparisonMetrics.electricity.current,
                    "kWh",
                    1
                  )}
                </p>
              </div>

              <div className="insight-item">
                <strong>Fuel now</strong>
                <p>
                  {formatMetricValue(comparisonMetrics.fuel.current, "liters", 1)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="dashboard-panels-grid">
          <Card title="Comparison Snapshot">
            <div className="summary-callout">
              <strong>Comparison unavailable</strong>
              <p>
                Add at least one earlier reporting month to unlock direct
                month-vs-month comparison for this report.
              </p>
            </div>
          </Card>
        </div>
      )}

      <div className="dashboard-panels-grid">
        <Card title="Performance Summary">
          <div className="performance-mini-panels">
            <div className="performance-mini-panel performance-mini-panel--lead">
              <strong>Executive summary</strong>
              <p>{intelligence.executiveSummary}</p>
            </div>

            <div className="performance-mini-panel-grid">
              <div className="performance-mini-panel performance-mini-panel--signal">
                <div className="performance-mini-panel-head">
                  <span className="performance-mini-panel-title">Benchmark</span>
                  {intelligence.intensityBand ? (
                    <span
                      className={getIntensityToneClass(
                        intelligence.intensityBand.tone
                      )}
                    >
                      {intelligence.intensityBand.label}
                    </span>
                  ) : null}
                </div>
                <p className="performance-mini-panel-summary">
                  {intelligence.perEmployee == null
                    ? "Employee count missing, so intensity benchmarking is limited."
                    : `Intensity is ${formatNumber(
                        intelligence.perEmployee,
                        1
                      )} kg CO₂e per employee.`}
                </p>
                <p className="performance-mini-panel-support">
                  {intelligence.benchmarkSummary}
                </p>
              </div>

              <div className="performance-mini-panel performance-mini-panel--signal">
                <div className="performance-mini-panel-head">
                  <span className="performance-mini-panel-title">Trend</span>
                  <span className={getSignalToneClass(intelligence.trend.tone)}>
                    {intelligence.trend.label}
                  </span>
                </div>
                <p className="performance-mini-panel-summary">
                  {intelligence.trend.summary}
                </p>
                <p className="performance-mini-panel-support">
                  {intelligence.trend.action}
                </p>
              </div>

              <div className="performance-mini-panel performance-mini-panel--signal">
                <div className="performance-mini-panel-head">
                  <span className="performance-mini-panel-title">
                    Normal vs unusual
                  </span>
                  <span
                    className={getSignalToneClass(intelligence.anomalySignal.tone)}
                  >
                    {intelligence.anomalySignal.label}
                  </span>
                </div>
                <p className="performance-mini-panel-summary">
                  {intelligence.anomalySignal.summary}
                </p>
                <p className="performance-mini-panel-support">
                  {intelligence.anomalySignal.action}
                </p>
              </div>

              <div className="performance-mini-panel performance-mini-panel--signal">
                <div className="performance-mini-panel-head">
                  <span className="performance-mini-panel-title">
                    Main watchout
                  </span>
                </div>
                <p className="performance-mini-panel-summary">
                  {intelligence.sourceWatchout.summary}
                </p>
                <p className="performance-mini-panel-support">
                  {intelligence.sourceWatchout.action}
                </p>
              </div>

              <div className="performance-mini-panel performance-mini-panel--signal">
                <div className="performance-mini-panel-head">
                  <span className="performance-mini-panel-title">
                    Management read
                  </span>
                  <span className={getSignalToneClass(intelligence.managementSignal.tone)}>
                    {intelligence.managementSignal.label}
                  </span>
                </div>
                <p className="performance-mini-panel-summary">
                  {intelligence.managementSignal.summary}
                </p>
                <p className="performance-mini-panel-support">
                  {intelligence.managementSignal.action}
                </p>
              </div>

              <div className="performance-mini-panel performance-mini-panel--signal">
                <div className="performance-mini-panel-head">
                  <span className="performance-mini-panel-title">
                    Recent pattern
                  </span>
                  <span className={getSignalToneClass(intelligence.consistencySignal.tone)}>
                    {intelligence.consistencySignal.label}
                  </span>
                </div>
                <p className="performance-mini-panel-summary">
                  {intelligence.consistencySignal.summary}
                </p>
                <p className="performance-mini-panel-support">
                  {intelligence.consistencySignal.action}
                </p>
              </div>

              <div className="performance-mini-panel performance-mini-panel--signal">
                <div className="performance-mini-panel-head">
                  <span className="performance-mini-panel-title">
                    Recovery Progress
                  </span>
                  <span className={getSignalToneClass(intelligence.recoveryProgressSignal.tone)}>
                    {intelligence.recoveryProgressSignal.label}
                  </span>
                </div>
                <p className="performance-mini-panel-summary">
                  {intelligence.recoveryProgressSignal.summary}
                </p>
                <p className="performance-mini-panel-support">
                  {intelligence.recoveryProgressSignal.action}
                </p>
              </div>

              <div className="performance-mini-panel performance-mini-panel--signal">
                <div className="performance-mini-panel-head">
                  <span className="performance-mini-panel-title">
                    Multi-month management read
                  </span>
                  <span className={getSignalToneClass(intelligence.multiMonthSignal.tone)}>
                    {intelligence.multiMonthSignal.label}
                  </span>
                </div>
                <p className="performance-mini-panel-summary">
                  {intelligence.multiMonthSignal.summary}
                </p>
                <p className="performance-mini-panel-support">
                  {intelligence.multiMonthSignal.action}
                </p>
                <p className="performance-mini-panel-support">
                  <strong>Window:</strong> {intelligence.multiMonthSignal.windowLabel}
                </p>
              </div>

              <div className="performance-mini-panel performance-mini-panel--signal">
                <div className="performance-mini-panel-head">
                  <span className="performance-mini-panel-title">
                    Benchmark Position
                  </span>
                  <span className={getSignalToneClass(intelligence.benchmarkPositionSignal.tone)}>
                    {intelligence.benchmarkPositionSignal.label}
                  </span>
                </div>
                <p className="performance-mini-panel-summary">
                  {intelligence.benchmarkPositionSignal.summary}
                </p>
                <p className="performance-mini-panel-support">
                  {intelligence.benchmarkPositionSignal.action}
                </p>
              </div>

              <div className="performance-mini-panel performance-mini-panel--signal">
                <div className="performance-mini-panel-head">
                  <span className="performance-mini-panel-title">
                    Dominant source
                  </span>
                </div>
                <p className="performance-mini-panel-summary">
                  {intelligence.dominantSource.summary}
                </p>
                <p className="performance-mini-panel-support">
                  {intelligence.dominantSource.action}
                </p>
              </div>

              <div className="performance-mini-panel performance-mini-panel--signal">
                <div className="performance-mini-panel-head">
                  <span className="performance-mini-panel-title">
                    Recent baseline
                  </span>
                </div>
                <p className="performance-mini-panel-summary">
                  {intelligence.baselineComparison.summary}
                </p>
              </div>

              <div className="performance-mini-panel performance-mini-panel--full">
                <div className="performance-mini-panel-head">
                  <span className="performance-mini-panel-title">Coverage</span>
                </div>
                <p className="performance-mini-panel-summary">
                  {intelligence.coverage}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Recommended Actions">
          <div className="summary-stack">
            <div className="summary-callout">
              <strong>Next best move</strong>
              <p>{intelligence.recommendedActions[0] || intelligence.dominantSource.action}</p>
            </div>

            <div className="summary-callout">
              <strong>Watchout response</strong>
              <p>{intelligence.sourceWatchout.action}</p>
            </div>

            <div className="summary-callout">
              <strong>Trend response</strong>
              <p>{intelligence.trend.action}</p>
            </div>

            <div className="summary-callout">
              <strong>Management read</strong>
              <p>{intelligence.managementSignal.summary}</p>
            </div>

            <div className="summary-callout">
              <strong>Recent pattern</strong>
              <p>{intelligence.consistencySignal.summary}</p>
            </div>

            {activeComparisonReport ? (
              <div className="summary-callout">
                <strong>Comparison month</strong>
                <p>
                  This report is being compared against{" "}
                  <strong>{activeComparisonLabel}</strong>.
                </p>
              </div>
            ) : null}

            <div className="summary-callout">
              <strong>Action checklist</strong>
              <ul className="recommendation-list recommendation-list--inside-callout">
                {intelligence.recommendedActions.map((item, index) => (
                  <li key={`detail-action-${index}`}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <div className="dashboard-panels-grid">
        <Card title="Manage report">
          <div className="dashboard-actions">
            <a
              href={pdfHref}
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
                    )} kg CO₂e per employee.`}
              </p>
              <p>{formatKgFull(report.total_emissions)} total emissions recorded.</p>
              <p>
                <span className={getSignalToneClass(intelligence.anomalySignal.tone)}>
                  {intelligence.anomalySignal.label}
                </span>
                {" · "}
                {intelligence.sourceWatchout.label}
              </p>
              <p>
                <span className={getSignalToneClass(intelligence.managementSignal.tone)}>
                  {intelligence.managementSignal.label}
                </span>
                {" · "}
                {intelligence.consistencySignal.label}
              </p>
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