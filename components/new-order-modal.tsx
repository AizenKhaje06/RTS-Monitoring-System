"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface Item {
  id: number
  item_name: string
  description: string
  default_price: number
}

interface NewOrderModalProps {
  onOrderCreated?: () => void
}

const STATUS_OPTIONS = [
  "PENDING",
  "ONDELIVERY",
  "INTRANSIT",
  "DELIVERED",
  "RETURNED",
  "CANCELLED",
  "DETAINED",
  "PROBLEMATIC",
  "SHOPEE",
]

export function NewOrderModal({ onOrderCreated }: NewOrderModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [contactError, setContactError] = useState("")
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    parcel_date: new Date().toISOString().split('T')[0],
    shipper_name: "",
    address: "",
    contact_number: "",
    cod_amount: 0,
    items: "",
    tracking_number: "",
    status: "PENDING",
  })

  const fetchItems = useCallback(async () => {
    setLoadingItems(true)
    try {
      const response = await fetch("/api/items")
      const data = await response.json()
      
      if (response.ok) {
        setItems(data.items || [])
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load items list",
        })
      }
    } catch (error) {
      console.error("Error fetching items:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load items list",
      })
    } finally {
      setLoadingItems(false)
    }
  }, [toast])

  // Fetch items when modal opens
  useEffect(() => {
    if (open && items.length === 0) {
      fetchItems()
    }
  }, [open, items.length, fetchItems])

  // Validate contact number
  const validateContactNumber = (contact: string): string => {
    if (!contact) return "Contact number is required"
    
    const cleaned = contact.replace(/\s+/g, '') // Remove spaces
    
    // Check if starts with 9 (10 digits required)
    if (cleaned.startsWith('9')) {
      if (cleaned.length !== 10) {
        return "Contact starting with 9 must be 10 digits"
      }
    }
    // Check if starts with 09 (11 digits required)
    else if (cleaned.startsWith('09')) {
      if (cleaned.length !== 11) {
        return "Contact starting with 09 must be 11 digits"
      }
    }
    // Check if starts with 639 or +639 (12 digits required)
    else if (cleaned.startsWith('639') || cleaned.startsWith('+639')) {
      const withoutPlus = cleaned.replace('+', '')
      if (withoutPlus.length !== 12) {
        return "Contact starting with 639/+639 must be 12 digits"
      }
    }
    else {
      return "Contact must start with 9, 09, 639, or +639"
    }
    
    return "" // Valid
  }

  const handleContactChange = (value: string) => {
    setFormData(prev => ({ ...prev, contact_number: value }))
    const error = validateContactNumber(value)
    setContactError(error)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate contact number before submitting
    const contactValidation = validateContactNumber(formData.contact_number)
    if (contactValidation) {
      setContactError(contactValidation)
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: contactValidation,
      })
      return
    }
    
    setLoading(true)

    try {
      const orderData = {
        ...formData,
        normalized_status: formData.status,
      }

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create order")
      }

      toast({
        title: "Order Created",
        description: `Successfully created order${formData.tracking_number ? ' ' + formData.tracking_number : ''}`,
      })

      // Reset form
      setFormData({
        parcel_date: new Date().toISOString().split('T')[0],
        shipper_name: "",
        address: "",
        contact_number: "",
        cod_amount: 0,
        items: "",
        tracking_number: "",
        status: "PENDING",
      })

      // Close modal
      setOpen(false)

      // Trigger refresh
      if (onOrderCreated) {
        onOrderCreated()
      }
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create order",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleItemSelect = (itemName: string) => {
    setFormData(prev => ({ ...prev, items: itemName }))
    
    // Auto-fill price if available
    const selectedItem = items.find(item => item.item_name === itemName)
    if (selectedItem && selectedItem.default_price) {
      setFormData(prev => ({ ...prev, cod_amount: selectedItem.default_price }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>
            Fill in the customer order details below
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.parcel_date}
                onChange={(e) => setFormData(prev => ({ ...prev, parcel_date: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>

            {/* Customer Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={formData.shipper_name}
                onChange={(e) => setFormData(prev => ({ ...prev, shipper_name: e.target.value }))}
                className="col-span-3"
                placeholder="Customer name"
                required
              />
            </div>

            {/* Address */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                Address
              </Label>
              <div className="col-span-3">
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Street, Barangay, Municipality, Province (comma-separated)"
                  required
                />
              </div>
            </div>

            {/* Contact Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="contact" className="text-right">
                Contact No.
              </Label>
              <div className="col-span-3">
                <Input
                  id="contact"
                  value={formData.contact_number}
                  onChange={(e) => handleContactChange(e.target.value)}
                  className={contactError ? "border-red-500" : ""}
                  placeholder="09XXXXXXXXX, 9XXXXXXXXX, or 639XXXXXXXXXX"
                  required
                />
                {contactError && (
                  <p className="text-xs text-red-500 mt-1">{contactError}</p>
                )}
              </div>
            </div>

            {/* Items Dropdown */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="items" className="text-right">
                Items
              </Label>
              <Select
                value={formData.items}
                onValueChange={handleItemSelect}
                disabled={loadingItems}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={loadingItems ? "Loading items..." : "Select item"} />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.item_name}>
                      {item.item_name} {item.default_price > 0 && `- ₱${item.default_price}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <Input
                id="price"
                type="number"
                value={formData.cod_amount || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, cod_amount: parseFloat(e.target.value) || 0 }))}
                className="col-span-3"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            {/* Tracking Number (Optional) */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tracking" className="text-right">
                Tracking No.
              </Label>
              <Input
                id="tracking"
                value={formData.tracking_number}
                onChange={(e) => setFormData(prev => ({ ...prev, tracking_number: e.target.value }))}
                className="col-span-3"
                placeholder="Optional - Leave blank if not available"
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
