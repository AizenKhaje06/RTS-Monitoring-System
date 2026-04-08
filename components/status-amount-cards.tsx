"use client"

import { useMemo } from "react"
import { CheckCircle, Truck, Package, MapPin, XCircle, AlertTriangle, Clock, Ban, Lock, FileQuestion } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { ProcessedData } from "@/lib/types"

interface StatusAmountCardsProps {
  data: ProcessedData
}

const STATUS_CONFIG = {
  DELIVERED: {
    label: "Delivered",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-900",
  },
  ONDELIVERY: {
    label: "On Delivery",
    icon: Truck,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-900",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/20",
    borderColor: "border-purple-200 dark:border-purple-900",
  },
  INTRANSIT: {
    label: "In Transit",
    icon: MapPin,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-900",
  },
  RETURNED: {
    label: "Returned",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/20",
    borderColor: "border-red-200 dark:border-red-900",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: Ban,
    color: "text-gray-600",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    borderColor: "border-gray-200 dark:border-gray-900",
  },
  DETAINED: {
    label: "Detained",
    icon: Lock,
    color: "text-gray-700",
    bgColor: "bg-gray-100 dark:bg-gray-900/20",
    borderColor: "border-gray-300 dark:border-gray-800",
  },
  PROBLEMATIC: {
    label: "Problematic",
    icon: AlertTriangle,
    color: "text-orange-700",
    bgColor: "bg-orange-100 dark:bg-orange-900/20",
    borderColor: "border-orange-300 dark:border-orange-800",
  },
  "PENDING FULFILLED": {
    label: "Pending Fulfilled",
    icon: Package,
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/20",
    borderColor: "border-teal-200 dark:border-teal-900",
  },
  OTHER: {
    label: "Other",
    icon: FileQuestion,
    color: "text-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-950/20",
    borderColor: "border-gray-200 dark:border-gray-900",
  },
}

export function StatusAmountCards({ data }: StatusAmountCardsProps) {
  const statusAmounts = useMemo(() => {
    const amounts: Record<string, { count: number; totalAmount: number }> = {}

    // Initialize all statuses
    Object.keys(STATUS_CONFIG).forEach((status) => {
      amounts[status] = { count: 0, totalAmount: 0 }
    })

    // Calculate amounts per status
    data.all.data.forEach((parcel) => {
      const status = parcel.normalizedStatus
      if (amounts[status]) {
        amounts[status].count++
        amounts[status].totalAmount += parcel.codAmount || 0
      }
    })

    return amounts
  }, [data])

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
      {Object.entries(STATUS_CONFIG).map(([status, config]) => {
        const Icon = config.icon
        const statusData = statusAmounts[status]

        return (
          <Card
            key={status}
            className={`${config.bgColor} ${config.borderColor} border transition-all hover:shadow-md`}
          >
            <CardContent className="p-2.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Icon className={`w-3.5 h-3.5 ${config.color} flex-shrink-0`} />
                <span className="text-[11px] font-medium text-foreground truncate leading-tight">{config.label}</span>
              </div>
              <div className={`text-base font-bold ${config.color} truncate leading-tight`}>
                ₱{statusData.totalAmount.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
