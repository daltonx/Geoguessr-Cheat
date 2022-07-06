const apiBase = 'http://192.168.0.106:3000'

async function registerLoc(lat, lng) {
    await fetch(`${apiBase}/log`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            lat,
            lng
        })
    })
}

async function sendSc(image) {
    await fetch(`${apiBase}/img`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify({
            image
        })
    })
}

browser.webRequest.onBeforeRequest.addListener(details => {
    let filter = browser.webRequest.filterResponseData(details.requestId)
    let decoder = new TextDecoder("utf-8")
    
    filter.ondata = event => {
        let str = decoder.decode(event.data, {stream: true})
        try {
            const { rounds } = JSON.parse(str)
            const { lat, lng } = rounds[rounds.length - 1]
            registerLoc(lat, lng)
        } catch (e) {}
        
        filter.write(event.data)
        filter.disconnect()
    }
    return {}
},
    { urls: [ 
        'https://www.geoguessr.com/api/v3/games*', 
        'https://www.geoguessr.com/api/v3/challenges*'
    ]},
    [ 'blocking' ]
)
  
browser.commands.onCommand.addListener(async command => {
    if(command !== 'doshit') return
    const img = await browser.tabs.captureVisibleTab()
    sendSc(img)
})