export const useCostMeter = () => {
  const sessionCost = useState<number>('cost-session', () => 0)
  const monthlyCost = useState<number>('cost-month', () => 0)

  async function loadMonthly() {
    try {
      const data = await $fetch<{ totalUsd: number }>('/api/stats/month')
      monthlyCost.value = data.totalUsd
    } catch {
      monthlyCost.value = 0
    }
  }

  function addToSession(usd: number) {
    sessionCost.value += usd
    monthlyCost.value += usd
  }

  function resetSession() { sessionCost.value = 0 }

  return { sessionCost, monthlyCost, loadMonthly, addToSession, resetSession }
}
