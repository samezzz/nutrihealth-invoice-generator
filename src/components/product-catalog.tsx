"use client"

import type { Product } from "../lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Minus } from "lucide-react"
import Image from "next/image"
import { AddProductDialog } from "@/components/add-product-dialog"

interface ProductCatalogProps {
  products: Product[]
  selectedItems: Map<string, number>
  onAddItem: (product: Product) => void
  onRemoveItem: (productId: string) => void
  onAddProduct: (product: Product) => void
}

export function ProductCatalog({
  products,
  selectedItems,
  onAddItem,
  onRemoveItem,
  onAddProduct,
}: ProductCatalogProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Product Catalog</h2>
        <AddProductDialog onAddProduct={onAddProduct} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const quantity = selectedItems.get(product.id) || 0
          return (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-secondary">
                    <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground truncate">{product.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                    <p className="text-sm font-bold text-primary mt-2">${product.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRemoveItem(product.id)}
                      disabled={quantity === 0}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">{quantity}</span>
                    <Button size="sm" onClick={() => onAddItem(product)} className="h-8 w-8 p-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {quantity > 0 && (
                    <span className="text-sm font-semibold text-primary">${(product.price * quantity).toFixed(2)}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
