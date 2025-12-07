"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DollarSign, Ticket, AlertTriangle, CheckCircle, Tag, BarChart3, XCircle, TrendingUp } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend, Sector } from "recharts"

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
  const [paymentConversionRate, setPaymentConversionRate] = useState<number>(0)
  const [typeTicketStats, setTypeTicketStats] = useState<Record<string, { count: number; totalPaid: number }>>({})
  const [dateTicketData, setDateTicketData] = useState<Array<{ date: string; count: number; totalPaid: number }>>([])
  const [statusPieData, setStatusPieData] = useState<Array<{ name: string; value: number }>>([])

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

        // Status "1" (Awaiting Check-in)
        const awaitingCheckinParticipants = participants.filter((p) => {
          const status = String(p.status || "").trim()
          return status === "1"
        })

        const totalAwaitingCheckin = awaitingCheckinParticipants.reduce((sum, p) => sum + (Number(p.qty) || 0), 0)

        // Pie chart data untuk status
        const pieData = [
          {
            name: "Check In",
            value: totalCheckin,
          },
          {
            name: "Awaiting Check-in",
            value: totalAwaitingCheckin,
          },
        ]

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

        // Payment Conversion Rate calculation
        const totalOrder = totalTickets + totalUnpaid
        const conversionRate = totalOrder > 0 ? (totalTickets / totalOrder) * 100 : 0

        setTotalPaidTickets(totalTickets)
        setTotalRevenue(totalPaid)
        setTotalCheckinTickets(totalCheckin)
        setTotalUnpaidTickets(totalUnpaid)
        setPaymentConversionRate(conversionRate)
        setTypeTicketStats(typeTicketData)
        setDateTicketData(dateTicketArray)
        setStatusPieData(pieData)
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
      title: "Payment Conversion Rate",
      value: loading ? "Loading..." : `${paymentConversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      trend: "",
      description: "Order-to-paid-ticket conversion rate",
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

      {/* Date Ticket Bar Chart and Status Pie Chart */}
      {(dateTicketData.length > 0 || statusPieData.length > 0) && (
        <div className="space-y-4">
          {/* <div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">Distribusi Tiket Berdasarkan Tanggal</h3>
            <p className="text-muted-foreground">Jumlah tiket per tanggal</p>
          </div> */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
            {dateTicketData.length > 0 && (
              <Card className="bg-white text-black pt-6 pb-0">
                <CardHeader>
                  <CardTitle>Date Ticket</CardTitle>
                  <CardDescription>Ticket sales chart by date</CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden -mb-6">
                <ChartContainer
                  config={{
                    count: {
                      label: "Total Tickets",
                      color: "hsl(var(--chart-1))",
                    },
                  }}
                  className="h-[400px] w-full"
                >
                  <BarChart 
                    data={dateTicketData}
                    margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
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
            )}

            {/* Status Pie */}
            {statusPieData.length > 0 && (
              <Card className="bg-white text-black pt-6 pb-0">
                <CardHeader>
                  <CardTitle>Ticket Status</CardTitle>
                  <CardDescription>Distribution by check-in status</CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden -mb-6">
                  <ChartContainer
                    config={{
                      checkin: {
                        label: "Check In",
                        color: "hsl(217, 91%, 60%)", // Biru
                      },
                      awaiting: {
                        label: "Awaiting Check-in",
                        color: "hsl(110, 91.30%, 44.90%)", // Hijau
                      },
                    }}
                    className="h-[300px] w-full"
                  >
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={100}
                        innerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                        isAnimationActive={true}
                        animationBegin={0}
                        animationDuration={800}
                        activeShape={(props: any) => {
                          const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props
                          return (
                            <g>
                              <Sector
                                cx={cx}
                                cy={cy}
                                innerRadius={innerRadius}
                                outerRadius={outerRadius + 5}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                fill={fill}
                                stroke="#fff"
                                strokeWidth={2}
                              />
                            </g>
                          )
                        }}
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? "var(--color-checkin)" : "var(--color-awaiting)"}
                            stroke="#fff"
                            strokeWidth={2}
                            style={{
                              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                              transition: 'all 0.3s ease',
                              cursor: 'pointer',
                            }}
                          />
                        ))}
                      </Pie>
                      {/* Center label showing total */}
                      <text
                        x="50%"
                        y="43%"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="currentColor"
                        fontSize={25}
                        fontWeight={700}
                        className="text-foreground"
                      >
                        {statusPieData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
                      </text>
                      <text
                        x="50%"
                        y="43%"
                        textAnchor="middle"
                        dominantBaseline="central"
                        dy={20}
                        fill="currentColor"
                        fontSize={10}
                        fontWeight={500}
                        className="text-muted-foreground"
                      >
                        Total Tickets
                      </text>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0]
                            const total = statusPieData.reduce((sum, item) => sum + item.value, 0)
                            const percent = ((data.value as number) / total) * 100
                            return (
                              <div className="border-border/50 bg-background rounded-lg border px-3 py-2 text-xs shadow-xl">
                                <div className="font-semibold mb-2 text-sm">{data.name}</div>
                                <div className="grid gap-1.5">
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Count</span>
                                    <span className="font-mono font-bold tabular-nums text-foreground">
                                      {data.value?.toLocaleString() || 0}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Percentage</span>
                                    <span className="font-mono font-bold tabular-nums text-foreground">
                                      {percent.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

