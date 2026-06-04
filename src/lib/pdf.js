import { jsPDF } from 'jspdf'
import { euroPdf, dmy } from './format'

// Baut Rechnung/Quittung als PDF.
// Einnahme: Aussteller = Inhaber (settings), Empfänger = Kunde.
// Ausgabe:  Aussteller = Putzkraft (beleg.customer inkl. Steuernr.), Empfänger = Inhaber.
export function buildInvoicePdf(beleg, s) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const M = 48
  const RIGHT = 420
  let y = 60
  const isAus = beleg.direction === 'ausgabe'
  const cust = beleg.customer || {}

  const issuerName = isAus ? (cust.name || 'Rechnung') : (s.businessName || 'Rechnung')
  const issuerLines = isAus
    ? [cust.street, [cust.zip, cust.city].filter(Boolean).join(' '), cust.taxId ? 'Steuernummer: ' + cust.taxId : '', cust.email].filter(Boolean)
    : [s.owner, s.street, [s.zip, s.city].filter(Boolean).join(' '), s.phone, s.email].filter(Boolean)

  // Logo nur bei Einnahme (Rechnung des Inhabers)
  if (s.logoDataUrl && !isAus) {
    try {
      const p = doc.getImageProperties(s.logoDataUrl)
      const maxW = 150, maxH = 55
      let w = maxW, h = (p.height / p.width) * w
      if (h > maxH) { h = maxH; w = (p.width / p.height) * h }
      doc.addImage(s.logoDataUrl, p.fileType || 'PNG', M, 38, w, h)
      y = 38 + h + 18
    } catch { /* ignore */ }
  }

  doc.setFont('helvetica', 'bold').setFontSize(20)
  doc.text(issuerName, M, y)
  doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(90)
  y += 18
  issuerLines.forEach((l) => { doc.text(String(l), M, y); y += 13 })
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
  doc.text(isAus ? 'Rechnung (Barauszahlung)' : 'Rechnung / Barquittung', M, y)

  // Empfänger
  const recipName = isAus ? (s.businessName || '—') : (cust.name || '—')
  const recipLines = isAus
    ? [s.owner, s.street, [s.zip, s.city].filter(Boolean).join(' ')].filter(Boolean)
    : [cust.email].filter(Boolean)
  y += 26
  doc.setFont('helvetica', 'bold').setFontSize(10).text('Empfänger:', M, y)
  doc.setFont('helvetica', 'normal')
  y += 14; doc.text(recipName, M, y)
  recipLines.forEach((l) => { y += 13; doc.text(String(l), M, y) })

  // Objekt / Wohnung (bei Rechnung)
  if (!isAus && beleg.objekt) {
    y += 18
    doc.setFont('helvetica', 'bold').text('Objekt:', M, y)
    doc.setFont('helvetica', 'normal').text(String(beleg.objekt), M + 48, y)
  }

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
  doc.text('Gesamtbetrag:', RIGHT - 150, y)
  doc.text(euroPdf(beleg.total), RIGHT + 60, y, { align: 'right' })

  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90)
  y += 20
  const kleinunternehmer = isAus ? (cust.kleinunternehmer !== false) : (beleg.taxMode === 'kleinunternehmer')
  if (kleinunternehmer) {
    doc.text('Gemäß §19 UStG wird keine Umsatzsteuer berechnet.', M, y); y += 13
  } else {
    const rate = beleg.vatRate || 19
    const net = beleg.total / (1 + rate / 100)
    const vat = beleg.total - net
    doc.text(`Netto: ${euroPdf(net)}   zzgl. ${rate}% USt: ${euroPdf(vat)}`, M, y); y += 13
  }
  doc.text('Betrag dankend in bar erhalten.', M, y); y += 20
  doc.setTextColor(0)

  // Unterschrift
  if (beleg.signatureDataUrl) {
    doc.setFontSize(9).setTextColor(90)
    const cap = isAus ? 'Unterschrift Empfänger (Bargeld erhalten):' : 'Unterschrift Zahler (Bargeld übergeben):'
    doc.text(cap, M, y); y += 8
    try { doc.addImage(beleg.signatureDataUrl, 'PNG', M, y, 170, 64) } catch { /* ignore */ }
    y += 74
    doc.setTextColor(0).setFontSize(10)
    doc.text(beleg.signerName || cust.name || '', M, y)
  }

  doc.setFontSize(7).setTextColor(130)
  doc.text(
    `Manipulationssicher (Hash-Kette) · Hash ${String(beleg.hash || '').slice(0, 28)}… · erstellt ${beleg.createdAt || ''}`,
    M, 812, { maxWidth: RIGHT + 60 - M }
  )
  return doc
}

export const pdfFileName = (beleg) => `${beleg.direction === 'ausgabe' ? 'Quittung' : 'Rechnung'}_${beleg.number}.pdf`
