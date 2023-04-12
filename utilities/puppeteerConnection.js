const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const getUserAgent = require("../utilities/useragents");

let connection = {};
connection.initialisePuppeteer = async (URL) => {
  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: undefined,
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
    err.message = error.message;
    err.status = 403;
    throw err;
  }
};

module.exports = connection;
