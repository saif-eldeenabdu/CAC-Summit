import type { Delegation, DelegationScores } from "@/store/types";
import { calcRankings } from "@/store/scoring";

// ─── CSV Export ──────────────────────────────────────────────────────
export function exportCSV(delegations: Record<string, Delegation>) {
  const rankings = calcRankings(delegations);
  const headers = [
    "Rank",
    "Delegation",
    "Total Score",
    "Speech Score",
    "POIs Asked Score",
    "POI Responses Score",
    "Directive Score",
    "Chair Discretion",
    "Leadership Score",
    "Total Speeches",
    "Total POIs",
    "Total Responses",
    "Total Directives",
    "Passed Directives",
    "Chair Notes",
  ];

  const rows = rankings.map((r) => {
    const d = delegations[r.name];
    return [
      r.rank,
      r.name,
      r.totalScore,
      r.speechScore,
      r.poiAskedScore,
      r.poiResponseScore,
      r.directiveScore,
      r.chairDiscretion,
      r.leadershipScore,
      d.speeches.length,
      d.poisAsked.length,
      d.poiResponses.length,
      d.directives.length,
      d.directives.filter((dir) => dir.status === "Passed").length,
      `"${d.chairNotes.replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  downloadFile(csv, "mun-scores.csv", "text/csv");
}

// ─── Excel Export ───────────────────────────────────────────────────
export async function exportExcel(delegations: Record<string, Delegation>) {
  const XLSX = await import("xlsx");
  const rankings = calcRankings(delegations);

  const data = rankings.map((r) => {
    const d = delegations[r.name];
    return {
      Rank: r.rank,
      Delegation: r.name,
      "Total Score": r.totalScore,
      "Speech Score": r.speechScore,
      "POIs Asked Score": r.poiAskedScore,
      "POI Responses Score": r.poiResponseScore,
      "Directive Score": r.directiveScore,
      "Chair Discretion": r.chairDiscretion,
      "Leadership Score": r.leadershipScore,
      "Total Speeches": d.speeches.length,
      "Total POIs": d.poisAsked.length,
      "Total Responses": d.poiResponses.length,
      "Total Directives": d.directives.length,
      "Passed Directives": d.directives.filter((dir) => dir.status === "Passed").length,
      "Chair Notes": d.chairNotes,
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Rankings");

  // Add speech detail sheet
  const speechData: Record<string, unknown>[] = [];
  Object.values(delegations).forEach((d) => {
    d.speeches.forEach((s) => {
      speechData.push({
        Delegation: d.name,
        Type: s.type,
        "Info/Research": s.informationResearch,
        Delivery: s.delivery,
        Creativity: s.creativity,
        Passion: s.passion,
        "Weighted Score": s.weightedScore,
        Time: new Date(s.timestamp).toLocaleString(),
        Notes: s.notes,
      });
    });
  });
  if (speechData.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(speechData), "Speeches");
  }

  // Add directive detail sheet
  const directiveData: Record<string, unknown>[] = [];
  Object.values(delegations).forEach((d) => {
    d.directives.forEach((dir) => {
      directiveData.push({
        Delegation: d.name,
        Title: dir.title,
        Topic: dir.topic,
        "Submission Type": dir.submissionType,
        "Research Quality": dir.researchQuality,
        Practicality: dir.practicality,
        Creativity: dir.creativity,
        "Diplomatic Value": dir.diplomaticValue,
        "Quality Score": dir.qualityScore,
        Status: dir.status,
        "Pass Bonus": dir.passBonus,
        Time: new Date(dir.timestamp).toLocaleString(),
        Notes: dir.notes,
      });
    });
  });
  if (directiveData.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(directiveData), "Directives");
  }

  XLSX.writeFile(wb, "mun-scores.xlsx");
}

// ─── PDF Export ─────────────────────────────────────────────────────
export async function exportPDF(delegations: Record<string, Delegation>) {
  const { default: jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF({ orientation: "landscape" });
  const rankings = calcRankings(delegations);

  // Title
  doc.setFontSize(18);
  doc.text("MUN Committee Rankings — CAC Summit II", 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

  // Rankings table
  autoTable(doc, {
    startY: 35,
    head: [["Rank", "Delegation", "Total", "Speeches", "POIs", "Responses", "Directives", "Discretion", "Leadership"]],
    body: rankings.map((r) => [
      r.rank,
      r.name,
      r.totalScore.toFixed(2),
      r.speechScore.toFixed(2),
      r.poiAskedScore,
      r.poiResponseScore,
      r.directiveScore.toFixed(2),
      r.chairDiscretion,
      r.leadershipScore,
    ]),
    theme: "grid",
    headStyles: { fillColor: [245, 158, 11] },
    styles: { fontSize: 9 },
  });

  doc.save("mun-scores.pdf");
}

// ─── Utility ────────────────────────────────────────────────────────
function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
