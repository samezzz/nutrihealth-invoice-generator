"use client"

import type { Product } from "../lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Minus } from "lucide-react"
import Image from "next/image"
import { AddProductDialog } from "@/components/add-product-dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductCatalogProps {
  products: Product[]
  selectedItems: Map<string, { quantity: number; priceType: 'customer' | 'retail' | 'wholesale' }>
  onAddItem: (product: Product, priceType: 'customer' | 'retail' | 'wholesale') => void
  onRemoveItem: (productId: string) => void
  onPriceTypeChange: (productId: string, priceType: 'customer' | 'retail' | 'wholesale') => void
  onAddProduct: (product: Product) => void
}

export function ProductCatalog({ 
  products, 
  selectedItems, 
  onAddItem, 
  onRemoveItem, 
  onPriceTypeChange,
  onAddProduct 
}: ProductCatalogProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const itemData = selectedItems.get(product.id)
          const quantity = itemData?.quantity || 0
          const priceType = itemData?.priceType || 'retail'
          
          const currentPrice = priceType === 'customer' ? product.customerPrice :
                              priceType === 'retail' ? product.retailPrice :
                              product.wholesalePrice

          return (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative aspect-square">
                <Image
                  src={product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                </div>

                {/* Pricing Options */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pricing:</span>
                    <Select 
                      value={priceType} 
                      onValueChange={(value: 'customer' | 'retail' | 'wholesale') => 
                        onPriceTypeChange(product.id, value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="wholesale">Wholesale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Price:</span>
                    <span className="font-semibold">${currentPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRemoveItem(product.id)}
                      disabled={quantity === 0}
                    >
                      -
                    </Button>
                    <span className="w-8 text-center">{quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAddItem(product, priceType)}
                    >
                      +
                    </Button>
                  </div>
                  
                  {quantity > 0 && (
                    <Badge variant="secondary">
                      ${(currentPrice * quantity).toFixed(2)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <AddProductDialog onAddProduct={onAddProduct} />
    </div>
  )
}
