"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Search, ArrowUpDown, Loader2, CalendarIcon, RefreshCw, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import * as XLSX from "xlsx"

interface Participant {
  id: number
  name: string
  email: string
  whatsapp: string
  event_id: string
  type_ticket: string
  date_ticket: string
  qty: number
  total_paid: number
  order_id: string
  qr_code: string
  ispaid: number
  date_paid: string
  status: string
  clock_in: string | null
  created_at: string
  expires_at: string
}

interface ApiResponse {
  page: number
  pageSize: number
  totalData: number
  totalPages: number
  data: Participant[]
}

export function TicketTable() {
  const [tickets, setTickets] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number | "all">(50)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Participant | null
    direction: "asc" | "desc"
  }>({ key: "id", direction: "desc" })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      setIsRefreshing(true)
      const response = await fetch("/api/participants")

      if (response.status === 404) {
        // Treat missing data as empty without showing error
        setTickets([])
        setError(null)
      } else {
        if (!response.ok) {
          throw new Error("Failed to fetch data")
        }

        const apiData: ApiResponse = await response.json()
        setTickets(apiData.data)
        setError(null)
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Gagal mengambil data")
      setTickets([])
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    fetchData()
  }

  const handleExportExcel = () => {
    // Prepare data for export
    const exportData = sortedAndFilteredTickets.map((ticket, index) => ({
      No: index + 1,
      Name: ticket.name,
      Email: ticket.email,
      WhatsApp: ticket.whatsapp,
      "Type Tiket": ticket.type_ticket,
      "Date Ticket": ticket.date_ticket,
      Qty: ticket.qty,
      "Total Payment": ticket.total_paid,
      Status: ticket.status === "1" || ticket.status?.toLowerCase() === "sudah bayar" 
        ? "Sudah Bayar" 
        : ticket.status === "0" || ticket.status?.toLowerCase() === "belum bayar"
        ? "Belum Bayar"
        : ticket.status || "Tidak Diketahui",
      "Order ID": ticket.order_id,
      "Date Paid": ticket.date_paid,
      "Created At": ticket.created_at,
    }))

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Tickets")

    // Generate filename with current date
    const date = new Date()
    const dateStr = date.toISOString().split("T")[0]
    const filename = `tickets_export_${dateStr}.xlsx`

    // Write file
    XLSX.writeFile(wb, filename)
  }

  const handleSort = (key: keyof Participant) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }))
  }

  const sortedAndFilteredTickets = tickets
    .filter((ticket) => {
      const statusLower = (ticket.status || "").toLowerCase()
      const isUnpaid = statusLower === "0" || statusLower === "belum bayar"
      const matchesSearch =
        (ticket.order_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.whatsapp || "").toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType =
        typeFilter === "all" || (ticket.type_ticket || "").toLowerCase() === typeFilter.toLowerCase()

      const matchesDate =
        dateFilter === "all" || (ticket.date_ticket || "").toLowerCase() === dateFilter.toLowerCase()

      return !isUnpaid && matchesSearch && matchesType && matchesDate
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0
      const aValue = (a[sortConfig.key] as any) || ""
      const bValue = (b[sortConfig.key] as any) || ""
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
      return 0
    })

  const totalItems = sortedAndFilteredTickets.length
  const effectivePageSize = pageSize === "all" ? totalItems || 1 : pageSize
  const totalPages = Math.max(1, Math.ceil(totalItems / effectivePageSize))

  // Reset ke halaman pertama jika filter berubah atau data berkurang
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter, dateFilter, tickets.length, pageSize])

  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = pageSize === "all" ? 0 : (safeCurrentPage - 1) * effectivePageSize
  const endIndex = pageSize === "all" ? totalItems : startIndex + effectivePageSize
  const currentTickets = sortedAndFilteredTickets.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusLower = (status || "").toLowerCase()
    switch (statusLower) {
      case "1":
      case "Awaiting Check-in":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border border-green-200">
            Awaiting Check-in
          </Badge>
        )
      case "0":
      case "belum bayar":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-200">
            Belum Bayar
          </Badge>
        )
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200">
            {status || "Tidak Diketahui"}
          </Badge>
        )
    }
  }

  return (
    <div className="p-6 space-y-6 bg-white">
      {/* Header ala AttendancePage */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Tickets Table</h2>
          <p className="text-gray-600 mt-1">Manage and monitor ticket sales</p>
        </div>
      </div>

      <div className="text-black bg-white">
        <div>
          {/* Search bar + Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-black"
              />
            </div>

            {/* Type filter dropdown */}
            <div className="min-w-0">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-white border-gray-300 text-black justify-between">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 text-black">
                  <SelectItem value="all">All Types</SelectItem>
                  {Array.from(
                    new Set(
                      tickets
                        .map((t) => t.type_ticket)
                        .filter((t): t is string => Boolean(t && t.trim())),
                    ),
                  )
                    .sort((a, b) => a.localeCompare(b))
                    .map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date_ticket filter dropdown */}
            <div className="min-w-0">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="bg-white border-gray-300 text-black justify-between">
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 text-black">
                  <SelectItem value="all">All Dates</SelectItem>
                  {Array.from(
                    new Set(
                      tickets
                        .map((t) => t.date_ticket)
                        .filter((d): d is string => Boolean(d && d.trim())),
                    ),
                  )
                    .sort((a, b) => a.localeCompare(b))
                    .map((date) => (
                      <SelectItem key={date} value={date}>
                        {date}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refresh and Export buttons */}
            <div className="flex items-center gap-2 ml-auto">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing || loading}
                variant="outline"
                className="bg-gray-600 text-white hover:bg-gray-700 border-gray-600"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                onClick={handleExportExcel}
                disabled={loading || sortedAndFilteredTickets.length === 0}
                variant="outline"
                className="bg-primary text-white hover:bg-blue-500 border-green-600"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-gray-600">Memuat data tiket...</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-semibold mb-1">Terjadi kesalahan</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && sortedAndFilteredTickets.length === 0 && (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data tiket</h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "Tidak ada tiket yang cocok dengan kata kunci pencarian."
                  : "Belum ada data tiket yang tersedia."}
              </p>
            </div>
          )}

          {/* Table + Pagination */}
          {!loading && !error && sortedAndFilteredTickets.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-black text-white">
                    <TableHead className="text-white font-bold w-16">No</TableHead>
                    <TableHead className="text-white font-bold">ID Ticket</TableHead>
                    <TableHead className="text-white font-bold">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-1 font-semibold hover:text-blue-200"
                      >
                        Name
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className="text-white font-bold">Email</TableHead>
                    <TableHead className="text-white font-bold">WhatsApp</TableHead>
                    <TableHead className="text-white font-bold">
                      <button
                        onClick={() => handleSort("type_ticket")}
                        className="flex items-center gap-1 font-semibold hover:text-blue-200"
                      >
                        Type Tiket
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className="text-white font-bold">Ticket</TableHead>
                    <TableHead className="text-white font-bold">
                      <button
                        onClick={() => handleSort("total_paid")}
                        className="flex items-center gap-1 font-semibold hover:text-blue-200"
                      >
                        Total Payment
                        <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className="text-white font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentTickets.map((ticket, index) => (
                    <TableRow key={ticket.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium text-black">
                        {startIndex + index + 1}
                      </TableCell>
                      <TableCell className="font-medium text-black">{ticket.order_id}</TableCell>
                      <TableCell className="font-medium text-black">{ticket.name}</TableCell>
                      <TableCell className="text-black text-sm">{ticket.email}</TableCell>
                      <TableCell className="text-black text-sm">{ticket.whatsapp}</TableCell>
                      <TableCell className="text-black">{ticket.type_ticket}
                        <div>{ticket.date_ticket}</div>
                      </TableCell>
                      <TableCell className="text-black">{ticket.qty}</TableCell>
                      <TableCell className="text-black">{formatCurrency(ticket.total_paid)}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-3 border-t bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between w-full">
                {/* Showing entries dropdown di ujung kiri */}
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span>Showing</span>
                  <Select
                    value={pageSize === "all" ? "all" : String(pageSize)}
                    onValueChange={(value) => {
                      if (value === "all") {
                        setPageSize("all")
                      } else {
                        setPageSize(Number(value))
                      }
                    }}
                  >
                    <SelectTrigger className="w-[100px] bg-white border-gray-300 text-black justify-between">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 text-black">
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="200">200</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>entries</span>
                </div>

                {/* Pagination di ujung kanan */}
                <Pagination className="ml-auto mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        className={safeCurrentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(safeCurrentPage - 1)
                        }}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === safeCurrentPage}
                          onClick={(e) => {
                            e.preventDefault()
                            handlePageChange(page)
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        className={safeCurrentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        onClick={(e) => {
                          e.preventDefault()
                          handlePageChange(safeCurrentPage + 1)
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
