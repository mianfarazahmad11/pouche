'use client'
import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { FileText, Search, Eye, Printer, Download, XCircle } from 'lucide-react'
import DataTable from '@/components/DataTable'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sort: 'latest',
    from: '',
    to: '',
  })

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleStatusChange = async (id, newStatus, newPaymentStatus) => {
    setUpdatingId(id)
    const payload = {}
    if (newStatus) payload.status = newStatus
    if (newPaymentStatus) payload.paymentStatus = newPaymentStatus
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    setUpdatingId(null)
    fetchOrders()
  }

  const filteredOrders = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    const fromTime = filters.from ? new Date(filters.from).getTime() : null
    const toTime = filters.to ? new Date(filters.to).getTime() : null

    let list = Array.isArray(orders) ? [...orders] : []

    if (q) {
      list = list.filter((o) => {
        const orderId = String(o._id || '').toLowerCase()
        const name = String(o.userId?.name || o.customerSnapshot?.name || '').toLowerCase()
        const email = String(o.userId?.email || o.customerSnapshot?.email || '').toLowerCase()
        return orderId.includes(q) || name.includes(q) || email.includes(q)
      })
    }

    if (filters.status !== 'all') {
      list = list.filter((o) => o.status === filters.status)
    }

    if (fromTime) {
      list = list.filter((o) => new Date(o.createdAt).getTime() >= fromTime)
    }
    if (toTime) {
      const end = new Date(filters.to)
      end.setHours(23, 59, 59, 999)
      list = list.filter((o) => new Date(o.createdAt).getTime() <= end.getTime())
    }

    if (filters.sort === 'latest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (filters.sort === 'oldest') list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    if (filters.sort === 'amount_high') list.sort((a, b) => (b.totalPrice || 0) - (a.totalPrice || 0))
    if (filters.sort === 'amount_low') list.sort((a, b) => (a.totalPrice || 0) - (b.totalPrice || 0))
    return list
  }, [orders, filters])

  const openDetails = (order) => setSelectedOrder(order)
  const closeDetails = () => setSelectedOrder(null)

  const columns = useMemo(() => [
    {
      key: 'orderId',
      header: 'Order ID',
      render: (o) => <span className="font-mono text-sm">#{o._id?.slice(-8).toUpperCase()}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <div>
          <div className="font-semibold">{o.userId?.name || o.customerSnapshot?.name || 'Unknown User'}</div>
          <div className="text-sm text-muted-foreground">{o.userId?.email || o.customerSnapshot?.email || 'No email'}</div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date & Time',
      render: (o) => <span className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      render: (o) => <span className="font-bold text-foreground">Rs. {(o.totalPrice || 0).toFixed(2)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => (
        <select
          value={o.status}
          disabled={updatingId === o._id}
          onChange={(e) => handleStatusChange(o._id, e.target.value)}
          className={`p-2 rounded-lg text-sm font-semibold uppercase tracking-wider outline-none border cursor-pointer
            ${o.status === 'delivered' ? 'bg-green-100 text-green-700 border-green-200' :
              o.status === 'processing' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
              o.status === 'shipped' ? 'bg-blue-100 text-blue-700 border-blue-200' :
              o.status === 'cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
              'bg-yellow-100 text-yellow-700 border-yellow-200'}
          `}
        >
          <option value="awaiting_payment">Awaiting Payment</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (o) => (
        <select
          value={o.paymentStatus || 'unpaid'}
          disabled={updatingId === o._id}
          onChange={(e) => handleStatusChange(o._id, null, e.target.value)}
          className="p-2 rounded-lg text-xs font-semibold uppercase tracking-wider outline-none border cursor-pointer bg-secondary/40"
        >
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="failed">Failed</option>
        </select>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (o) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => openDetails(o)} className="text-sm font-medium flex items-center gap-1.5 px-3 py-2 bg-secondary rounded-lg hover:bg-border transition-colors">
            <Eye className="w-4 h-4"/> View
          </button>
          <Link href={`/invoice/${o._id}`} className="text-sm font-medium flex items-center gap-1.5 px-3 py-2 bg-secondary rounded-lg hover:bg-border transition-colors">
            <FileText className="w-4 h-4"/> Invoice
          </Link>
          <button onClick={() => window.open(`/invoice/${o._id}?print=1`, '_blank')} className="text-sm font-medium flex items-center gap-1.5 px-3 py-2 bg-secondary rounded-lg hover:bg-border transition-colors">
            <Download className="w-4 h-4"/> PDF
          </button>
          <button onClick={() => window.open(`/invoice/${o._id}?print=1`, '_blank')} className="text-sm font-medium flex items-center gap-1.5 px-3 py-2 bg-secondary rounded-lg hover:bg-border transition-colors">
            <Printer className="w-4 h-4"/> Print
          </button>
          {o.status !== 'cancelled' ? (
            <button onClick={() => handleStatusChange(o._id, 'cancelled')} className="text-sm font-medium flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive hover:text-white transition-colors">
              <XCircle className="w-4 h-4"/> Cancel
            </button>
          ) : null}
        </div>
      ),
    },
  ], [updatingId])

  return (
    <div className="space-y-8 min-w-0 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">Manage Orders</h1>
      </div>

      <div className="bg-background p-4 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Order ID, Name, Email"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 p-2.5 border rounded-xl bg-secondary/50"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          className="p-2.5 border rounded-xl bg-secondary/50"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="awaiting_payment">Awaiting Payment</option>
        </select>
        <select
          value={filters.sort}
          onChange={(e) => setFilters((prev) => ({ ...prev, sort: e.target.value }))}
          className="p-2.5 border rounded-xl bg-secondary/50"
        >
          <option value="latest">Latest</option>
          <option value="oldest">Oldest</option>
          <option value="amount_high">Amount High</option>
          <option value="amount_low">Amount Low</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input type="date" value={filters.from} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))} className="p-2.5 border rounded-xl bg-secondary/50" />
          <input type="date" value={filters.to} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))} className="p-2.5 border rounded-xl bg-secondary/50" />
        </div>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground animate-pulse p-10">Loading orders...</div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredOrders}
          rowKey={(row) => row._id}
          emptyText="No orders found."
          bodyScrollable={true}
          bodyMaxHeightClass="max-h-[62vh]"
          initialPageSize={10}
        />
      )}

      {selectedOrder ? (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] p-4 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-background rounded-2xl border shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-xl font-bold">Order Details #{selectedOrder._id?.slice(-8).toUpperCase()}</h3>
              <button onClick={closeDetails} className="text-muted-foreground hover:text-foreground">Close</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold">Customer Info</h4>
                  <p className="text-sm">{selectedOrder.userId?.name || selectedOrder.customerSnapshot?.name || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">{selectedOrder.userId?.email || selectedOrder.customerSnapshot?.email || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Shipping Address</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedOrder.shippingAddress?.fullName || 'Not provided'}<br />
                    {selectedOrder.shippingAddress?.phone || ''}<br />
                    {selectedOrder.shippingAddress?.addressLine || 'Address not provided'}<br />
                    {[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.postalCode, selectedOrder.shippingAddress?.country].filter(Boolean).join(', ') || ''}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Products ({selectedOrder.products?.length || 0} items)</h4>
                <div className="space-y-2">
                  {(selectedOrder.products || []).map((item, idx) => (
                    <div key={`${item.productId || item.name}-${idx}`} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                      <span>{item.name}</span>
                      <span>Qty {item.quantity} x Rs. {(item.priceAtPurchase || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">Payment</p>
                  <p>Method: {(selectedOrder.paymentMethod || 'N/A').toUpperCase()}</p>
                  <p>Status: {(selectedOrder.paymentStatus || 'unpaid').toUpperCase()}</p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">Price Breakdown</p>
                  <p>Subtotal: Rs. {(selectedOrder.subtotal || 0).toFixed(2)}</p>
                  <p>Shipping: Rs. {(selectedOrder.shippingAmount || 0).toFixed(2)}</p>
                  <p>Tax: Rs. {(selectedOrder.taxAmount || 0).toFixed(2)}</p>
                  <p className="font-bold">Total: Rs. {(selectedOrder.totalPrice || 0).toFixed(2)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Order Timeline</h4>
                <div className="space-y-2">
                  {(selectedOrder.statusHistory || []).slice().reverse().map((entry, idx) => (
                    <div key={`${entry.status}-${entry.changedAt}-${idx}`} className="text-sm border-l-2 border-primary/40 pl-3 py-1">
                      <p className="font-semibold uppercase text-xs">{entry.status}</p>
                      <p className="text-muted-foreground">{entry.note || 'Status updated'}</p>
                      <p className="text-xs text-muted-foreground">{entry.changedAt ? new Date(entry.changedAt).toLocaleString() : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
