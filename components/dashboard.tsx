"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, DollarSign, Ticket, AlertTriangle } from "lucide-react"

export function Dashboard() {
  type Participant = {
    qty: number
    total_paid: number
    ispaid: number
  }

  type ApiResponse = {
    data: Participant[]
  }

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPaidTickets, setTotalPaidTickets] = useState<number>(0)
  const [totalRevenue, setTotalRevenue] = useState<number>(0)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/participants")

        if (!response.ok) {
          throw new Error("Gagal mengambil data peserta")
        }

        const apiData: ApiResponse = await response.json()
        const participants = Array.isArray(apiData.data) ? apiData.data : []

        const paidParticipants = participants.filter((p) => Number(p.ispaid) === 1)

        const totalTickets = paidParticipants.reduce((sum, p) => sum + (Number(p.qty) || 0), 0)
        const totalPaid = paidParticipants.reduce((sum, p) => sum + (Number(p.total_paid) || 0), 0)

        setTotalPaidTickets(totalTickets)
        setTotalRevenue(totalPaid)
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
      title: "Total Penjualan Tiket",
      // total tiket yang sudah dibayar (qty dari peserta dengan ispaid = 1)
      value: loading ? "Loading..." : totalPaidTickets.toLocaleString("id-ID"),
      icon: Ticket,
      trend: "",
      description: "Total tiket yang sudah dibayar",
    },
    {
      title: "Total Pendapatan",
      // total nilai pembayaran dari tiket yang sudah dibayar
      value: loading ? "Loading..." : formatCurrency(totalRevenue),
      icon: DollarSign,
      trend: "",
      description: "Total pendapatan dari tiket yang sudah dibayar",
    },
    {
      title: "Tiket Terjual Minggu Ini",
      value: "342",
      icon: TrendingUp,
      trend: "+8.1%",
      description: "dari minggu lalu",
    },
  ]

  return (
    <div className="space-y-6 p-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Gambaran umum penjualan tiket dan performa</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
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
    </div>
  )
}
