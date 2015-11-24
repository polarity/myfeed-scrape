var cheerio, parseImageSite, parseImage, parseRegularWebsite, request, iconv;

request = require('request');
cheerio = require('cheerio');
Boom = require('boom');
iconv = require('iconv');

/**
 * Extract header params
 * @author Robert Agthe <robert@scriptshit.de
 */
var getParams = function(str) {
	var params = str.split(';').reduce(function(params, param) {
		var parts = param.split('=').map(function(part) {
			return part.trim();
		});
		if (parts.length === 2) {
			params[parts[0]] = parts[1];
		}
		return params;
	}, {});
	return params;
};

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
	type = $('meta[property="og:type"]').attr('content');
	return {
		title: title,
		description: description,
		thumbnail: thumbnail,
		type: type ? type : 'url',
		url: url
	};
};
// parse a image file
parseImage = function(url) {
	var data = {
		title: "Photo",
		description: "",
		thumbnail: url,
		type: 'image',
		url: url,
		embed: '<a href="' + url + '"><img src="' + url + '" alt="Photo"></a>'
	};
	return data;
};
// parse a known image hoster
parseImageSite = function(html, url) {
	var data = parseRegularWebsite(html, url);
	data.type = 'image';
	data.embed = '<a href="' + url + '" title="' + data.title + '"><img src="' + data.thumbnail + '" alt="' + data.title + '"></a>';
	return data;
};
// parse a known video portal
parseVideoSite = function(html, url) {
	var data = parseRegularWebsite(html, url);
	data.type = 'video';
	return data;
};
// parse a known image hoster
parseImgur = function(html, url) {
	var data = parseRegularWebsite(html, url);
	$ = cheerio.load(html);
	if (data.type == 'video.other') {
		data.type = 'video';
		data.content_url = $('meta[name="twitter:player:stream"]').attr('content');
		data.embed = '<video style="width: 100%;" preload="auto" autoplay="autoplay" muted="muted" loop>\
<source src="' + data.content_url.replace('.mp4', '.webm') + '" type="video/webm">\
<source src="' + data.content_url + '" type="video/mp4">\
<img src="' + data.thumbnail.replace('?fb', '') + '" title="Your browser does not support the video tag">\
</video>';
	} else {
		data.type = 'image';
		data.embed = '<a href="' + url + '" title="' + data.title + '"><img src="' + data.thumbnail.replace('?fb', '') + '" alt="' + data.title + '"></a>';
		data.content_url = data.thumbnail.replace('?fb', '');
	}
	return data;
};
// parse a known sound portal
parseSoundcloud = function(response, url) {
	var parsedBody;
	if (typeof response.body != 'object') {
		parsedBody = JSON.parse(response.body);
	} else {
		parsedBody = response.body;
	}
	return {
		title: parsedBody.title,
		description: parsedBody.description,
		thumbnail: parsedBody.thumbnail_url,
		type: 'sound',
		url: url,
		embed: parsedBody.html,
		full_response: parsedBody
	};
};
// parse a known sound portal
parseSpotify = function(response, url) {
	var parsedBody;
	if (typeof response.body != 'object') {
		if (!response || response === '') {
			return false;
		} else {
			parsedBody = JSON.parse(response.body);
		}

	} else {
		parsedBody = response.body;
	}
	return {
		title: parsedBody.title,
		description: parsedBody.description,
		thumbnail: parsedBody.thumbnail_url,
		type: 'sound',
		url: url,
		embed: parsedBody.html,
		full_response: parsedBody
	};
};
// instagram oembed
parseInstagram = function(response, url) {
	var parsedBody;
	if (typeof response.body != 'object') {
		parsedBody = JSON.parse(response.body);
	} else {
		parsedBody = response.body;
	}
	return {
		title: parsedBody.title,
		thumbnail: parsedBody.thumbnail_url,
		type: 'image',
		url: url,
		embed: parsedBody.html.replace('max-width:658px; ', ''),
		full_response: parsedBody
	};
};
// Vine oembed
parseVine = function(response, url) {
	var parsedBody;
	if (typeof response.body != 'object') {
		parsedBody = JSON.parse(response.body);
	} else {
		parsedBody = response.body;
	}
	return {
		title: parsedBody.title,
		thumbnail: parsedBody.thumbnail_url,
		type: 'video',
		url: url,
		embed: parsedBody.html,
		full_response: parsedBody
	};
};
// parse twitter
parseTwitter = function(response, url) {
	$ = cheerio.load(response);
	return {
		title: $('title').text(),
		description: $('.permalink-tweet p.js-tweet-text').text(),
		thumbnail: $('meta[property="og:image"]').attr('content'),
		type: 'article',
		url: $('meta[property="og:url"]').attr('content'),
		embed: '<blockquote data-align="center" class="twitter-tweet" lang="de"><p>' + $('.permalink-tweet p.js-tweet-text').text() + '</p>&mdash; ' + $('div.permalink-tweet').attr('data-name') + ' (@' + $('div.permalink-tweet').attr('data-screen-name') + ') <a href="' + $('meta[property="og:url"]').attr('content') + '">13. November 2014</a></blockquote>'
	};
};
// parse a known video portal
parseYoutube = function(response, url) {
	var parsedBody;
	if (typeof response.body != 'object') {
		parsedBody = JSON.parse(response.body);
	} else {
		parsedBody = response.body;
	}

	var html = parsedBody.html.replace('width="480', '').replace('height="270"', 'class="youtube"');

	return {
		title: parsedBody.title,
		thumbnail: parsedBody.thumbnail_url,
		type: 'video',
		url: url,
		embed: html,
		full_response: parsedBody
	};
};
parseGfycat = function(response, url) {
	var parsedBody;
	if (typeof response.body != 'object') {
		parsedBody = JSON.parse(response.body);
	} else {
		parsedBody = response.body;
	}
	parsedBody = parsedBody.gfyItem;
	return {
		title: parsedBody.gfyName,
		description: "Animated Loop from gfycat by " + parsedBody.userName,
		thumbnail: parsedBody.gifUrl,
		type: 'video',
		url: url,
		embed: '<video style="width: 100%;" preload="auto" autoplay="autoplay" muted="muted" loop>\
<source src="' + parsedBody.webmUrl + '" type="video/webm">\
<source src="' + parsedBody.mp4Url + '" type="video/mp4">\
<img src="' + parsedBody.gifUrl + '" title="Your browser does not support the video tag">\
</video>',
		full_response: parsedBody
	};
};

// Mixcloud oembed
parseMixcloud = function(response, url) {
	var parsedBody;
	if (typeof response.body != 'object') {
		parsedBody = JSON.parse(response.body);
	} else {
		parsedBody = response.body;
	}

	// Remove element width and set it to css 100% width
	var html = parsedBody.html.replace('width="300', 'style="width:100%;" class="mixcloud"');

	return {
		title: parsedBody.title,
		thumbnail: parsedBody.thumbnail_url,
		type: 'sound',
		url: url,
		embed: html,
		full_response: parsedBody
	};
};

// get the site, parse it and return what we found
exports.scrape = function(req, res) {
	var parsedObj;
	// parse different sites and media different ;)
	if (req.body.url.indexOf('.jpg') !== -1 || req.body.url.indexOf('.jpeg') !== -1 || req.body.url.indexOf('.gif') !== -1 || req.body.url.indexOf('.png') !== -1) {
		// no request needed, it´s an image!
		parsedObj = parseImage(req.body.url);
		// send header and response
		res.setHeader('Content-Type', 'application/json');
		res.end(JSON.stringify(parsedObj));
	} else if (req.body.url.indexOf('flickr.com/') !== -1) {
		request(req.body.url, function(error, response, html) {
			if (!error && response.statusCode == 200) {
				parsedObj = parseImageSite(html, req.body.url);
				// send header and response
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(parsedObj));
			} else {
				// respond with error
				response = Boom.badRequest('Flickr failed');
				res.status(response.output.statusCode).send(response.output.payload);
			}
		});
	} else if (req.body.url.indexOf('imgur.com/') !== -1) {
		request(req.body.url, function(error, response, html) {
			if (!error && response.statusCode == 200) {
				parsedObj = parseImgur(html, req.body.url);
				// send header and response
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(parsedObj));
			} else {
				// respond with error
				response = Boom.badRequest('Imgur failed');
				res.status(response.output.statusCode).send(response.output.payload);
			}
		});
	} else if (req.body.url.indexOf('youtube.com/') !== -1 || req.body.url.indexOf('youtu.be/') !== -1) {
		request('http://www.youtube.com/oembed?url=' + req.body.url + '&format=json', function(error, response, html) {
			if (!error && response.statusCode == 200) {
				parsedObj = parseYoutube(response, req.body.url);
				// send header and response
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(parsedObj));
			} else {
				// respond with error
				response = Boom.badRequest('Youtube failed');
				res.status(response.output.statusCode).send(response.output.payload);
			}
		});
	} else if (req.body.url.indexOf('vimeo.com/') !== -1) {
		request(req.body.url, function(error, response, html) {
			if (!error && response.statusCode == 200) {
				parsedObj = parseVideoSite(html, req.body.url);
				// send header and response
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(parsedObj));
			} else {
				// respond with error
				response = Boom.badRequest('Vimeo failed');
				res.status(response.output.statusCode).send(response.output.payload);
			}
		});
	} else if (req.body.url.indexOf('soundcloud.com/') !== -1) {
		request('http://soundcloud.com/oembed?format=json&amp;url=' + req.body.url, function(error, response, html) {
			if (!error && response.statusCode == 200) {
				parsedObj = parseSoundcloud(response, req.body.url);
				// send header and response
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(parsedObj));
			} else {
				// respond with error
				response = Boom.badRequest('Soundcloud failed');
				res.status(response.output.statusCode).send(response.output.payload);
			}
		});
	} else if (req.body.url.indexOf('spotify.com/') !== -1) {
		request('https://embed.spotify.com/oembed/?url=' + req.body.url, function(error, response, html) {
			if (response.statusCode == 200) {
				//parsedObj = parseSpotify(response, req.body.url);
				parsedObj = {};
				// send header and response
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(parsedObj));
			} else {
				// respond with error
				response = Boom.badRequest('Spotify access failed');
				res.status(response.output.statusCode).send(response.output.payload);
			}
		});
	} else if (req.body.url.indexOf('twitter.com/') !== -1) {
		request(req.body.url, function(error, response, html) {
			if (response.statusCode == 200) {
				parsedObj = parseTwitter(html, req.body.url);
				// send header and response
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(parsedObj));
			} else {
				// respond with error
				response = Boom.badRequest('Twitter access failed');
				res.status(response.output.statusCode).send(response.output.payload);
			}
		});
	} else if (req.body.url.indexOf('instagram.com/') !== -1) {
		request('http://api.instagram.com/oembed?beta=true&url=' + req.body.url, function(error, response, html) {
			if (response.statusCode == 200) {
				parsedObj = parseInstagram(response, req.body.url);
				// send header and response
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(parsedObj));
			} else {
				// respond with error
				response = Boom.badRequest('Instagram access failed');
				res.status(response.output.statusCode).send(response.output.payload);
			}
		});
	} else if (req.body.url.indexOf('vine.co/') !== -1) {
		request('https://vine.co/oembed.json?&url=' + req.body.url, function(error, response, html) {
			if (response.statusCode == 200) {
				parsedObj = parseVine(response, req.body.url);
				// send header and response
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(parsedObj));
			} else {
				// respond with error
				response = Boom.badRequest('Vine access failed');
				res.status(response.output.statusCode).send(response.output.payload);
			}
		});
	} else if (req.body.url.indexOf('gfycat.com/') !== -1) {
		request('http://gfycat.com/cajax/get/' + req.body.url.split("/")[req.body.url.split("/").length - 1], function(error, response, html) {
			if (response.statusCode == 200) {
				parsedObj = parseGfycat(response, req.body.url);
				// send header and response
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(parsedObj));
			} else {
				// respond with error
				response = Boom.badRequest('Vine access failed');
				res.status(response.output.statusCode).send(response.output.payload);
			}
		});
	} else if (req.body.url.indexOf('mixcloud.com/') !== -1) {
		request('https://www.mixcloud.com/oembed/?format=json&url=' + req.body.url, function(error, response, html) {
			if (response.statusCode == 200) {
				parsedObj = parseMixcloud(response, req.body.url);
				// send header and response
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(parsedObj));
			} else {
				// respond with error
				response = Boom.badRequest('Mixcloud access failed');
				res.status(response.output.statusCode).send(response.output.payload);
			}
		});
	} else {
		request({
			url: req.body.url,
			encoding: null
		}, function(error, response, html) {
			if (response.statusCode == 200) {
				var charset = getParams(response.headers['content-type'] || '').charset;
				// only convert when content type available
				if(charset){
					// convert to utf8
					var ic = new iconv.Iconv(charset, 'utf-8');
					var buf = ic.convert(html);
					var websiteAsString = buf.toString('utf-8');
				} else {
					// no charset? just use the string
					// without utf8 conversion
					websiteAsString = html;
				}
				parsedObj = parseRegularWebsite(websiteAsString, req.body.url);
				parsedObj.type = 'url';
				// send header and response
				res.setHeader('Content-Type', 'application/json');
				res.end(JSON.stringify(parsedObj));
			} else {
				// respond with error
				response = Boom.badRequest('Regular Website parsing failed');
				res.status(response.output.statusCode).send(response.output.payload);
			}
		});
	}
};
