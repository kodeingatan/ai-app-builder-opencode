export interface InferredIntent {
  domain: string
  domainLabel: string
  entities: { name: string; label: string; fields: any[] }[]
  pages: string[]
  roles: string[]
  flows: string[]
}

const templates: Record<string, InferredIntent> = {
  kasir: {
    domain: 'pos',
    domainLabel: 'Kasir POS',
    entities: [
      { name: 'Product', label: 'Produk', fields: [{ name: 'name', type: 'string', required: true }, { name: 'price', type: 'decimal', required: true }, { name: 'stock', type: 'integer', required: true }] },
      { name: 'Category', label: 'Kategori', fields: [{ name: 'name', type: 'string', required: true }] },
      { name: 'Transaction', label: 'Transaksi', fields: [{ name: 'total', type: 'decimal', required: true }, { name: 'status', type: 'enum', enumValues: ['pending', 'paid'] }] },
      { name: 'Customer', label: 'Pelanggan', fields: [{ name: 'name', type: 'string', required: true }, { name: 'phone', type: 'string' }] }
    ],
    pages: ['Dashboard', 'Products', 'Transactions', 'Customers', 'Reports'],
    roles: ['Admin', 'Kasir'],
    flows: ['Kasir buat transaksi → kurangi stok → cetak struk']
  },
  klinik: {
    domain: 'clinic',
    domainLabel: 'CRM Klinik',
    entities: [
      { name: 'Patient', label: 'Pasien', fields: [{ name: 'name', type: 'string', required: true }] },
      { name: 'Doctor', label: 'Dokter', fields: [{ name: 'name', type: 'string', required: true }] },
      { name: 'Appointment', label: 'Janji Temu', fields: [{ name: 'date', type: 'datetime', required: true }] }
    ],
    pages: ['Dashboard', 'Patients', 'Doctors', 'Appointments'],
    roles: ['Admin', 'Dokter'],
    flows: ['Pasien daftar → dokter periksa']
  },
  todo: {
    domain: 'todo',
    domainLabel: 'Todo Share',
    entities: [
      { name: 'Todo', label: 'Tugas', fields: [{ name: 'title', type: 'string', required: true }] },
      { name: 'Project', label: 'Proyek', fields: [{ name: 'name', type: 'string', required: true }] }
    ],
    pages: ['Dashboard', 'Todos', 'Projects'],
    roles: ['Owner', 'Member'],
    flows: ['Buat todo → share']
  }
}

export const AiInferenceService = {
  async infer(prompt: string): Promise<InferredIntent> {
    const lower = prompt.toLowerCase()
    if (lower.includes('kasir') || lower.includes('toko') || lower.includes('pos')) return templates.kasir
    if (lower.includes('klinik') || lower.includes('dokter')) return templates.klinik
    if (lower.includes('todo') || lower.includes('task')) return templates.todo
    return {
      domain: 'generic',
      domainLabel: 'Aplikasi Bisnis',
      entities: [
        { name: 'Item', label: 'Item', fields: [{ name: 'name', type: 'string', required: true }] },
        { name: 'Category', label: 'Kategori', fields: [{ name: 'name', type: 'string', required: true }] }
      ],
      pages: ['Dashboard', 'Items', 'Categories'],
      roles: ['Admin', 'User'],
      flows: ['Kelola item']
    }
  },
  slugify(prompt: string, domain: string) {
    const base = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || domain
    return base.replace(/--+/g, '-')
  }
}
