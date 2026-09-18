"use client"
import { useState } from "react"

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  total: number
  page: number
  limit: number
  totalPages: number
  onPageChange?: (page: number) => void
  onSearch?: (search: string) => void
  searchPlaceholder?: string
  loading?: boolean
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  total,
  page,
  limit,
  totalPages,
  onPageChange,
  onSearch,
  searchPlaceholder = "Cari...",
  loading,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")

  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="bg-white rounded-[12px] border border-[#e6e6e6] overflow-hidden shadow-sm">
      {onSearch && (
        <div className="p-4 border-b border-[#e6e6e6] flex items-center gap-3">
          <div className="relative flex-1 max-w-[320px]">
            <input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch(search)
              }}
              className="w-full h-9 rounded-[4px] border border-[#e6e6e6] bg-white px-3 pr-9 text-sm placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#0075de]"
            />
            <button
              onClick={() => onSearch(search)}
              className="absolute right-1 top-1 bottom-1 px-3 rounded-[4px] bg-[#0075de] text-white text-xs font-medium hover:bg-[#0066c2]"
            >
              Cari
            </button>
          </div>
          <div className="text-xs text-[#6b7280] hidden sm:block">Menampilkan {from}-{to} dari {total}</div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f6f5f4] border-b border-[#e6e6e6]">
              {columns.map((col) => (
                <th key={col.key} className="text-left px-4 py-3 text-xs font-semibold tracking-widest uppercase text-[#6b7280] whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-[#6b7280]">
                  Memuat...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#f6f5f4] flex items-center justify-center text-[#9ca3af]">∅</div>
                    <div className="text-sm font-medium text-[#6b7280]">Tidak ada data</div>
                    <div className="text-xs text-[#9ca3af]">Coba ubah filter atau tambah data baru</div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="border-b border-[#f3f4f6] hover:bg-[#fafafa] transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-[#111] whitespace-nowrap">
                      {col.render ? col.render(row) : String(row[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-[#e6e6e6] flex items-center justify-between">
          <div className="text-xs text-[#6b7280]">Halaman {page} dari {totalPages} • Total {total} data</div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="h-8 px-3 rounded-[8px] border border-[#e6e6e6] bg-white text-xs font-medium disabled:opacity-50 hover:bg-[#f6f5f4]"
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number
              if (totalPages <= 5) p = i + 1
              else if (page <= 3) p = i + 1
              else if (page >= totalPages - 2) p = totalPages - 4 + i
              else p = page - 2 + i
              const active = p === page
              return (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className={`w-8 h-8 rounded-[8px] text-xs font-medium ${active ? "bg-[#0075de] text-white" : "border border-[#e6e6e6] bg-white hover:bg-[#f6f5f4]"}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="h-8 px-3 rounded-[8px] border border-[#e6e6e6] bg-white text-xs font-medium disabled:opacity-50 hover:bg-[#f6f5f4]"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {!onSearch && total > 0 && (
        <div className="px-4 py-3 border-t border-[#e6e6e6] text-xs text-[#6b7280] bg-[#fafafa]">Menampilkan {from}-{to} dari {total}</div>
      )}
    </div>
  )
}
