const path = require('path')
const https = require('https')
const LCUConnector = require('lcu-connector')

const connector = new LCUConnector()
const RetryDelay = 1000 // Milliseconds. Time between attempting request again
var clientData = {}

connector.on('connect', data =>
{
	clientData = data
	console.log(`Found League client on port ${clientData.port}`)
	clientData.authString = btoa(`${clientData.username}:${clientData.password}`)
})
connector.on('disconnect', () => clientData = {})

// Connect to League client
connector.start()

CreateRequest = (url, type, callback, retryAttempts = 3) =>
{
	let options =
	{
		host: clientData.address,
		port: clientData.port,
		path: url,
		method: type,
		rejectUnauthorized: false,
		headers:
		{
			'Authorization': `Basic ${clientData.authString}`,
			'Content-Type': 'application/json',
			'Accept': '*/*',
		}
	}
	// console.log(options)
	let output = ''
	const request = https.request(options, (res) =>
	{
		// console.log(`Request response for '${clientData.address}:${clientData.port}${url}': ${res.statusCode}`)
		// console.log(`Headers: ${JSON.stringify(res.headers)}`)

		res.on('data', (chunk) => output += chunk)
		res.on('end', async () => callback(output.length > 0 ? JSON.parse(output) : {}))
	})

	request.on('error', (err) =>
	{
		console.error(err)
		console.error('Disconnecting from League client')
		connector.stop()
	})

	return request
}

module.exports =
{
	Connector: connector,

	Get:  (url) 		=> new Promise((resolve) => CreateRequest(url, 'GET',  resolve).end()),
	Put:  (url, data) 	=> new Promise((resolve) => CreateRequest(url, 'PUT', resolve).end(JSON.stringify(data))),
	Post: (url, data) 	=> new Promise((resolve) => CreateRequest(url, 'POST', resolve).end(JSON.stringify(data)))
}