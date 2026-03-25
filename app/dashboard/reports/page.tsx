"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createSupabaseClient } from "../../../lib/supabaseClient";
import Card from "../../../components/Card";
import { formatCarbonExactKg } from "../../../lib/carbonFormat";
import {
  formatDisplayDate,
  formatPeriodLabel,
  getElectricityMethodLabel,
  parseReportingDateStrict,
  sortReportsChronologically,
  type ReportRow,
} from "../../../lib/reportIntelligence";

function formatKg(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return formatCarbonExactKg(value);
}

function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCountryDisplay(country?: string | null) {
  const raw = country?.trim();
  if (!raw) return "Not recorded";

  const normalized = raw.toLowerCase();
  const countryMap: Record<string, string> = {
    usa: "USA",
    us: "US",
    uk: "UK",
    uae: "UAE",
    drc: "DRC",
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

function getSelectedYearLabel(selectedYear: string) {
  return selectedYear === "all" ? "All years" : selectedYear;
}

function getPeriodYear(report: ReportRow) {
  const parsed = parseReportingDateStrict(report);
  if (!parsed) return null;
  return parsed.getFullYear();
}

function getSignalToneClass(tone: "positive" | "negative" | "neutral") {
  if (tone === "positive") return "signal-chip signal-chip--positive";
  if (tone === "negative") return "signal-chip signal-chip--negative";
  return "signal-chip signal-chip--neutral";
}

export default function ReportsPage() {
  const [deletedFromDetail, setDeletedFromDetail] = useState(false);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [reportToDelete, setReportToDelete] = useState<ReportRow | null>(null);

  const shouldShowDeletedFromDetail = useMemo(
    () => deletedFromDetail && !successMessage,
    [deletedFromDetail, successMessage]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDeletedFromDetail(params.get("deleted") === "1");
  }, []);

  useEffect(() => {
    async function loadReports() {
      const supabase = createSupabaseClient();

      const { data, error } = await supabase
        .from("report_results")
        .select(
          "id, period_label, reporting_period, total_emissions, created_at, company_name, country, industry, electricity_method, fuel_type"
        )
        .order("id", { ascending: false });

      if (error) {
        console.error("Error loading reports:", error);
        setErrorMessage("Failed to load reports.");
      } else {
        const sortedReports = sortReportsChronologically(
          ((data as ReportRow[]) || []).map((report) => ({
            ...report,
            employee_count: null,
            electricity_kwh: null,
            electricity_factor: null,
            fuel_liters: null,
            fuel_factor: null,
            scope1_emissions: null,
            scope2_emissions: null,
          }))
        ).reverse();

        setReports(sortedReports);
      }

      setLoading(false);
    }

    loadReports();
  }, []);

  useEffect(() => {
    if (deletedFromDetail) {
      setSuccessMessage("Report deleted successfully.");

      const timer = window.setTimeout(() => {
        setSuccessMessage("");
        window.history.replaceState({}, "", "/dashboard/reports");
      }, 3000);

      return () => window.clearTimeout(timer);
    }
  }, [deletedFromDetail]);

  useEffect(() => {
    if (!successMessage || deletedFromDetail) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [successMessage, deletedFromDetail]);

  useEffect(() => {
    if (!errorMessage) return;

    const timer = window.setTimeout(() => {
      setErrorMessage("");
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [errorMessage]);

  const availableYears = useMemo(() => {
    return Array.from(
      new Set(
        reports
          .map((report) => getPeriodYear(report))
          .filter((year): year is number => year != null)
      )
    ).sort((a, b) => b - a);
  }, [reports]);

  useEffect(() => {
    if (availableYears.length === 0) {
      if (selectedYear !== "all") {
        setSelectedYear("all");
      }
      return;
    }

    const latestYear = String(availableYears[0]);

    if (!selectedYear) {
      setSelectedYear(latestYear);
      return;
    }

    if (
      selectedYear !== "all" &&
      !availableYears.some((year) => String(year) === selectedYear)
    ) {
      setSelectedYear(latestYear);
    }
  }, [availableYears, selectedYear]);

  const filteredReports = useMemo(() => {
    if (selectedYear === "all") return reports;

    return reports.filter(
      (report) => String(getPeriodYear(report)) === selectedYear
    );
  }, [reports, selectedYear]);

  const selectedYearSummary = useMemo(() => {
    const reportsWithTotals = filteredReports.filter(
      (report) => report.total_emissions != null
    );

    if (!reportsWithTotals.length) {
      return {
        count: 0,
        total: null as number | null,
        average: null as number | null,
        best: null as ReportRow | null,
        worst: null as ReportRow | null,
      };
    }

    const total = reportsWithTotals.reduce(
      (sum, report) => sum + (report.total_emissions ?? 0),
      0
    );

    let best = reportsWithTotals[0];
    let worst = reportsWithTotals[0];

    reportsWithTotals.forEach((report) => {
      const current = report.total_emissions ?? 0;
      const bestValue = best.total_emissions ?? 0;
      const worstValue = worst.total_emissions ?? 0;

      if (current < bestValue) best = report;
      if (current > worstValue) worst = report;
    });

    return {
      count: reportsWithTotals.length,
      total,
      average: total / reportsWithTotals.length,
      best,
      worst,
    };
  }, [filteredReports]);

  const comparisonByReportId = useMemo(() => {
    const chronological = [...filteredReports].reverse();
    const map = new Map<
      string,
      {
        label: string;
        tone: "positive" | "negative" | "neutral";
      }
    >();

    chronological.forEach((report, index) => {
      const previous = index > 0 ? chronological[index - 1] : null;
      const currentTotal = report.total_emissions ?? null;
      const previousTotal = previous?.total_emissions ?? null;
      const previousLabel = previous ? formatPeriodLabel(previous) : "previous month";

      if (currentTotal == null || previousTotal == null) {
        map.set(report.id, {
          label: "Need previous month",
          tone: "neutral",
        });
        return;
      }

      const delta = currentTotal - previousTotal;
      const percent = previousTotal > 0 ? (delta / previousTotal) * 100 : null;

      if (delta < 0) {
        map.set(report.id, {
          label:
            percent == null
              ? `Down vs ${previousLabel}`
              : `Down vs ${previousLabel} · ${Math.abs(percent).toFixed(1)}%`,
          tone: "positive",
        });
        return;
      }

      if (delta > 0) {
        map.set(report.id, {
          label:
            percent == null
              ? `Up vs ${previousLabel}`
              : `Up vs ${previousLabel} · ${percent.toFixed(1)}%`,
          tone: "negative",
        });
        return;
      }

      map.set(report.id, {
        label: `Flat vs ${previousLabel}`,
        tone: "neutral",
      });
    });

    return map;
  }, [filteredReports]);

  async function confirmDelete() {
    if (!reportToDelete) return;

    const label = formatPeriodLabel(reportToDelete);
    setDeletingId(reportToDelete.id);

    try {
      const response = await fetch(`/api/reports/${reportToDelete.id}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to delete report.");
      }

      setReports((current) =>
        current.filter((item) => item.id !== reportToDelete.id)
      );
      setSuccessMessage(`"${label}" deleted successfully.`);
    } catch (error) {
      console.error("Error deleting report:", error);
      setErrorMessage("Failed to delete report. Please try again.");
    } finally {
      setDeletingId(null);
      setReportToDelete(null);
    }
  }

  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>
            Review completed carbon reports, open details, download PDFs, or
            remove test entries.
          </p>
        </div>

        <Link href="/dashboard/assessment" className="dashboard-btn-primary">
          New Assessment
        </Link>
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
          <Link
            href="/dashboard/monthly-tracker"
            className="workflow-strip-link"
          >
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

      {(successMessage || shouldShowDeletedFromDetail) && (
        <div className="status-banner status-banner-success">
          {successMessage || "Report deleted successfully."}
        </div>
      )}

      {errorMessage && (
        <div className="status-banner status-banner-error">{errorMessage}</div>
      )}

      {!loading && reports.length > 0 && (
        <Card>
          <div className="section-header">
            <div>
              <h3>Report Filters</h3>
              <p className="chart-meta-label">
                Focus reports on a single year or review all available reporting
                months.
              </p>
            </div>
          </div>

          <div className="details-list">
            <div className="details-row">
              <span>Year View</span>
              <strong>
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  className="assessment-input"
                  style={{ minWidth: "160px" }}
                >
                  <option value="all">All years</option>
                  {availableYears.map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
              </strong>
            </div>
          </div>
        </Card>
      )}

      {loading && (
        <Card title="Loading">
          <p className="dashboard-insight-text">Loading reports...</p>
        </Card>
      )}

      {!loading && reports.length === 0 && (
        <>
          <section className="dashboard-onboarding-hero reports-onboarding-hero">
            <div className="dashboard-onboarding-copy">
              <p className="dashboard-onboarding-eyebrow">Reports</p>
              <h2>Your first assessment creates your first carbon report.</h2>
              <p className="dashboard-onboarding-lead">
                This page becomes your report library. Each completed assessment
                creates a detailed report you can open, review, and export as a
                PDF for internal tracking or stakeholder sharing.
              </p>

              <div className="dashboard-onboarding-actions">
                <Link
                  href="/dashboard/assessment"
                  className="dashboard-btn-primary"
                >
                  Start New Assessment
                </Link>
                <Link
                  href="/dashboard"
                  className="dashboard-btn-secondary"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>

            <div className="dashboard-onboarding-checklist">
              <div className="dashboard-onboarding-checklist-card">
                <strong>What appears here</strong>
                <ul className="recommendation-list recommendation-list--compact">
                  <li>One card per completed reporting month</li>
                  <li>Quick access to report detail pages</li>
                  <li>PDF download for each report</li>
                  <li>Year filtering once you build history</li>
                </ul>
              </div>

              <div className="dashboard-onboarding-checklist-card">
                <strong>Why it matters</strong>
                <ul className="recommendation-list recommendation-list--compact">
                  <li>Keep a clean archive of monthly reports</li>
                  <li>Review performance summaries over time</li>
                  <li>Spot better and worse reporting months</li>
                  <li>Support future ESG reporting workflows</li>
                </ul>
              </div>
            </div>
          </section>

          <div className="dashboard-grid dashboard-grid--main">
            <Card>
              <div className="section-header">
                <div>
                  <h3>What your first report includes</h3>
                  <p className="chart-meta-label">
                    The first completed assessment already produces a usable report.
                  </p>
                </div>
              </div>

              <div className="insights-list">
                <div className="insight-item">
                  <strong>Emissions summary</strong>
                  <p>
                    Total emissions, Scope 1, Scope 2, and input details from
                    your selected reporting month.
                  </p>
                </div>

                <div className="insight-item">
                  <strong>Methodology basis</strong>
                  <p>
                    Electricity and fuel assumptions are shown so the report can
                    be interpreted consistently.
                  </p>
                </div>

                <div className="insight-item">
                  <strong>Performance summary</strong>
                  <p>
                    Benchmarking, dominant source, and baseline-oriented
                    commentary become visible in the report layout.
                  </p>
                </div>

                <div className="insight-item">
                  <strong>Recommended actions</strong>
                  <p>
                    The report surfaces next steps based on the emissions mix
                    and current reporting context.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="section-header">
                <div>
                  <h3>What improves after more months</h3>
                  <p className="chart-meta-label">
                    Repeated reporting makes this page more useful.
                  </p>
                </div>
              </div>

              <div className="insights-list">
                <div className="insight-item">
                  <strong>Comparison cues</strong>
                  <p>
                    Report cards begin showing whether a month is up, down, or
                    flat against the previous reporting month.
                  </p>
                </div>

                <div className="insight-item">
                  <strong>Year filtering</strong>
                  <p>
                    Once you build history, you can focus on one reporting year
                    or review all years together.
                  </p>
                </div>

                <div className="insight-item">
                  <strong>Better archive value</strong>
                  <p>
                    A growing report library makes it easier to revisit past
                    months and support ongoing reporting discipline.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="section-header">
              <div>
                <h3>How to get value from this page</h3>
                <p className="chart-meta-label">
                  Use reports as your monthly reporting record.
                </p>
              </div>
            </div>

            <div className="dashboard-onboarding-benefits">
              <div className="dashboard-onboarding-benefit">
                <strong>Open report detail</strong>
                <p>
                  Review the full breakdown for a single month, including
                  summary commentary and recommendations.
                </p>
              </div>

              <div className="dashboard-onboarding-benefit">
                <strong>Download PDF</strong>
                <p>
                  Export a cleaner report format for sharing, archiving, or
                  internal documentation.
                </p>
              </div>

              <div className="dashboard-onboarding-benefit">
                <strong>Build month by month</strong>
                <p>
                  Each new assessment strengthens the value of your report
                  library and later comparisons.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      {!loading && reports.length > 0 && filteredReports.length === 0 && (
        <Card title="No Reports in View">
          <p className="dashboard-insight-text">
            No reports match the selected year.
          </p>
        </Card>
      )}

      {!loading && filteredReports.length > 0 && (
        <>
          <div className="filter-status-bar">
            <span className="filter-status-label">Year view</span>
            <span className="filter-status-chip">
              {getSelectedYearLabel(selectedYear)}
            </span>
          </div>

          <div className="year-summary-bar">
            <div className="year-summary-bar-header">
              <div>
                <p className="year-summary-bar-eyebrow">Selected year summary</p>
                <h2>{getSelectedYearLabel(selectedYear)}</h2>
              </div>
              <p className="chart-meta-label">
                Snapshot based on the reports currently in view.
              </p>
            </div>

            <div className="year-summary-bar-grid">
              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Reports in View</span>
                <strong>{selectedYearSummary.count}</strong>
              </div>

              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Total Emissions</span>
                <strong>
                  {formatCarbonExactKg(selectedYearSummary.total, 2)}
                </strong>
              </div>

              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Average / Report</span>
                <strong>
                  {formatCarbonExactKg(selectedYearSummary.average, 2)}
                </strong>
              </div>

              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Lowest Month</span>
                <strong>
                  {selectedYearSummary.best
                    ? formatPeriodLabel(selectedYearSummary.best)
                    : "—"}
                </strong>
              </div>

              <div className="year-summary-bar-card">
                <span className="year-summary-bar-label">Highest Month</span>
                <strong>
                  {selectedYearSummary.worst
                    ? formatPeriodLabel(selectedYearSummary.worst)
                    : "—"}
                </strong>
              </div>
            </div>
          </div>

          <div className="reports-list">
            {filteredReports.map((report, index) => {
              const period = formatPeriodLabel(report);
              const createdDate = formatDisplayDate(report.created_at);
              const isDeleting = deletingId === report.id;
              const isLatestReport = index === 0;
              const comparisonCue = comparisonByReportId.get(report.id);

              return (
                <div
                  key={report.id}
                  className={isLatestReport ? "report-card-latest-wrap" : ""}
                >
                  {isLatestReport ? (
                    <div className="report-card-latest-label">Latest</div>
                  ) : null}
                  <Card title={period}>
                    <div className="report-row-meta">
                      <div className="report-total-block">
                        <p className="dashboard-insight-text">
                          Total Emissions:{" "}
                          <strong>{formatKg(report.total_emissions)}</strong>
                        </p>
                        {comparisonCue ? (
                          <span className={getSignalToneClass(comparisonCue.tone)}>
                            {comparisonCue.label}
                          </span>
                        ) : null}
                      </div>

                      <p className="dashboard-insight-text">
                        Created: {createdDate}
                      </p>

                      <p className="dashboard-insight-text">
                        Company:{" "}
                        <strong>
                          {formatCompanyDisplay(report.company_name)}
                        </strong>
                      </p>

                      <p className="dashboard-insight-text">
                        Country / Industry:{" "}
                        <strong>
                          {formatCountryDisplay(report.country)} /{" "}
                          {formatIndustryDisplay(report.industry)}
                        </strong>
                      </p>

                      <p className="dashboard-insight-text">
                        Method / Fuel:{" "}
                        <strong>
                          {getElectricityMethodLabel(report.electricity_method)}{" "}
                          / {formatIndustryDisplay(report.fuel_type)}
                        </strong>
                      </p>
                    </div>

                    <div className="report-card-actions reports-actions-spacer">
                      <Link
                        href={`/dashboard/reports/${report.id}`}
                        className="dashboard-btn-secondary report-card-action"
                      >
                        View Report
                      </Link>
                      <Link
                        href={`/dashboard/assessment?edit=${report.id}`}
                        className="dashboard-btn-secondary report-card-action"
                      >
                        Edit
                      </Link>

                      <a
                        href={`/api/reports/${report.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="dashboard-btn-secondary report-card-action"
                      >
                        Download PDF
                      </a>

                      <button
                        type="button"
                        onClick={() => setReportToDelete(report)}
                        disabled={isDeleting}
                        className="dashboard-btn-danger-outline report-card-action"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </>
      )}

      {reportToDelete && (
        <div
          className="app-modal-overlay"
          onClick={() => deletingId == null && setReportToDelete(null)}
        >
          <div className="app-modal" onClick={(event) => event.stopPropagation()}>
            <h3>Delete Report</h3>
            <p>
              Delete report <strong>"{formatPeriodLabel(reportToDelete)}"</strong>?
            </p>
            <p className="app-modal-note">This action cannot be undone.</p>

            <div className="app-modal-actions">
              <button
                type="button"
                className="dashboard-btn-secondary"
                onClick={() => setReportToDelete(null)}
                disabled={deletingId === reportToDelete.id}
              >
                Cancel
              </button>

              <button
                type="button"
                className="dashboard-btn-danger-solid"
                onClick={confirmDelete}
                disabled={deletingId === reportToDelete.id}
              >
                {deletingId === reportToDelete.id
                  ? "Deleting..."
                  : "Delete Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}