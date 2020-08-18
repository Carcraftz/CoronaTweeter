//dependencies
const express = require("express");
const app = express();
const fs = require("fs");
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
const twitter = require("twitter");
const client = new twitter({
  consumer_key: config.key,
  consumer_secret: config.keysecret,
  access_token_key: config.token,
  access_token_secret: config.tokensecret
});
const fetch = require("node-fetch");
const cheerio = require("cheerio");

//needed for free hosting on glitch. If running on a personal machine you can comment this out or remove i
app.use(express.static("public"));
app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});
const listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

let run = false;
setInterval(checktime => {
  let date = new Date();
  let minute = date.getMinutes();
  let second = date.getSeconds();
  //runs every hour on the 0th hour and the 30th second
  if (minute == 0 && second == 30 && !run) {
    run = true;
    let cases = "Error";
    let deaths = "Error";
    let recovered = "Error";
    fetch("https://www.worldometers.info/coronavirus/country/us/")
      .then(res => res.text())
      .then(body => {
        const $ = cheerio.load(body);
        cases = $(".maincounter-number")[0].children[1].children[0].data;
        deaths = $(".maincounter-number")[1].children[1].children[0].data;
        recovered = $(".maincounter-number")[2].children[1].children[0].data;
        let caseint = parseInt(cases.replace(/,/g, ""));
        let deathint = parseInt(deaths.replace(/,/g, ""));
        let recoveredint = parseInt(recovered.replace(/,/g, ""));

        console.log("Cases: " + cases);
        console.log("Deaths: " + deaths);
        console.log("Recovered: " + recovered);
        var status = {
          status:
            "USA Coronavirus Stats:\nCases: " +
            cases +
            "- Up " +
            (caseint - config.lastcases).toString() +
            " from the last hour\nDeaths: " +
            deaths +
            "- Up " +
            (deathint - config.lastdeaths).toString() +
            " from the last hour\nRecovered: " +
            recovered +
            "- Up " +
            (recoveredint - config.lastrecovered).toString() +
            " from the last hour"
        };
        client.post("statuses/update", status, function(
          error,
          tweet,
          response
        ) {
          if (!error) {
            console.log(tweet);
          }
        });
        //JSON isn't ideal as a database, but this will be updating only once per hour, so it should be fine
        config.lastcases = caseint;
        config.lastdeaths = deathint;
        config.lastrecovered = recoveredint;
        fs.writeFileSync("config.json", JSON.stringify(config));
      });
  }
  //resets run variable to allow new posts again
  if (minute == 5) {
    run = false;
  }
}, 1);
