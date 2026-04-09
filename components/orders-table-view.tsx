"use client"

import { useState, useMemo, useCallback } from "react"
import { Search, ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertCircle, Package, DollarSign, Eye, Save, Trash2, X } from "lucide-react"
import type { ProcessedData, ParcelData } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { NewOrderModal } from "@/components/new-order-modal"
import { ItemsManagementModal } from "@/components/items-management-modal"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"

interface OrdersTableViewProps {
  data: ProcessedData | null
  onDataChange?: () => Promise<void>
}

// Extended ParcelData with ID for tracking
interface OrderWithId extends ParcelData {
  id?: number
}

// Status options including SHOPEE
const STATUS_OPTIONS = [
  "DELIVERED",
  "ONDELIVERY",
  "PENDING",
  "INTRANSIT",
  "RETURNED",
  "CANCELLED",
  "DETAINED",
  "PROBLEMATIC",
  "PENDING FULFILLED",
  "SHOPEE",
  "OTHER",
]

// Return-specific reasons
const RETURN_REASONS = [
  "Customer Refused",
  "Incomplete Address",
  "Wrong Address",
  "Customer Not Available",
  "Unable to Contact Customer",
  "Customer Requested Return",
  "Damaged Item",
  "Wrong Item Delivered",
  "Customer Changed Mind",
  "Other Return Reason",
]

// Cancellation reasons
const CANCELLATION_REASONS = [
  "Customer Cancelled",
  "Out of Stock",
  "Duplicate Order",
  "Payment Issue",
  "Seller Cancelled",
  "Invalid Order",
  "Other Cancellation Reason",
]

// Function to get appropriate reason options based on status
const getReasonOptions = (status: string): string[] => {
  if (status === "RETURNED") {
    return RETURN_REASONS
  } else if (status === "CANCELLED") {
    return CANCELLATION_REASONS
  } else {
    // For other statuses, no reason dropdown (empty or disabled)
    return []
  }
}

export function OrdersTableView({ data, onDataChange }: OrdersTableViewProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [orders, setOrders] = useState<OrderWithId[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [savingStates, setSavingStates] = useState<Record<string, "saving" | "saved" | "error">>({})
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithId | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<OrderWithId>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { toast } = useToast()

  // Initialize orders from data with IDs
  useMemo(() => {
    if (data?.all?.data) {
      // Use actual Supabase ID from data
      console.log("📦 Loading orders, first order:", data.all.data[0])
      console.log("📦 First order has ID?", data.all.data[0]?.id)
      setOrders(data.all.data as OrderWithId[])
      if (!isInitialized) {
        setIsInitialized(true)
      }
    }
  }, [data])

  // Auto-save function with debounce
  const autoSaveOrder = useCallback(async (order: OrderWithId, field: keyof ParcelData, value: string | number) => {
    const orderKey = order.tracking || `order-${order.id}`

    // Check if order has valid ID
    if (!order.id) {
      console.error("❌ Cannot save: Order has no ID", order)
      setSavingStates(prev => ({ ...prev, [orderKey]: "error" }))
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Order has no valid ID. Please refresh the page.",
      })
      setTimeout(() => {
        setSavingStates(prev => {
          const newState = { ...prev }
          delete newState[orderKey]
          return newState
        })
      }, 3000)
      return
    }

    // Set saving state
    setSavingStates(prev => ({ ...prev, [orderKey]: "saving" }))

    try {
      // Prepare updates object
      const updates: Partial<ParcelData> = {
        [field]: value
      }

      console.log(`💾 Saving order ID ${order.id}, field: ${field}, value:`, value)

      // Call update API
      const response = await fetch("/api/supabase/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: order.id,
          updates
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("❌ API Error:", result)
        throw new Error(result.error || "Failed to update order")
      }

      console.log("✅ Successfully saved order ID", order.id)

      // Show success toast
      toast({
        title: "Changes Saved",
        description: `Successfully updated ${field} for tracking ${order.tracking || 'order'}`,
        duration: 2000,
      })

      // Set saved state
      setSavingStates(prev => ({ ...prev, [orderKey]: "saved" }))

      // NOTE: We don't refresh data here to avoid re-rendering and losing scroll position
      // The local state is already updated, and other pages will get fresh data from cache

      // Clear saved indicator after 2 seconds
      setTimeout(() => {
        setSavingStates(prev => {
          const newState = { ...prev }
          delete newState[orderKey]
          return newState
        })
      }, 2000)

    } catch (error) {
      console.error("❌ Error saving order:", error)
      setSavingStates(prev => ({ ...prev, [orderKey]: "error" }))

      // Show error toast
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save changes. Please try again.",
        duration: 3000,
      })

      // Clear error indicator after 3 seconds
      setTimeout(() => {
        setSavingStates(prev => {
          const newState = { ...prev }
          delete newState[orderKey]
          return newState
        })
      }, 3000)
    }
  }, [onDataChange])

  // Filter orders based on search term, month, and status
  const filteredOrders = useMemo(() => {
    let filtered = orders

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      filtered = filtered.filter((order) =>
        order.shipper?.toLowerCase().includes(lowerSearch) ||
        order.fullAddress?.toLowerCase().includes(lowerSearch) ||
        order.contactNumber?.toLowerCase().includes(lowerSearch) ||
        order.items?.toLowerCase().includes(lowerSearch) ||
        order.tracking?.toLowerCase().includes(lowerSearch) ||
        order.normalizedStatus?.toLowerCase().includes(lowerSearch)
      )
    }

    // Apply month filter
    if (selectedMonth !== "all") {
      filtered = filtered.filter((order) => {
        if (!order.date) return false
        const orderDate = new Date(order.date)
        const orderMonth = orderDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })
        return orderMonth === selectedMonth
      })
    }

    // Apply status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((order) => order.normalizedStatus === selectedStatus)
    }

    return filtered
  }, [orders, searchTerm, selectedMonth, selectedStatus])

  // Get unique months from orders
  const availableMonths = useMemo(() => {
    const months = new Set<string>()
    orders.forEach((order) => {
      if (order.date) {
        try {
          const date = new Date(order.date)
          if (!isNaN(date.getTime())) {
            const monthYear = date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
            months.add(monthYear)
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    })
    return Array.from(months).sort((a, b) => {
      const dateA = new Date(a)
      const dateB = new Date(b)
      return dateB.getTime() - dateA.getTime() // Most recent first
    })
  }, [orders])

  // Calculate summary stats based on filtered orders
  const summaryStats = useMemo(() => {
    const totalParcels = filteredOrders.length
    const totalAmount = filteredOrders.reduce((sum, order) => {
      return sum + (order.codAmount || 0)
    }, 0)

    return {
      totalParcels,
      totalAmount: totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
  }, [filteredOrders])

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentOrders = filteredOrders.slice(startIndex, endIndex)

  // Handle cell edit with auto-save
  const handleCellChange = (rowIndex: number, field: keyof ParcelData, value: string | number) => {
    const actualIndex = startIndex + rowIndex
    const orderToUpdate = filteredOrders[actualIndex]
    const originalIndex = orders.findIndex(o => o.id === orderToUpdate.id)

    if (originalIndex !== -1) {
      const updatedOrders = [...orders]
      updatedOrders[originalIndex] = {
        ...updatedOrders[originalIndex],
        [field]: value,
      }
      setOrders(updatedOrders)

      // Auto-save to Supabase
      autoSaveOrder(updatedOrders[originalIndex], field, value)
    }
  }

  // Format date for display
  const formatDate = (dateValue: string | number): string => {
    if (!dateValue) return ""
    const dateStr = dateValue.toString().trim()

    try {
      const numDate = parseFloat(dateStr)
      if (!isNaN(numDate) && numDate.toString() === dateStr) {
        // Excel serial date
        const d = new Date(Date.UTC(1899, 11, 30) + numDate * 86400000)
        return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
      } else {
        const d = new Date(dateStr)
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
        }
      }
    } catch {
      // Return as-is if parsing fails
    }

    return dateStr
  }

  // Get save status indicator
  const getSaveIndicator = (order: OrderWithId) => {
    const orderKey = order.tracking || `order-${order.id}`
    const state = savingStates[orderKey]

    if (state === "saving") {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }
    if (state === "saved") {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    }
    if (state === "error") {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
    return null
  }

  // Handle view/edit order
  const handleViewOrder = (order: OrderWithId) => {
    setSelectedOrder(order)
    setEditFormData({ ...order })
    setEditModalOpen(true)
  }

  // Handle save edited order
  const handleSaveOrder = async () => {
    if (!selectedOrder?.id) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/supabase/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedOrder.id,
          updates: editFormData
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update order")
      }

      toast({
        title: "Order Updated",
        description: "Successfully updated order information",
      })

      // Update local state
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...editFormData } : o))
      setEditModalOpen(false)
      
      // Refresh data
      if (onDataChange) {
        await onDataChange()
      }
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update order",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete order
  const handleDeleteOrder = async () => {
    if (!selectedOrder?.id) return

    setIsDeleting(true)
    try {
      console.log("🗑️ Deleting order ID:", selectedOrder.id)
      
      const response = await fetch(`/api/supabase/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedOrder.id
        }),
      })

      const result = await response.json()
      console.log("Delete API response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete order")
      }

      toast({
        title: "Order Deleted",
        description: "Successfully deleted order",
      })

      // Remove from local state immediately
      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id))
      setDeleteDialogOpen(false)
      setEditModalOpen(false)
      
      // Refresh data in background (don't await)
      if (onDataChange) {
        onDataChange().catch(err => console.error("Background refresh error:", err))
      }
    } catch (error) {
      console.error("❌ Error deleting order:", error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete order",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please load data from the dashboard to view orders.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">ORDERS</h1>
          <p className="text-muted-foreground">View and manage all customer orders (auto-saves changes)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Auto-save enabled</span>
          </div>
          <ItemsManagementModal />
          <NewOrderModal onOrderCreated={onDataChange} />
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, address, tracking, status..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Month:</label>
          <Select value={selectedMonth} onValueChange={(value) => {
            setSelectedMonth(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Months" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {availableMonths.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-foreground">Status:</label>
          <Select value={selectedStatus} onValueChange={(value) => {
            setSelectedStatus(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters Button */}
        {(selectedMonth !== "all" || selectedStatus !== "all") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedMonth("all")
              setSelectedStatus("all")
              setCurrentPage(1)
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Parcels</p>
                <p className="text-3xl font-bold text-foreground mt-2">{summaryStats.totalParcels}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-3xl font-bold text-foreground mt-2">₱{summaryStats.totalAmount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[85px]">Date</TableHead>
                  <TableHead className="w-[140px]">Name</TableHead>
                  <TableHead className="w-[90px]">Address</TableHead>
                  <TableHead className="w-[105px]">Contact No.</TableHead>
                  <TableHead className="w-[70px]">Price</TableHead>
                  <TableHead className="w-[100px]">Items</TableHead>
                  <TableHead className="w-[100px]">Tracking</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[140px]">Reason</TableHead>
                  <TableHead className="w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentOrders.map((order, index) => (
                  <TableRow key={`${order.tracking}-${index}`}>
                    {/* Save Status Indicator */}
                    <TableCell className="text-center">
                      {getSaveIndicator(order)}
                    </TableCell>

                    {/* Date - Read Only */}
                    <TableCell>
                      <div className="text-xs text-foreground py-2 px-2 text-left">
                        {formatDate(order.date)}
                      </div>
                    </TableCell>

                    {/* Name - Read Only */}
                    <TableCell className="max-w-[140px]">
                      <div className="text-xs text-foreground py-2 px-2 text-left truncate overflow-hidden" title={order.shipper || ""}>
                        {order.shipper || "-"}
                      </div>
                    </TableCell>

                    {/* Address - Read Only */}
                    <TableCell className="max-w-[90px]">
                      <div className="text-xs text-foreground py-2 px-2 text-left truncate overflow-hidden" title={order.fullAddress || ""}>
                        {order.fullAddress || "-"}
                      </div>
                    </TableCell>

                    {/* Contact No. - Read Only */}
                    <TableCell>
                      <div className="text-xs text-foreground py-2 px-2 text-left">
                        {order.contactNumber || "-"}
                      </div>
                    </TableCell>

                    {/* Price - Read Only */}
                    <TableCell>
                      <div className="text-xs text-foreground py-2 px-2 text-left font-medium">
                        ₱{order.codAmount || 0}
                      </div>
                    </TableCell>

                    {/* Items - Read Only */}
                    <TableCell className="max-w-[100px]">
                      <div className="text-xs text-foreground py-2 px-2 text-left truncate overflow-hidden" title={order.items || ""}>
                        {order.items || "-"}
                      </div>
                    </TableCell>

                    {/* Tracking - Read Only */}
                    <TableCell className="max-w-[100px]">
                      <div className="text-xs font-mono text-foreground py-2 px-2 text-left truncate overflow-hidden" title={order.tracking || ""}>
                        {order.tracking || "-"}
                      </div>
                    </TableCell>

                    {/* Status Dropdown */}
                    <TableCell>
                      <Select
                        value={order.normalizedStatus}
                        onValueChange={(value) => handleCellChange(index, "normalizedStatus", value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
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
                    </TableCell>

                    {/* Reason Dropdown - Editable */}
                    <TableCell>
                      <Select
                        value={order.reason || ""}
                        onValueChange={(value) => handleCellChange(index, "reason", value)}
                        disabled={order.normalizedStatus !== "RETURNED" && order.normalizedStatus !== "CANCELLED"}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder={
                            order.normalizedStatus === "RETURNED" || order.normalizedStatus === "CANCELLED" 
                              ? "Select reason" 
                              : "N/A"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {getReasonOptions(order.normalizedStatus).map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Action Column */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                        className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      {/* Edit Order Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order Details</DialogTitle>
            <DialogDescription>
              Update customer information and order details
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right">Date</Label>
              <Input
                id="edit-date"
                type="text"
                value={editFormData.date || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                className="col-span-3"
              />
            </div>

            {/* Name */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.shipper || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, shipper: e.target.value }))}
                className="col-span-3"
              />
            </div>

            {/* Address */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">Address</Label>
              <Input
                id="edit-address"
                value={editFormData.fullAddress || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, fullAddress: e.target.value }))}
                className="col-span-3"
              />
            </div>

            {/* Contact Number */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-contact" className="text-right">Contact No.</Label>
              <Input
                id="edit-contact"
                value={editFormData.contactNumber || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                className="col-span-3"
              />
            </div>

            {/* Price */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">Price</Label>
              <Input
                id="edit-price"
                type="number"
                value={editFormData.codAmount || 0}
                onChange={(e) => setEditFormData(prev => ({ ...prev, codAmount: parseFloat(e.target.value) || 0 }))}
                className="col-span-3"
              />
            </div>

            {/* Items */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-items" className="text-right">Items</Label>
              <Input
                id="edit-items"
                value={editFormData.items || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, items: e.target.value }))}
                className="col-span-3"
              />
            </div>

            {/* Tracking */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-tracking" className="text-right">Tracking</Label>
              <Input
                id="edit-tracking"
                value={editFormData.tracking || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, tracking: e.target.value }))}
                className="col-span-3"
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">Status</Label>
              <Select
                value={editFormData.normalizedStatus || ""}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, normalizedStatus: value }))}
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

            {/* Reason */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-reason" className="text-right">Reason</Label>
              <Select
                value={editFormData.reason || ""}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, reason: value }))}
                disabled={editFormData.normalizedStatus !== "RETURNED" && editFormData.normalizedStatus !== "CANCELLED"}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {getReasonOptions(editFormData.normalizedStatus || "").map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting || isSaving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button
              onClick={handleSaveOrder}
              disabled={isDeleting || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
              {selectedOrder && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium text-foreground">Order Details:</p>
                  <p className="text-sm text-muted-foreground mt-1">Tracking: {selectedOrder.tracking}</p>
                  <p className="text-sm text-muted-foreground">Customer: {selectedOrder.shipper}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Order
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
