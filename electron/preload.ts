import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: (options: Electron.OpenDialogOptions) => 
    ipcRenderer.invoke('open-file-dialog', options),
  saveFileDialog: (options: Electron.SaveDialogOptions) => 
    ipcRenderer.invoke('save-file-dialog', options),
  getAppVersion: () => ipcRenderer.invoke('get-app-version')
})

export type ElectronAPI = {
  openFileDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>
  saveFileDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>
  getAppVersion: () => Promise<string>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
