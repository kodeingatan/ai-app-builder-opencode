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
    <div className="bg-white rounded-[8px] border border-[#e6e6e6] overflow-hidden shadow-sm">
      {onSearch && (
        <div className="px-2.5 py-2 border-b border-[#e6e6e6] flex items-center gap-2">
          <div className="relative flex-1 max-w-[240px]">
            <input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch(search)
              }}
              className="w-full h-7 rounded-[4px] border border-[#e6e6e6] bg-white px-2.5 pr-14 text-[13px] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#0075de]"
            />
            <button
              onClick={() => onSearch(search)}
              className="absolute right-0.5 top-0.5 bottom-0.5 px-2.5 rounded-[4px] bg-[#0075de] text-white text-[11px] font-medium hover:bg-[#0066c2]"
            >
              Cari
            </button>
          </div>
          <div className="text-[11px] text-[#6b7280] hidden sm:block ml-auto whitespace-nowrap">Menampilkan {from}-{to} dari {total}</div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-[#f6f5f4] border-b border-[#e6e6e6]">
              {columns.map((col) => (
                <th key={col.key} className="text-left px-3 py-2 text-[11px] font-semibold tracking-wide uppercase text-[#6b7280] whitespace-nowrap">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-[13px] text-[#6b7280]">
                  Memuat...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-[#f6f5f4] flex items-center justify-center text-[#9ca3af] text-sm">∅</div>
                    <div className="text-[13px] font-medium text-[#6b7280]">Tidak ada data</div>
                    <div className="text-[11px] text-[#9ca3af]">Coba ubah filter atau tambah data baru</div>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="border-b border-[#f3f4f6] last:border-0 hover:bg-[#fafafa] transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-1.5 text-[13px] leading-snug text-[#111] whitespace-nowrap max-w-[280px] truncate">
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
        <div className="px-2.5 py-2 border-t border-[#e6e6e6] flex items-center justify-between gap-2 flex-wrap">
          <div className="text-[11px] text-[#6b7280]">Halaman {page} dari {totalPages} • Total {total} data</div>
          <div className="flex items-center gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="h-7 px-2.5 rounded-[6px] border border-[#e6e6e6] bg-white text-[11px] font-medium disabled:opacity-50 hover:bg-[#f6f5f4]"
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
                  className={`w-7 h-7 rounded-[6px] text-[11px] font-medium ${active ? "bg-[#0075de] text-white" : "border border-[#e6e6e6] bg-white hover:bg-[#f6f5f4]"}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="h-7 px-2.5 rounded-[6px] border border-[#e6e6e6] bg-white text-[11px] font-medium disabled:opacity-50 hover:bg-[#f6f5f4]"
            >
              Next
            </button>
          </div>
        </div>
      )}
      {!onSearch && total > 0 && (
        <div className="px-3 py-2 border-t border-[#e6e6e6] text-[11px] text-[#6b7280] bg-[#fafafa]">Menampilkan {from}-{to} dari {total}</div>
      )}
    </div>
  )
}
