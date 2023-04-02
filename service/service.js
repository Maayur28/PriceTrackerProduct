const connection = require("../utilities/puppeteerConnection");
const util = require("../utilities/util");
const constant = require("../utilities/constant");
const model = require("../model/user");
let service = {};

service.scrapAmazon = async (URL, domain) => {
  try {
    let retry = constant.START_RETRY_COUNT;
    do {
      let $ = await connection.initialisePuppeteer(URL);
      if ($(".product-title-word-break.a-size-large").html() != null) {
        let response = util.fetchAmazon($, URL, domain);
        return response;
      } else retry++;
    } while (retry <= process.env.RETRY_COUNT);
  } catch (error) {
    throw error;
  }
};

service.scrapAmazonPriceOnly = async (URL, domain, email, alertPrice) => {
  try {
    let retry = constant.START_RETRY_COUNT;
    do {
      let $ = await connection.initialisePuppeteer(URL);
      if ($(".product-title-word-break.a-size-large").html() != null) {
        let price = util.scrapAmazonPriceOnly($);
        if (price != null) {
          if (price <= alertPrice) {
            console.log("price reduced");
          }
          return await model.addTracker(price, URL);
        }
      } else retry++;
    } while (retry <= process.env.RETRY_COUNT);
  } catch (error) {
    throw error;
  }
};

service.scrapMyntraPriceOnly = async (URL, domain, email, alertPrice) => {
  try {
    let retry = constant.START_RETRY_COUNT;
    do {
      let $ = await connection.initialisePuppeteer(URL);
      if ($(".pdp-name").html() != null) {
        let price = util.scrapMyntraPriceOnly($);
        if (price != null) {
          if (price <= alertPrice) {
            console.log("price reduced");
          }
          return await model.addTracker(price, URL);
        }
      } else retry++;
    } while (retry <= process.env.RETRY_COUNT);
  } catch (error) {
    throw error;
  }
};

service.scrapMyntra = async (URL, domain) => {
  try {
    let retry = constant.START_RETRY_COUNT;
    do {
      let $ = await connection.initialisePuppeteer(URL);
      if ($(".pdp-name").html() != null) {
        let response = util.fetchMyntra($, URL, domain);
        return response;
      } else retry++;
    } while (retry <= process.env.RETRY_COUNT);
  } catch (error) {
    throw error;
  }
};

module.exports = service;
