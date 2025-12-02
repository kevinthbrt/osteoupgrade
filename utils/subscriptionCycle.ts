export interface SubscriptionCycle {
  cycleStart: Date
  cycleEnd: Date
}

const fallbackCycle = (): SubscriptionCycle => {
  const now = new Date()
  const cycleStart = new Date(now.getFullYear(), 0, 1)
  const cycleEnd = new Date(cycleStart)
  cycleEnd.setFullYear(cycleEnd.getFullYear() + 1)
  return { cycleStart, cycleEnd }
}

export function getCurrentSubscriptionCycle(subscriptionStartDate?: string | null): SubscriptionCycle {
  if (!subscriptionStartDate) return fallbackCycle()

  const startDate = new Date(subscriptionStartDate)
  if (isNaN(startDate.getTime())) return fallbackCycle()

  const now = new Date()
  const anniversaryThisYear = new Date(now.getFullYear(), startDate.getMonth(), startDate.getDate())

  const cycleStart = new Date(
    now >= anniversaryThisYear
      ? anniversaryThisYear
      : new Date(now.getFullYear() - 1, startDate.getMonth(), startDate.getDate())
  )

  const cycleEnd = new Date(cycleStart)
  cycleEnd.setFullYear(cycleEnd.getFullYear() + 1)

  return { cycleStart, cycleEnd }
}

export function isDateWithinCycle(date: string, cycle: SubscriptionCycle): boolean {
  const parsed = new Date(date)
  if (isNaN(parsed.getTime())) return false

  return parsed >= cycle.cycleStart && parsed < cycle.cycleEnd
}

export function formatCycleWindow(cycle: SubscriptionCycle): string {
  return `${cycle.cycleStart.toLocaleDateString('fr-FR')} - ${cycle.cycleEnd.toLocaleDateString('fr-FR')}`
}
