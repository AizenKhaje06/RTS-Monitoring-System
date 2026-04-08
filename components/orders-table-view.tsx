import { useState, useMemo, useCallback } from "react"
import { Search, ChevronLeft, ChevronRight, Loader2, CheckCircle2, AlertCircle, Package, DollarSign } from "lucide-react"
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
      filtered = filtered.filter(
        (order) =>
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
      totalAmount: totalAmount.toLocaleString('en-PH', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
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

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please load data from the dashboard to view orders.
            </p>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead className="w-[150px]">Name</TableHead>
                  <TableHead className="min-w-[250px]">Address</TableHead>
                  <TableHead className="w-[120px]">Contact No.</TableHead>
                  <TableHead className="w-[100px]">Price</TableHead>
                  <TableHead className="w-[150px]">Items</TableHead>
                  <TableHead className="w-[150px]">Tracking</TableHead>
                  <TableHead className="w-[150px]">Status</TableHead>
                  <TableHead className="w-[180px]">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentOrders.map((order, index) => (
                  <TableRow key={`${order.tracking}-${index}`}>
                    {/* Save Status Indicator */}
                    <TableCell className="text-center">
                      {getSaveIndicator(order)}
                    </TableCell>

                    {/* Date */}
                    <TableCell>
                      <Input
                        type="text"
                        value={formatDate(order.date)}
                        onChange={(e) => handleCellChange(index, "date", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>

                    {/* Name */}
                    <TableCell>
                      <Input
                        type="text"
                        value={order.shipper || ""}
                        onChange={(e) => handleCellChange(index, "shipper", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>

                    {/* Address */}
                    <TableCell>
                      <Input
                        type="text"
                        value={order.fullAddress || ""}
                        onChange={(e) => handleCellChange(index, "fullAddress", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>

                    {/* Contact No. */}
                    <TableCell>
                      <Input
                        type="text"
                        value={order.contactNumber || ""}
                        onChange={(e) => handleCellChange(index, "contactNumber", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      <Input
                        type="number"
                        value={order.codAmount || 0}
                        onChange={(e) => handleCellChange(index, "codAmount", parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm"
                      />
                    </TableCell>

                    {/* Items */}
                    <TableCell>
                      <Input
                        type="text"
                        value={order.items || ""}
                        onChange={(e) => handleCellChange(index, "items", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>

                    {/* Tracking */}
                    <TableCell>
                      <Input
                        type="text"
                        value={order.tracking || ""}
                        onChange={(e) => handleCellChange(index, "tracking", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </TableCell>

                    {/* Status Dropdown */}
                    <TableCell>
                      <Select
                        value={order.normalizedStatus}
                        onValueChange={(value) => handleCellChange(index, "normalizedStatus", value)}
                      >
                        <SelectTrigger className="h-8 text-sm">
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

                    {/* Reason Dropdown - Dynamic based on status */}
                    <TableCell>
                      <Select
                        value={order.reason || ""}
                        onValueChange={(value) => handleCellChange(index, "reason", value)}
                        disabled={order.normalizedStatus !== "RETURNED" && order.normalizedStatus !== "CANCELLED"}
                      >
                        <SelectTrigger className="h-8 text-sm">
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
    </div>
  )
}
