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
var songFinished = false;
var lyricsArray = [];

var currentLine = 0;
var startLine = 0;
var numLines = 10;

bot.addListener("message", function (from, to, text, message) {
  if (text.match(/^(L|l)yrics(B|b)ot\shelp$/)) {
    bot.say(config.channels[0], "Request a song by typing \"LyricsBot sing [artist]:[song]\".");
    bot.say(config.channels[0], "Continue current song by typing \"LyricsBot continue\".");
  } else if (text.match(/(L|l)yrics(B|b)ot\ssing/)) {
    if (singing == false) {
      var artistSongRegExp = /sing\s(.+)\:(.+)/g;
      var match = artistSongRegExp.exec(text);

      if (match != null) {
        var artist = match[1].replace(/\s\w/g, function (txt) {
          return '_' + txt.charAt(1).toUpperCase();
        });
        var song = match[2].replace(/\s\w/g, function (txt) {
          return '_' + txt.charAt(1).toUpperCase();
        });
        
        // artist = artist.charAt(0).toUpperCase() + artist.slice(1);
    
        console.log(artist)
        console.log(song)
    
        var url = 'http://lyrics.wikia.com/' + artist + ':' + song;
        
        makeLyricRequest(url, artist, song, from);
      }
    }
  } else if (text.match(/(L|l)yrics(B|b)ot\scontinue/)) {
    if (singing == false && lyricsArray.length > 0 && currentLine < lyricsArray.length - 1) {
      startLine = currentLine;
      sing(startLine, numLines);
    }
  }
});

function makeLyricRequest(url, artist, song, from) {
  bot.say(config.channels[0], "Fetching lyrics...");
  
  // using request library
  request(url, function (err, resp, body) {
    if (err) { throw err; }
    
    // set LyricsBot's singing status to true and songFinished to false
    singing = true;
    songFinished = false;

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
      lyricsArray = lyrics.split("|");
      
      removeSpaces();
      sing(0, numLines);
    }
  });
}

function sing(startLine, numLines) {
  var time = 0;
  currentLine = startLine;
  
  if (startLine + numLines < lyricsArray.length) {
    endLine = startLine + numLines;
  } else {
    endLine = lyricsArray.length;
  }
  
  for (var line = startLine; line < endLine; line++) {
    time += 25;
    
    setTimeout(function () {      
      bot.say(config.channels[0], lyricsArray[currentLine]);
      currentLine++;
      
      if (currentLine == lyricsArray.length) {
        console.log("SONG FINISHED");
        songFinished = true;
      }
    }, time);
  }
  
  setTimeout(function () {
    doneSinging()
  }, time + 50);
}

function doneSinging() {
  singing = false;
  
  if (songFinished) {
    bot.say(config.channels[0], "Song finished! You may request a new song.");
  } else {
    bot.say(config.channels[0], "You may have me continue singing the next lines of the current song or request a new song.");
  }
}

function removeSpaces() {
  for (var idx = lyricsArray.length - 1; idx >= 0; idx--) {
    if (lyricsArray[idx] == "") {
      lyricsArray.splice(idx, 1);
    }
  }
}
