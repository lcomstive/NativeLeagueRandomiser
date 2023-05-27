const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const LoLClient = require('./LoLClient')
const Summoner = require('./summoner')

// Allow self-signed certificates for HTTPS requests.
// League client uses a self-signed certificate, so this is required
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

var mainWindow = undefined

const createWindow = () =>
{
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
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

	LoLClient.Connector.on('connect', _ =>
		Summoner.refreshSummonerData()
			.then(summoner => mainWindow.webContents.send('summonerDataAvailable', summoner)))

	ipcMain.handle('getSummonerData', () => Summoner.summoner)

	ipcMain.handle('lolClientGet',  (_, url) => LoLClient.Get(url))
	ipcMain.handle('lolClientPost', (_, url, data) => LoLClient.Post(url, data))
})

app.on('window-all-closed', () =>
{
	if(process.platform !== 'darwin')
		app.quit()
})

