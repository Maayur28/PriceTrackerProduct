const puppeteer = require("puppeteer");
const PCR = require("puppeteer-chromium-resolver");
const cheerio = require("cheerio");
const getUserAgent = require("../utilities/useragents");

let connection = {};
connection.initialisePuppeteer = async (URL) => {
  try {
    const options = {};
    const stats = await PCR(options);
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox"],
      executablePath: stats.executablePath,
    });
    const page = await browser.newPage();
    let userAgent = getUserAgent();
    await page.setUserAgent(userAgent);
    await page.goto(URL, {
      waitUntil: "domcontentloaded",
    });
    let $ = cheerio.load(await page.content());
    await browser.close();
    return $;
  } catch (error) {
    console.log(error.message);
    let err = new Error();
    err.message = "Could not establish connection with server.";
    err.status = 403;
    throw err;
  }
};

module.exports = connection;
