"use client"

import { useMemo, useState } from "react"
import { Search, Download, Filter, Package } from "lucide-react"
import type { ProcessedData, FilterState } from "@/lib/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExportMenu } from "@/components/export-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface OrdersReportProps {
  data: ProcessedData | null
  filter: FilterState
  onFilterChange: (filter: FilterState) => void
}

const STATUS_OPTIONS = [
  "DELIVERED",
  "ONDELIVERY",
  "PENDING",
  "INTRANSIT",
  "CANCELLED",
  "DETAINED",
  "PROBLEMATIC",
  "RETURNED",
  "PENDING FULFILLED",
  "OTHER",
]

const REASON_OPTIONS = [
  "Customer Request",
  "Address Issue",
  "Contact Number Invalid",
  "Refused to Accept",
  "No One Home",
  "Incomplete Address",
  "Wrong Item",
  "Damaged Item",
  "COD Issue",
  "Weather Delay",
  "Other",
]

export function OrdersReport({ data, filter, onFilterChange }: OrdersReportProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  const filteredOrders = useMemo(() => {
    if (!data) return []

    let filtered = data.all.data

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.tracking?.toLowerCase().includes(search) ||
          order.items?.toLowerCase().includes(search) ||
          order.fullAddress?.toLowerCase().includes(search) ||
          order.contactNumber?.toLowerCase().includes(search) ||
          order.shipper?.toLowerCase().includes(search)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.normalizedStatus === statusFilter)
    }

    return filtered
  }, [data, searchTerm, statusFilter])

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredOrders.slice(startIndex, endIndex)
  }, [filteredOrders, currentPage])

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)

  const handleStatusChange = (orderId: string, newStatus: string) => {
    // TODO: Implement status update logic
    console.log(`Update order ${orderId} status to ${newStatus}`)
    // This would typically call an API to update the database
  }

  const handleReasonChange = (orderId: string, newReason: string) => {
    // TODO: Implement reason update logic
    console.log(`Update order ${orderId} reason to ${newReason}`)
    // This would typically call an API to update the database
  }

  const handleExport = () => {
    // Export filtered data to CSV
    const headers = [
      "Date",
      "Tracking",
      "Status",
      "Reason",
      "Shipper",
      "Items",
      "Amount",
      "Contact",
      "Address",
      "Province",
      "Municipality",
      "Region",
    ]

    const csvData = filteredOrders.map((order) => [
      order.date,
      order.tracking,
      order.normalizedStatus,
      order.reason || "",
      order.shipper,
      order.items,
      order.codAmount,
      order.contactNumber,
      order.fullAddress,
      order.province,
      order.municipality,
      order.region,
    ])

    const csv = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[600px] p-8">
        <div className="glass-strong rounded-2xl p-12 text-center max-w-2xl border border-border/50">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-6">
            <div className="absolute inset-0 gradient-orange rounded-2xl opacity-20 blur-xl" />
            <div className="relative glass-strong rounded-2xl w-full h-full flex items-center justify-center border border-primary/30">
              <Package className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">No Orders Data</h3>
          <p className="text-muted-foreground text-lg mb-6">
            Load data from the dashboard to view all customer orders
          </p>
          <p className="text-sm text-muted-foreground">
            Navigate to the Parcel dashboard and click &ldquo;Enter Dashboard&rdquo; to load your data
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Orders Management</h1>
          <p className="text-muted-foreground">View and manage all customer orders with editable status and reason</p>
        </div>
        <ExportMenu data={data} region="all" />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by tracking, items, address, contact..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value)
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
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

          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedOrders.length} of {filteredOrders.length} orders
        {searchTerm && ` (filtered from ${data.all.data.length} total)`}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead className="w-[150px]">Tracking</TableHead>
                  <TableHead className="w-[180px]">Status</TableHead>
                  <TableHead className="w-[180px]">Reason</TableHead>
                  <TableHead className="w-[120px]">Shipper</TableHead>
                  <TableHead className="w-[200px]">Items</TableHead>
                  <TableHead className="w-[100px] text-right">Amount</TableHead>
                  <TableHead className="w-[120px]">Contact</TableHead>
                  <TableHead className="w-[300px]">Address</TableHead>
                  <TableHead className="w-[150px]">Province</TableHead>
                  <TableHead className="w-[150px]">Municipality</TableHead>
                  <TableHead className="w-[120px]">Region</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order, index) => (
                    <TableRow key={`${order.tracking}-${index}`}>
                      <TableCell className="text-xs">{order.date}</TableCell>
                      <TableCell className="font-mono text-xs">{order.tracking}</TableCell>
                      <TableCell>
                        <Select
                          value={order.normalizedStatus}
                          onValueChange={(value) => handleStatusChange(order.tracking, value)}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status} className="text-xs">
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.reason || ""}
                          onValueChange={(value) => handleReasonChange(order.tracking, value)}
                        >
                          <SelectTrigger className="w-full h-8 text-xs">
                            <SelectValue placeholder="Select reason" />
                          </SelectTrigger>
                          <SelectContent>
                            {REASON_OPTIONS.map((reason) => (
                              <SelectItem key={reason} value={reason} className="text-xs">
                                {reason}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs">{order.shipper}</TableCell>
                      <TableCell className="text-xs truncate max-w-[200px]" title={order.items}>
                        {order.items}
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">
                        ₱{order.codAmount?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">{order.contactNumber}</TableCell>
                      <TableCell className="text-xs truncate max-w-[300px]" title={order.fullAddress}>
                        {order.fullAddress}
                      </TableCell>
                      <TableCell className="text-xs">{order.province}</TableCell>
                      <TableCell className="text-xs">{order.municipality}</TableCell>
                      <TableCell className="text-xs">{order.region}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
