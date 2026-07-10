'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { ShieldCheck, ArrowRight, Loader2 } from 'lucide-react'
import Link from 'next/link'

const initialShippingAddress = {
  fullName: '',
  phone: '',
  addressLine: '',
  city: '',
  postalCode: '',
  country: '',
}

export default function CheckoutPage() {
  const { cart, user } = useStore()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shippingAddress, setShippingAddress] = useState(initialShippingAddress)
  const [settings, setSettings] = useState({
    currencySymbol: 'Rs.',
    defaultShippingCharges: 200,
    freeShippingThreshold: 5000,
    taxEnabled: false,
    taxPercentage: 0,
    cashOnDeliveryEnabled: true,
    stripeEnabled: true,
  })

  const items = cart?.items || []
  const getProduct = (item) => {
    const product = item?.productId
    if (product && typeof product === 'object') return product
    return null
  }
  const subtotal = items.reduce((acc, item) => {
    const product = getProduct(item)
    if (!product) return acc
    const price = product.discountPrice || product.price || 0
    return acc + price * item.quantity
  }, 0)
  const shipping = subtotal >= settings.freeShippingThreshold ? 0 : settings.defaultShippingCharges
  const taxAmount = settings.taxEnabled ? (subtotal * settings.taxPercentage) / 100 : 0
  const total = subtotal + shipping + taxAmount
  const mergedShippingAddress = {
    ...shippingAddress,
    fullName: shippingAddress.fullName || user?.name || '',
    phone: shippingAddress.phone || user?.phoneNumber || '',
  }

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings/public')
        if (!res.ok) return
        const data = await res.json()
        setSettings((prev) => ({ ...prev, ...data }))
      } catch (err) {
        // Keep default values on public settings failure.
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout')
    }
  }, [user, router])

  const handleShippingAddressChange = (field, value) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }))
  }

  const validateShippingAddress = () => {
    const requiredFields = ['fullName', 'phone', 'addressLine', 'city', 'postalCode', 'country']
    for (const field of requiredFields) {
      if (!String(mergedShippingAddress[field] || '').trim()) {
        return 'Please add your delivery address before placing the order.'
      }
    }
    return ''
  }

  const handleCheckout = async () => {
    const addressError = validateShippingAddress()
    if (addressError) {
      setError(addressError)
      return
    }
    if (!settings.cashOnDeliveryEnabled) {
      setError('Cash on Delivery is currently disabled.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, paymentMethod: 'cod', shippingAddress: mergedShippingAddress }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to initiate checkout')
        setLoading(false)
        return
      }

      router.push(`/checkout/success?method=cod&orderId=${data.orderId}`)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (!user) return null

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground text-lg">Your cart is empty.</p>
        <Link href="/products" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-all">
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in duration-500">
      <h1 className="text-3xl font-extrabold mb-8 tracking-tight">Secure Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <div className="glass p-6 rounded-[2rem] border bg-card space-y-4">
            <h2 className="text-xl font-bold border-b pb-3">Delivery Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full name"
                value={mergedShippingAddress.fullName}
                onChange={(e) => handleShippingAddressChange('fullName', e.target.value)}
                className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={mergedShippingAddress.phone}
                onChange={(e) => handleShippingAddressChange('phone', e.target.value)}
                className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="House / Street / Apartment"
                value={shippingAddress.addressLine}
                onChange={(e) => handleShippingAddressChange('addressLine', e.target.value)}
                className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50 md:col-span-2"
              />
              <input
                type="text"
                placeholder="City"
                value={shippingAddress.city}
                onChange={(e) => handleShippingAddressChange('city', e.target.value)}
                className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="Postal code"
                value={shippingAddress.postalCode}
                onChange={(e) => handleShippingAddressChange('postalCode', e.target.value)}
                className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="text"
                placeholder="Country"
                value={shippingAddress.country}
                onChange={(e) => handleShippingAddressChange('country', e.target.value)}
                className="p-3 border rounded-xl bg-secondary/50 focus:bg-background outline-none focus:ring-2 focus:ring-primary/50 md:col-span-2"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              We&apos;ll use this address for delivery and order records.
            </p>
          </div>

          <h2 className="text-xl font-bold border-b pb-3">Order Summary</h2>
          <div className="space-y-4">
            {items.map((item, index) => {
              const product = getProduct(item)
              if (!product?._id) return null
              const price = product.discountPrice || product.price
              return (
                <div key={`${product._id}-${index}`} className="flex items-center gap-4 p-3 bg-secondary/30 rounded-2xl border">
                  <div className="w-16 h-16 rounded-xl bg-secondary overflow-hidden flex-shrink-0">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Luxe</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm line-clamp-1">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-bold text-sm">{settings.currencySymbol} {(price * item.quantity).toFixed(2)}</div>
                </div>
              )
            })}
          </div>

          <div className="space-y-2 pt-2 border-t">
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>Subtotal</span><span>{settings.currencySymbol} {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground text-sm">
              <span>Shipping</span>
              <span>{shipping === 0 ? <span className="text-green-600 font-semibold">Free</span> : `${settings.currencySymbol} ${shipping.toFixed(2)}`}</span>
            </div>
            {settings.taxEnabled && (
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>Tax ({settings.taxPercentage}%)</span>
                <span>{settings.currencySymbol} {taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-xl pt-2 border-t">
              <span>Total</span><span>{settings.currencySymbol} {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold border-b pb-3">Payment Method</h2>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 p-4 border-2 rounded-2xl transition-all border-primary bg-primary/5 shadow-md">
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center border-primary">
                <div className="w-3 h-3 bg-primary rounded-full" />
              </div>
              <div className="bg-secondary p-1.5 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">Cash on Delivery</p>
                <p className="text-xs text-muted-foreground">
                  {settings.cashOnDeliveryEnabled ? 'Pay with cash at your doorstep' : 'Currently unavailable'}
                </p>
              </div>
            </div>
          </div>

          {!settings.cashOnDeliveryEnabled && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-2xl text-sm font-bold text-center border border-destructive/20">
              Cash on Delivery is currently unavailable. Please contact support.
            </div>
          )}

          <div className="glass p-6 rounded-[2.5rem] border bg-card space-y-6">
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-primary/5 border border-primary/20 p-6 rounded-3xl space-y-3 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-black text-lg tracking-tight">Cash on Delivery</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Place your order now and pay with cash when our delivery partner reaches your doorstep.
                </p>
              </div>
              <div className="bg-secondary/30 p-4 rounded-2xl text-[10px] font-bold text-center text-muted-foreground uppercase tracking-widest border border-border/50">
                Order will be verified via phone call
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-2xl text-sm font-bold text-center border border-destructive/20 animate-shake">
                {error}
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={loading || !settings.cashOnDeliveryEnabled}
              className={`w-full bg-primary text-primary-foreground py-5 rounded-[2rem] font-black text-lg hover:bg-primary/90 transition-all shadow-xl flex justify-center items-center gap-3 ${loading ? 'opacity-70 cursor-wait' : 'hover:scale-[1.02] active:scale-95'}`}
            >
              {loading ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Processing...</>
              ) : (
                <>Place Order · {settings.currencySymbol} {total.toFixed(2)} <ArrowRight className="w-6 h-6" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
