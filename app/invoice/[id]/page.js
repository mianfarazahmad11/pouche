import dbConnect from "@/lib/mongodb"
import Order from "@/models/Order"
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import AutoPrintOnLoad from "@/components/AutoPrintOnLoad"

export const dynamic = 'force-dynamic'

export default async function InvoicePage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const autoPrint = resolvedSearchParams?.print === '1';
  await dbConnect()
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  let order = await Order.findById(resolvedParams.id).populate('userId', 'name email createdAt')
  
  if (!order) {
    return <div className="text-center py-20 text-2xl font-bold">Invoice not found.</div>
  }

  if (session.role !== 'admin' && order.userId._id.toString() !== session.userId) {
    return <div className="text-center py-20 text-2xl font-bold text-destructive">Unauthorized</div>
  }

  const orderData = JSON.parse(JSON.stringify(order))

  return (
    <div className="max-w-4xl mx-auto py-8">
      <AutoPrintOnLoad enabled={autoPrint} />
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link href="/orders" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4"/> Back to Orders
        </Link>
        <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <Printer className="w-4 h-4"/> Press Ctrl+P to Print
        </div>
      </div>

      <div className="bg-white text-black p-8 md:p-12 border rounded-none shadow-xl print:shadow-none print:border-none print:p-0">
        <div className="flex justify-between items-start border-b pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-[#1a1a1a]">LuxeShop</h1>
            <p className="text-gray-500 mt-1">123 Premium Way, Aesthetic City</p>
            <p className="text-gray-500">contact@luxeshop.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-gray-200 mb-2 uppercase">Invoice</h2>
            <p className="font-mono font-bold text-gray-700">#{orderData._id.slice(-8).toUpperCase()}</p>
            <p className="text-gray-500 text-sm mt-1">{new Date(orderData.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</h3>
          <p className="font-bold text-lg">{orderData.userId.name}</p>
          <p className="text-gray-600">{orderData.userId.email}</p>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
              <th className="py-3 font-semibold">Item</th>
              <th className="py-3 font-semibold text-center">Qty</th>
              <th className="py-3 font-semibold text-right">Price</th>
              <th className="py-3 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orderData.products.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-4 text-gray-800 font-medium">{item.name}</td>
                <td className="py-4 text-center text-gray-600">{item.quantity}</td>
                <td className="py-4 text-right text-gray-600">Rs. {item.priceAtPurchase.toFixed(2)}</td>
                <td className="py-4 text-right font-bold text-gray-800">Rs. {(item.quantity * item.priceAtPurchase).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-8 flex justify-end">
          <div className="w-64 space-y-3">
             <div className="flex justify-between text-gray-500">
               <span>Subtotal</span>
               <span>Rs. {orderData.products.reduce((acc, curr) => acc + curr.quantity * curr.priceAtPurchase, 0).toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-gray-500 pb-3 border-b border-gray-200">
               <span>Shipping</span>
               <span>Rs. { (orderData.totalPrice - orderData.products.reduce((acc, curr) => acc + curr.quantity * curr.priceAtPurchase, 0)).toFixed(2) }</span>
             </div>
             <div className="flex justify-between text-2xl font-black text-gray-800 pt-1">
               <span>Total</span>
               <span>Rs. {orderData.totalPrice.toFixed(2)}</span>
             </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-200 text-center text-gray-400 text-sm">
          Thank you for your business. For any inquiries about this invoice, please contact support.
        </div>
      </div>
    </div>
  )
}
