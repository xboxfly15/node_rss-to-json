const RssParser = require('rss-parser')
const parser = new RssParser()
const app = require('express')()
const cron = require('node-cron')

const settings = require('./settings.json')
const refreshRate = parseInt(settings.refreshRateInMinutes)
const limit = parseInt(settings.limitItemsPerRSSFeed)
const { rssFeeds } = settings
const rssCache = {}

const ipAddr = process.env.IP_ADDR || '0.0.0.0'
const port = process.env.PORT || 9000

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  return next()
})

app.get('/', (req, res) => res.json(rssCache))
app.get('/feeds', (req, res) => res.json(rssFeeds))
app.listen(port, ipAddr, () => console.info(`node_rss-to-json started on ${ipAddr}:${port}. Refresh rate set at ${refreshRate} minutes & limit set at ${limit} items per RSS feed`))

cron.schedule(`0 */${refreshRate} * * * *`, () => {
  Object.keys(rssFeeds).forEach(async category => {
    rssCache[category] = []
    console.log('Fetching ' + category)
    for (const url of rssFeeds[category]) await fetchAndPushItems(rssCache[category], url, limit)
    console.log('Fetched ' + rssCache[category].length + ' items from ' + category)
  })
})

function fetchAndPushItems(array, url, limit = 25) {
  return new Promise(resolve => resolve(parser.parseURL(url)))
    .then(feed => {
      for (let i = 0; i < limit; i++) {
        array.push({
          title: escapeString(feed.items[i].title),
          link: escapeString(feed.items[i].link),
          content: escapeString(feed.items[i].contentSnippet),
          published: parseInt(new Date(escapeString(feed.items[i].isoDate)).getTime())
        })
      }
    })
}

function escapeString(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}
