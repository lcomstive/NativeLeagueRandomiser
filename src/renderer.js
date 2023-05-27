var summoner = {}

const changePage = (selectedPage) =>
{
	for(let i = 0; i < document.body.children.length; i++)
	{
		var element = document.body.children[i]
		if(element.id == selectedPage)
			element.classList.add('selectedPage')
		else
			element.classList.remove('selectedPage')
	}

	console.log(`Page set to '${selectedPage}'`)
}

const replaceText = (selector, text) =>
{
	const element = document.getElementById(selector)
	if(element) element.innerText = text
}

onConnectedToClient = async (summonerData) =>
{
	summoner = summonerData
	console.log(summoner)

	replaceText('summonerName', summoner.displayName)
	changePage('mainContent')

	let champions = await window.ipc.clientGet(`/lol-champions/v1/inventories/${summoner.summonerId}/champions`)
	console.log(champions)

	let runes = await window.ipc.clientGet(`/lol-perks/v1/pages`)
	console.log(runes)
}

window.addEventListener('DOMContentLoaded', async () =>
{
	changePage('disconnected')

	let summonerData = await window.ipc.getSummonerData()
	if(summonerData && summonerData.summonerId)
		onConnectedToClient(summonerData)
})
	
window.ipc.onConnectedToClient(onConnectedToClient)
