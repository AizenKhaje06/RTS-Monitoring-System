"use client"

import React from "react"

interface TotalCostOfFailureKPIProps {
  amount: number
}

export function TotalCostOfFailureKPI({ amount }: TotalCostOfFailureKPIProps) {
  return (
    <div className="glass rounded-xl p-6 border border-border/50 mb-6 text-center">
      <h2 className="text-xl font-bold text-foreground mb-2">Total Cost of Failure</h2>
      <p className="text-4xl font-extrabold text-red-600">${amount.toLocaleString()}</p>
    </div>
  )
}
