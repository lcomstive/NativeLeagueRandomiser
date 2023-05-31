let runes = {}
var summoner = {}
let runeData = new Map()

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

random = (inputArray) => inputArray[Math.floor(Math.random() * inputArray.length)]

/*
	Chooses a champion at random and returns an object containing champion data and skin index.
	If `randomSkin` is false, skin selected is base skin (index 0)
*/
const SkinPathIndexRegex = /loadscreen\_(\d+)/i
randomChampion = (randomSkin = true) =>
{
	let champion = random(summoner.champions)
	if(!randomSkin)
		return  { champion, skin: 0, skinPathIndex: 0 }

	let skinIndex = 0
	do skinIndex = Math.floor(Math.random() * champion.skins.length)
	while(!champion.skins[skinIndex].ownership.owned)
	
	// Extract skin number from data
	// e.g. skin.loadScreenPath "/lol-game-data/assets/ASSETS/Characters/Caitlyn/Skins/Skin13/CaitlynLoadScreen_13.jpg"
	let skinPathIndex = champion.skins[skinIndex].loadScreenPath.match(SkinPathIndexRegex)
	if(!skinPathIndex) // If base skin
		skinPathIndex = 0
	else
		skinPathIndex = Number(skinPathIndex[1])

	return { champion, skin: skinIndex, skinPathIndex }
}

randomRunes = () =>
{
	let output = {}
	// Select primary keystone
	output.primaryKeystone = random(runes)
	output.primarySlots = []
	for(let i = 0; i < 4; i++)
		output.primarySlots.push(random(output.primaryKeystone.slots[i].perks))

	// Select secondary keystone
	output.secondaryKeystone = {}
	do output.secondaryKeystone = random(runes)
	while(output.primaryKeystone.id == output.secondaryKeystone.id)

	output.secondarySlots = []
	for(let i = 0; i < 2; i++)
		output.secondarySlots.push(random(output.secondaryKeystone.slots[i + 1].perks))

	// Select stat mods
	output.statMods = []
	for(let i = 0; i < 3; i++)
		output.statMods.push(random(output.secondaryKeystone.slots[i + 4].perks))

	return output
}

runeIconPath = (runeID) => runeData.get(runeID).iconPath.replace('/lol-game-data/assets/v1', '../assets/img')

const InvisibleElements = [ 'champion', 'runes' ]
randomise = async () =>
{
	InvisibleElements.forEach(element => document.getElementById(element).classList.add('invisible'))

	// Sleep
	await new Promise(r => setTimeout(r, 200));

	/// CHAMPION ///
	let championData = randomChampion()
	let skinPath = `../assets/img/champion/tiles/${championData.champion.alias}_${championData.skinPathIndex}.jpg`
	
	// Set champion element data
	document.getElementById('champion').innerHTML = `<img id="championIcon" src='${skinPath}' />` +
													`<p id="championName">${championData.champion.skins[championData.skin].name}</p>`

	// RUNES ///
	let runes = randomRunes()
	let runeElement = document.getElementById('runes')

	let html = `<div id="primaryRunes">`
	html += `<img src=${runeIconPath(runes.primaryKeystone.id)} />`
	runes.primarySlots.forEach(slot => html += `<img src=${runeIconPath(slot)} />`)
	html += `</div>`

	html += `<div id="secondaryRunes">`
	html += `<img src=${runeIconPath(runes.secondaryKeystone.id)} />`
	runes.secondarySlots.forEach(slot => html += `<img src=${runeIconPath(slot)} />`)

	html += `<div id="statMods">`
	runes.statMods.forEach(mod => html += `<img src=${runeIconPath(mod)} />`)
	html += `</div></div>`

	runeElement.innerHTML = html

	InvisibleElements.forEach(element => document.getElementById(element).classList.remove('invisible'))
}

onConnectedToClient = async (summonerData) =>
{
	summoner = summonerData
	console.log(summoner)

	replaceText('summonerName', summoner.displayName)
	changePage('mainContent')

	let champions = await window.ipc.clientGet(`/lol-champions/v1/inventories/${summoner.summonerId}/champions`)
	summoner.champions = champions.filter(champ => champ.active && (champ.freeToPlay || champ.ownership.owned))
	console.log(summoner.champions)

	summoner.runes = await window.ipc.clientGet(`/lol-perks/v1/pages`)
	console.log(summoner.runes)

	runes = await window.ipc.clientGet('/lol-perks/v1/styles')
	console.log(runes)
	runes.forEach(rune => runeData.set(rune.id, rune))

	// Get rune data
	let perks = await window.ipc.clientGet('/lol-perks/v1/perks')
	perks.forEach(perk => runeData.set(perk.id, perk))

	randomise()
}

window.addEventListener('DOMContentLoaded', async () =>
{
	changePage('disconnected')

	let summonerData = await window.ipc.getSummonerData()
	if(summonerData && summonerData.summonerId)
		onConnectedToClient(summonerData)
})
	
window.ipc.onConnectedToClient(onConnectedToClient)
