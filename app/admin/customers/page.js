import dbConnect from "@/lib/mongodb"
import User from "@/models/User"
import Order from "@/models/Order"
import { Users, Mail, CalendarDays, Phone, ShieldCheck, Clock3, ShoppingBag, Wallet, UserCircle2 } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AdminCustomersPage() {
  await dbConnect()

  const customers = await User.find({ role: "user" })
    .sort({ createdAt: -1 })
    .lean()

  const orderStats = await Order.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$userId",
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: "$totalPrice" },
        lastOrderDate: { $max: "$createdAt" },
        lastOrderPhone: { $first: "$shippingAddress.phone" },
      },
    },
  ])
  const statsByUserId = new Map(orderStats.map((item) => [String(item._id), item]))
  const customersWithStats = customers.map((customer) => {
    const customerStats = statsByUserId.get(String(customer._id))
    const totalOrders = customerStats?.totalOrders || 0
    const totalSpent = customerStats?.totalSpent || 0
    return {
      ...customer,
      phoneNumber: customer.phoneNumber || customerStats?.lastOrderPhone || "",
      accountStatus: customer.accountStatus || "active",
      lastLoginAt: customer.lastLoginAt || null,
      totalOrders,
      totalSpent,
      aov: totalOrders > 0 ? totalSpent / totalOrders : 0,
      lastOrderDate: customerStats?.lastOrderDate || null,
    }
  })

  const totalCustomers = customersWithStats.length
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const newThisMonth = customersWithStats.filter((customer) => new Date(customer.createdAt) >= thisMonth).length
  const activeCustomers = customersWithStats.filter((customer) => customer.accountStatus === "active").length

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor your customer base and growth.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-background rounded-2xl border border-border/80 p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">Total Customers</p>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black">{totalCustomers}</p>
        </div>

        <div className="bg-background rounded-2xl border border-border/80 p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">New This Month</p>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black">{newThisMonth}</p>
        </div>
        <div className="bg-background rounded-2xl border border-border/80 p-5 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs md:text-sm text-muted-foreground font-semibold uppercase tracking-wide">Active Accounts</p>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black">{activeCustomers}</p>
        </div>
      </div>

      <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border/70">
          <h2 className="font-bold text-lg">Customer List</h2>
        </div>

        {customersWithStats.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No customers found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] text-left border-collapse">
              <thead>
                <tr className="bg-secondary/70 text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="p-4 font-semibold">Profile</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Phone</th>
                  <th className="p-4 font-semibold">Registered</th>
                  <th className="p-4 font-semibold">Account Status</th>
                  <th className="p-4 font-semibold">Last Login</th>
                  <th className="p-4 font-semibold">Total Orders</th>
                  <th className="p-4 font-semibold">Total Spent</th>
                  <th className="p-4 font-semibold">AOV</th>
                  <th className="p-4 font-semibold">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customersWithStats.map((customer) => (
                  <tr key={String(customer._id)} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {customer.profileImageUrl ? (
                          <img
                            src={customer.profileImageUrl}
                            alt={customer.name}
                            className="w-9 h-9 rounded-full object-cover border border-border/70"
                          />
                        ) : (
                          <span className="inline-flex w-9 h-9 rounded-full bg-secondary items-center justify-center text-muted-foreground">
                            <UserCircle2 className="w-5 h-5" />
                          </span>
                        )}
                        <span className="font-semibold">{customer.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        {customer.email}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {customer.phoneNumber || "-"}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${
                        customer.accountStatus === "suspended"
                          ? "bg-rose-100 text-rose-700"
                          : customer.accountStatus === "inactive"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {customer.accountStatus}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="w-4 h-4" />
                        {customer.lastLoginAt ? new Date(customer.lastLoginAt).toLocaleString() : "-"}
                      </span>
                    </td>
                    <td className="p-4 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="p-4 font-semibold">Rs. {Number(customer.totalSpent || 0).toFixed(2)}</td>
                    <td className="p-4 text-muted-foreground">Rs. {Number(customer.aov || 0).toFixed(2)}</td>
                    <td className="p-4 text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
