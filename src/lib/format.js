export const euro = (n) => (Number(n) || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
// PDF-sichere Variante (kein €-Glyph-Problem in jsPDF-Standardfont)
export const euroPdf = (n) => (Number(n) || 0).toFixed(2).replace('.', ',') + ' EUR'
export const dmy = (d) => new Date(d).toLocaleDateString('de-DE')
export const dmyhm = (d) => new Date(d).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
