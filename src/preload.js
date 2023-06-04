const { contextBridge, ipcRenderer } = require('electron')

var summonerData = {}

// Expose IPC calls
const IPCCalls =
{
	// Functions
	getSummonerData: () => ipcRenderer.invoke('getSummonerData'),

	clientGet:  (url) => ipcRenderer.invoke('lolClientGet', url),
	clientPost: (url, data) => ipcRenderer.invoke('lolClientPost', url, data),

	// Events
	onConnectedToClient: (callback) => ipcRenderer.on('summonerDataAvailable', (_, data) => callback(data)),
	onDisconnectedFromClient: (callback) => ipcRenderer.on('disconnectedFromClient', (_) => callback())
}

contextBridge.exposeInMainWorld('ipc', IPCCalls)
