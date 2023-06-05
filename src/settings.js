let Settings =
{
	randomiseSkin: true,
	autoLockInChamp: true
}

saveSettings = () =>
{
	Settings.randomiseSkin = document.getElementById('settingsRandomiseSkin').checked
	Settings.autoLockInChamp = document.getElementById('settingsAutoLockInChamp').checked

	window.ipc.saveSettings(Settings)
}

loadSettings = async () =>
{
	Settings = await window.ipc.loadSettings()

	document.getElementById('settingsRandomiseSkin').checked = Settings.randomiseSkin
	document.getElementById('settingsAutoLockInChamp').checked = Settings.autoLockInChamp
}