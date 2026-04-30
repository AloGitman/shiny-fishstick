// Simple in-memory store — works on Vercel (data resets per cold start, fine for testing)
// Replace with a real database later

const mem: Record<string, unknown> = {}

export const store = {
  get: async (key: string): Promise<unknown> => mem[key] ?? null,
  set: async (key: string, value: unknown): Promise<void> => { mem[key] = value },
  del: async (key: string): Promise<void> => { delete mem[key] },
  keys: async (pattern: string): Promise<string[]> => {
    const prefix = pattern.replace('*', '')
    return Object.keys(mem).filter(k => k.startsWith(prefix))
  },
}
