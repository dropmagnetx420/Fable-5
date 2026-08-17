import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency, monthLabel } from "./utils";
import type { SettlementLine } from "./types";

interface SettlementPdfInput {
  month: string;
  total_expense: number;
  total_meals: number;
  per_meal_cost: number;
  breakdown: SettlementLine[];
}

// Standard PDF (Helvetica) fonts are Latin-only, so the ৳ glyph won't render.
// Use an ASCII "Tk" prefix for money in the document instead.
const money = (n: number) => `Tk ${formatCurrency(n, false)}`;

/** Build and trigger download of a one-page monthly settlement report. */
export function generateSettlementPdf(s: SettlementPdfInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(20, 184, 166);
  doc.rect(0, 0, width, 92, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Sitol Chaya", 40, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(`Monthly Settlement - ${monthLabel(s.month)}`, 40, 68);

  // Summary lines
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  let y = 128;
  const rows: [string, string][] = [
    ["Total expense", money(s.total_expense)],
    ["Total meals", String(s.total_meals)],
    ["Per-meal cost", money(s.per_meal_cost)],
  ];
  for (const [k, v] of rows) {
    doc.setFont("helvetica", "normal");
    doc.text(k, 40, y);
    doc.setFont("helvetica", "bold");
    doc.text(v, 220, y);
    y += 20;
  }

  // Breakdown table
  let finalY = y + 12;
  autoTable(doc, {
    startY: y + 12,
    head: [["Member", "Meals", "Share", "Deposited", "Balance"]],
    body: s.breakdown.map((l) => [
      l.name,
      String(l.meals),
      money(l.share),
      money(l.paid),
      `${l.balance >= 0 ? "+" : "-"}${money(Math.abs(l.balance))}`,
    ]),
    theme: "striped",
    headStyles: { fillColor: [20, 184, 166], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 6 },
    didDrawPage: (data) => {
      if (data.cursor) finalY = data.cursor.y;
    },
  });

  // Footnote
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Positive balance = receives  ·  Negative balance = owes", 40, finalY + 28);
  doc.text(`Generated ${new Date().toLocaleString()}`, 40, finalY + 44);

  doc.save(`sitol-chaya-${s.month}.pdf`);
}
