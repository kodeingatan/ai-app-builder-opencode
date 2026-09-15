// Rule-based stub inference — LLM-ready via AiInferenceProvider interface
export interface InferredIntent {
  domain: string
  domainLabel: string
  entities: { name: string; label: string; fields: any[]; relations?: any[] }[]
  pages: string[]
  roles: string[]
  flows: string[]
}

const templates: Record<string, InferredIntent> = {
  kasir: {
    domain: 'pos',
    domainLabel: 'Kasir POS',
    entities: [
      { name: 'Product', label: 'Produk', fields: [{ name: 'name', type: 'string', required: true }, { name: 'price', type: 'decimal', required: true }, { name: 'stock', type: 'integer', required: true }, { name: 'barcode', type: 'string', required: false }] },
      { name: 'Category', label: 'Kategori', fields: [{ name: 'name', type: 'string', required: true }] },
      { name: 'Transaction', label: 'Transaksi', fields: [{ name: 'total', type: 'decimal', required: true }, { name: 'status', type: 'enum', required: true, enumValues: ['pending', 'paid', 'cancelled'] }] },
      { name: 'Customer', label: 'Pelanggan', fields: [{ name: 'name', type: 'string', required: true }, { name: 'phone', type: 'string', required: false }] }
    ],
    pages: ['Dashboard', 'Products', 'Transactions', 'Customers', 'Reports'],
    roles: ['Admin', 'Kasir'],
    flows: ['Kasir buat transaksi → kurangi stok → cetak struk']
  },
  klinik: {
    domain: 'clinic',
    domainLabel: 'CRM Klinik',
    entities: [
      { name: 'Patient', label: 'Pasien', fields: [{ name: 'name', type: 'string', required: true }, { name: 'phone', type: 'string', required: true }] },
      { name: 'Doctor', label: 'Dokter', fields: [{ name: 'name', type: 'string', required: true }, { name: 'specialty', type: 'string', required: true }] },
      { name: 'Appointment', label: 'Janji Temu', fields: [{ name: 'date', type: 'datetime', required: true }, { name: 'status', type: 'enum', enumValues: ['scheduled', 'done', 'cancelled'] }] },
      { name: 'MedicalRecord', label: 'Rekam Medis', fields: [{ name: 'diagnosis', type: 'text', required: true }] }
    ],
    pages: ['Dashboard', 'Patients', 'Doctors', 'Appointments', 'Records'],
    roles: ['Admin', 'Dokter', 'Perawat'],
    flows: ['Pasien daftar → dokter periksa → rekam medis']
  },
  todo: {
    domain: 'todo',
    domainLabel: 'Todo Share',
    entities: [
      { name: 'Todo', label: 'Tugas', fields: [{ name: 'title', type: 'string', required: true }, { name: 'done', type: 'boolean', required: true }] },
      { name: 'Project', label: 'Proyek', fields: [{ name: 'name', type: 'string', required: true }] },
      { name: 'ShareLink', label: 'Link Share', fields: [{ name: 'url', type: 'string', required: true }] }
    ],
    pages: ['Dashboard', 'Todos', 'Projects', 'Shared'],
    roles: ['Owner', 'Member'],
    flows: ['Buat todo → share link → colaborator ceklis']
  }
}

export const AiInferenceService = {
  async infer(prompt: string): Promise<InferredIntent> {
    const lower = prompt.toLowerCase()
    if (lower.includes('kasir') || lower.includes('toko') || lower.includes('pos')) return templates.kasir
    if (lower.includes('klinik') || lower.includes('dokter') || lower.includes('rumah sakit')) return templates.klinik
    if (lower.includes('todo') || lower.includes('task') || lower.includes('tugas')) return templates.todo
    // generic fallback — 3 entities
    return {
      domain: 'generic',
      domainLabel: 'Aplikasi Bisnis',
      entities: [
        { name: 'Item', label: 'Item', fields: [{ name: 'name', type: 'string', required: true }, { name: 'description', type: 'text', required: false }] },
        { name: 'Category', label: 'Kategori', fields: [{ name: 'name', type: 'string', required: true }] },
        { name: 'Transaction', label: 'Transaksi', fields: [{ name: 'amount', type: 'decimal', required: true }, { name: 'status', type: 'enum', enumValues: ['pending', 'done'] }] }
      ],
      pages: ['Dashboard', 'Items', 'Categories', 'Transactions'],
      roles: ['Admin', 'User'],
      flows: ['Kelola item → transaksi → laporan']
    }
  },

  slugify(prompt: string, domain: string) {
    // generate slug from prompt, fallback domain
    const base = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || domain
    return base.replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-')
  }
}
