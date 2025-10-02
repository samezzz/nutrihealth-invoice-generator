"use client"

import { useState, useRef } from "react"
import { ProductCatalog } from "@/components/product-catalog"
import { InvoicePreview } from "@/components/invoice-preview"
import { InvoiceForm } from "@/components/invoice-form"
import { ShareInvoiceDialog } from "@/components/share-invoice-dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { sampleProducts } from "@/lib/sample-products"
import type { InvoiceData, InvoiceItem, Product, SellerInfo, ClientInfo, PaymentMethod } from "@/lib/types"
import {
  generateInvoiceNumber,
  calculateLineTotal,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
} from "@/lib/invoice-utils"
import { Download, Share2, Loader2 } from "lucide-react"
import Image from "next/image"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function InvoiceGenerator() {
  const [products, setProducts] = useState<Product[]>(sampleProducts)
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map())
  const [invoiceNumber] = useState(generateInvoiceNumber())
  const [invoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().split("T")[0]
  })

  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const [seller, setSeller] = useState<SellerInfo>({
    businessName: "NutriHealth",
    address: "Dome, Accra",
    phone: "+233 55 398 1862",
    email: "",
    taxId: "",
  })

  const [client, setClient] = useState<ClientInfo>({
    name: "",
    address: "",
    email: "",
    phone: "",
  })

  const [taxRate, setTaxRate] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState("Thank you for your business! We appreciate your trust in NutriHealth.")
  const [latePaymentPolicy, setLatePaymentPolicy] = useState(
    "Payment is due within 30 days. Late payments may incur a 2% monthly interest charge.",
  )

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      type: "bank",
      details:
        "Bank Name: EcoBank\nAccount Number: 1234567890\nRouting Number: 987654321\nAccount Name: Nutrihealth",
    },
    {
      type: "mobile",
      details: "Provider: MTN\nPhone Number: +233 55 398 1862\nAccount Name: Nathaniel Kwame Essilfie",
    },
  ])

  const invoiceRef = useRef<HTMLDivElement>(null)

  const handleAddProduct = (product: Product) => {
    setProducts((prev) => [...prev, product])
  }

  const handleAddItem = (product: Product) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev)
      const currentQty = newMap.get(product.id) || 0
      newMap.set(product.id, currentQty + 1)
      return newMap
    })
  }

  const handleRemoveItem = (productId: string) => {
    setSelectedItems((prev) => {
      const newMap = new Map(prev)
      const currentQty = newMap.get(productId) || 0
      if (currentQty > 1) {
        newMap.set(productId, currentQty - 1)
      } else {
        newMap.delete(productId)
      }
      return newMap
    })
  }

  const invoiceItems: InvoiceItem[] = Array.from(selectedItems.entries())
    .map(([productId, quantity]) => {
      const product = products.find((p) => p.id === productId)
      if (!product) return null
      return {
        ...product,
        quantity,
        lineTotal: calculateLineTotal(product.price, quantity),
      }
    })
    .filter((item): item is InvoiceItem => item !== null)

  const subtotal = calculateSubtotal(invoiceItems)
  const taxAmount = calculateTax(subtotal, taxRate)
  const total = calculateTotal(subtotal, taxAmount, discount)

  const invoiceData: InvoiceData = {
    invoiceNumber,
    invoiceDate,
    dueDate,
    seller,
    client,
    items: invoiceItems,
    subtotal,
    taxRate,
    taxAmount,
    discount,
    total,
    paymentMethods,
    notes,
    latePaymentPolicy,
  }

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return
    
    setIsGeneratingPDF(true)
    try {
      const element = invoiceRef.current
      
      // Add a small delay to ensure all content is rendered
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Try to capture the element
      const canvas = await html2canvas(element, {
        scale: 1.2,
        useCORS: true,
        allowTaint: true,
        logging: false, // Disable logging to avoid color function errors
        backgroundColor: "#ffffff",
        width: element.offsetWidth,
        height: element.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element) => {
          // Skip elements that might cause color parsing issues
          return element.tagName === 'STYLE' || element.tagName === 'SCRIPT'
        },
        onclone: (clonedDoc) => {
          // Remove problematic CSS that might contain lab() or other modern color functions
          const styleSheets = clonedDoc.styleSheets
          for (let i = 0; i < styleSheets.length; i++) {
            try {
              const rules = styleSheets[i].cssRules
              for (let j = 0; j < rules.length; j++) {
                const rule = rules[j]
                if (rule.style && rule.style.cssText.includes('lab(')) {
                  rule.style.cssText = rule.style.cssText.replace(/lab\([^)]+\)/g, '#000000')
                }
              }
            } catch (e) {
              // Ignore cross-origin stylesheet errors
            }
          }
        }
      })
      
      // Validate canvas
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error("Canvas capture failed")
      }
      
      const imgData = canvas.toDataURL("image/png", 0.8)
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      })
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 0
      
      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      
      // Save with a unique filename
      const fileName = `invoice-${invoiceData.invoiceNumber}-${Date.now()}.pdf`
      pdf.save(fileName)
      
    } catch (error) {
      console.error("PDF generation error:", error)
      
      // Provide user feedback
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      alert(`PDF generation failed: ${errorMessage}. Please try using your browser's print function instead.`)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Image src="/NutriHealth.png" alt="NutriHealth logo" width={110} height={110} className="object-cover" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">NutriHealth Invoice Generator</h1>
              <p className="text-sm text-muted-foreground">
                Create professional invoices for your healthy and tasty teas
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShareDialogOpen(true)} size="lg" variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button onClick={handleDownloadPDF} size="lg" className="gap-2" disabled={isGeneratingPDF}>
              {isGeneratingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isGeneratingPDF ? "Generating..." : "Download PDF"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <ProductCatalog
              products={products}
              selectedItems={selectedItems}
              onAddItem={handleAddItem}
              onRemoveItem={handleRemoveItem}
              onAddProduct={handleAddProduct}
            />
            {invoiceItems.length > 0 && (
              <div className="bg-card p-4 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  {invoiceItems.length} item(s) selected • Subtotal:{" "}
                  <span className="font-semibold text-primary">${subtotal.toFixed(2)}</span>
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details">
            <InvoiceForm
              seller={seller}
              client={client}
              dueDate={dueDate}
              taxRate={taxRate}
              discount={discount}
              notes={notes}
              latePaymentPolicy={latePaymentPolicy}
              paymentMethods={paymentMethods}
              onSellerChange={setSeller}
              onClientChange={setClient}
              onDueDateChange={setDueDate}
              onTaxRateChange={setTaxRate}
              onDiscountChange={setDiscount}
              onNotesChange={setNotes}
              onLatePaymentPolicyChange={setLatePaymentPolicy}
              onPaymentMethodsChange={setPaymentMethods}
            />
          </TabsContent>

          <TabsContent value="preview">
            <div id="invoice-preview" ref={invoiceRef}>
              <InvoicePreview data={invoiceData} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ShareInvoiceDialog 
        open={shareDialogOpen} 
        onOpenChange={setShareDialogOpen} 
        invoiceData={invoiceData}
      />

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block,
          .print\\:block * {
            visibility: visible;
          }
          button,
          nav,
          [role='tablist'] {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
