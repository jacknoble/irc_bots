irc_bots
========

Both bots utilize the [Node.js IRC](https://github.com/martynsmith/node-irc) library.

### LyricsBot
+ Request the first 10 lines of song lyrics by issuing the request `LyricsBot sing [artist name]:[song name]`
+ Song requests are parsed for artist and song name
+ Uses [request](https://github.com/mikeal/request) and [cheerio](https://github.com/MatthewMueller/cheerio) to make HTTP requests and load HTML from page
+ Sends out timed lines of lyrics into channel
##### To-Do's
+ Code needs to be refactored...
+ Continue singing song after 10 lines are through if requested
+ Account for spaces in between [artist]:[song]
+ Add song lookup by artist

### RyanBot
+ Needs more functionality
