export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { createClient } from "@supabase/supabase-js";
import { formatNumber } from "../../../../../lib/carbonFormat";
import {
  type ReportRow,
  formatDisplayDate,
  formatPeriodLabel,
  getElectricityMethodLabel,
  sortReportsChronologically,
  buildReportIntelligence,
  buildComparisonMetrics,
  getComparisonSummary,
} from "../../../../../lib/reportIntelligence";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PDF_CARBON_UNIT = "kg CO2e";

function formatPdfCarbonKg(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "Not recorded";
  return `${formatNumber(value, 0)} ${PDF_CARBON_UNIT}`;
}

function cleanPdfText(value: string | null | undefined) {
  if (!value) return "";
  return value.replace(/[\uFFFE\uFFFF\u0000-\u001F]/g, "").trim();
}

function formatPdfMetricDelta(
  value: number | null | undefined,
  unit?: string,
  digits = 1
) {
  if (value == null || Number.isNaN(value)) return "Not recorded";
  const absolute = Math.abs(value);
  const formatted = formatNumber(absolute, digits);
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatPdfComparisonLine(
  changeLabel: string,
  delta: number | null | undefined,
  unit?: string,
  digits = 1
) {
  if (changeLabel === "Not enough data") return changeLabel;
  return `${changeLabel} · ${formatPdfMetricDelta(delta, unit, digits)}`;
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

const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 10,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  brand: {
    fontSize: 10,
    color: "#166534",
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 8,
    color: "#475569",
    marginBottom: 1,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#111827",
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 7,
  },
  summaryLabel: {
    fontSize: 7.75,
    color: "#64748b",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 10.5,
    fontWeight: "bold",
    color: "#166534",
  },
  twoColumn: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  column: {
    flex: 1,
  },
  detailCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 7,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  rowLabel: {
    fontSize: 8,
    color: "#475569",
    paddingRight: 8,
  },
  rowValue: {
    fontSize: 7.9,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "right",
    maxWidth: "58%",
    lineHeight: 1.2,
  },
  insightBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 7,
    backgroundColor: "#f8fafc",
  },
  insightHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  insightText: {
    fontSize: 7.85,
    lineHeight: 1.32,
    color: "#334155",
  },
  executiveLeadBox: {
    borderWidth: 1,
    borderColor: "#dbe4ea",
    borderRadius: 6,
    padding: 7,
    backgroundColor: "#f8fbfd",
    marginBottom: 7,
  },
  executiveGrid: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "stretch",
  },
  executiveMiniBox: {
    flexGrow: 1,
    flexBasis: "48%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 7,
    backgroundColor: "#ffffff",
    marginBottom: 7,
  },
  calloutBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 7,
    backgroundColor: "#f8fafc",
    marginBottom: 7,
  },
  calloutTitle: {
    fontSize: 8.25,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  bulletList: {
    marginTop: 4,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 5,
  },
  bulletDot: {
    width: 8,
    fontSize: 8.1,
    color: "#334155",
  },
  bulletText: {
    flex: 1,
    fontSize: 8.1,
    lineHeight: 1.28,
    color: "#334155",
  },
  noteBox: {
    borderWidth: 1,
    borderColor: "#dbeafe",
    borderRadius: 6,
    padding: 7,
    backgroundColor: "#eff6ff",
    marginTop: 7,
  },
  noteTitle: {
    fontSize: 8.25,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },
  footer: {
    position: "absolute",
    bottom: 12,
    left: 28,
    right: 28,
    textAlign: "center",
    fontSize: 7.25,
    color: "#94a3b8",
  },
});

function ReportPDF({
  report,
  activeComparisonReport,
  comparisonHistory,
}: {
  report: ReportRow;
  activeComparisonReport: ReportRow | null;
  comparisonHistory: ReportRow[];
}) {
  const reportingPeriod = formatPeriodLabel(report);
  const activeComparisonLabel = formatPeriodLabel(activeComparisonReport);

  const totalEmissions = formatPdfCarbonKg(report.total_emissions);
  const scope1 = formatPdfCarbonKg(report.scope1_emissions);
  const scope2 = formatPdfCarbonKg(report.scope2_emissions);
  const electricity =
    report.electricity_kwh == null ? "Not recorded" : formatNumber(report.electricity_kwh);
  const fuel =
    report.fuel_liters == null ? "Not recorded" : formatNumber(report.fuel_liters);
  const employees =
    report.employee_count !== null && report.employee_count !== undefined
      ? String(report.employee_count)
      : "N/A";

  const intelligence = buildReportIntelligence(
    report,
    activeComparisonReport,
    comparisonHistory
  );

  const comparisonMetrics = buildComparisonMetrics(report, activeComparisonReport);
  const comparisonSummary = getComparisonSummary(report, activeComparisonReport);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} wrap={false}>
          <Text style={styles.brand}>Carbon Accounting Pro</Text>
          <Text style={styles.title}>Emissions Report</Text>
          <Text style={styles.subtitle}>Reporting Month: {reportingPeriod}</Text>
          <Text style={styles.subtitle}>
            Created: {formatDisplayDate(report.created_at)}
          </Text>
          <Text style={styles.subtitle}>
            Company: {report.company_name?.trim() || "Not recorded"}
          </Text>
        </View>

        <View style={styles.summaryGrid} wrap={false}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Emissions</Text>
            <Text style={styles.summaryValue}>{totalEmissions}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Scope 1</Text>
            <Text style={styles.summaryValue}>{scope1}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Scope 2</Text>
            <Text style={styles.summaryValue}>{scope2}</Text>
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Assessment Details</Text>

            <View style={styles.detailCard}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Company</Text>
                <Text style={styles.rowValue}>
                  {report.company_name?.trim() || "Not recorded"}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Country</Text>
                <Text style={styles.rowValue}>
                  {formatCountryDisplay(report.country)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Industry</Text>
                <Text style={styles.rowValue}>
                  {formatIndustryDisplay(report.industry)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Reporting Month</Text>
                <Text style={styles.rowValue}>{reportingPeriod}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Electricity Usage</Text>
                <Text style={styles.rowValue}>{electricity} kWh</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Fuel Usage</Text>
                <Text style={styles.rowValue}>{fuel} liters</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Employee Count</Text>
                <Text style={styles.rowValue}>{employees}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Total Emissions</Text>
                <Text style={styles.rowValue}>{totalEmissions}</Text>
              </View>

              {intelligence.perEmployee != null ? (
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Emissions per Employee</Text>
                  <Text style={styles.rowValue}>
                    {formatNumber(intelligence.perEmployee, 1)} {PDF_CARBON_UNIT}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Methodology Basis</Text>

            <View style={styles.detailCard}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Electricity Method</Text>
                <Text style={styles.rowValue}>
                  {getElectricityMethodLabel(report.electricity_method)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Electricity Factor</Text>
                <Text style={styles.rowValue}>
                  {report.electricity_factor == null
                    ? "Not recorded"
                    : `${formatNumber(report.electricity_factor, 2)} ${PDF_CARBON_UNIT} / kWh`}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Fuel Type</Text>
                <Text style={styles.rowValue}>
                  {formatIndustryDisplay(report.fuel_type)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Fuel Factor</Text>
                <Text style={styles.rowValue}>
                  {report.fuel_factor == null
                    ? "Not recorded"
                    : `${formatNumber(report.fuel_factor, 2)} ${PDF_CARBON_UNIT} / liter`}
                </Text>
              </View>
            </View>

            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>Important note</Text>
              <Text style={styles.insightText}>
                This report should be interpreted using the recorded electricity
                and fuel factors shown above. Factors can differ by grid,
                supplier, fuel type, and reporting method.
              </Text>
            </View>
          </View>
        </View>

        {comparisonMetrics && comparisonSummary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comparison Snapshot</Text>

            <View style={styles.calloutBox}>
              <Text style={styles.calloutTitle}>{comparisonSummary.title}</Text>
              <Text style={styles.insightText}>{comparisonSummary.summary}</Text>
              <Text style={styles.insightText}>{comparisonSummary.action}</Text>
            </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority Actions</Text>

          {intelligence.priorityActions?.length ? (
            intelligence.priorityActions.map((action, index) => (
              <View key={`${action.title}-${index}`} style={{ marginBottom: 8 }}>
                <Text style={styles.calloutTitle}>{action.title}</Text>
                <Text style={styles.insightText}>{action.summary}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.insightText}>No priority actions yet.</Text>
          )}

          {intelligence.biggestOpportunity ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.calloutTitle}>Biggest Opportunity</Text>
              <Text style={styles.insightText}>{cleanPdfText(intelligence.biggestOpportunity)}</Text>
            </View>
          ) : null}

          {intelligence.nextBestStep ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.calloutTitle}>Next Best Step</Text>
              <Text style={styles.insightText}>{cleanPdfText(intelligence.nextBestStep)}</Text>
            </View>
          ) : null}
        </View>


            <View style={styles.calloutBox}>
              <Text style={styles.calloutTitle}>
                Normal vs unusual · {intelligence.anomalySignal.label}
              </Text>
              <Text style={styles.insightText}>
                {cleanPdfText(intelligence.anomalySignal.summary)}
              </Text>
              <Text style={styles.insightText}>
                {intelligence.anomalySignal.action}
              </Text>
            </View>

            <View style={styles.calloutBox}>
              <Text style={styles.calloutTitle}>
                Main watchout · {intelligence.sourceWatchout.label}
              </Text>
              <Text style={styles.insightText}>
                {cleanPdfText(intelligence.sourceWatchout.summary)}
              </Text>
              <Text style={styles.insightText}>
                {intelligence.sourceWatchout.action}
              </Text>
            </View>


          </View>
        ) : null}

        {comparisonMetrics ? (
          <View style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>Comparison Metrics</Text>

            <View style={styles.detailCard}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Total emissions</Text>
                <Text style={styles.rowValue}>
                  {formatPdfComparisonLine(
                    comparisonMetrics.totalEmissions.changeLabel,
                    comparisonMetrics.totalEmissions.delta,
                    PDF_CARBON_UNIT,
                    1
                  )}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Scope 1</Text>
                <Text style={styles.rowValue}>
                  {formatPdfComparisonLine(
                    comparisonMetrics.scope1.changeLabel,
                    comparisonMetrics.scope1.delta,
                    PDF_CARBON_UNIT,
                    1
                  )}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Scope 2</Text>
                <Text style={styles.rowValue}>
                  {formatPdfComparisonLine(
                    comparisonMetrics.scope2.changeLabel,
                    comparisonMetrics.scope2.delta,
                    PDF_CARBON_UNIT,
                    1
                  )}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Emissions per Employee</Text>
                <Text style={styles.rowValue}>
                  {formatPdfComparisonLine(
                    comparisonMetrics.emissionsPerEmployee.changeLabel,
                    comparisonMetrics.emissionsPerEmployee.delta,
                    `${PDF_CARBON_UNIT} / employee`,
                    1
                  )}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Electricity Usage</Text>
                <Text style={styles.rowValue}>
                  {formatPdfComparisonLine(
                    comparisonMetrics.electricity.changeLabel,
                    comparisonMetrics.electricity.delta,
                    "kWh",
                    1
                  )}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Fuel Usage</Text>
                <Text style={styles.rowValue}>
                  {formatPdfComparisonLine(
                    comparisonMetrics.fuel.changeLabel,
                    comparisonMetrics.fuel.delta,
                    "liters",
                    1
                  )}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Summary</Text>

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <View style={styles.executiveLeadBox}>
                <Text style={styles.insightHeading}>Executive summary</Text>
                <Text style={styles.insightText}>
                  {cleanPdfText(intelligence.executiveSummary)}
                </Text>
              </View>

              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>
                  Benchmark
                  {intelligence.intensityBand
                    ? ` · ${intelligence.intensityBand.label}`
                    : ""}
                </Text>
                <Text style={styles.insightText}>
                  {cleanPdfText(intelligence.benchmarkSummary)}
                </Text>
              </View>

              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>
                  Trend · {intelligence.trend.label}
                </Text>
                <Text style={styles.insightText}>
                  {cleanPdfText(intelligence.trend.summary)}
                </Text>
              </View>

              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>
                  Normal vs unusual · {intelligence.anomalySignal.label}
                </Text>
                <Text style={styles.insightText}>
                  {cleanPdfText(intelligence.anomalySignal.summary)}
                </Text>
              </View>

              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>
                  Main watchout · {intelligence.sourceWatchout.label}
                </Text>
                <Text style={styles.insightText}>
                  {cleanPdfText(intelligence.sourceWatchout.summary)}
                </Text>
              </View>

              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>
                  Management read · {intelligence.managementSignal.label}
                </Text>
                <Text style={styles.insightText}>
                  {cleanPdfText(intelligence.managementSignal.summary)}
                </Text>
              </View>

              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>
                  Recent position · {intelligence.recentPositionSignal.label}
                </Text>
                <Text style={styles.insightText}>
                  {cleanPdfText(intelligence.recentPositionSignal.summary)}
                </Text>
              </View>
            </View>

            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Recommended Actions</Text>

              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>Next best move</Text>
                <Text style={styles.insightText}>
                  {intelligence.nextBestStep ||
                    intelligence.recommendedActions[0] ||
                    intelligence.dominantSource.action}
                </Text>
              </View>

              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>Biggest opportunity</Text>
                <Text style={styles.insightText}>
                  {cleanPdfText(intelligence.biggestOpportunity)}
                </Text>
              </View>

              <View style={styles.calloutBox}>
                <Text style={styles.calloutTitle}>Priority actions</Text>
                <View style={styles.bulletList}>
                  {(intelligence.priorityActions?.length
                    ? intelligence.priorityActions.map((item) => item.title)
                    : intelligence.recommendedActions.slice(0, 3)
                  ).map((item, index) => (
                    <View key={`pdf-priority-${index}`} style={styles.bulletItem}>
                      <Text style={styles.bulletDot}>•</Text>
                      <Text style={styles.bulletText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {activeComparisonReport ? (
                <View style={styles.calloutBox}>
                  <Text style={styles.calloutTitle}>Comparison month</Text>
                  <Text style={styles.insightText}>
                    This report is being compared against {activeComparisonLabel}.
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Generated by Carbon Accounting Pro · Page ${pageNumber} of ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const compareId = new URL(request.url).searchParams.get("compareId");

    const [reportResponse, comparisonResponse] = await Promise.all([
      supabase.from("report_results").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("report_results")
        .select(
          "id, created_at, period_label, reporting_period, employee_count, electricity_kwh, fuel_liters, scope1_emissions, scope2_emissions, total_emissions, company_name, country, industry, electricity_method, electricity_factor, fuel_type, fuel_factor"
        )
        .order("id", { ascending: false })
        .limit(36),
    ]);

    const report = reportResponse.data as ReportRow | null;

    if (reportResponse.error || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (comparisonResponse.error) {
      console.error("Comparison fetch error:", comparisonResponse.error);
      return NextResponse.json(
        { error: "Failed to load comparison context" },
        { status: 500 }
      );
    }

    const comparisonReports = (comparisonResponse.data as ReportRow[]) || [];
    const orderedReports = sortReportsChronologically(comparisonReports);

    const currentIndex = orderedReports.findIndex((item) => item.id === report.id);
    const previousComparableReport =
      currentIndex > 0 ? orderedReports[currentIndex - 1] : null;

    const activeComparisonReport =
      compareId && compareId !== report.id
        ? orderedReports.find((item) => item.id === compareId) ??
          previousComparableReport
        : previousComparableReport;

    const comparisonHistory =
      currentIndex > 0
        ? orderedReports
            .slice(Math.max(0, currentIndex - 6), currentIndex)
            .filter((item) => item.total_emissions != null)
        : [];

    const doc = (
      <ReportPDF
        report={report}
        activeComparisonReport={activeComparisonReport}
        comparisonHistory={comparisonHistory}
      />
    );

    const pdfBuffer = await pdf(doc).toBuffer();

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="carbon-report-${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}