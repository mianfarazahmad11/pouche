export function getProductAvailability(product = {}) {
  const status = String(product?.status || 'active').toLowerCase()
  const quantity = Number(product?.quantity || 0)
  const lowStockAlertLevel = Number(product?.lowStockAlertLevel || 0)

  if (status === 'draft') {
    return {
      code: 'coming_soon',
      label: 'Coming Soon',
      canPurchase: false,
    }
  }

  if (quantity <= 0) {
    return {
      code: 'out_of_stock',
      label: 'Out of Stock',
      canPurchase: false,
    }
  }

  if (quantity <= lowStockAlertLevel) {
    return {
      code: 'low_stock',
      label: 'Low Stock',
      canPurchase: true,
    }
  }

  return {
    code: 'in_stock',
    label: 'In Stock',
    canPurchase: true,
  }
}
