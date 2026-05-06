import { prisma } from '../../db/client'

export default defineEventHandler(async () => {
  const settings = await prisma.setting.findMany()
  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value
  return map
})
