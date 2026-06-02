import { jsPDF } from 'jspdf'
import { euroPdf, dmy } from './format'

// Baut eine rechtssichere (Kleinbetrags-)Rechnung/Quittung als PDF
export function buildInvoicePdf(beleg, s) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const M = 48
  const RIGHT = 420
  let y = 60

  doc.setFont('helvetica', 'bold').setFontSize(20)
  doc.text(s.businessName || 'Rechnung', M, y)

  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(90)
  y += 18
  ;[s.owner, s.street, [s.zip, s.city].filter(Boolean).join(' '), s.phone, s.email]
    .filter(Boolean)
    .forEach((l) => { doc.text(String(l), M, y); y += 13 })
  doc.setTextColor(0)

  // Meta rechts
  let my = 60
  doc.setFontSize(10)
  doc.text(`Rechnungs-Nr.: ${beleg.number}`, RIGHT, my); my += 14
  doc.text(`Datum: ${dmy(beleg.date)}`, RIGHT, my); my += 14
  doc.text(`Beleg-Token: ${String(beleg.token).slice(0, 12)}`, RIGHT, my)

  // Titel
  y += 24
  doc.setFont('helvetica', 'bold').setFontSize(15)
  doc.text(beleg.direction === 'ausgabe' ? 'Quittung (Barauszahlung)' : 'Rechnung / Barquittung', M, y)

  // Empfänger
  y += 26
  doc.setFont('helvetica', 'bold').setFontSize(10).text('Empfänger:', M, y)
  doc.setFont('helvetica', 'normal')
  y += 14; doc.text(beleg.customer?.name || '—', M, y)
  if (beleg.customer?.email) { y += 13; doc.text(beleg.customer.email, M, y) }

  // Positionen
  y += 30
  doc.setFont('helvetica', 'bold')
  doc.text('Pos', M, y)
  doc.text('Leistung', M + 34, y)
  doc.text('Menge', RIGHT - 60, y)
  doc.text('Betrag', RIGHT + 60, y, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  y += 6; doc.setDrawColor(200).line(M, y, RIGHT + 60, y); y += 16
  beleg.items.forEach((it, i) => {
    doc.text(String(i + 1), M, y)
    doc.text(String(it.label), M + 34, y, { maxWidth: RIGHT - 110 })
    doc.text(String(it.qty || 1), RIGHT - 60, y)
    doc.text(euroPdf(it.price * (it.qty || 1)), RIGHT + 60, y, { align: 'right' })
    y += 18
  })
  y += 4; doc.line(M, y, RIGHT + 60, y); y += 22

  doc.setFont('helvetica', 'bold').setFontSize(12)
  doc.text('Gesamtbetrag:', RIGHT - 60, y)
  doc.text(euroPdf(beleg.total), RIGHT + 60, y, { align: 'right' })

  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90)
  y += 20
  if (beleg.taxMode === 'kleinunternehmer') {
    doc.text('Gemäß §19 UStG wird keine Umsatzsteuer berechnet.', M, y); y += 13
  } else {
    const net = beleg.total / (1 + (beleg.vatRate || 19) / 100)
    const vat = beleg.total - net
    doc.text(`Netto: ${euroPdf(net)}   zzgl. ${beleg.vatRate || 19}% USt: ${euroPdf(vat)}`, M, y); y += 13
  }
  doc.text('Betrag dankend in bar erhalten.', M, y); y += 20
  doc.setTextColor(0)

  // Unterschrift
  if (beleg.signatureDataUrl) {
    doc.setFontSize(9).setTextColor(90)
    const cap = beleg.direction === 'ausgabe'
      ? 'Unterschrift Empfänger (Bargeld erhalten):'
      : 'Unterschrift Zahler (Bargeld übergeben):'
    doc.text(cap, M, y); y += 8
    try { doc.addImage(beleg.signatureDataUrl, 'PNG', M, y, 170, 64) } catch { /* ignore */ }
    y += 74
    doc.setTextColor(0).setFontSize(10)
    doc.text(beleg.signerName || beleg.customer?.name || '', M, y)
  }

  // Fußzeile: Manipulationssicherheit
  doc.setFontSize(7).setTextColor(130)
  doc.text(
    `Manipulationssicher (Hash-Kette) · Hash ${String(beleg.hash || '').slice(0, 28)}… · erstellt ${beleg.createdAt || ''}`,
    M, 812, { maxWidth: RIGHT + 60 - M }
  )
  return doc
}

export const pdfFileName = (beleg) => `Rechnung_${beleg.number}.pdf`
