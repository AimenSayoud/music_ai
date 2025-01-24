"use client"
import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, RotateCcw, Music, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Progress } from "./ui/progress"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface GenerationStatus {
  step: number
  totalSteps: number
  activeNotes: number
  avgActivity: number
  currentThreshold: number
  avgVelocity: number
}

interface GenerationParams {
  fs: number
  length: number
  minNotes: number
  maxNotes: number
  tempo: number
  velocityMin: number
  velocityMax: number
  seedTries: number
  noteRepeatThreshold: number
}

export default function MusicGeneration({ isEnabled }: { isEnabled: boolean }) {
  // Basic Parameters
  const [params, setParams] = useState<GenerationParams>({
    fs: 32,
    length: 1024,
    minNotes: 2,
    maxNotes: 6,
    tempo: 100,
    velocityMin: 55,
    velocityMax: 120,
    seedTries: 5,
    noteRepeatThreshold: 4
  })

  // UI State
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [status, setStatus] = useState<GenerationStatus | null>(null)
  const [generationHistory, setGenerationHistory] = useState<any[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [audioProgress, setAudioProgress] = useState(0)
  const { toast } = useToast()

  const handleGenerate = async () => {
    setIsGenerating(true)
    setStatus(null)
    setCurrentFile(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Generation failed')
      }

      const data = await response.json()
      
      // Add MIDI file to audio player
      setCurrentFile(data.file)
      
      // Add to history
      setGenerationHistory(prev => [...prev, {
        timestamp: new Date().toISOString(),
        params: { ...params },
        stats: data.stats
      }])

      toast({
        title: "Success",
        description: "Music generated successfully!"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Generation failed",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePlayPause = () => {
    if (!audioRef.current || !currentFile) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setAudioProgress(0)
  }

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current

      const updateProgress = () => {
        setAudioProgress((audio.currentTime / audio.duration) * 100)
      }

      const handleEnd = () => {
        setIsPlaying(false)
        setAudioProgress(0)
      }

      audio.addEventListener("timeupdate", updateProgress)
      audio.addEventListener("ended", handleEnd)

      return () => {
        audio.removeEventListener("timeupdate", updateProgress)
        audio.removeEventListener("ended", handleEnd)
      }
    }
  }, [currentFile])

  // Create chart data from status
  const chartData = status ? [
    { name: "Active Notes", value: status.activeNotes },
    { name: "Avg Activity", value: status.avgActivity },
    { name: "Threshold", value: status.currentThreshold },
    { name: "Velocity", value: status.avgVelocity }
  ] : []

  return (
    <div className="space-y-4">
      {/* Basic Parameters */}
      <div>
        <label className="block text-xs font-medium text-white mb-1">Length: {params.length} steps</label>
        <Slider
          min={256}
          max={2048}
          step={256}
          value={[params.length]}
          onValueChange={(value) => setParams(prev => ({ ...prev, length: value[0] }))}
          disabled={isGenerating || !isEnabled}
          className="my-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-white mb-1">Min Notes: {params.minNotes}</label>
          <Slider
            min={1}
            max={4}
            step={1}
            value={[params.minNotes]}
            onValueChange={(value) => setParams(prev => ({ ...prev, minNotes: value[0] }))}
            disabled={isGenerating || !isEnabled}
            className="my-2"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white mb-1">Max Notes: {params.maxNotes}</label>
          <Slider
            min={4}
            max={12}
            step={1}
            value={[params.maxNotes]}
            onValueChange={(value) => setParams(prev => ({ ...prev, maxNotes: value[0] }))}
            disabled={isGenerating || !isEnabled}
            className="my-2"
          />
        </div>
      </div>

      {/* Advanced Parameters Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full">
            <Settings className="w-4 h-4 mr-2" />
            Advanced Settings
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Advanced Generation Settings</SheetTitle>
            <SheetDescription>
              Fine-tune the music generation parameters.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm">Tempo (BPM): {params.tempo}</label>
              <Slider
                min={60}
                max={180}
                step={5}
                value={[params.tempo]}
                onValueChange={(value) => setParams(prev => ({ ...prev, tempo: value[0] }))}
                className="my-2"
              />
            </div>
            <div>
              <label className="block text-sm">Velocity Range</label>
              <Slider
                min={0}
                max={127}
                step={1}
                value={[params.velocityMin, params.velocityMax]}
                onValueChange={(value) => setParams(prev => ({
                  ...prev,
                  velocityMin: value[0],
                  velocityMax: value[1]
                }))}
                className="my-2"
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Button
        onClick={handleGenerate}
        className="w-full bg-primary hover:bg-primary/90 text-white"
        disabled={isGenerating || !isEnabled}
      >
        {isGenerating ? "Generating..." : "Generate Music"}
      </Button>

      {/* Generation Progress */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <Progress value={(status.step / status.totalSteps) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-white">
            <span>Step {status.step}/{status.totalSteps}</span>
            <span>{((status.step / status.totalSteps) * 100).toFixed(1)}%</span>
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
        </motion.div>
      )}

      {/* Audio Player */}
      {currentFile && (
        <div className="bg-gray-700 rounded-lg p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-white text-xs font-medium">Generated Audio</div>
            <div className="flex space-x-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePlayPause}
                className="h-6 w-6 text-white hover:text-primary"
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleReset}
                className="h-6 w-6 text-white hover:text-primary"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="bg-gray-600 h-1 rounded-full overflow-hidden">
            <motion.div
              className="bg-green-500 h-full"
              style={{ width: `${audioProgress}%` }}
            />
          </div>
        </div>
      )}

      <audio
        ref={audioRef}
        src={currentFile || undefined}
        className="hidden"
        controls
      />
    </div>
  )
}