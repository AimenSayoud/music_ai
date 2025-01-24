import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

const Dashboard = dynamic(() => import("@/components/Dashboard"), {
  loading: () => <Loader2 className="h-8 w-8 animate-spin text-primary" />,
})

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800">
      <header className="p-6 text-center">
        <h1 className="text-5xl font-bold text-white mb-2 animate-fade-in-down">AI Music Generator</h1>
        <p className="text-xl text-white opacity-80 animate-fade-in-up">Preprocess, Train, and Generate Unique Music</p>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
          <Dashboard />
        </Suspense>
      </main>
    </div>
  )
}

