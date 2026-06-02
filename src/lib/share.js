import { pdfFileName } from './pdf'

// Teilt das PDF über den nativen Handy-Dialog (E-Mail/WhatsApp), sonst Download-Fallback
export async function sharePdf(doc, beleg) {
  const blob = doc.output('blob')
  const fileName = pdfFileName(beleg)
  const file = new File([blob], fileName, { type: 'application/pdf' })

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName, text: `Rechnung ${beleg.number}` })
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
