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
}

const replaceText = (selector, text) =>
{
	const element = document.getElementById(selector)
	if(element) element.innerText = text
}

random = (inputArray) => inputArray[Math.floor(Math.random() * inputArray.length)]
