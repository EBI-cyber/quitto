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
  kleinunternehmer: true, // §19 UStG
  vatRate: 19,
  invoicePrefix: 'R',
  defaultService: 'Wohnung gereinigt',
  defaultPrice: 50,
  surchargeLabel: 'Nachtrag starke Verschmutzung',
  surchargePrice: 20,
}

export function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...defaultSettings }
  }
}

export function saveSettings(s) {
  localStorage.setItem(KEY, JSON.stringify(s))
}
