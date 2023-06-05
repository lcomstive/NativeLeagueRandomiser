let runes = {}
var summoner = {}
let runeData = new Map()

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
	summoner.tempRunes = {
		primaryStyleId: 0,
		secondaryStyleId: 0,
		perkIds: []
	}
	// Select primary keystone
	output.primaryKeystone = random(runes)
	summoner.tempRunes.primaryStyleId = output.primaryKeystone.id

	output.primarySlots = []
	for(let i = 0; i < 4; i++)
	{
		let perk = random(output.primaryKeystone.slots[i].perks)
		output.primarySlots.push(perk)
		summoner.tempRunes.perkIds.push(perk)
	}

	// Select secondary keystone
	output.secondaryKeystone = {}
	do output.secondaryKeystone = random(runes)
	while(output.primaryKeystone.id == output.secondaryKeystone.id)

	summoner.tempRunes.secondaryStyleId = output.secondaryKeystone.id
	output.secondarySlots = []
	for(let i = 0; i < 2; i++)
	{
		let perk = random(output.secondaryKeystone.slots[i + 1].perks)
		output.secondarySlots.push(perk)
		summoner.tempRunes.perkIds.push(perk)
	}

	// Select stat mods
	output.statMods = []
	for(let i = 0; i < 3; i++)
	{
		let mod = random(output.secondaryKeystone.slots[i + 4].perks)
		output.statMods.push(mod)
		summoner.tempRunes.perkIds.push(mod)
	}

	return output
}

runeIconPath = (runeID) => runeData.get(runeID).iconPath.replace('/lol-game-data/assets/v1', '../assets/img')

const InvisibleElements = [ 'champion', 'runes' ]
const FadeAnimationTime = 200 // Milliseconds
randomise = async () =>
{
	InvisibleElements.forEach(element => document.getElementById(element).classList.add('invisible'))

	// Sleep
	await new Promise(r => setTimeout(r, FadeAnimationTime));

	/// CHAMPION ///
	let championData = randomChampion(Settings.randomiseSkin)
	summoner.tempChamp = championData
	let skinPath = `../assets/img/champion/tiles/${championData.champion.alias}_${championData.skinPathIndex}.jpg`
	
	// Set champion element data
	document.getElementById('champion').innerHTML = `<img id="championIcon" src='${skinPath}' />` +
													`<p id="championName">${championData.champion.skins[championData.skin].name}</p>`

	// RUNES ///
	let runes = randomRunes()
	let runeElement = document.getElementById('runes')

	let html = `<div id="primaryRunes"><img src=${runeIconPath(runes.primaryKeystone.id)} />`
	runes.primarySlots.forEach(slot => html += `<img src=${runeIconPath(slot)} />`)
	html += `</div>`

	html += `<div id="secondaryRunes"><img src=${runeIconPath(runes.secondaryKeystone.id)} />`
	runes.secondarySlots.forEach(slot => html += `<img src=${runeIconPath(slot)} />`)

	html += `<div id="statMods">`
	runes.statMods.forEach(mod => html += `<img src=${runeIconPath(mod)} />`)
	html += `</div></div>`

	runeElement.innerHTML = html

	InvisibleElements.forEach(element => document.getElementById(element).classList.remove('invisible'))
}

updateRuneExporter = () =>
{
	let html = '<select id="runeSelector">'
	for(let i = 0; i < summoner.runes.length; i++)
		html += `<option value="${i}">${summoner.runes[i].name}</option>`
	html += '</select><button onClick="exportRunes()" id="exportButton">Export</button>'
	
	document.getElementById('runeExporter').innerHTML = html
}

exportRunes = async () =>
{
	let exportButton = document.getElementById('exportButton')
	exportButton.disabled = true

	let runes = summoner.runes[Number(document.getElementById('runeSelector').value)]
	
	runes.primaryStyleId = summoner.tempRunes.primaryStyleId
	runes.subStyleId = summoner.tempRunes.secondaryStyleId
	runes.selectedPerkIds = summoner.tempRunes.perkIds

	// Upload to League client
	await window.ipc.clientPut(`/lol-perks/v1/pages/${runes.id}`, runes)

	// Check if in champ select screen
	let champSelectSession = await window.ipc.clientGet('/lol-champ-select/v1/session')
	if(champSelectSession.errorCode == 'RPC_ERROR')
	{
		exportButton.disabled = false
		return // Not in champ select
	}
	
	// Find action for local player
	let action = champSelectSession.actions[0].find(x => x.type == 'pick' && x.actorCellId == champSelectSession.localPlayerCellId)
	if(action.completed)
	{
		exportButton.disabled = false
		return // Already picked champion
	}

	let response = await window.ipc.clientPatch(`/lol-champ-select/v1/session/actions/${action.id}`, {
		championId: summoner.tempChamp.champion.id,
		completed: Settings.autoLockInChamp
	})
	if(response.errorCode) console.log(response)

	// Select skin
	response = await window.ipc.clientPatch('/lol-champ-select/v1/session/my-selection', {
		selectedSkinId: summoner.tempChamp.champion.skins[summoner.tempChamp.skin].id
	})
	if(response.errorCode) console.log(response)

	// Set rune page
	response = await window.ipc.clientPut('/lol-perks/v1/currentpage', runes.id)
	if(response.errorCode) console.log(response)
	
	exportButton.disabled = false
}

onConnectedToClient = async (summonerData) =>
{
	summoner = summonerData
	
	replaceText('summonerName', summoner.displayName)
	changePage('mainContent')

	let champions = await window.ipc.clientGet(`/lol-champions/v1/inventories/${summoner.summonerId}/champions`)
	summoner.champions = champions.filter(champ => champ.active && (champ.freeToPlay || champ.ownership.owned))
	
	summoner.runes = await window.ipc.clientGet(`/lol-perks/v1/pages`)
	updateRuneExporter()

	runes = await window.ipc.clientGet('/lol-perks/v1/styles')
	runes.forEach(rune => runeData.set(rune.id, rune))

	// Get rune data
	let perks = await window.ipc.clientGet('/lol-perks/v1/perks')
	perks.forEach(perk => runeData.set(perk.id, perk))

	randomise()
}

onDisconnectedFromClient = () => changePage('disconnected')

window.addEventListener('DOMContentLoaded', async () =>
{
	onDisconnectedFromClient()

	let summonerData = await window.ipc.getSummonerData()
	if(summonerData && summonerData.summonerId)
		onConnectedToClient(summonerData)

	loadSettings()
})

window.addEventListener('keyup', (event) =>
{
	if(event.key == ' ')
		randomise()
})

window.ipc.onRandomise(randomise)
window.ipc.onConnectedToClient(onConnectedToClient)
window.ipc.onDisconnectedFromClient(onDisconnectedFromClient)
