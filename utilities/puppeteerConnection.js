const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const chromium = require("chrome-aws-lambda");
const getUserAgent = require("../utilities/useragents");

let connection = {};
connection.initialisePuppeteer = async (URL) => {
  try {
    // const browser = await puppeteer.launch({
    //   ignoreDefaultArgs: ["--disable-extensions"],
    //   headless: false,
    //   args: ["--no-sandbox", "--disabled-setupid-sandbox"],
    //   'ignoreHTTPSErrors': true
    // });
    const browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
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
