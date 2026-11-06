import 'server-only'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import QRCode from 'qrcode'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { PrescriptionItem } from '@/lib/types'

export interface PrescriptionPdfInput {
  code: string
  verifyUrl: string
  patientName: string
  patientAge: number | null
  doctorName: string
  doctorSpecialty: string
  issuedAt: string
  expiresAt: string
  items: PrescriptionItem[]
  instructions: string | null
}

const BLUE = rgb(15 / 255, 110 / 255, 185 / 255)
const NAVY = rgb(13 / 255, 34 / 255, 56 / 255)
const GREY = rgb(71 / 255, 85 / 255, 105 / 255)
const YELLOW = rgb(247 / 255, 214 / 255, 24 / 255)

/** Les polices standard des PDF ne gèrent que le jeu WinAnsi : on remplace les caractères hors jeu. */
function safe(text: string): string {
  return text
    .replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...')
    .replace(/ | /g, ' ')
    .replace(/[^\x20-\x7E -ÿ€]/g, '')
}

function wrap(text: string, max: number): string[] {
  const words = safe(text).split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) { if (line) lines.push(line); line = w } else line = (line + ' ' + w).trim()
  }
  if (line) lines.push(line)
  return lines
}

const fmt = (iso: string) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Africa/Kinshasa', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(iso))

export async function buildPrescriptionPdf(d: PrescriptionPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Ordonnance ${d.code}`)
  pdf.setAuthor('MONGANGA na Tshombo')
  const page = pdf.addPage([595, 842])
  const regular = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const { width } = page.getSize()

  page.drawRectangle({ x: 0, y: 762, width, height: 80, color: NAVY })
  page.drawRectangle({ x: 0, y: 758, width, height: 4, color: YELLOW })
  try {
    const logo = await pdf.embedPng(await readFile(path.join(process.cwd(), 'public/logo/monganga-icon-192.png')))
    page.drawRectangle({ x: 36, y: 778, width: 48, height: 48, color: rgb(1, 1, 1) })
    page.drawImage(logo, { x: 38, y: 780, width: 44, height: 44 })
  } catch { /* logo facultatif */ }
  page.drawText('ORDONNANCE', { x: 96, y: 806, size: 20, font: bold, color: rgb(1, 1, 1) })
  page.drawText('MONGANGA na Tshombo - Consultation en visio', { x: 96, y: 788, size: 10, font: regular, color: rgb(0.85, 0.9, 0.95) })
  page.drawText(safe(`N° ${d.code}`), { x: width - 160, y: 806, size: 11, font: bold, color: rgb(1, 1, 1) })

  let y = 720
  const label = (t: string, x: number, yy: number) => page.drawText(safe(t).toUpperCase(), { x, y: yy, size: 8, font: bold, color: GREY })
  const value = (t: string, x: number, yy: number) => page.drawText(safe(t), { x, y: yy, size: 12, font: bold, color: NAVY })
  label('Patient', 36, y); value(d.patientName + (d.patientAge ? `, ${d.patientAge} ans` : ''), 36, y - 16)
  label('Médecin', 300, y); value(d.doctorName, 300, y - 16)
  page.drawText(safe(d.doctorSpecialty), { x: 300, y: y - 30, size: 10, font: regular, color: GREY })
  y -= 64
  label('Date', 36, y); value(fmt(d.issuedAt), 36, y - 16)
  label('Valable jusqu’au', 300, y); value(fmt(d.expiresAt), 300, y - 16)
  y -= 44
  page.drawLine({ start: { x: 36, y }, end: { x: width - 36, y }, thickness: 1.5, color: BLUE })
  y -= 30

  d.items.forEach((item, i) => {
    page.drawText(`${i + 1}.`, { x: 36, y, size: 12, font: bold, color: BLUE })
    page.drawText(safe(item.name), { x: 56, y, size: 13, font: bold, color: NAVY })
    y -= 17
    const detail = [item.dosage, item.duration].filter(Boolean).join(' - ')
    for (const line of wrap(detail, 85)) { page.drawText(line, { x: 56, y, size: 11, font: regular, color: GREY }); y -= 15 }
    y -= 10
  })
  if (d.instructions) {
    y -= 6
    label('Recommandations', 36, y); y -= 16
    for (const line of wrap(d.instructions, 90)) { page.drawText(line, { x: 36, y, size: 11, font: regular, color: NAVY }); y -= 15 }
  }

  const qr = await QRCode.toBuffer(d.verifyUrl, { margin: 1, width: 300, errorCorrectionLevel: 'M' })
  const qrImage = await pdf.embedPng(qr)
  page.drawRectangle({ x: 36, y: 60, width: width - 72, height: 120, borderColor: rgb(0.85, 0.88, 0.92), borderWidth: 1 })
  page.drawImage(qrImage, { x: 46, y: 70, width: 100, height: 100 })
  const verifyLines = [
    'Vérification : le pharmacien scanne ce code pour confirmer que',
    'l’ordonnance est authentique et encore valable. Aucune information',
    'médicale n’apparaît lors de la vérification.',
  ]
  verifyLines.forEach((t, i) => page.drawText(safe(t), { x: 160, y: 140 - i * 15, size: 10, font: regular, color: GREY }))
  page.drawText(safe(d.verifyUrl), { x: 160, y: 88, size: 9, font: bold, color: BLUE })
  page.drawText(safe('Document supprimé de MONGANGA 30 jours après la consultation. Conservez ce PDF si nécessaire.'), { x: 36, y: 40, size: 8, font: regular, color: GREY })

  return pdf.save()
}
