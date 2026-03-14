import { useMemo } from 'react'
import { format } from 'date-fns'
import { Activity } from 'lucide-react'
import useStore from '../store'

export default function Units() {
  const tasks = useStore((s) => s.tasks)

  const historicalUnits = useMemo(() => {
    const datesMap = {}
    
    tasks.forEach(t => {
      // 1. Process timeLog exact entries (resolves data drift from rollover)
      if (t.timeLog) {
        Object.keys(t.timeLog).forEach(dateStr => {
          if (!datesMap[dateStr]) datesMap[dateStr] = 0
          datesMap[dateStr] += t.timeLog[dateStr]
        })
      }
      
      // 2. Process legacy timeSpent (if no timeLog exists yet)
      if (t.timeSpent && (!t.timeLog || Object.keys(t.timeLog).length === 0) && t.date) {
        if (!datesMap[t.date]) datesMap[t.date] = 0
        datesMap[t.date] += t.timeSpent
      }
      
      // 3. Process active live timers
      if (t.isRunning && t.startTime) {
        // Active timers always belong to today
        const todayStr = format(new Date(), 'yyyy-MM-dd')
        if (!datesMap[todayStr]) datesMap[todayStr] = 0
        datesMap[todayStr] += Math.floor((Date.now() - t.startTime) / 60000)
      }
    })

    // Convert to array and calculate units
    const daysArray = Object.keys(datesMap).map(dateStr => {
      const totalMins = datesMap[dateStr]
      const units = Math.round((totalMins / 50) * 10) / 10 // 1 unit = 50 mins, round to 1 decimal
      
      return {
        date: dateStr,
        mins: totalMins,
        units: units
      }
    })

    // Sort by date descending (newest first)
    daysArray.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    return daysArray
  }, [tasks])

  // Get max units for chart scaling. Provide a minimum scale of 1 to avoid zero-division or tiny bars
  const maxUnits = Math.max(1, ...historicalUnits.map(d => d.units))

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24 h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">Daily Units</h1>
        <p className="text-[#555] mt-1 text-sm font-medium">Historical timeline of your mapped units (1 Unit = 50 mins)</p>
      </div>

      {historicalUnits.length === 0 ? (
        <div className="text-center py-24 bg-[#141414] border border-[#1E1E1E] border-dashed rounded-2xl flex-1 flex flex-col items-center justify-center">
          <Activity size={48} className="text-[#333] mb-4" />
          <p className="text-lg font-bold text-white">No data generated yet.</p>
          <p className="mt-2 text-[#555] text-sm font-medium max-w-sm">
            Complete tasks with time running. For every 50 minutes you log, you earn 1 Unit on your timeline.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 flex-1 min-h-0">
          
          {/* Main Chart Container */}
          <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl p-6" style={{ borderTop: '2px solid #F0C040' }}>
            <div className="text-[11px] text-[#555] uppercase tracking-wider font-bold mb-6">Unit Generation Trajectory</div>
            
            <div className="h-48 flex items-end gap-1.5 overflow-x-auto pb-2 scrollbar-hide flex-row-reverse">
              {historicalUnits.map((day, i) => {
                const heightPct = Math.max(5, (day.units / maxUnits) * 100)
                const isToday = day.date === format(new Date(), 'yyyy-MM-dd')
                
                return (
                  <div key={day.date} className="flex-shrink-0 w-12 flex flex-col items-center justify-end h-full gap-2 group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-[#252525] text-white text-[10px] font-bold py-1 px-2 rounded pointer-events-none z-10 whitespace-nowrap">
                      {day.units} units ({day.mins}m)
                    </div>
                    
                    {/* Bar */}
                    <div className="w-full relative flex items-end justify-center h-full">
                      <div 
                        className={`w-full max-w-[28px] rounded-t-md transition-all duration-300
                          ${isToday ? 'bg-[#F0C040]' : 'bg-[#1E1E1E] group-hover:bg-[#2a2a2a]'}`}
                        style={{ height: `${heightPct}%` }}
                      >
                         <span className={`absolute bottom-full left-1/2 -translate-x-1/2 -mb-5 text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity
                           ${isToday ? 'text-[#F0C040]' : 'text-[#888]'}`}>
                           {day.units}
                         </span>
                      </div>
                    </div>
                    {/* Label */}
                    <span className={`text-[9px] font-bold ${isToday ? 'text-white' : 'text-[#555]'}`}>
                      {format(new Date(day.date), 'MMM d')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* List View */}
          <div className="bg-[#141414] border border-[#1E1E1E] rounded-2xl flex-1 min-h-0 flex flex-col">
            <div className="p-5 border-b border-[#1E1E1E] flex-shrink-0">
               <div className="text-[11px] text-[#555] uppercase tracking-wider font-bold">Daily Ledger</div>
            </div>
            <div className="overflow-y-auto p-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {historicalUnits.map((day) => {
                  const isToday = day.date === format(new Date(), 'yyyy-MM-dd')
                  return (
                    <div key={day.date} className={`flex items-center justify-between p-4 rounded-xl border ${isToday ? 'bg-[#F0C040]/5 border-[#F0C040]/20' : 'bg-[#1A1A1A] border-transparent hover:border-[#252525]'} transition-colors`}>
                      <div>
                        <div className="text-sm font-bold text-white tracking-wide">
                          {format(new Date(day.date), 'MMMM d')}
                        </div>
                        <div className="text-[10px] text-[#666] font-medium mt-0.5 uppercase tracking-wide">
                          {isToday ? 'Today' : format(new Date(day.date), 'EEEE')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-black tabular-nums leading-none ${isToday ? 'text-[#F0C040]' : 'text-[#10b981]'}`}>
                          {day.units}
                        </div>
                        <div className="text-[9px] text-[#555] font-bold mt-1 tracking-wider uppercase">Units</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  )
}
