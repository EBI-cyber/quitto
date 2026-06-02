const KEY = 'quitto.settings.v1'

export const defaultSettings = {
  businessName: 'Mein Reinigungsservice',
  owner: '',
  street: '',
  zip: '',
  city: '',
  taxId: '',        // Steuernummer
  vatId: '',        // USt-IdNr (optional)
  email: '',
  phone: '',
  iban: '',
  logoDataUrl: '',
  kleinunternehmer: true, // §19 UStG
  vatRate: 19,
  invoicePrefix: 'R',
  expensePrefix: 'A',
  payees: [],
  defaultService: 'Wohnung gereinigt',
  defaultPrice: 50,
  surchargeLabel: 'Nachtrag starke Verschmutzung',
  surchargePrice: 20,
  services: [
    { label: 'Wohnung gereinigt', price: 50 },
    { label: 'Nachtrag starke Verschmutzung', price: 20 },
  ],
}

export function loadSettings() {
  try {
    const merged = { ...defaultSettings, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
    if (!Array.isArray(merged.services) || merged.services.length === 0) {
      merged.services = defaultSettings.services
    }
    return merged
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(s) {
  localStorage.setItem(KEY, JSON.stringify(s))
}
