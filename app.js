'use strict'
const rssParser = require('rss-parser')
const parser = new rssParser()
const app = require('express')()
const CronJob = require('cron').CronJob

const settings = require('./settings.json')
const refreshRate = parseInt(settings.refreshRateInMinutes)
const limit = parseInt(settings.limitItemsPerRSSFeed)
const rssFeeds = settings.rssFeeds
let rssCache = {}

app.get('/', (req, res) => res.json(rssCache))
app.get('/feeds', (req, res) => res.json(rssFeeds))
app.listen(8080, () => console.log('Listening on port 8080'))

var job = new CronJob('0 */'+refreshRate+' * * * *', () => {
  Object.keys(rssFeeds).forEach(async category => {
    rssCache[category] = new Array()
    console.log('Fetching ' + category)
    for (const url of rssFeeds[category]) await fetchAndPushItems(rssCache[category], url, limit)
    console.log('Fetched ' + rssCache[category].length + ' items from ' + category)
  })
})
job.start()

function fetchAndPushItems(array, url, limit=25) {
  return new Promise(resolve => resolve(parser.parseURL(url)))
  .then(feed => {
    for(let i = 0; i < limit; i++) {
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

console.log('Started njs_rss_to_json, refresh rate set at ' + refreshRate + ' minutes & limit set at ' + limit + ' items per RSS feed')