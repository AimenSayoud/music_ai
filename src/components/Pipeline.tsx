// "use client"
// import { useState } from "react"
// import { motion } from "framer-motion"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { FileMusic, Brain, Music } from "lucide-react"
// import Preprocessing from "./Preprocessing"
// import ModelTraining from "./ModelTraining"
// import MusicGeneration from "./MusicGeneration"

// export default function Pipeline() {
//   const [activePhase, setActivePhase] = useState("preprocessing")

//   return (
//     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
//       <Card className="bg-gray-800 border-gray-700 overflow-hidden">
//         <CardHeader className="bg-gray-900">
//           <CardTitle className="text-2xl text-white flex items-center">AI Music Generation Pipeline</CardTitle>
//         </CardHeader>
//         <CardContent className="p-6">
//           <Tabs value={activePhase} onValueChange={setActivePhase} className="space-y-4">
//             <TabsList className="grid w-full grid-cols-3">
//               <TabsTrigger value="preprocessing" className="data-[state=active]:bg-primary">
//                 <FileMusic className="mr-2 h-4 w-4" />
//                 Preprocessing
//               </TabsTrigger>
//               <TabsTrigger value="training" className="data-[state=active]:bg-primary">
//                 <Brain className="mr-2 h-4 w-4" />
//                 Training
//               </TabsTrigger>
//               <TabsTrigger value="generation" className="data-[state=active]:bg-primary">
//                 <Music className="mr-2 h-4 w-4" />
//                 Generation
//               </TabsTrigger>
//             </TabsList>
//             <TabsContent value="preprocessing">
//               <Preprocessing onComplete={() => setActivePhase("training")} />
//             </TabsContent>
//             <TabsContent value="training">
//               <ModelTraining onComplete={() => setActivePhase("generation")} />
//             </TabsContent>
//             <TabsContent value="generation">
//               <MusicGeneration />
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>
//     </motion.div>
//   )
// }

