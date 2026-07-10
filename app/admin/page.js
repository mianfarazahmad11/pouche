import dbConnect from "@/lib/mongodb"
import Order from "@/models/Order"
import Product from "@/models/Product"
import User from "@/models/User"
import { ArrowUpRight, Package, ShoppingCart, TrendingUp, Users } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AdminOverview() {
  await dbConnect()
  const ordersCount = await Order.countDocuments()
  const productsCount = await Product.countDocuments()
  const usersCount = await User.countDocuments()
  
  const totalRevenueData = await Order.aggregate([
    { $group: { _id: null, total: { $sum: "$totalPrice" } } }
  ])
  const revenue = totalRevenueData[0]?.total || 0
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const monthlyRevenueRaw = await Order.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total: { $sum: "$totalPrice" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ])

  const monthlyRevenueMap = new Map(
    monthlyRevenueRaw.map((item) => [`${item._id.year}-${item._id.month}`, item.total || 0])
  )
  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const label = date.toLocaleString("en-US", { month: "short" })
    return {
      label,
      total: monthlyRevenueMap.get(`${year}-${month}`) || 0,
    }
  })

  const statusRows = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ])
  const statusCounts = {
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    awaiting_payment: 0,
  }
  for (const row of statusRows) {
    const key = String(row._id || "")
    if (Object.prototype.hasOwnProperty.call(statusCounts, key)) {
      statusCounts[key] = row.count || 0
    }
  }
  const statusChart = [
    { key: "pending", label: "Pending", color: "bg-yellow-500" },
    { key: "processing", label: "Processing", color: "bg-indigo-500" },
    { key: "shipped", label: "Shipped", color: "bg-blue-500" },
    { key: "delivered", label: "Delivered", color: "bg-emerald-500" },
    { key: "cancelled", label: "Cancelled", color: "bg-rose-500" },
    { key: "awaiting_payment", label: "Awaiting Payment", color: "bg-orange-500" },
  ].map((item) => ({
    ...item,
    count: statusCounts[item.key] || 0,
  }))
  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map((m) => m.total), 1)
  const totalStatusOrders = statusChart.reduce((sum, item) => sum + item.count, 0)
  const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.total || 0
  const previousMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.total || 0
  const revenueGrowth = previousMonthRevenue
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    : currentMonthRevenue > 0
      ? 100
      : 0
  const currency = new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 2,
  })
  const stats = [
    {
      label: "Total Revenue",
      value: currency.format(revenue),
      icon: TrendingUp,
      iconClass: "bg-primary/15 text-primary",
    },
    {
      label: "Valid Orders",
      value: String(ordersCount),
      icon: ShoppingCart,
      iconClass: "bg-blue-500/15 text-blue-500",
    },
    {
      label: "Live Products",
      value: String(productsCount),
      icon: Package,
      iconClass: "bg-green-500/15 text-green-500",
    },
    {
      label: "Customers",
      value: String(usersCount),
      icon: Users,
      iconClass: "bg-purple-500/15 text-purple-500",
    },
  ]

  return (
    <div className="space-y-6 md:space-y-7 animate-in fade-in duration-500">
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Performance Summary
            </p>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">Dashboard Overview</h1>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Real-time snapshot of sales, orders, products, and customer activity.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/85 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Revenue Momentum</p>
            <p className="mt-1 flex items-center gap-2 text-xl font-black tracking-tight">
              {revenueGrowth >= 0 ? "+" : ""}
              {revenueGrowth.toFixed(1)}%
              <span className={`inline-flex rounded-full p-1 ${revenueGrowth >= 0 ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"}`}>
                <ArrowUpRight className={`h-4 w-4 ${revenueGrowth < 0 ? "rotate-90" : ""}`} />
              </span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Compared with previous month</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-5">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="group relative overflow-hidden rounded-2xl border border-border/80 bg-background p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
              <div className="relative mb-4 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground md:text-sm">
                  {item.label}
                </h3>
                <div className={`p-2.5 rounded-xl ${item.iconClass}`}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
              </div>
              <div className="relative text-2xl font-black tracking-tight md:text-3xl">{item.value}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 md:gap-5">
        <div className="rounded-2xl border border-border/80 bg-background p-5 shadow-sm md:p-6 xl:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight md:text-lg">Monthly Revenue</h2>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <div className="h-56 flex items-end gap-3 rounded-xl bg-secondary/20 px-3 pb-3 pt-4">
            {monthlyRevenue.map((item) => {
              const height = `${Math.max((item.total / maxMonthlyRevenue) * 100, 6)}%`
              return (
                <div key={item.label} className="flex-1 min-w-0 flex flex-col items-center gap-2">
                  <div className="flex h-44 w-full items-end">
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-primary to-primary/60 transition-all duration-200 hover:brightness-110"
                      style={{ height }}
                      title={`${item.label}: ${currency.format(item.total)}`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-background p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight md:text-lg">Order Status</h2>
            <span className="text-xs text-muted-foreground">{totalStatusOrders} orders</span>
          </div>
          <div className="space-y-3.5">
            {statusChart.map((item) => {
              const percent = totalStatusOrders ? (item.count / totalStatusOrders) * 100 : 0
              return (
                <div key={item.key} className="space-y-1.5 rounded-xl border border-border/60 bg-secondary/10 p-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">{item.label}</span>
                    <span className="font-bold">{item.count}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full ${item.color}`}
                      style={{ width: `${Math.max(percent, item.count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
