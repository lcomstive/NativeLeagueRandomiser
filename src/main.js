const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const LoLClient = require('./LoLClient')
const Summoner = require('./summoner')

// Allow self-signed certificates for HTTPS requests.
// League client uses a self-signed certificate, so this is required
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

var mainWindow = undefined

const createWindow = () =>
{
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		minHeight: 500,
		minWidth: 350,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js')
		}
	})

	mainWindow.loadFile(path.join(__dirname, 'index.html'))

	mainWindow.webContents.openDevTools()
}

app.whenReady().then(() =>
{
	createWindow()

	app.on('activate', () =>
	{
		if(BrowserWindow.getAllWindows().length === 0)
			createWindow()
	})

	LoLClient.Connector.on('connect', async _ =>
	{
		let attempts = 0
		const MaxAttempts = 4
		const AttemptDelay = 1000 // milliseconds. Time between attempting to get summoner data
		while(attempts < MaxAttempts)
		{
			// Get summoner data from client
			let summoner = await Summoner.refreshSummonerData()

			// Check for valid summoner data
			if(summoner && summoner.httpStatus != 404)
			{
				mainWindow.webContents.send('summonerDataAvailable', summoner)
				break
			}
			
			// Wait one second before trying again
			await new Promise(resolve => setTimeout(resolve, AttemptDelay))
			attempts++
		}
	})

	LoLClient.Connector.on('disconnect', _ => mainWindow.webContents.send('disconnectedFromClient'))

	ipcMain.handle('getSummonerData', () => Summoner.summoner)

	ipcMain.handle('lolClientGet',  (_, url) => LoLClient.Get(url))
	ipcMain.handle('lolClientPut',  (_, url, data) => LoLClient.Put(url, data))
	ipcMain.handle('lolClientPost', (_, url, data) => LoLClient.Post(url, data))
})

app.on('window-all-closed', () =>
{
	if(process.platform !== 'darwin')
		app.quit()
})
