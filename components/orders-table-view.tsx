"use client"

import { useState, useMemo, useCallback } from "react"
import { Search, ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertCircle, Package, DollarSign, Eye, Save, Trash2 } from "lucide-react"
import type { ProcessedData, ParcelData } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { NewOrderModal } from "@/components/new-order-modal"
import { ItemsManagementModal } from "@/components/items-management-modal"
import { OrdersExportButton } from "@/components/orders-export-button"
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
  userRole?: "admin" | "tracker" | null
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

export function OrdersTableView({ data, onDataChange, userRole }: OrdersTableViewProps) {
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

  // Keyboard shortcuts
  useMemo(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  // Calculate summary stats based on filtered orders (excluding SHOPEE)
  const summaryStats = useMemo(() => {
    // Filter out SHOPEE orders from stats
    const nonShopeeOrders = filteredOrders.filter(order => order.normalizedStatus !== "SHOPEE")
    
    const totalParcels = nonShopeeOrders.length
    const totalAmount = nonShopeeOrders.reduce((sum, order) => {
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

      // Remove from local state immediately
      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id))
      
      // Close dialogs immediately
      setDeleteDialogOpen(false)
      setEditModalOpen(false)
      setSelectedOrder(null)
      setEditFormData({})
      
      // Show success toast
      toast({
        title: "Order Deleted",
        description: "Successfully deleted order",
      })
      
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
      {/* Header - Responsive */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">ORDERS</h1>
          <p className="text-sm md:text-base text-muted-foreground">View and manage all customer orders (auto-saves changes)</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="text-sm text-muted-foreground flex items-center gap-2 justify-center sm:justify-start">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Auto-save enabled</span>
          </div>
        </div>
      </div>

      {/* Search and Controls - Responsive */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, address, tracking, status... (Ctrl+K)"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchTerm('')
                setCurrentPage(1)
              }
            }}
            className="pl-10"
          />
        </div>
        
        {/* Quick Filter Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">Quick:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              const monthValue = String(today.getMonth() + 1).padStart(2, "0")
              setSelectedMonth("all")
              setSelectedStatus("all")
              setCurrentPage(1)
            }}
            className="h-8 text-xs"
          >
            All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStatus("DELIVERED")
              setCurrentPage(1)
            }}
            className="h-8 text-xs"
          >
            Delivered
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedStatus("RETURNED")
              setCurrentPage(1)
            }}
            className="h-8 text-xs"
          >
            Returned
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground text-center md:text-left whitespace-nowrap">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
        </div>
      </div>

      {/* Filters - Responsive Stack */}
      <div className="space-y-3">
        {/* Active Filters Badge */}
        {(selectedMonth !== "all" || selectedStatus !== "all") && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <span className="text-sm font-medium text-primary">Active Filters:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedMonth !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-background rounded-md text-xs">
                  <span className="text-muted-foreground">Month:</span>
                  <span className="font-medium">{availableMonths.find(m => m === selectedMonth) || selectedMonth}</span>
                </span>
              )}
              {selectedStatus !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-background rounded-md text-xs">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium">{selectedStatus}</span>
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Month Filter */}
        <div className="flex items-center gap-2 flex-1">
          <label className="text-sm font-medium text-foreground whitespace-nowrap">Month:</label>
          <Select value={selectedMonth} onValueChange={(value) => {
            setSelectedMonth(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="flex-1 sm:w-[200px]">
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
        <div className="flex items-center gap-2 flex-1">
          <label className="text-sm font-medium text-foreground whitespace-nowrap">Status:</label>
          <Select value={selectedStatus} onValueChange={(value) => {
            setSelectedStatus(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="flex-1 sm:w-[180px]">
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

        {/* Export Button */}
        <OrdersExportButton orders={filteredOrders} />

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
            className="w-full sm:w-auto"
          >
            Clear Filters
          </Button>
        )}
      </div>
      </div>

      {/* Summary Cards - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-black z-10 shadow-sm">
                <TableRow className="hover:bg-black border-b border-gray-700">
                  <TableHead className="w-[50px] px-3 text-white"></TableHead>
                  <TableHead className="w-[100px] px-3 text-white">Date</TableHead>
                  <TableHead className="w-[150px] px-3 text-white">Name</TableHead>
                  <TableHead className="w-[120px] px-3 text-white">Address</TableHead>
                  <TableHead className="w-[120px] px-3 text-white">Contact No.</TableHead>
                  <TableHead className="w-[90px] px-3 text-white">Price</TableHead>
                  <TableHead className="w-[120px] px-3 text-white">Items</TableHead>
                  <TableHead className="w-[120px] px-3 text-white">Tracking</TableHead>
                  <TableHead className="w-[130px] px-3 text-white">Status</TableHead>
                  <TableHead className="w-[150px] px-3 text-white">Reason</TableHead>
                  <TableHead className="w-[90px] px-3 text-white">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentOrders.map((order, index) => (
                  <TableRow 
                    key={`${order.tracking}-${index}`}
                    className="hover:bg-muted/50 transition-colors even:bg-muted/20"
                  >
                    {/* Save Status Indicator */}
                    <TableCell className="text-center px-3 py-3">
                      {getSaveIndicator(order)}
                    </TableCell>

                    {/* Date - Read Only */}
                    <TableCell className="px-3 py-3">
                      <div className="text-xs text-foreground">
                        {formatDate(order.date)}
                      </div>
                    </TableCell>

                    {/* Name - Read Only */}
                    <TableCell className="max-w-[150px] px-3 py-3">
                      <div className="text-xs text-foreground truncate overflow-hidden" title={order.shipper || ""}>
                        {order.shipper || "-"}
                      </div>
                    </TableCell>

                    {/* Address - Read Only */}
                    <TableCell className="max-w-[120px] px-3 py-3">
                      <div className="text-xs text-foreground truncate overflow-hidden" title={order.fullAddress || ""}>
                        {order.fullAddress || "-"}
                      </div>
                    </TableCell>

                    {/* Contact No. - Read Only */}
                    <TableCell className="px-3 py-3">
                      <div className="text-xs text-foreground">
                        {order.contactNumber || "-"}
                      </div>
                    </TableCell>

                    {/* Price - Read Only */}
                    <TableCell className="px-3 py-3">
                      <div className="text-xs text-foreground font-medium">
                        ₱{order.codAmount || 0}
                      </div>
                    </TableCell>

                    {/* Items - Read Only */}
                    <TableCell className="max-w-[120px] px-3 py-3">
                      <div className="text-xs text-foreground truncate overflow-hidden" title={order.items || ""}>
                        {order.items || "-"}
                      </div>
                    </TableCell>

                    {/* Tracking - Read Only */}
                    <TableCell className="max-w-[120px] px-3 py-3">
                      <div className="text-xs font-mono text-foreground truncate overflow-hidden" title={order.tracking || ""}>
                        {order.tracking || "-"}
                      </div>
                    </TableCell>

                    {/* Status Dropdown */}
                    <TableCell className="px-3 py-3">
                      <Select
                        value={order.normalizedStatus}
                        onValueChange={(value) => handleCellChange(index, "normalizedStatus", value)}
                      >
                        <SelectTrigger className="h-9 text-xs">
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
                    <TableCell className="px-3 py-3">
                      <Select
                        value={order.reason || ""}
                        onValueChange={(value) => handleCellChange(index, "reason", value)}
                        disabled={order.normalizedStatus !== "RETURNED" && order.normalizedStatus !== "CANCELLED"}
                      >
                        <SelectTrigger className="h-9 text-xs">
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
                    <TableCell className="px-3 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order)}
                        className="h-8 px-3 text-xs text-primary hover:text-primary hover:bg-primary/10"
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {currentOrders.map((order, index) => (
          <Card key={`${order.tracking}-${index}`} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{order.shipper || "N/A"}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSaveIndicator(order)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                      className="h-9 px-2"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Address */}
                <div className="text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Address</p>
                  <p className="line-clamp-2">{order.fullAddress || "N/A"}</p>
                </div>

                {/* Contact & Price Row */}
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Contact</p>
                    <p className="font-medium">{order.contactNumber || "N/A"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-medium">₱{order.codAmount || 0}</p>
                  </div>
                </div>

                {/* Items & Tracking */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Items</p>
                    <p className="truncate">{order.items || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Tracking</p>
                    <p className="font-mono text-xs truncate">{order.tracking || "N/A"}</p>
                  </div>
                </div>

                {/* Status & Reason */}
                <div className="flex flex-col gap-2">
                  <Select
                    value={order.normalizedStatus}
                    onValueChange={(value) => handleCellChange(index, "normalizedStatus", value)}
                  >
                    <SelectTrigger className="h-10 text-sm w-full">
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
                  
                  <Select
                    value={order.reason || ""}
                    onValueChange={(value) => handleCellChange(index, "reason", value)}
                    disabled={order.normalizedStatus !== "RETURNED" && order.normalizedStatus !== "CANCELLED"}
                  >
                    <SelectTrigger className="h-10 text-sm w-full">
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
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination - Responsive */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex-1 sm:flex-none h-10"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex-1 sm:flex-none h-10"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      {/* Edit Order Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order Details</DialogTitle>
            <DialogDescription>
              Update customer information and order details
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Date */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="edit-date" className="md:text-right font-medium">Date</Label>
              <Input
                id="edit-date"
                type="text"
                value={editFormData.date || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                className="md:col-span-3"
              />
            </div>

            {/* Name */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="edit-name" className="md:text-right font-medium">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.shipper || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, shipper: e.target.value }))}
                className="md:col-span-3"
              />
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="edit-address" className="md:text-right font-medium">Address</Label>
              <Input
                id="edit-address"
                value={editFormData.fullAddress || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, fullAddress: e.target.value }))}
                className="md:col-span-3"
              />
            </div>

            {/* Contact Number */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="edit-contact" className="md:text-right font-medium">Contact No.</Label>
              <Input
                id="edit-contact"
                value={editFormData.contactNumber || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                className="md:col-span-3"
              />
            </div>

            {/* Price */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="edit-price" className="md:text-right font-medium">Price</Label>
              <Input
                id="edit-price"
                type="number"
                value={editFormData.codAmount || 0}
                onChange={(e) => setEditFormData(prev => ({ ...prev, codAmount: parseFloat(e.target.value) || 0 }))}
                className="md:col-span-3"
              />
            </div>

            {/* Items */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="edit-items" className="md:text-right font-medium">Items</Label>
              <Input
                id="edit-items"
                value={editFormData.items || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, items: e.target.value }))}
                className="md:col-span-3"
              />
            </div>

            {/* Tracking */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="edit-tracking" className="md:text-right font-medium">Tracking</Label>
              <Input
                id="edit-tracking"
                value={editFormData.tracking || ""}
                onChange={(e) => setEditFormData(prev => ({ ...prev, tracking: e.target.value }))}
                className="md:col-span-3"
              />
            </div>

            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="edit-status" className="md:text-right font-medium">Status</Label>
              {userRole === "tracker" ? (
                <Input
                  value={editFormData.normalizedStatus || ""}
                  readOnly
                  disabled
                  className="md:col-span-3 bg-muted"
                />
              ) : (
                <Select
                  value={editFormData.normalizedStatus || ""}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, normalizedStatus: value }))}
                >
                  <SelectTrigger className="md:col-span-3">
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
              )}
            </div>

            {/* Reason */}
            <div className="grid grid-cols-1 md:grid-cols-4 items-start md:items-center gap-2 md:gap-4">
              <Label htmlFor="edit-reason" className="md:text-right font-medium">Reason</Label>
              {userRole === "tracker" ? (
                <Input
                  value={editFormData.reason || ""}
                  readOnly
                  disabled
                  className="md:col-span-3 bg-muted"
                />
              ) : (
                <Select
                  value={editFormData.reason || ""}
                  onValueChange={(value) => setEditFormData(prev => ({ ...prev, reason: value }))}
                  disabled={editFormData.normalizedStatus !== "RETURNED" && editFormData.normalizedStatus !== "CANCELLED"}
                >
                  <SelectTrigger className="md:col-span-3">
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
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isDeleting || isSaving}
              className="w-full sm:w-auto h-10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button
              onClick={handleSaveOrder}
              disabled={isDeleting || isSaving}
              className="w-full sm:w-auto h-10"
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
