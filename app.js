const express = require('express')
const cors = require('cors')
const { createCanvas, loadImage } = require('canvas')
const { Translate } = require('@google-cloud/translate').v2
const vision = require('@google-cloud/vision')
const ejs = require('ejs')
const axios = require('axios')
const { v4: uuidv4 } = require('uuid')

const app = express()
const data = {
    uuid: '',
    address: '',
    url: '',
    embedUrl: '',
    translate: ''
}

async function geocode(lat, lng) {
    const { data } = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
    return data.error ? false : data
}

function numberfy (str) {
    const dict = {
        a: 4,
        b: 6,
        e: 3,
        i: 1,
        o: 0,
        t: 7,
        l: 1
    }
    return str.split('').map(char => dict[char] || char + 'b').join('')
}

function shh (addr) {
    const uuid = uuidv4()
    const country = addr.split(',').pop().trim()
    console.log(`${uuid}-${numberfy(country.toLowerCase())}-${uuid}`)
}

async function log(lat, lng) {
    const locData = await geocode(lat, lng)
    data.uuid = uuidv4()
    data.address = locData.display_name
    data.url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
    data.embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=5&ie=UTF8&iwloc=&output=embed`
    shh(data.address)
}

app.options('/log', cors())
app.post('/log', cors(), express.json(), (req, res) => {
    const { lat, lng } = req.body
    log(lat, lng)
    res.end()
})

app.options('/img', cors())
app.post('/img', cors(), express.text({ limit: '50mb' }), async (req, res) => {
    const image = req.body
    const buffer = Buffer.from(image.split(',')[1], 'base64')
    
    const img = await loadImage(buffer)
    const canvas = createCanvas(400, 400)
    const ctx = canvas.getContext('2d')
    const x = (canvas.width  - img.width ) * 0.5
    const y = (canvas.height - img.height) * 0.5
    ctx.drawImage(img, x, y)

    const client = new vision.ImageAnnotatorClient({
        keyFilename: './key.json'
    })

    const clientTranslator = new Translate({
        keyFilename: './key.json'
    })
    
    const [ result ] = await client.textDetection({
        image: {
            content: canvas.toBuffer()
        }
    })

    const { text } = result.fullTextAnnotation
    const test = await clientTranslator.translate(text, 'en')
    data.translate = JSON.stringify(test)
    res.end()
})

app.get('/', async (req, res) => {
    console.log(data)
    res.send(await ejs.renderFile('data.ejs', data))
})

app.get('/test', (req, res) => {
    res.send('teste')
})

app.get('/uuid', (req, res) => {
    res.send(data.uuid)
})

app.listen(3000)