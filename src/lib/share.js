import { pdfFileName } from './pdf'
import { loadSettings } from './settings'
import { euro, dmy } from './format'

// Schöner Begleittext je Richtung (geht beim Teilen an E-Mail/WhatsApp mit)
export function mailText(beleg, s = loadSettings()) {
  const biz = s.businessName || 'Quitto'
  const datum = dmy(beleg.createdAt || beleg.date)
  if (beleg.direction === 'ausgabe') {
    return {
      title: `Quittung ${beleg.number} – Barauszahlung`,
      body:
`Hallo ${beleg.customer?.name || ''},

anbei deine Quittung über die erhaltene Barauszahlung in Höhe von ${euro(beleg.total)}, die du mit deiner Unterschrift bestätigt hast.

Beleg-Nr.: ${beleg.number}
Betrag:    ${euro(beleg.total)}
Datum:     ${datum}

Vielen Dank für deine Arbeit!
${biz}`,
    }
  }
  return {
    title: `Ihre Rechnung ${beleg.number} von ${biz}`,
    body:
`Sehr geehrte/r ${beleg.customer?.name || 'Kundin/Kunde'},

vielen Dank für Ihren Auftrag! Im Anhang finden Sie Ihre Rechnung/Quittung über ${euro(beleg.total)}. Der Betrag wurde dankend in bar erhalten – diese Quittung dient Ihnen als Zahlungsnachweis.

Rechnungs-Nr.: ${beleg.number}
Betrag:        ${euro(beleg.total)}
Datum:         ${datum}

Mit freundlichen Grüßen
${biz}`,
  }
}

export async function sharePdf(doc, beleg) {
  const s = loadSettings()
  const { title, body } = mailText(beleg, s)
  const blob = doc.output('blob')
  const fileName = pdfFileName(beleg)
  const file = new File([blob], fileName, { type: 'application/pdf' })

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text: body })
      return 'shared'
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return 'downloaded'
}
