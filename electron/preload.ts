import { contextBridge, ipcRenderer } from 'electron'

const api = {
  keys: {
    get: (providerId: string): Promise<string | null> =>
      ipcRenderer.invoke('keys:get', providerId),
    set: (providerId: string, key: string): Promise<boolean> =>
      ipcRenderer.invoke('keys:set', providerId, key),
    list: (): Promise<string[]> => ipcRenderer.invoke('keys:list'),
  },
  dialog: {
    selectFolder: (): Promise<string | null> =>
      ipcRenderer.invoke('dialog:selectFolder'),
  },
}

contextBridge.exposeInMainWorld('seedApi', api)

export type SeedApi = typeof api
