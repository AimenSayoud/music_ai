"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import Preprocessing from "./Preprocessing"
import ModelTraining from "./ModelTraining"
import MusicGeneration from "./MusicGeneration"
import { FileMusic, Brain, Music } from "lucide-react"

export default function Dashboard() {
  const [preprocessingComplete, setPreprocessingComplete] = useState(false)
  const [trainingComplete, setTrainingComplete] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <Card className="bg-gray-800 border-gray-700 overflow-hidden">
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileMusic className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-white">Preprocessing</h2>
              </div>
              <Preprocessing onComplete={() => setPreprocessingComplete(true)} />
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-white">Model Training</h2>
              </div>
              <ModelTraining onComplete={() => setTrainingComplete(true)} isEnabled={preprocessingComplete} />
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Music className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold text-white">Music Generation</h2>
              </div>
              <MusicGeneration isEnabled={trainingComplete} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

