"use client"
import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, FileMusic } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface PreprocessingStatus {
  filesProcessed: number
  totalFiles: number
  sequencesGenerated: number
}

export default function Preprocessing({ onComplete }: { onComplete: () => void }) {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<PreprocessingStatus | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const validFiles = selectedFiles.filter((file) => file.name.endsWith(".mid") || file.name.endsWith(".midi"))

      if (validFiles.length !== selectedFiles.length) {
        toast({
          title: "Invalid Files",
          description: "Only MIDI files (.mid, .midi) are allowed",
          variant: "destructive",
        })
      }

      setFiles(validFiles)
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePreprocess = async () => {
    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please select MIDI files for preprocessing",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setStatus({ filesProcessed: 0, totalFiles: files.length, sequencesGenerated: 0 })

    // Simulating preprocessing
    for (let i = 0; i < files.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setStatus((prev) => ({
        filesProcessed: i + 1,
        totalFiles: files.length,
        sequencesGenerated: prev ? prev.sequencesGenerated + Math.floor(Math.random() * 1000 + 500) : 0,
      }))
    }

    setIsProcessing(false)
    toast({
      title: "Success",
      description: "Preprocessing completed successfully!",
    })
    onComplete()
  }

  const chartData = status
    ? [
        { name: "Processed", value: status.filesProcessed },
        { name: "Remaining", value: status.totalFiles - status.filesProcessed },
      ]
    : []

  return (
    <div className="space-y-4">
      <div>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".mid,.midi"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-600 p-4 hover:border-primary transition-colors"
          variant="outline"
          disabled={isProcessing}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload MIDI Files
        </Button>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 space-y-2 max-h-32 overflow-y-auto"
            >
              {files.map((file, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between bg-gray-700 p-2 rounded text-xs"
                >
                  <span className="text-white truncate">{file.name}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveFile(index)}
                    disabled={isProcessing}
                    className="h-6 w-6"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Button
        onClick={handlePreprocess}
        disabled={isProcessing || files.length === 0}
        className="w-full bg-primary hover:bg-primary/90 text-white"
      >
        {isProcessing ? "Preprocessing..." : "Start Preprocessing"}
      </Button>

      {status && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <Progress value={(status.filesProcessed / status.totalFiles) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-white">
            <span>
              {status.filesProcessed}/{status.totalFiles} Files
            </span>
            <span>{status.sequencesGenerated} Sequences</span>
          </div>

          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {status.filesProcessed === status.totalFiles && (
            <Alert variant="default" className="bg-green-700 border-green-600">
              <FileMusic className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Preprocessing Complete! {status.sequencesGenerated} sequences generated.
              </AlertDescription>
            </Alert>
          )}
        </motion.div>
      )}
    </div>
  )
}

