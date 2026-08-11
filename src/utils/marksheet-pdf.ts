import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export type MarksheetPdfRow = {
  subject: string
  marksObtained: string
  totalMarks: number
}

const sanitizeFilename = (value: string): string =>
  value.replace(/[^\w\-.() ]/g, '_').trim().replace(/^_+$/, '') || 'marksheet'

/**
 * Pure client-side export of one exam marksheet (already-fetched data only).
 * Renders the exam name as the document title, then the Subject / Marks
 * Obtained / Total Marks table. Filename: {rollNumber}_{examName}.pdf.
 */
export const downloadMarksheetPdf = (params: {
  examName: string
  rollNumber: string
  rows: MarksheetPdfRow[]
}): void => {
  const { examName, rollNumber, rows } = params

  const doc = new jsPDF()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(examName, 14, 20)

  autoTable(doc, {
    startY: 28,
    head: [['Subject', 'Marks Obtained', 'Total Marks']],
    body: rows.map((row) => [row.subject, row.marksObtained, String(row.totalMarks)]),
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [0, 32, 69], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [242, 244, 247] },
    margin: { left: 14, right: 14 },
  })

  doc.save(`${sanitizeFilename(rollNumber)}_${sanitizeFilename(examName)}.pdf`)
}
