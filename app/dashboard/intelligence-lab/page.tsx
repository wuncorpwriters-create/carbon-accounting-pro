import Link from "next/link";
import Card from "../../../components/Card";
import {
  type ReportRow,
  buildReportIntelligence,
  formatPeriodLabel,
} from "../../../lib/reportIntelligence";
import { formatNumber, formatCarbonExactKg } from "../../../lib/carbonFormat";

type Scenario = {
  slug: string;
  title: string;
  expectation: string;
  history: ReportRow[];
  current: ReportRow;
};

function makeRow(
  id: string,
  period_label: string,
  total: number,
  scope1: number,
  scope2: number,
  employees: number,
  electricity_kwh: number,
  fuel_liters: number
): ReportRow {
  return {
    id,
    period_label,
    reporting_period: period_label,
    employee_count: employees,
    electricity_kwh,
    fuel_liters,
    scope1_emissions: scope1,
    scope2_emissions: scope2,
    total_emissions: total,
  };
}

function formatKg(value: number | null | undefined) {
  return formatCarbonExactKg(value, 1);
}

const scenarios: Scenario[] = [
  {
    slug: "stable-improvement",
    title: "Stable history, likely real improvement",
    expectation:
      "Should read as stable recent pattern + likely real improvement + below normal.",
    history: [
      makeRow("a1", "Jan 2026", 1200, 500, 700, 20, 1400, 210),
      makeRow("a2", "Feb 2026", 1180, 490, 690, 20, 1380, 205),
      makeRow("a3", "Mar 2026", 1210, 505, 705, 20, 1410, 212),
      makeRow("a4", "Apr 2026", 1195, 500, 695, 20, 1395, 208),
    ],
    current: makeRow("a5", "May 2026", 1030, 430, 600, 20, 1210, 180),
  },
  {
    slug: "stable-spike",
    title: "Stable history, one clear deterioration spike",
    expectation:
      "Should read as stable recent pattern + likely real deterioration + above normal.",
    history: [
      makeRow("b1", "Jan 2026", 1200, 500, 700, 20, 1400, 210),
      makeRow("b2", "Feb 2026", 1185, 495, 690, 20, 1385, 206),
      makeRow("b3", "Mar 2026", 1215, 505, 710, 20, 1415, 212),
      makeRow("b4", "Apr 2026", 1190, 498, 692, 20, 1392, 207),
    ],
    current: makeRow("b5", "May 2026", 1480, 560, 920, 20, 1840, 228),
  },
  {
    slug: "volatile-history",
    title: "Volatile history, caution needed",
    expectation:
      "Should read as volatile recent pattern + interpret cautiously, even if current month is high.",
    history: [
      makeRow("c1", "Jan 2026", 900, 420, 480, 20, 900, 190),
      makeRow("c2", "Feb 2026", 1450, 650, 800, 20, 1650, 250),
      makeRow("c3", "Mar 2026", 980, 450, 530, 20, 980, 200),
      makeRow("c4", "Apr 2026", 1520, 700, 820, 20, 1700, 260),
    ],
    current: makeRow("c5", "May 2026", 1380, 630, 750, 20, 1600, 240),
  },
  {
    slug: "scale-up-better-intensity",
    title: "Higher total, better per-employee intensity",
    expectation:
      "Should hint at scale-driven increase / not pure efficiency deterioration.",
    history: [
      makeRow("d1", "Jan 2026", 1000, 420, 580, 15, 1100, 180),
      makeRow("d2", "Feb 2026", 1020, 430, 590, 15, 1120, 182),
      makeRow("d3", "Mar 2026", 1010, 425, 585, 15, 1110, 181),
      makeRow("d4", "Apr 2026", 1030, 435, 595, 15, 1130, 183),
    ],
    current: makeRow("d5", "May 2026", 1180, 480, 700, 20, 1320, 198),
  },
  {
    slug: "electricity-driven-deterioration",
    title: "Electricity-driven deterioration",
    expectation:
      "Should call out Scope 2 / electricity-driven increase clearly.",
    history: [
      makeRow("e1", "Jan 2026", 1100, 500, 600, 20, 1200, 210),
      makeRow("e2", "Feb 2026", 1120, 505, 615, 20, 1220, 212),
      makeRow("e3", "Mar 2026", 1110, 500, 610, 20, 1210, 210),
      makeRow("e4", "Apr 2026", 1130, 510, 620, 20, 1230, 213),
    ],
    current: makeRow("e5", "May 2026", 1360, 520, 840, 20, 1650, 214),
  },
  {
    slug: "fuel-driven-deterioration",
    title: "Fuel-driven deterioration",
    expectation:
      "Should call out Scope 1 / fuel-driven increase clearly.",
    history: [
      makeRow("f1", "Jan 2026", 1100, 580, 520, 20, 1050, 220),
      makeRow("f2", "Feb 2026", 1115, 590, 525, 20, 1060, 223),
      makeRow("f3", "Mar 2026", 1095, 575, 520, 20, 1045, 219),
      makeRow("f4", "Apr 2026", 1120, 592, 528, 20, 1065, 224),
    ],
    current: makeRow("f5", "May 2026", 1375, 830, 545, 20, 1080, 300),
  },
  {
    slug: "low-history-caution",
    title: "Low history, avoid overconfidence",
    expectation:
      "Should sound cautious because only one prior comparable month exists.",
    history: [
      makeRow("g1", "Apr 2026", 1200, 520, 680, 20, 1380, 215),
    ],
    current: makeRow("g2", "May 2026", 980, 430, 550, 20, 1180, 180),
  },
  {
    slug: "lower-total-worse-intensity",
    title: "Lower total, worse per-employee intensity",
    expectation:
      "Should avoid calling this a clean improvement because intensity worsened.",
    history: [
      makeRow("h1", "Jan 2026", 1000, 420, 580, 25, 1150, 185),
      makeRow("h2", "Feb 2026", 1015, 425, 590, 25, 1160, 188),
      makeRow("h3", "Mar 2026", 1005, 422, 583, 25, 1155, 186),
      makeRow("h4", "Apr 2026", 1020, 430, 590, 25, 1165, 189),
    ],
    current: makeRow("h5", "May 2026", 930, 395, 535, 18, 1085, 170),
  },
  {
    slug: "broad-based-increase",
    title: "Broad increase without one dominant source",
    expectation:
      "Should avoid over-focusing on one source if both Scope 1 and Scope 2 moved up together.",
    history: [
      makeRow("i1", "Jan 2026", 1200, 600, 600, 20, 1250, 230),
      makeRow("i2", "Feb 2026", 1210, 605, 605, 20, 1260, 232),
      makeRow("i3", "Mar 2026", 1195, 598, 597, 20, 1245, 229),
      makeRow("i4", "Apr 2026", 1215, 608, 607, 20, 1265, 233),
    ],
    current: makeRow("i5", "May 2026", 1420, 710, 710, 20, 1450, 272),
  },
  {
    slug: "volatile-but-improving",
    title: "Volatile history but current month improved",
    expectation:
      "Should acknowledge improvement but still sound cautious because history is unstable.",
    history: [
      makeRow("j1", "Jan 2026", 900, 380, 520, 20, 920, 175),
      makeRow("j2", "Feb 2026", 1500, 680, 820, 20, 1700, 255),
      makeRow("j3", "Mar 2026", 980, 430, 550, 20, 980, 190),
      makeRow("j4", "Apr 2026", 1480, 660, 820, 20, 1680, 250),
    ],
    current: makeRow("j5", "May 2026", 1040, 450, 590, 20, 1040, 195),
  },
  {
    slug: "near-normal-high-intensity",
    title: "Near normal total, still high intensity",
    expectation:
      "Should keep pressure on efficiency even if total emissions are near baseline.",
    history: [
      makeRow("k1", "Jan 2026", 1800, 850, 950, 12, 1800, 320),
      makeRow("k2", "Feb 2026", 1820, 860, 960, 12, 1815, 323),
      makeRow("k3", "Mar 2026", 1810, 855, 955, 12, 1808, 322),
      makeRow("k4", "Apr 2026", 1795, 848, 947, 12, 1798, 319),
    ],
    current: makeRow("k5", "May 2026", 1805, 852, 953, 12, 1806, 321),
  },
];

export default function IntelligenceLabPage() {
  return (
    <main className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Intelligence Lab (Internal)</h1>
          <p>Internal scenario testing for shared reporting intelligence.</p>
        </div>
        <div className="page-actions">
          <Link href="/dashboard" className="button button-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="workflow-strip">
        <span className="workflow-strip-label">Internal tool</span>
        <div className="workflow-strip-links">
          <span className="workflow-strip-link workflow-strip-link--current">
            Use this page to test shared reporting logic before changing production-facing summaries
          </span>
        </div>
      </div>

      <Card>
        <div className="section-header">
          <div>
            <h3>How to review each scenario</h3>
            <p className="chart-meta-label">
              Check whether Management read, Recent pattern, Normal vs unusual, Main watchout, Executive summary, and Recommended next actions match the expectation line.
            </p>
          </div>
        </div>
      </Card>

      <div className="dashboard-grid dashboard-grid--main">
        {scenarios.map((scenario) => {
          const previous = scenario.history[scenario.history.length - 1] ?? null;
          const intelligence = buildReportIntelligence(
            scenario.current,
            previous,
            scenario.history
          );

          return (
            <Card key={scenario.slug}>
              <div className="section-header">
                <div>
                  <h3>{scenario.title}</h3>
                  <p className="chart-meta-label">{scenario.expectation}</p>
                </div>
              </div>

              <div className="details-list" style={{ marginBottom: "16px" }}>
                <div className="details-row">
                  <span>Current month</span>
                  <strong>{formatPeriodLabel(scenario.current)}</strong>
                </div>
                <div className="details-row">
                  <span>Current total</span>
                  <strong>{formatKg(scenario.current.total_emissions)}</strong>
                </div>
                <div className="details-row">
                  <span>Previous month</span>
                  <strong>{formatPeriodLabel(previous)}</strong>
                </div>
                <div className="details-row">
                  <span>History count</span>
                  <strong>{scenario.history.length}</strong>
                </div>
              </div>

              <div className="insights-list">
                <div className="insight-item">
                  <strong>Management read</strong>
                  <p>{intelligence.managementSignal.label}</p>
                  <p>{intelligence.managementSignal.summary}</p>
                </div>

                <div className="insight-item">
                  <strong>Recent pattern</strong>
                  <p>{intelligence.consistencySignal.label}</p>
                  <p>{intelligence.consistencySignal.summary}</p>
                  <p>
                    CV:{" "}
                    {intelligence.consistencySignal.coefficientOfVariation == null
                      ? "—"
                      : `${formatNumber(
                          intelligence.consistencySignal.coefficientOfVariation,
                          1
                        )}%`}
                    {" · "}
                    Range:{" "}
                    {intelligence.consistencySignal.rangePercentage == null
                      ? "—"
                      : `${formatNumber(
                          intelligence.consistencySignal.rangePercentage,
                          1
                        )}%`}
                  </p>
                </div>

                <div className="insight-item">
                  <strong>Normal vs unusual</strong>
                  <p>{intelligence.anomalySignal.label}</p>
                  <p>{intelligence.anomalySignal.summary}</p>
                </div>

                <div className="insight-item">
                  <strong>Main watchout</strong>
                  <p>{intelligence.sourceWatchout.label}</p>
                  <p>{intelligence.sourceWatchout.summary}</p>
                </div>

                <div className="insight-item">
                  <strong>Executive summary</strong>
                  <p>{intelligence.executiveSummary}</p>
                </div>

                <div className="insight-item">
                  <strong>Recommended next actions</strong>
                  <ul className="recommendation-list">
                    {intelligence.recommendedActions.map((item, index) => (
                      <li key={`${scenario.slug}-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
