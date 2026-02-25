declare global {
  interface Window {
    electronAPI: {
      send(channel: string, data: unknown): void
      on(channel: string, callback: (data: unknown) => void): void
      removeListener(channel: string, callback: (data: unknown) => void): void
    }
  }
}

export const vscode = {
  postMessage(msg: unknown): void {
    window.electronAPI.send('message', msg)
  },
}
