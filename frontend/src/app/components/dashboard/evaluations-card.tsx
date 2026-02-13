"use client"

import { Clock, Calendar, Settings2 } from "lucide-react"

interface Evaluation {
  id: string
  project: string
  date: string
  time: string
  type: "corrector" | "corrected"
}

interface EvaluationsCardProps {
  evaluations: Evaluation[]
}

export function EvaluationsCard({ evaluations }: EvaluationsCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Pending Evaluations</h3>
        
        <div className="flex gap-2">
          <button className="rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white">
            HIDE
          </button>
          <button className="rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white">
            FEEDBACK LOGS
          </button>
          <button className="rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white">
            MANAGE SLOTS
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {evaluations.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No pending evaluations</p>
        ) : (
          evaluations.map((evaluation) => (
            <div
              key={evaluation.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  evaluation.type === "corrector" ? "bg-primary/20" : "bg-amber-500/20"
                }`}>
                  <Settings2 className={`h-5 w-5 ${
                    evaluation.type === "corrector" ? "text-primary" : "text-amber-500"
                  }`} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{evaluation.project}</h4>
                  <p className="text-xs text-gray-500">
                    {evaluation.type === "corrector" ? "As corrector" : "Being corrected"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{evaluation.date}</span>
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{evaluation.time}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
