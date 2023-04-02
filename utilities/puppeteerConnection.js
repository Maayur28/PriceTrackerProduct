const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const getUserAgent = require("../utilities/useragents");

let connection = {};
connection.initialisePuppeteer = async (URL) => {
  try {
    const browserFetcher = puppeteer.createBrowserFetcher();
    let revisionInfo = await browserFetcher.download("1095492");

    const browser = await puppeteer.launch({
      executablePath: revisionInfo.executablePath,
      ignoreDefaultArgs: ["--disable-extensions"],
      headless: true,
      args: ["--no-sandbox", "--disabled-setupid-sandbox"],
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
