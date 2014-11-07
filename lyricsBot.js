var irc     = require('irc');
var request = require('request');
var cheerio = require('cheerio');

var config = {
  channels: ['#appacademy'],
  server: 'irc.foonetic.net',
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
var song = null;
var toCompletion = false;

bot.addListener('message', function (from, to, text, message) {
  if (from.match(/bot/i)) {
    return;
  
  } else if (text.match(/^lyricsbot( help)?$/i)) {
    bot.output('Request a song by typing "LyricsBot sing [artist]:[song]".');
    bot.output('Continue current song by typing "LyricsBot continue".');

  } else if (text.match(/lyricsbot sing/i) && !singing) {
    var artistSongRegExp = /sing (.+)[\.\|\\\-:!,/](.+)/gi;
    var match = artistSongRegExp.exec(text);
    extractInfoAndMakeLyricsRequest(match, from);
    toCompletion = text.match(/forr?ealz(ies)?/i);

  } else if (text.match(/lyricsbot continue/i) && !singing && !songFinished && currentLyrics.length > 0) {
    sing(currentLine, defaultNumLines);
    toCompletion = text.match(/forr?ealz(ies)?/i);
  
  } else if (text.match(/lyricsbot st(op|ahp)/i)) {
    stopSinging();
    bot.output('Ok.');
  } else if (text.match(/lyricsbot dance/i)) {
    dance();
  }
});

function extractInfoAndMakeLyricsRequest(match, from) {
  if (!match) return;

  var artist = parseString(match[1]);
  var song   = parseString(match[2]);
  var url    = 'http://lyrics.wikia.com/' + artist + ':' + song;

  makeLyricsRequest(url, artist, song, from);
}

// convert spaces to snake_Camelcase
function parseString(string) {
  return string.replace(/ \w/g, function (txt) {
    return '_' + txt[1].toUpperCase();
  });
}

function makeLyricsRequest(url, artist, song, from) {
  bot.output('Fetching lyrics...');

  request(url, function (error, response, body) {
    if (error) { throw error; }

    // load response body to allow for jQuery functionality server-side
    var $ = cheerio.load(body);

    if ($('.lyricbox').text() == '') {
      handleLyricsRedirect($);
    } else {
      removeJankFromPage($);
      parseLyrics($('.lyricbox'));
      sing(0, defaultNumLines);
    }
  });
}

// check for redirect link, if it exists, pull lyrics
function handleLyricsRedirect($) {
  var redirectLink = $('.redirectText a').attr('href');
  if (redirectLink) {
    var newUrl = 'http://lyrics.wikia.com/' + redirectLink.slice(1);
    makeLyricsRequest(newUrl, artist, song, from);
  } else {
    bot.output('Sorry ' + from + ', that artist or song was not found.');
  }
}

function removeJankFromPage($) {
  // remove ad HTML
  $('.rtMatcher').empty();
  $('br').replaceWith('|');

  // remove stupid JS script and irrelevant div
  $('.lyricbox script, .lyricbox div').remove();
}

// get lyrics and split them along transitions from lowercase or punctuation to uppercase
function parseLyrics(el) {
  currentLyrics = el
    .text()
    .replace(/([\?\),!'a-z])([A-Z])/g, '$1|$2')
    .split('|')
    .filter(function (line) {
      return line !== '';
    });
}

function sing(startLine, numLines) {
  singing      = true;
  songFinished = false;

  currentLine = startLine;
  var endLine = Math.min(startLine + numLines, currentLyrics.length);
  if (toCompletion) endLine = currentLyrics.length;

  song = setInterval(function () {
    bot.output(currentLyrics[currentLine]);
    currentLine++;
    songFinished = currentLine == currentLyrics.length;
    if (currentLine == endLine) doneSinging();
  }, 2500);
}

function stopSinging() {
  clearInterval(song);
  singing = false;  
}

function doneSinging() {
  stopSinging();
  bot.output(songFinished ? 'Song finished! You may request a new song.' : 
    'You may have me continue singing the next lines of the current song or request a new song.');
}

function dance() {
  setTimeout(function () { bot.output('/me dances :D-<'); }, 2000);
  setTimeout(function () { bot.output('/me dances :D|-<'); }, 4000);
  setTimeout(function () { bot.output('/me dances :D/-<'); }, 6000);
}
