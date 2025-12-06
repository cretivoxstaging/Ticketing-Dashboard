"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DollarSign, Ticket, AlertTriangle, CheckCircle, Tag, BarChart3, XCircle } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

export function Dashboard() {
  type Participant = {
    qty: number
    total_paid: number
    status: string
    clock_in: string | null
    type_ticket: string
    date_ticket: string
  }

  type ApiResponse = {
    data: Participant[]
  }

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPaidTickets, setTotalPaidTickets] = useState<number>(0)
  const [totalRevenue, setTotalRevenue] = useState<number>(0)
  const [totalCheckinTickets, setTotalCheckinTickets] = useState<number>(0)
  const [totalUnpaidTickets, setTotalUnpaidTickets] = useState<number>(0)
  const [typeTicketStats, setTypeTicketStats] = useState<Record<string, { count: number; totalPaid: number }>>({})
  const [dateTicketData, setDateTicketData] = useState<Array<{ date: string; count: number; totalPaid: number }>>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/participants")

        let participants: Participant[] = []
        if (response.status === 404) {
          // Treat missing data as empty without showing error
          participants = []
        } else {
          if (!response.ok) {
            throw new Error("Gagal mengambil data peserta")
          }
          const apiData: ApiResponse = await response.json()
          participants = Array.isArray(apiData.data) ? apiData.data : []
        }

        // Tiket terjual: status === "1" atau ada clock_in (checkin)
        const soldParticipants = participants.filter((p) => {
          const status = String(p.status || "").toLowerCase()
          const hasCheckin = p.clock_in !== null && p.clock_in !== ""
          return status === "1" || hasCheckin
        })

        const totalTickets = soldParticipants.reduce((sum, p) => sum + (Number(p.qty) || 0), 0)
        const totalPaid = soldParticipants.reduce((sum, p) => sum + (Number(p.total_paid) || 0), 0)

        // Checkin: status === "check in"
        const checkinParticipants = participants.filter((p) => {
          const status = String(p.status || "").toLowerCase().trim()
          return status === "check in"
        })

        const totalCheckin = checkinParticipants.reduce((sum, p) => sum + (Number(p.qty) || 0), 0)

        // Tidak melakukan pembayaran: status === "0"
        const unpaidParticipants = participants.filter((p) => {
          const status = String(p.status || "").trim()
          return status === "0"
        })

        const totalUnpaid = unpaidParticipants.reduce((sum, p) => sum + (Number(p.qty) || 0), 0)

        // Type Ticket: hitung jumlah tiket dan total_paid per type_ticket (hanya yang sudah bayar: status "1" atau "check in")
        const typeTicketData: Record<string, { count: number; totalPaid: number }> = {}
        soldParticipants.forEach((p) => {
          const typeTicket = String(p.type_ticket || "").trim()
          if (typeTicket) {
            if (!typeTicketData[typeTicket]) {
              typeTicketData[typeTicket] = { count: 0, totalPaid: 0 }
            }
            typeTicketData[typeTicket].count += Number(p.qty) || 0
            typeTicketData[typeTicket].totalPaid += Number(p.total_paid) || 0
          }
        })

        // Date Ticket: hitung jumlah tiket dan total_paid per date_ticket (hanya yang sudah bayar: status "1" atau "check in")
        const dateTicketData: Record<string, { count: number; totalPaid: number }> = {}
        soldParticipants.forEach((p) => {
          const dateTicket = String(p.date_ticket || "").trim()
          if (dateTicket) {
            if (!dateTicketData[dateTicket]) {
              dateTicketData[dateTicket] = { count: 0, totalPaid: 0 }
            }
            dateTicketData[dateTicket].count += Number(p.qty) || 0
            dateTicketData[dateTicket].totalPaid += Number(p.total_paid) || 0
          }
        })

        // Convert to array and sort by date
        const dateTicketArray = Object.entries(dateTicketData)
          .map(([date, data]) => ({ date, count: data.count, totalPaid: data.totalPaid }))
          .sort((a, b) => {
            // Sort by date string (assuming format like YYYY-MM-DD)
            return a.date.localeCompare(b.date)
          })

        setTotalPaidTickets(totalTickets)
        setTotalRevenue(totalPaid)
        setTotalCheckinTickets(totalCheckin)
        setTotalUnpaidTickets(totalUnpaid)
        setTypeTicketStats(typeTicketData)
        setDateTicketData(dateTicketArray)
        setError(null)
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError(err instanceof Error ? err.message : "Terjadi kesalahan saat mengambil data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const stats = [
    {
      title: "Tickets Sold",
      // total tiket terjual (status = 1 atau checkin)
      value: loading ? "Loading..." : totalPaidTickets.toLocaleString("id-ID"),
      icon: Ticket,
      trend: "",
      description: "Total tickets sold",
    },
    {
      title: "Total Revenue",
      // total nilai pembayaran dari tiket terjual
      value: loading ? "Loading..." : formatCurrency(totalRevenue),
      icon: DollarSign,
      trend: "",
      description: "Total revenue from ticket sales",
    },
    {
      title: "Unpaid Tickets",
      value: loading ? "Loading..." : totalUnpaidTickets.toLocaleString("id-ID"),
      icon: XCircle,
      trend: "",
      description: "Total tickets without payment",
    },
    {
      title: "Checked-in Tiket",
      value: loading ? "Loading..." : totalCheckinTickets.toLocaleString("id-ID"),
      icon: CheckCircle,
      trend: "",
      description: "Total tickets checked in",
    },
  ]

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Overview of ticket sales and performance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-white text-black">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium ">{stat.title}</CardTitle>
              <stat.icon className="h-5 w-5 " />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs">
                <span className="text-accent">{stat.trend}</span> {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Type Ticket Cards */}
      {Object.keys(typeTicketStats).length > 0 && (
        <div className="space-y-4">
          {/* <div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Type Tiket</h3>
            <p className="text-muted-foreground">Distribusi tiket berdasarkan type</p>
          </div> */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {Object.entries(typeTicketStats).map(([typeTicket, data]) => (
              <Card key={typeTicket} className="bg-white text-black">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{typeTicket}</CardTitle>
                  <Tag className="h-5 w-5" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "Loading..." : data.count.toLocaleString("id-ID")}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {loading ? "Loading..." : formatCurrency(data.totalPaid)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Date Ticket Bar Chart */}
      {dateTicketData.length > 0 && (
        <div className="space-y-4">
          {/* <div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Distribusi Tiket Berdasarkan Tanggal</h3>
            <p className="text-muted-foreground">Jumlah tiket per tanggal</p>
          </div> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2">
            <Card className="bg-white text-black">
              <CardHeader>
                <CardTitle>Date Ticket</CardTitle>
                <CardDescription>Ticket sales chart by date</CardDescription>
              </CardHeader>
              <CardContent className="overflow-hidden">
                <ChartContainer
                  config={{
                    count: {
                      label: "Total Tickets",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[300px] w-full"
                >
                  <BarChart 
                    data={dateTicketData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 80 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "currentColor", fontSize: 12 }}
                      tickLine={{ stroke: "currentColor" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: "currentColor" }}
                      tickLine={{ stroke: "currentColor" }}
                    />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="border-border/50 bg-background rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                              <div className="font-medium mb-2">{label}</div>
                              <div className="grid gap-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Total Tickets</span>
                                  <span className="font-mono font-medium tabular-nums text-foreground">
                                    {data.count?.toLocaleString() || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">Total Paid</span>
                                  <span className="font-mono ml-2 font-medium tabular-nums text-foreground">
                                    {formatCurrency(data.totalPaid || 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[4, 4, 0, 0]}
                      barSize={50}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

