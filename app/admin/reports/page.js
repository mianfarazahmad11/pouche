import dbConnect from "@/lib/mongodb"
import Order from "@/models/Order"

function formatMoney(amount) {
  return `Rs. ${Number(amount || 0).toFixed(2)}`
}

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  await dbConnect()

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    totalOrders,
    deliveredOrders,
    paidOrders,
    totalRevenueRows,
    last30DaysRevenueRows,
    monthlyRevenueRaw,
    statusRows,
    paymentRows,
    methodRows,
    topProductsRaw,
    topCustomersRaw,
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ status: "delivered" }),
    Order.countDocuments({ paymentStatus: "paid" }),
    Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalPrice" } } }]),
    Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.aggregate([{ $group: { _id: "$paymentStatus", count: { $sum: 1 } } }]),
    Order.aggregate([{ $group: { _id: "$paymentMethod", count: { $sum: 1 } } }]),
    Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.name",
          unitsSold: { $sum: "$products.quantity" },
          revenue: { $sum: { $multiply: ["$products.quantity", "$products.priceAtPurchase"] } },
        },
      },
      { $sort: { unitsSold: -1 } },
      { $limit: 8 },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: "$userId",
          orders: { $sum: 1 },
          totalSpend: { $sum: "$totalPrice" },
          name: { $first: "$customerSnapshot.name" },
          email: { $first: "$customerSnapshot.email" },
        },
      },
      { $sort: { totalSpend: -1 } },
      { $limit: 8 },
    ]),
  ])

  const totalRevenue = totalRevenueRows[0]?.total || 0
  const last30DaysRevenue = last30DaysRevenueRows[0]?.total || 0
  const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0
  const fulfillmentRate = totalOrders ? (deliveredOrders / totalOrders) * 100 : 0
  const paymentSuccessRate = totalOrders ? (paidOrders / totalOrders) * 100 : 0

  const monthlyMap = new Map(
    monthlyRevenueRaw.map((item) => [
      `${item._id.year}-${item._id.month}`,
      { total: item.total || 0, orders: item.orders || 0 },
    ])
  )
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`
    const fromMap = monthlyMap.get(key) || { total: 0, orders: 0 }
    return {
      label: date.toLocaleString("en-US", { month: "short" }),
      ...fromMap,
    }
  })

  const maxMonthlyRevenue = Math.max(...monthly.map((m) => m.total), 1)

  const normalizeRows = (rows, fallback = "unknown") =>
    rows
      .map((row) => ({
        key: String(row._id || fallback).replaceAll("_", " "),
        count: row.count || 0,
      }))
      .sort((a, b) => b.count - a.count)

  const statusBreakdown = normalizeRows(statusRows, "unknown")
  const paymentBreakdown = normalizeRows(paymentRows, "unknown")
  const methodBreakdown = normalizeRows(methodRows, "unknown")

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Store performance summary with sales and customer trends.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard title="Total Revenue" value={formatMoney(totalRevenue)} />
        <StatCard title="Last 30 Days" value={formatMoney(last30DaysRevenue)} />
        <StatCard title="Orders" value={String(totalOrders)} />
        <StatCard title="Avg. Order Value" value={formatMoney(averageOrderValue)} />
        <StatCard title="Fulfillment Rate" value={`${fulfillmentRate.toFixed(1)}%`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-2 p-5 bg-background rounded-2xl border border-border/80 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold tracking-tight">Monthly Revenue</h2>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <div className="h-56 flex items-end gap-3">
            {monthly.map((item) => {
              const height = `${Math.max((item.total / maxMonthlyRevenue) * 100, 6)}%`
              return (
                <div key={item.label} className="flex-1 min-w-0 flex flex-col items-center gap-2">
                  <div className="w-full h-44 flex items-end">
                    <div
                      className="w-full rounded-t-xl bg-primary/80"
                      style={{ height }}
                      title={`${item.label}: ${formatMoney(item.total)}`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{item.label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="p-5 bg-background rounded-2xl border border-border/80 shadow-sm space-y-4">
          <h2 className="font-bold tracking-tight">Conversion Snapshot</h2>
          <MetricRow label="Paid Orders" value={`${paidOrders}/${totalOrders}`} />
          <MetricRow label="Payment Success" value={`${paymentSuccessRate.toFixed(1)}%`} />
          <MetricRow label="Delivered Orders" value={`${deliveredOrders}/${totalOrders}`} />
          <MetricRow label="Revenue / Order" value={formatMoney(averageOrderValue)} />
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <BreakdownCard title="Order Status" rows={statusBreakdown} />
        <BreakdownCard title="Payment Status" rows={paymentBreakdown} />
        <BreakdownCard title="Payment Method" rows={methodBreakdown} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="p-5 bg-background rounded-2xl border border-border/80 shadow-sm">
          <h2 className="font-bold tracking-tight mb-4">Top Products</h2>
          <div className="space-y-2">
            {topProductsRaw.length === 0 ? (
              <p className="text-sm text-muted-foreground">No product sales data yet.</p>
            ) : (
              topProductsRaw.map((item, index) => (
                <div key={`${item._id}-${index}`} className="flex items-center justify-between text-sm border-b border-border/50 py-2">
                  <p className="font-semibold truncate pr-2">{item._id || "Unknown Product"}</p>
                  <p className="text-muted-foreground whitespace-nowrap">
                    {item.unitsSold || 0} sold - {formatMoney(item.revenue || 0)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="p-5 bg-background rounded-2xl border border-border/80 shadow-sm">
          <h2 className="font-bold tracking-tight mb-4">Top Customers</h2>
          <div className="space-y-2">
            {topCustomersRaw.length === 0 ? (
              <p className="text-sm text-muted-foreground">No customer data yet.</p>
            ) : (
              topCustomersRaw.map((item, index) => (
                <div key={`${item._id}-${index}`} className="flex items-center justify-between text-sm border-b border-border/50 py-2">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold truncate">{item.name || "Unknown Customer"}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.email || "No email"}</p>
                  </div>
                  <p className="text-muted-foreground whitespace-nowrap">
                    {item.orders || 0} orders - {formatMoney(item.totalSpend || 0)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function StatCard({ title, value }) {
  return (
    <div className="p-5 bg-background rounded-2xl border border-border/80 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{title}</p>
      <p className="text-2xl font-black tracking-tight mt-2">{value}</p>
    </div>
  )
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function BreakdownCard({ title, rows }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  return (
    <section className="p-5 bg-background rounded-2xl border border-border/80 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold tracking-tight">{title}</h2>
        <span className="text-xs text-muted-foreground">{total} total</span>
      </div>
      <div className="space-y-2.5">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          rows.map((row) => {
            const percentage = total ? (row.count / total) * 100 : 0
            return (
              <div key={row.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize font-semibold text-muted-foreground">{row.key}</span>
                  <span className="font-bold">{row.count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-primary/80" style={{ width: `${Math.max(percentage, row.count > 0 ? 4 : 0)}%` }} />
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
