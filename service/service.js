const connection = require("../utilities/puppeteerConnection");
const axiosConnection = require("../utilities/axiosConnection");
const util = require("../utilities/util");
const constant = require("../utilities/constant");
const model = require("../model/user");
const axios = require("axios");
const sendMailObj = require("../utilities/mail");
const telegram = require("../utilities/telegram");

let service = {};

service.scrapAmazon = async (URL, domain) => {
  try {
    let retry = constant.START_RETRY_COUNT;
    do {
      let $ = await axiosConnection.initialiseAxios(URL);
      if ($(".product-title-word-break.a-size-large").html() != null) {
        let response = util.fetchAmazon($, URL, domain);
        if (
          response != null &&
          response != undefined &&
          response.price != null &&
          response.price != undefined &&
          response.price.discountPrice != null &&
          response.price.discountPrice != undefined
        ) {
          let pId = util.getProductId(URL, domain);
          await model.addTracker(response.price.discountPrice, URL, pId);
          await telegram.newProductScrapped(response.price.discountPrice, URL);
        }
        return response;
      } else retry++;
    } while (retry <= process.env.AMAZON_RETRY_COUNT);
  } catch (error) {
    throw error;
  }
};

service.scrapAmazonPriceOnly = async (
  URL,
  domain,
  email,
  alertPrice,
  title,
  discountPrice,
  image,
  productId,
  emailSentPrice
) => {
  try {
    let retry = constant.START_RETRY_COUNT;
    do {
      let $ = await axiosConnection.initialiseAxios(URL);
      if ($ && $("#productTitle").html() != null) {
        let price = await util.scrapAmazonPriceOnly($);
        if (price != null) {
          console.log(price, alertPrice, emailSentPrice);
          if (price <= alertPrice && price != emailSentPrice) {
            await telegram.scrapped(title, price, URL, discountPrice);
            await sendMailObj.priceDropMail(
              price,
              email,
              URL,
              alertPrice,
              title,
              discountPrice,
              image
            );
            let obj = {};
            obj.email = email;
            obj.emailSentPrice = price;
            obj.productId = productId;
            await axios.put(
              `${process.env.AUTH_DOMAIN}/updateEmailSentPrice`,
              obj,
              {
                headers: {
                  "Content-type": "application/json; charset=UTF-8",
                },
              }
            );
          }
          let pId = util.getProductId(URL, domain);
          return await model.addTracker(price, URL, pId);
        } else retry++;
      } else retry++;
    } while (retry <= process.env.AMAZON_RETRY_COUNT);
  } catch (error) {
    throw error;
  }
};

service.scrapFlipkart = async (URL, domain) => {
  try {
    let retry = constant.START_RETRY_COUNT;
    do {
      let $ = await axiosConnection.initialiseAxios(URL);
      if ($ && $(".B_NuCI").html() != null) {
        let response = util.fetchFlipkart($, URL, domain);
        if (
          response != null &&
          response != undefined &&
          response.price != null &&
          response.price != undefined &&
          response.price.discountPrice != null &&
          response.price.discountPrice != undefined
        ) {
          let pId = util.getProductId(URL, domain);
          await model.addTracker(response.price.discountPrice, URL, pId);
          await telegram.newProductScrapped(response.price.discountPrice, URL);
        }
        return response;
      } else retry++;
    } while (retry <= process.env.FLIPKART_RETRY_COUNT);
  } catch (error) {
    throw error;
  }
};

service.scrapFlipkartPriceOnly = async (
  URL,
  domain,
  email,
  alertPrice,
  title,
  discountPrice,
  image,
  productId,
  emailSentPrice
) => {
  try {
    let retry = constant.START_RETRY_COUNT;
    do {
      let $ = await axiosConnection.initialiseAxios(URL);
      if ($ && $(".B_NuCI").html() != null) {
        let price = await util.scrapFlipkartPriceOnly($);
        if (price != null) {
          console.log(price, alertPrice, emailSentPrice);
          if (price <= alertPrice && price != emailSentPrice) {
            await telegram.scrapped(title, price, URL, discountPrice);
            await sendMailObj.priceDropMail(
              price,
              email,
              URL,
              alertPrice,
              title,
              discountPrice,
              image
            );
            let obj = {};
            obj.email = email;
            obj.emailSentPrice = price;
            obj.productId = productId;
            await axios.put(
              `${process.env.AUTH_DOMAIN}/updateEmailSentPrice`,
              obj,
              {
                headers: {
                  "Content-type": "application/json; charset=UTF-8",
                },
              }
            );
          }
          let pId = util.getProductId(URL, domain);
          return await model.addTracker(price, URL, pId);
        } else retry++;
      } else retry++;
    } while (retry <= process.env.FLIPKART_RETRY_COUNT);
  } catch (error) {
    throw error;
  }
};

service.scrapMyntraPriceOnly = async (URL, domain, email, alertPrice) => {
  try {
    let retry = constant.START_RETRY_COUNT;
    do {
      let $ = await connection.initialisePuppeteer(URL);
      if ($ && $(".pdp-name").html() != null) {
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
      if ($ && $(".pdp-name").html() != null) {
        let response = util.fetchMyntra($, URL, domain);
        return response;
      } else retry++;
    } while (retry <= process.env.RETRY_COUNT);
  } catch (error) {
    throw error;
  }
};

service.getPriceHistory = async (URL) => {
  let domain = URL.replace(/.+\/\/|www.|\..+/g, "");
  if (domain != null || domain != undefined || domain != "") {
    domain = domain.toUpperCase();
  }
  let pId = util.getProductId(URL, domain);
  return await model.getPriceHistory(pId);
};

service.getPriceHistoryUrls = async (urls) => {
  let pids = [];
  urls.forEach((URL) => {
    let domain = URL.replace(/.+\/\/|www.|\..+/g, "");
    if (domain != null || domain != undefined || domain != "") {
      domain = domain.toUpperCase();
    }
    let pId = util.getProductId(URL, domain);
    pids.push(pId);
  });
  return await model.getPriceHistoryUrls(pids);
};

service.getProductsList = async () => {
  return await model.getProductsList();
};

service.scrapAmazonPriceOnlyRegular = async (
  URL,
  originalPrice,
  pId,
  priceList
) => {
  try {
    let retry = constant.START_RETRY_COUNT;
    do {
      let $ = await axiosConnection.initialiseAxios(URL);
      if ($ && $("#productTitle").html() != null) {
        let price = util.scrapAmazonPriceOnlyRegular($);
        if (price != null && Object.keys(price).length == 2) {
          console.log("Scrapped Amazon: " + URL + " " + JSON.stringify(price));
          if (price.discountPrice < priceList[priceList.length - 1].price) {
            console.log("Price Dropped : " + URL + " " + JSON.stringify(price));
            await telegram.priceDropped(
              price.originalPrice,
              price.discountPrice,
              priceList[priceList.length - 1].price,
              URL
            );
          }
          return await model.addTrackerRegular(
            price.discountPrice,
            pId,
            originalPrice == null || originalPrice == undefined
              ? price.originalPrice
              : originalPrice
          );
        } else retry++;
      } else retry++;
    } while (retry <= process.env.RETRY_COUNT);
  } catch (error) {
    throw error;
  }
};

service.scrapFlipkartPriceOnlyRegular = async (
  URL,
  originalPrice,
  pId,
  priceList
) => {
  try {
    let retry = constant.START_RETRY_COUNT;
    do {
      let $ = await axiosConnection.initialiseAxios(URL);
      if ($ && $(".B_NuCI").html() != null) {
        let price = util.scrapFlipkartPriceOnlyRegular($);
        if (price != null && Object.keys(price).length == 2) {
          console.log(
            "Scrapped Flipkart: " + URL + " " + JSON.stringify(price)
          );
          if (price.discountPrice < priceList[priceList.length - 1].price) {
            console.log("Price Dropped : " + URL + " " + JSON.stringify(price));
            await telegram.priceDropped(
              price.originalPrice,
              price.discountPrice,
              priceList[priceList.length - 1].price,
              URL
            );
          }
          return await model.addTrackerRegular(
            price.discountPrice,
            pId,
            originalPrice == null || originalPrice == undefined
              ? price.originalPrice
              : originalPrice
          );
        } else retry++;
      } else retry++;
    } while (retry <= process.env.RETRY_COUNT);
  } catch (error) {
    throw error;
  }
};

module.exports = service;
