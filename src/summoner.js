const LoLClient = require('./LoLClient')

module.exports =
{
	summoner: {},

	refreshSummonerData: () => new Promise((resolve) =>
	{
		LoLClient.Get('/lol-summoner/v1/current-summoner')
			.then(data =>
				{
					module.exports.summoner = data
					resolve(module.exports.summoner)
				})
			.catch(err => console.error(err))
	})
}