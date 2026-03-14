import { format, differenceInDays, startOfDay } from 'date-fns'

export function getTasksByDate(tasks, dateStr) {
  const today = format(new Date(), 'yyyy-MM-dd')

  return tasks.filter((t) => {
    // Always show tasks that belong to this date
    if (t.date === dateStr) return true

    // When viewing today, also show all incomplete tasks from past dates
    if (dateStr === today && t.status !== 'completed' && t.date && t.date < today) {
      return true
    }

    return false
  })
}

export function getDaysUntil(dateStr) {
  if (!dateStr) return null
  const target = startOfDay(new Date(dateStr))
  const today = startOfDay(new Date())
  return differenceInDays(target, today)
}

export function getTaskTotalTime(t) {
  let logMins = 0
  if (t.timeLog) {
    logMins = Object.values(t.timeLog).reduce((sum, val) => sum + val, 0)
  }
  return (t.timeSpent || 0) + logMins
}

export function getGoalProgress(goalId, tasks) {
  const goalTasks = tasks.filter((t) => t.goalId === goalId)
  const total = goalTasks.length
  const completed = goalTasks.filter((t) => t.status === 'completed').length
  const remaining = total - completed
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)
  
  const totalTimeSpent = goalTasks.reduce((sum, t) => {
    let extra = 0
    if (t.isRunning && t.startTime) {
      extra = Math.floor((Date.now() - t.startTime) / 60000)
    }
    return sum + getTaskTotalTime(t) + extra
  }, 0)
  
  return { total, completed, remaining, percentage, totalTimeSpent }
}

export function getDashboardStats(goals, tasks) {
  const activeGoals = goals.filter((g) => g.status === 'active')
  
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayTasks = getTasksByDate(tasks, todayStr)
  
  const completedToday = todayTasks.filter((t) => t.status === 'completed').length
  const pendingToday = todayTasks.length - completedToday

  const totalTasks = tasks.length
  const totalCompleted = tasks.filter((t) => t.status === 'completed').length
  
  const totalTimeSpent = tasks.reduce((sum, t) => {
    let extra = 0
    if (t.isRunning && t.startTime) {
      extra = Math.floor((Date.now() - t.startTime) / 60000)
    }
    return sum + getTaskTotalTime(t) + extra
  }, 0)

  const LIFETIME_GOAL = 500000
  const overallProgress = totalTimeSpent === 0 ? 0 : Math.round((totalTimeSpent / LIFETIME_GOAL) * 100)

  const dailyUnits = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateKey = format(d, 'yyyy-MM-dd')
    
    // Instead of looking at t.date, look at the timeLog for dateKey to find how much time was logged specifically on that day
    const dayTimeSpent = tasks.reduce((sum, t) => {
      let logMins = (t.timeLog && t.timeLog[dateKey]) || 0
      // Legacy fallback: if old task without timeLog sits on this date, count its timeSpent
      let legacyMins = (t.date === dateKey && !t.timeLog && t.timeSpent) ? t.timeSpent : 0
      
      let extra = 0
      // Add live running time if we're generating today's stat
      if (t.isRunning && t.startTime && dateKey === todayStr) {
        extra = Math.floor((Date.now() - t.startTime) / 60000)
      }
      return sum + logMins + legacyMins + extra
    }, 0)
    
    const label = i === 0 ? 'Today' : format(d, 'eee')
    dailyUnits.push({ date: dateKey, label, units: Math.round(dayTimeSpent / 50 * 10) / 10 })
  }

  return {
    totalGoals: goals.length,
    activeGoals: activeGoals.length,
    completedToday,
    pendingToday,
    overallProgress,
    totalTasks,
    totalCompleted,
    totalTimeSpent,
    LIFETIME_GOAL,
    dailyUnits
  }
}

