export function generateInvoiceNumber(): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `INV-${timestamp}-${random}`
  }
  
  export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "GHS",
    }).format(amount)
  }
  
  export function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
  
  export function calculateLineTotal(price: number, quantity: number): number {
    return price * quantity
  }
  
  export function calculateSubtotal(items: { lineTotal: number }[]): number {
    return items.reduce((sum, item) => sum + item.lineTotal, 0)
  }
  
  export function calculateTax(subtotal: number, taxRate: number): number {
    return (subtotal * taxRate) / 100
  }
  
  export function calculateTotal(subtotal: number, taxAmount: number, discount: number): number {
    return subtotal + taxAmount - discount
  }
  