import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import type { PortfolioAnalytics } from './dashboardData.server'
import { CHECK_INFO } from './checkInfo'
import type { CheckStatus } from './checks'

const PAGE_SIZE: [number, number] = [612, 792] // US Letter, points
const MARGIN = 56
const CONTENT_WIDTH = PAGE_SIZE[0] - MARGIN * 2
const DARK = rgb(0.06, 0.09, 0.16)
const MUTED = rgb(0.39, 0.45, 0.55)
const LINE = rgb(0.89, 0.91, 0.94)
const DANGER = rgb(0.73, 0.11, 0.11)
const WARNING = rgb(0.71, 0.28, 0.04)
const SUCCESS = rgb(0.08, 0.5, 0.24)

const SEVERITY_LABEL: Record<CheckStatus, string> = {
  red: 'NEEDS ATTENTION',
  yellow: 'TO REVIEW',
  unknown: 'UNKNOWN',
  green: 'GOOD',
}

const SEVERITY_COLOR: Record<CheckStatus, ReturnType<typeof rgb>> = {
  red: DANGER,
  yellow: WARNING,
  unknown: MUTED,
  green: SUCCESS,
}

// A plain, readable PDF — no attempt to mirror the HTML email pixel for
// pixel. pdf-lib is pure JS (no headless browser / native binary), so this
// stays cheap to run on Vercel's serverless functions.
export async function generateReportPdf(
  analytics: PortfolioAnalytics,
  accountEmail: string,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold)

  let page: PDFPage = doc.addPage(PAGE_SIZE)
  let y = PAGE_SIZE[1] - MARGIN

  function ensureSpace(needed: number) {
    if (y - needed < MARGIN) {
      page = doc.addPage(PAGE_SIZE)
      y = PAGE_SIZE[1] - MARGIN
    }
  }

  function text(value: string, x: number, size: number, useFont: PDFFont, color = DARK) {
    page.drawText(value, { x, y, size, font: useFont, color })
  }

  // Greedy word-wrap using the font's own metrics, since pdf-lib doesn't
  // wrap text for you.
  function wrap(value: string, useFont: PDFFont, size: number, maxWidth: number): string[] {
    const words = value.split(/\s+/)
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      const attempt = current ? `${current} ${word}` : word
      if (current && useFont.widthOfTextAtSize(attempt, size) > maxWidth) {
        lines.push(current)
        current = word
      } else {
        current = attempt
      }
    }
    if (current) lines.push(current)
    return lines
  }

  text('GuardScore Report', MARGIN, 20, boldFont)
  y -= 22
  text(`Generated ${new Date().toLocaleDateString()} for ${accountEmail}`, MARGIN, 10, font, MUTED)
  y -= 32

  const avgScore = analytics.domainScores.length
    ? Math.round(
        analytics.domainScores.reduce((sum, d) => sum + d.score, 0) / analytics.domainScores.length,
      )
    : 0

  text(`Portfolio average score: ${avgScore}/100`, MARGIN, 13, boldFont)
  y -= 18
  text(
    `Needs attention: ${analytics.severity.attention}    To review: ${analytics.severity.review}    Good: ${analytics.severity.good}    Unknown: ${analytics.severity.unknown}`,
    MARGIN,
    10,
    font,
    MUTED,
  )
  y -= 30

  text('Domain', MARGIN, 10, boldFont)
  text('Grade', 400, 10, boldFont)
  text('Score', 470, 10, boldFont)
  y -= 6
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_SIZE[0] - MARGIN, y },
    thickness: 1,
    color: LINE,
  })
  y -= 16

  const sortedScores = [...analytics.domainScores].sort((a, b) => a.score - b.score)
  for (const d of sortedScores) {
    ensureSpace(20)
    text(d.domain, MARGIN, 10, font)
    text(d.grade, 400, 10, font)
    text(`${d.score}/100`, 470, 10, font)
    y -= 18
  }

  // --- Issues by domain --------------------------------------------------
  ensureSpace(50)
  y -= 16
  text('Issues by domain', MARGIN, 15, boldFont)
  y -= 8
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_SIZE[0] - MARGIN, y },
    thickness: 1,
    color: LINE,
  })
  y -= 22

  for (const domain of analytics.domainIssues) {
    ensureSpace(24)
    text(domain.domain, MARGIN, 12, boldFont)
    y -= 18

    if (!domain.issues.length) {
      text('No issues — all checks passing.', MARGIN + 12, 10, font, SUCCESS)
      y -= 20
      continue
    }

    for (const issue of domain.issues) {
      const label = CHECK_INFO[issue.checkType]?.label ?? issue.checkType
      const severityLabel = SEVERITY_LABEL[issue.status]
      const severityColor = SEVERITY_COLOR[issue.status]

      ensureSpace(16)
      text(`[${severityLabel}]`, MARGIN + 12, 9, boldFont, severityColor)
      const severityWidth = boldFont.widthOfTextAtSize(`[${severityLabel}]`, 9)
      text(label, MARGIN + 12 + severityWidth + 6, 9, boldFont, DARK)
      y -= 13

      const summaryLines = wrap(issue.summary, font, 9, CONTENT_WIDTH - 24)
      for (const line of summaryLines) {
        ensureSpace(13)
        text(line, MARGIN + 12, 9, font, MUTED)
        y -= 12
      }
      y -= 4
    }
    y -= 10
  }

  return doc.save()
}
