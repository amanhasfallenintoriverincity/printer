import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useState } from "react"

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Gemini Printer Project
        </h1>
        <p className="text-slate-600 max-w-md mx-auto">
          Vite + Tailwind CSS + ShadCN UI + Framer Motion 세팅이 완료되었습니다.
        </p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 flex flex-col items-center space-y-6"
      >
        <div className="text-6xl font-mono font-bold text-primary">
          {count}
        </div>
        
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            onClick={() => setCount(prev => prev - 1)}
          >
            Decrease
          </Button>
          <Button 
            onClick={() => setCount(prev => prev + 1)}
            className="bg-primary hover:bg-primary/90"
          >
            Increase
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-slate-400"
      >
        Press the buttons to see the counter in action.
      </motion.div>
    </div>
  )
}

export default App