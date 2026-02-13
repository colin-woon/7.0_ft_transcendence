"use client"

import { Calendar, MapPin } from "lucide-react"

interface Event {
  id: string
  title: string
  date: string
  time: string
  location: string
  type: "event" | "exam" | "rush"
}

interface AgendaCardProps {
  events: Event[]
}

export function AgendaCard({ events }: AgendaCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900">Agenda</h3>
        
        <div className="flex gap-2">
          <button className="rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white">
            ALL EVENTS
          </button>
          <button className="rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white">
            EVENT MARKS
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">No upcoming events</p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4"
            >
              <h4 className="font-semibold text-gray-900">{event.title}</h4>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{event.date} at {event.time}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{event.location}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
