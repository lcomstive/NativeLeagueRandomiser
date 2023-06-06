# League Randomiser
Generates a random champion and runes for a player to try out, this is intended for fun or a challenge.

## Setup
 - Install [NodeJS](https://nodejs.org/en)
 - Clone the repo
 - Open a terminal and cd to the root repo directory
 - Run `node install` to install dependencies
 - Download [DDragon data](https://developer.riotgames.com/docs/lol#data-dragon) and extract the `img` directory to repo `assets` folder
	- You should have the folder structure so that this path is valid: `<repo>/assets/img/champion/tiles/Aatrox_0.jpg`
 - Run `node start`

## Roadmap
* [x] Randomised runes
* [x] Randomised champions and skins, using what is available on the logged-in League client
* [x] Export runes to League client
* [x] Set active rune page, lock-in champion and skin in champ select
* [x] Settings page
* [ ] History of rolls
* [ ] Random summoner spells
* [ ] Random mythic item recommendation
* [ ] Create more randomness, as some champions roll more than others or twice in a row

## License
This repository is released under the [ISC License](./LICENSE.md)
