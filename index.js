const dns = require("dns");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();
require("dotenv").config();

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection established"))
  .catch((error) => console.log(error.message));

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number },
});
const Url = mongoose.model("Url", urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + "/public"));

app.get("/", function (req, res) {
  res.sendFile(path.resolve(__dirname, "views", "index.html"));
  // res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/shorturl", (req, res) => {
  // get request body
  const reqUrl = req.body.url;
  const reqUrlLowercase = reqUrl.toLowerCase();
  // check if it starts with https:// or http://
  if (
    reqUrlLowercase.startsWith("https://") ||
    reqUrlLowercase.startsWith("http://")
  ) {
    // Replace "https://" or "http://" with an empty string
    //dns.lookup( hostname, options, callback )
    // hostname example : www.example.com, not : https://www.example.com
    const hostname = reqUrlLowercase.replace(/^https?:\/\//, "");

    dns.lookup(hostname, async (err) => {
      // if hostname is not existing
      if (err) {
        return res.send({ error: "Invalid URL" });
      }

      // check if url is already exists in DB
      const haveUrl = await Url.findOne({ original_url: reqUrl });
      // if url is already exists in DB return that url
      if (haveUrl) {
        return res.send({
          original_url: haveUrl.original_url,
          short_url: haveUrl.short_url,
        });
      }
      // if not
      // create short_url by increase 1 and then create new url into DB
      const countData = await Url.find();
      const newdata = {
        original_url: reqUrl,
        short_url: countData.length + 1,
      };
      const newURL = await Url.create(newdata);
      return res.send({
        original_url: newURL.original_url,
        short_url: newURL.short_url,
      });
    });

    // if it not starts with https:// or http://
  } else {
    return res.send({ error: "Invalid URL" });
  }
});

// app.get("/api/shorturl/:shorturl", async function (req, res) {
//   // get params
//   const reqUrl = req.params.shorturl;

//   // find short_url in DB and redirect to that original_url
//   const url = await Url.findOne({ short_url: reqUrl });
//   res.redirect(url.original_url);
// });
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
//
