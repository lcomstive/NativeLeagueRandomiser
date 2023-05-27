const path = require('path')
const https = require('https')
const LCUConnector = require('lcu-connector')
const { BrowserWindow } = require('electron')

const connector = new LCUConnector()
var clientData = {}

connector.on('connect', data =>
{
	clientData = data
	clientData.authString = btoa(`${clientData.username}:${clientData.password}`)
	console.log(`Found League client on port ${clientData.port}`)
	// console.log(data)
})
connector.on('disconnect', () => clientData = {})

// Connect to League client
connector.start()

CreateRequest = (url, type, callback) =>
{
	let options =
	{
		host: clientData.address,
		port: clientData.port,
		path: url,
		method: type,
		headers:
		{
			'Authorization': `Basic ${clientData.authString}`,
			'Content-Type': 'application/json',
			'Accept': '*/*',
			'User-Agent': 'insomnia/7.1.1'
		}
	}
	// console.log(options)
	let output = ''
	const request = https.request(options, (res) =>
	{
		// console.log(`Request response for '${clientData.address}:${clientData.port}${url}': ${res.statusCode}`)
		// console.log(`Headers: ${JSON.stringify(res.headers)}`)

		res.on('data', (chunk) => output += chunk)
		res.on('end', () =>
		{
			callback(output.length > 0 ? JSON.parse(output) : {})

			// console.log('Data: ' + output)
		})
	})

	request.on('error', (err) => { throw new Error(err) })

	return request
},


module.exports =
{
	Connector: connector,

	Get:  (url) 		=> new Promise((resolve) => CreateRequest(url, 'GET',  resolve).end()),
	Post: (url, data) 	=> new Promise((resolve) => CreateRequest(url, 'POST', resolve).end(data))
}