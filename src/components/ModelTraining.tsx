"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Brain } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface TrainingStatus {
  epoch: number
  totalEpochs: number
  trainLoss: number
  valLoss: number
  learningRate: number
  timeElapsed: number
}

export default function ModelTraining({ onComplete, isEnabled }: { onComplete: () => void; isEnabled: boolean }) {
  const [isTraining, setIsTraining] = useState(false)
  const [status, setStatus] = useState<TrainingStatus | null>(null)
  const { toast } = useToast()

  const handleStartTraining = async () => {
    setIsTraining(true)
    setStatus({
      epoch: 0,
      totalEpochs: 150,
      trainLoss: 0,
      valLoss: 0,
      learningRate: 0.001,
      timeElapsed: 0,
    })

    // Simulating training
    for (let i = 1; i <= 150; i++) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setStatus((prev) => ({
        epoch: i,
        totalEpochs: 150,
        trainLoss: Math.max(0.1, prev!.trainLoss - 0.001 * Math.random()),
        valLoss: Math.max(0.1, prev!.valLoss - 0.0008 * Math.random()),
        learningRate: 0.001 * Math.pow(0.1, Math.floor(i / 50)),
        timeElapsed: prev!.timeElapsed + 0.2,
      }))
    }

    setIsTraining(false)
    toast({
      title: "Success",
      description: "Model training completed successfully!",
    })
    onComplete()
  }

  const chartData = status
    ? [
        { name: "Train Loss", value: status.trainLoss },
        { name: "Val Loss", value: status.valLoss },
      ]
    : []

  return (
    <div className="space-y-4">
      <Button
        onClick={handleStartTraining}
        disabled={isTraining || !isEnabled}
        className="w-full bg-primary hover:bg-primary/90 text-white"
      >
        {isTraining ? "Training in Progress..." : "Start Training"}
      </Button>

      {status && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <Progress value={(status.epoch / status.totalEpochs) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-white">
            <span>
              Epoch {status.epoch}/{status.totalEpochs}
            </span>
            <span>{status.timeElapsed.toFixed(2)} min</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-white">
            <div>Train Loss: {status.trainLoss.toFixed(4)}</div>
            <div>Val Loss: {status.valLoss.toFixed(4)}</div>
            <div>LR: {status.learningRate.toExponential(2)}</div>
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

          {status.epoch === status.totalEpochs &&
            (
              
            <Alert variant="default" className="bg-green-700 border-green-600">
              <Brain className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Training Complete! Model ready for music generation.
              </AlertDescription>
            </Alert>
            )}
        </motion.div>
      )}
    </div>
  )
}

