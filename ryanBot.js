var irc = require("irc");

var config = {
	channels: ["#"],
	server: "irc.foonetic.net",
  botName: "RyanBot"
};

var bot = new irc.Client(config.server, config.botName, {
	channels: config.channels
});

bot.addListener("message", function (from, to, text, message) {
  var randNum = Math.floor((Math.random() * 30) + 1);
  
  console.log(randNum);
  
  if (text.match(/(R|r)yan(B|b)ot/)) {
    bot.say(config.channels[0], from + ", WHY WOULD YOU DO THAT?");
    bot.say(config.channels[0], "\u0001ACTION takes keyboard away from " + from + " and starts typing emphatically.\u0001")
  }
});