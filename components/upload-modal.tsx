"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/file-upload"
import { GoogleSheetsSelector } from "@/components/google-sheets-selector"
import type { ProcessedData } from "@/lib/types"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataUpload: (data: ProcessedData) => void
}

export function UploadModal({ open, onOpenChange, onDataUpload }: UploadModalProps) {
  const [activeTab, setActiveTab] = useState("excel")

  const handleDataUpload = (data: ProcessedData) => {
    onDataUpload(data)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl glass-strong border-border/50">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Upload Data</DialogTitle>
          <DialogDescription>
            Upload your Excel file or connect Google Sheets containing parcel data to generate reports and analytics.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 glass border-border/50">
              <TabsTrigger value="excel" className="data-[state=active]:gradient-orange">Excel File</TabsTrigger>
              <TabsTrigger value="sheets" className="data-[state=active]:gradient-orange">Google Sheets</TabsTrigger>
            </TabsList>
            <TabsContent value="excel" className="mt-4">
              <FileUpload onDataUpload={handleDataUpload} />
            </TabsContent>
            <TabsContent value="sheets" className="mt-4">
              <GoogleSheetsSelector onDataUpload={handleDataUpload} onClose={() => onOpenChange(false)} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
