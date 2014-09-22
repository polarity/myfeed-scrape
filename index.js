var cheerio, parseImageSite, parseImage, parseRegularWebsite, request;

request = require('request');
cheerio = require('cheerio');

// parse a normal website
parseRegularWebsite = function(html, url) {
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
    type: 'url',
    url: url
  };
};

// parse a image file
parseImage = function(html, url) {
  var data = parseRegularWebsite(html, url);
  data.title = "";
  data.description = "";
  data.thumbnail = url;
  data.type = 'image';
  return data;
};

// parse a known image hoster
parseImageSite = function(html, url) {
  var data = parseRegularWebsite(html, url);
  data.type = 'image';
  return data;
};

// parse a known video portal
parseVideoSite = function(html, url) {
  var data = parseRegularWebsite(html, url);
  data.type = 'video';
  return data;
};

// get the site, parse it and return what we found
exports.scrape = function(req, res) {
  return request(req.body.url, function(error, response, html) {

    var parsedObj;

    // parse different sites and media different ;)
    if (req.body.url.indexOf('.jpg') !== -1 || req.body.url.indexOf('.jpeg') !== -1 || req.body.url.indexOf('.gif') !== -1 || req.body.url.indexOf('.png') !== -1) {
      parsedObj = parseImage(html, req.body.url);
    } else if (req.body.url.indexOf('flickr.com/') !== -1 || req.body.url.indexOf('imgur.com/') !== -1) {
      parsedObj = parseImageSite(html, req.body.url);
    } else if (req.body.url.indexOf('vimeo.com/') !== -1 || req.body.url.indexOf('youtube.com/') !== -1){
      parsedObj = parseVideoSite(html, req.body.url);
    } else {
      parsedObj = parseRegularWebsite(html, req.body.url);
    }

    // send header and response
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(parsedObj));
  });
};
