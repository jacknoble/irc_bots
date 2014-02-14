var irc     = require("irc");
var request = require('request');
var cheerio = require('cheerio');

var config = {
	channels: ["#"],
	server: "irc.foonetic.net",
  botName: "LyricsBot"
};

var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels
});

var singing = false;
var lyricsArray = [];

function makeLyricRequest(url, artist, song, from) {
  // using request library
  request(url, function (err, resp, body) {
    if (err) { throw err; }
    
    // set LyricsBot's singing status to true
    singing = true;

    // load response body to allow for jQuery functionality server-side
    $ = cheerio.load(body);

    // if lyrics do not exist
    if ($('.lyricbox').text() == "") {
      var redirectLink = $('.redirectText').find('a').attr('href');
      
      singing = false;
      
      // check for redirect link, if it exists, pull lyrics
      if (redirectLink != '' && redirectLink != null && redirectLink != undefined) {
        url = 'http://lyrics.wikia.com/' + redirectLink.slice(1);
        makeLyricRequest(url, artist, song, from);
      } else {
        bot.say(config.channels[0], "Sorry " + from + ", that artist or song was not found.");
      }
    } else {
      // remove ad HTML
      $('.rtMatcher').html('');
      
      $('br').each(function () {
        $(this).replaceWith('|')
      });      

      // get lyrics and replace with | to allow for split
      var lyrics = $('.lyricbox').text();
      lyrics.replace(/(\,|\!|\?|\'|\)|[a-z])([A-Z])/, '$1|$2');
      lyricsArray = lyrics.split("|").slice(0, 10);
      
      var time = 0
      var normalFinish = false

      // print each line of lyrics
      lyricsArray.forEach(function (line, idx) {
        time = time + 2500;

        setTimeout(function () {
          bot.say(config.channels[0], line);
        
          if (idx == 9) {
            normalFinish = true;
            doneSinging();
          }
        }, time);
      });
      
      setTimeout(function () {
        if (normalFinish == false) { doneSinging(); }
      }, time + 50);
    }
  });
}

function doneSinging() {
  singing = false;
  bot.say(config.channels[0], "Okay, I'm done singing. You may now request a new song.");
}

bot.addListener("message", function (from, to, text, message) {
  if (text.match(/^(L|l)yrics(B|b)ot\shelp$/)) {
    bot.say(config.channels[0], "Request a song by typing \"LyricsBot sing [artist]:[song]\".");
  } else if (text.match(/(L|l)yrics(B|b)ot\ssing/)) {
    if (singing == false) {      
      var artistSongRegExp = /sing\s(.+)\:(.+)/g;
      var match = artistSongRegExp.exec(text);

      if (match != null) {
        var artist = match[1].replace(/\s\w/g, function (txt) {
          return '_' + txt.charAt(1).toUpperCase();
        });
        var song = match[2].replace(/\s/g, '_');
        
        // artist = artist.charAt(0).toUpperCase() + artist.slice(1);
    
        console.log(artist)
        console.log(song)
    
        var url = 'http://lyrics.wikia.com/' + artist + ':' + song;
        
        makeLyricRequest(url, artist, song, from);
      }
    }
  }
});