"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, X, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ProcessedData } from "@/lib/types"
import { processExcelFile } from "@/lib/excel-processor"

interface FileUploadProps {
  onDataUpload: (data: ProcessedData) => void
}

export function FileUpload({ onDataUpload }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setIsProcessing(true)
    try {
      const data = await processExcelFile(file)
      onDataUpload(data)
    } catch (error) {
      console.error("Error processing file:", error)
      alert("Error processing file. Please check the format.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="glass-strong rounded-2xl p-6 border border-border/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative flex items-center gap-4">
        <div className="flex-1">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex items-center gap-3 px-5 py-4 glass rounded-xl cursor-pointer transition-all hover:border-primary/50 group"
          >
            {file ? (
              <>
                <div className="w-10 h-10 rounded-lg gradient-orange flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground block">{file.name}</span>
                  <span className="text-xs text-muted-foreground">Ready to process</span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-lg glass border border-border/50 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-foreground block">Select Excel File</span>
                  <span className="text-xs text-muted-foreground">Click to browse files</span>
                </div>
              </>
            )}
          </label>
        </div>

        {file && (
          <Button
            onClick={handleRemoveFile}
            variant="outline"
            size="icon"
            className="glass border-border/50 hover:border-destructive/50 hover:text-destructive transition-all bg-transparent"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || isProcessing}
          className="gradient-orange hover:opacity-90 text-primary-foreground font-semibold px-6 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : (
            "Upload & Process"
          )}
        </Button>
      </div>

      <p className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-primary" />
        Expected columns: Date, Status, Shipper, Consignee Region
      </p>
    </div>
  )
}
