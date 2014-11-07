var irc     = require('irc');
var request = require('request');
var cheerio = require('cheerio');

var config = {
  channels: [''],
  server: '',
  botName: 'LyricsBot'
};

var bot = new irc.Client(config.server, config.botName, {
  channels: config.channels
});

bot.output = function (str) {
  bot.say(config.channels[0], str);
}

var singing       = false;
var songFinished  = false;
var currentLyrics = [];

var currentLine = 0;
var defaultNumLines = 10;

bot.addListener('message', function (from, to, text, message) {
  if (text.match(/^lyricsbot help$/i)) {
    bot.output('Request a song by typing "LyricsBot sing [artist]:[song]".');
    bot.output('Continue current song by typing "LyricsBot continue".');
  } else if (text.match(/lyricsbot sing/i) && !singing) {
    var artistSongRegExp = /sing (.+)\:(.+)/gi;
    var match = artistSongRegExp.exec(text);

    if (match) {
      var artist = parseString(match[1]);
      var song   = parseString(match[2]);
      var url    = 'http://lyrics.wikia.com/' + artist + ':' + song;

      makeLyricRequest(url, artist, song, from);
    }
  } else if (text.match(/lyricsbot continue/i) && !singing && !songFinished && currentLyrics.length > 0) {
    sing(currentLine, defaultNumLines);
  }
});

function doneSinging() {
  singing = false;

  var response = songFinished ? 'Song finished! You may request a new song.' : 'You may have me continue singing the next lines of the current song or request a new song.';

  bot.output(response);
}

function makeLyricRequest(url, artist, song, from) {
  bot.output('Fetching lyrics...');

  // using request library
  request(url, function (error, response, body) {
    if (error) { throw error; }

    resetBotStatus();

    // load response body to allow for jQuery functionality server-side
    var $ = cheerio.load(body);

    // if lyrics do not exist
    if ($('.lyricbox').text() == '') {
      var redirectLink = $('.redirectText').find('a').attr('href');

      singing = false;

      // check for redirect link, if it exists, pull lyrics
      if (redirectLink) {
        var newUrl = 'http://lyrics.wikia.com/' + redirectLink.slice(1);
        makeLyricRequest(newUrl, artist, song, from);
      } else {
        bot.output('Sorry ' + from + ', that artist or song was not found.');
      }
    } else {
      // remove ad HTML
      $('.rtMatcher').empty();
      $('br').replaceWith('|');

      // remove stupid JS script and irrelevant div
      $('.lyricbox script, .lyricbox div').remove();

      // get lyrics and replace with | to allow for split
      var lyrics = $('.lyricbox').text();
      lyrics.replace(/([\,\!\?\'\)a-z])([A-Z])/, '$1|$2');
      currentLyrics = lyrics.split('|');

      removeSpaces();
      sing(0, defaultNumLines);
    }
  });
}

function parseString(string) {
  return string.replace(/ \w/g, function (txt) {
    return '_' + txt[1].toUpperCase();
  });
}

// remove empty lines from lyrics
function removeSpaces() {
  currentLyrics = currentLyrics.filter(function (line) {
    return line !== '';
  });
}

// reset LyricsBot's singing status, songFinished, and numLines
function resetBotStatus() {
  singing      = true;
  songFinished = false;
}

function sing(startLine, numLines) {
  var time = 0;
  currentLine = startLine;
  endLine = Math.min(startLine + numLines, currentLyrics.length);

  for (var i = startLine; i < endLine; i++) {
    time += 2500;

    setTimeout(function () {
      bot.output(currentLyrics[currentLine]);
      currentLine++;

      if (currentLine == currentLyrics.length) {
        songFinished = true;
      }
    }, time);
  }

  setTimeout(doneSinging, time + 50);
}
