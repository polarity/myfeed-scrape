var cheerio, parseImageSite, parseImage, parseRegularWebsite, request;

request = require('request');
cheerio = require('cheerio');

parseImage = function(url) {
  return {
    title: "",
    description: "",
    thumbnail: url,
    type: 'image'
  };
};

parseImageSite = function(html) {
  var $, description, thumbnail, title;
  $ = cheerio.load(html);
  title = $('meta[property="og:title"]').attr('content');
  if (!title) {
    title = $('title').text();
  }
  description = $('meta[property="og:description"]').attr('content');
  if (!description) {
    description = $('meta[name="description"]').attr('content');
  }
  thumbnail = $('meta[property="og:image"]').attr('content');
  return {
    title: title,
    description: description,
    thumbnail: thumbnail,
    type: 'image'
  };
};

parseRegularWebsite = function(html) {
  var $, apple_icon, description, thumbnail, title;
  $ = cheerio.load(html);
  title = $('meta[property="og:title"]').attr('content');
  if (!title) {
    title = $('title').text();
  }
  description = $('meta[property="og:description"]').attr('content');
  if (!description) {
    description = $('meta[name="description"]').attr('content');
  }
  thumbnail = $('meta[property="og:image"]').attr('content');
  apple_icon = $('link[rel="apple-touch-icon"][sizes="144x144"]').attr('href');
  if (apple_icon && !thumbnail) {
    thumbnail = req.body.url + '/' + apple_icon;
  }
  return {
    title: title,
    description: description,
    thumbnail: thumbnail,
    type: 'url'
  };
};

exports.scrape = function(req, res) {
  return request(req.body.url, function(error, response, html) {
    var parsedObj;
    if (req.body.url.indexOf('.jpg') !== -1 || req.body.url.indexOf('.jpeg') !== -1 || req.body.url.indexOf('.gif') !== -1 || req.body.url.indexOf('.png') !== -1) {
      parsedObj = parseImage(req.body.url);
    } else if (req.body.url.indexOf('flickr.com/') !== -1 || req.body.url.indexOf('imgur.com/') !== -1) {
      parsedObj = parseImageSite(html);
    } else {
      parsedObj = parseRegularWebsite(html);
    }
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      title: parsedObj.title,
      url: req.body.url,
      excerpt: parsedObj.description,
      thumb: parsedObj.thumbnail,
      type: parsedObj.type
    }));
  });
};
