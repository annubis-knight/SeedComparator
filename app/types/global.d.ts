export {}

declare global {
  interface Window {
    seedApi?: {
      keys: {
        get: (providerId: string) => Promise<string | null>
        set: (providerId: string, key: string) => Promise<boolean>
        list: () => Promise<string[]>
      }
      dialog: {
        selectFolder: () => Promise<string | null>
      }
    }
  }
}
