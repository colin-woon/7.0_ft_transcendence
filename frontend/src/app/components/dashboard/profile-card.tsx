// "use client"

// import { MapPin, Award, Star, Users } from "lucide-react"

// interface ProfileCardProps {
//   name: string
//   username: string
//   avatar: string
//   level: number
//   levelProgress: number
//   cursus: string
//   coalitionPoints: number
//   rank: number
//   score: number
//   evaluationPoints: number
//   available: boolean
// }

// export function ProfileCard({
//   name,
//   username,
//   avatar,
//   level,
//   levelProgress,
//   cursus,
//   coalitionPoints,
//   rank,
//   score,
//   evaluationPoints,
//   available,
// }: ProfileCardProps) {
//   return (
//     <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-gray-50 to-gray-100 p-6 shadow-lg ring-1 ring-gray-200">
//       {/* Glossy highlight */}
//       <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
//       {/* Subtle inner glow */}
//       <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />

//       <div className="relative">
//         {/* Coalition badge */}
//         <div className="absolute -left-2 -top-2 flex h-8 w-8 items-center justify-center rounded bg-violet-500/30">
//           <Award className="h-4 w-4 text-violet-400" />
//         </div>

//         {/* Availability status */}
//         <div className="absolute right-0 top-0">
//           <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
//             available ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
//           }`}>
//             <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-emerald-400" : "bg-amber-400"}`} />
//             {available ? "available" : "unavailable"}
//           </span>
//         </div>

//         {/* Profile info */}
//         <div className="mt-4 flex items-start gap-4">
//           <div className="relative">
//             <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-violet-400">
//               <img src={avatar || "/placeholder.svg"} alt={name} className="h-full w-full object-cover" />
//             </div>
//           </div>

//           <div className="flex-1">
//             <h2 className="text-xl font-bold text-white">{name}</h2>
//             <p className="text-sm text-gray-400">{username}</p>
//             <p className="mt-1 text-xs text-gray-500">{cursus}</p>
//           </div>
//         </div>

//         {/* Level */}
//         <div className="mt-6">
//           <div className="flex items-baseline gap-2">
//             <span className="text-4xl font-bold text-white">{String(level).padStart(2, "0")}</span>
//             <span className="text-sm text-gray-400">{levelProgress}%</span>
//           </div>
//           <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-700">
//             <div
//               className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all"
//               style={{ width: `${levelProgress}%` }}
//             />
//           </div>
//         </div>

//         {/* Stats */}
//         <div className="mt-6 flex items-center justify-between rounded-lg bg-black/30 px-4 py-3 backdrop-blur-sm">
//           <div className="flex items-center gap-1.5">
//             <Award className="h-4 w-4 text-primary" />
//             <span className="text-sm font-semibold text-white">{coalitionPoints}</span>
//           </div>
//           <div className="flex items-center gap-1">
//             <span className="text-xs text-gray-400">Rank</span>
//             <span className="text-sm font-semibold text-white">{rank}</span>
//           </div>
//           <div className="flex items-center gap-1">
//             <span className="text-xs text-gray-400">Score</span>
//             <span className="text-sm font-semibold text-white">{score >= 1000 ? `${(score / 1000).toFixed(1)}k` : score}</span>
//           </div>
//           <div className="flex items-center gap-1">
//             <span className="text-xs text-gray-400">Ev.P</span>
//             <span className="text-sm font-semibold text-white">{evaluationPoints}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }


"use client"

import React, { useState } from 'react'
import { Award, ChevronDown, TrendingUp, Trophy, Star } from "lucide-react"

interface ProfileCardProps {
  name: string
  username: string
  avatar: string
  level: number
  levelProgress: number
  cursus: string
  coalitionPoints: number
  rank: number
  score: number
  evaluationPoints: number
  available: boolean
}

export function ProfileCard({
  name,
  username,
  avatar,
  level,
  levelProgress,
  cursus,
  coalitionPoints,
  rank,
  score,
  evaluationPoints,
  available,
}: ProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg shadow-purple-100/50 transition-all hover:shadow-xl hover:shadow-purple-200/50">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-purple-50/30 pointer-events-none" />
      
      {/* Top shine effect */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

      <div className="relative p-6">
        {/* Header with avatar and status */}
        <div className="flex items-start gap-4 mb-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-purple-200/50 ring-offset-2 ring-offset-white/50">
              <img 
                src={avatar || "/api/placeholder/64/64"} 
                alt={name} 
                className="h-full w-full object-cover"
              />
            </div>
            {/* Level badge */}
            <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-white">{level}</span>
            </div>
          </div>

          {/* Name and info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{name}</h3>
            <p className="text-sm text-gray-500">@{username}</p>
            <p className="text-xs text-gray-400 mt-0.5">{cursus}</p>
          </div>

          {/* Availability badge */}
          <div className="flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              available 
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50" 
                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                available ? "bg-emerald-500" : "bg-amber-500"
              }`} />
              {available ? "Available" : "Busy"}
            </span>
          </div>
        </div>

        {/* Level progress */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Level Progress</span>
            <span className="text-xs font-semibold text-purple-600">{levelProgress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">Level {level}</span>
            <span className="text-xs text-gray-400">Level {level + 1}</span>
          </div>
        </div>

        {/* Stats dropdown - NOW OVERLAYS */}
        <div className="relative border-t border-gray-100 pt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors group"
          >
            <span>Statistics</span>
            <ChevronDown 
              className={`h-4 w-4 transition-transform duration-200 text-gray-400 group-hover:text-gray-600 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* DROPDOWN CONTENT - Absolute positioned to overlay */}
          <div 
            className={`
              absolute left-0 right-0 z-10 
              transition-all duration-300 ease-out
              ${isExpanded 
                ? 'opacity-100 translate-y-0 visible' 
                : 'opacity-0 -translate-y-2 invisible'
              }
            `}
            style={{
              top: 'calc(100% + 8px)',
            }}
          >
            {/* Floating stats card */}
            <div className="bg-white rounded-xl shadow-xl border border-gray-200/50 backdrop-blur-md p-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Coalition Points */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-3 border border-purple-200/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Award className="h-4 w-4 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">Coalition</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{coalitionPoints}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>

                {/* Rank */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-200/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Trophy className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">Rank</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">#{rank}</p>
                  <p className="text-xs text-gray-500">global</p>
                </div>

                {/* Score */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3 border border-emerald-200/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">Score</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {score >= 1000 ? `${(score / 1000).toFixed(1)}k` : score}
                  </p>
                  <p className="text-xs text-gray-500">total</p>
                </div>

                {/* Evaluation Points */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3 border border-amber-200/30">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <Star className="h-4 w-4 text-amber-600" />
                    </div>
                    <span className="text-xs font-medium text-gray-600">Eval Points</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">{evaluationPoints}</p>
                  <p className="text-xs text-gray-500">available</p>
                </div>
              </div>
              
              {/* Little arrow pointing up */}
              <div className="absolute -top-2 left-6 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-white"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}