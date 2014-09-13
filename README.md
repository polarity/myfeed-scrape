myFeedScrape
============

scrapes websites for "MyFeed" and returns nice informations

```
myFeedScrape = require 'myFeedScrape'

# scrape a website url
# request needs an url key
# req.url = "http://google.de"
app.post "/api/scrapethis", (req, res)->
	myFeedScrape.scrape(req, res)
````
