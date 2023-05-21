const express = require("express");
const routes = express.Router();
const validUrl = require("valid-url");
const axios = require("axios");
const util = require("../utilities/util");
const service = require("../service/service");
const telegram = require("../utilities/telegram");

require("dotenv").config();

routes.get("/", async (req, res, next) => {
  try {
    res.json("Ping Successful").status(200);
  } catch (error) {
    next(error);
  }
});

routes.get("/getDetails", async (req, res, next) => {
  try {
    if (
      req.query.url == null ||
      req.query.url == undefined ||
      req.query.url.trim().length <= 0
    ) {
      let err = new Error();
      err.message = "The url/link provided is invalid";
      err.status = 403;
      throw err;
    }
    const URL = util.shortentURL(req.query.url);
    try {
      let domain = URL.replace(/.+\/\/|www.|\..+/g, "");
      if (domain != null || domain != undefined || domain != "") {
        domain = domain.toUpperCase();
      } else {
        let err = new Error();
        err.message = "The url/link provided is invalid";
        err.status = 403;
        throw err;
      }
      let data = {};
      switch (domain) {
        case "AMAZON":
          data = await service.scrapAmazon(URL, domain);
          break;
        case "FLIPKART":
          data = await service.scrapFlipkart(URL, domain);
          break;
        case "MYNTRA":
          data = await service.scrapMyntra(URL, domain);
        default:
          break;
      }
      res.send(data).status(200);
    } catch (error) {
      next(error);
    }
  } catch (e) {
    next(e);
  }
});

routes.get(`/${process.env.SCRAP_ROUTE}`, async (req, res, next) => {
  try {
    let response = await axios.get(
      `${process.env.AUTH_DOMAIN}/${process.env.USERS_ROUTE}?key=${process.env.KEY}`
    );
    if (
      response != null &&
      response != undefined &&
      response.data != null &&
      response.data != undefined &&
      response.data.data != null &&
      response.data.data != undefined &&
      response.data.data.length > 0
    ) {
      let data = response.data.data;
      for (let i = 0; i < data.length; i++) {
        let products = data[i].products;
        if (products != null && products != undefined && products.length > 0) {
          for (let j = 0; j < products.length; j++) {
            let product = products[j];
            if (
              product != null &&
              product != undefined &&
              product.url != null &&
              product.url != undefined &&
              product.alertPrice != null &&
              product.alertPrice != undefined &&
              product.alertPrice > 0
            ) {
              let URL = product.url;
              let domain = product.domain;
              switch (domain) {
                case "AMAZON":
                  service.scrapAmazonPriceOnly(
                    URL,
                    domain,
                    data[i].email,
                    product.alertPrice,
                    product.title,
                    product.price.discountPrice,
                    product.image,
                    product.productId,
                    product.emailSentPrice
                  );

                  break;
                case "FLIPKART":
                  service.scrapFlipkartPriceOnly(
                    URL,
                    domain,
                    data[i].email,
                    product.alertPrice,
                    product.title,
                    product.price.discountPrice,
                    product.image,
                    product.productId,
                    product.emailSentPrice
                  );
                  break;
                // case "MYNTRA":
                //   await service.scrapMyntraPriceOnly(
                //     URL,
                //     domain,
                //     data[i],
                //     product.alertPrice
                //   );
                //   break;
                default:
                  break;
              }
            }
          }
        }
      }
      res.send("success").status(200);
    }
  } catch (e) {
    next(e);
  }
});

routes.get(`/${process.env.PRODUCT_SCRAP_ROUTE}`, async (req, res, next) => {
  try {
    let prodResponse = await service.getProductsList();
    if (
      prodResponse != null &&
      prodResponse != undefined &&
      prodResponse.length > 0
    ) {
      let amazonProductList = [];
      let flipkartProductList = [];
      prodResponse.forEach((val) => {
        if (val && val.url) {
          let domain = val.url.replace(/.+\/\/|www.|\..+/g, "");
          if (domain != null || domain != undefined || domain != "") {
            domain = domain.toUpperCase();
          }
          if (domain == "AMAZON") {
            amazonProductList.push(val);
          } else if (domain == "FLIPKART") {
            flipkartProductList.push(val);
          }
        }
      });
      let response = [];
      let i = 0,
        j = 0;
      while (i < amazonProductList.length || j < flipkartProductList.length) {
        if (i < amazonProductList.length) {
          response.push(amazonProductList[i]);
          i++;
        }
        if (j < flipkartProductList.length) {
          response.push(flipkartProductList[j]);
          j++;
        }
      }
      telegram.sendAutoScrapStarted(response.length);
      for (let j = 0; j < response.length; j++) {
        console.log(
          `Waiting on index ${j} for product ${response[j].url} on  ` +
            new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        await delay(3000);
        let product = response[j];
        if (
          product != null &&
          product != undefined &&
          product.url != null &&
          product.url != undefined
        ) {
          let URL = product.url;
          let domain = URL.replace(/.+\/\/|www.|\..+/g, "");
          if (domain != null || domain != undefined || domain != "") {
            domain = domain.toUpperCase();
          }
          switch (domain) {
            case "AMAZON":
              await service.scrapAmazonPriceOnlyRegular(
                URL,
                product.originalPrice,
                product.pId,
                product.priceList
              );
              break;
            case "FLIPKART":
              await service.scrapFlipkartPriceOnlyRegular(
                URL,
                product.originalPrice,
                product.pId,
                product.priceList
              );
              break;
            default:
              break;
          }
          console.log(
            `Completed on index ${j} for product ${response[j].url} on  ` +
              new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
          );
          await delay(2000);
        }
      }
      telegram.sendAutoScrapCompleted();
      res.send("success").status(200);
    } else {
      res.send("no products found").status(200);
    }
  } catch (e) {
    next(e);
  }
});

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

setInterval(async () => {
  try {
    let prodResponse = await service.getProductsList();
    if (
      prodResponse != null &&
      prodResponse != undefined &&
      prodResponse.length > 0
    ) {
      let amazonProductList = [];
      let flipkartProductList = [];
      prodResponse.forEach((val) => {
        if (val && val.url) {
          let domain = val.url.replace(/.+\/\/|www.|\..+/g, "");
          if (domain != null || domain != undefined || domain != "") {
            domain = domain.toUpperCase();
          }
          if (domain == "AMAZON") {
            amazonProductList.push(val);
          } else if (domain == "FLIPKART") {
            flipkartProductList.push(val);
          }
        }
      });
      let response = [];
      let i = 0,
        j = 0;
      while (i < amazonProductList.length || j < flipkartProductList.length) {
        if (i < amazonProductList.length) {
          response.push(amazonProductList[i]);
          i++;
        }
        if (j < flipkartProductList.length) {
          response.push(flipkartProductList[j]);
          j++;
        }
      }
      telegram.sendAutoScrapStarted(response.length);
      for (let j = 0; j < response.length; j++) {
        console.log(
          `Waiting on index ${j} for product ${response[j].url} on  ` +
            new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        await delay(3000);
        let product = response[j];
        if (
          product != null &&
          product != undefined &&
          product.url != null &&
          product.url != undefined
        ) {
          let URL = product.url;
          let domain = URL.replace(/.+\/\/|www.|\..+/g, "");
          if (domain != null || domain != undefined || domain != "") {
            domain = domain.toUpperCase();
          }
          switch (domain) {
            case "AMAZON":
              await service.scrapAmazonPriceOnlyRegular(
                URL,
                product.originalPrice,
                product.pId,
                product.priceList
              );
              break;
            case "FLIPKART":
              await service.scrapFlipkartPriceOnlyRegular(
                URL,
                product.originalPrice,
                product.pId,
                product.priceList
              );
              break;
            default:
              break;
          }
          console.log(
            `Completed on index ${j} for product ${response[j].url} on  ` +
              new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
          );
          await delay(2000);
        }
      }
      telegram.sendAutoScrapCompleted();
      console.log("success");
    } else {
      console.log("no products found");
    }
  } catch (e) {
    console.log(e.message);
  }
}, process.env.AUTO_SCRAP_INTERVAL_IN_HRS * 60 * 60 * 1000);

routes.get("/getPriceHistory", async (req, res, next) => {
  try {
    const URL = req.query.url;
    if (
      validUrl.isUri(URL) &&
      validUrl.isWebUri(URL) &&
      validUrl.isHttpsUri(URL)
    ) {
      try {
        let data = await service.getPriceHistory(URL);
        res.send({ data }).status(200);
      } catch (error) {
        next(error);
      }
    } else {
      let err = new Error();
      err.message = "The url/link provided is invalid";
      err.status = 403;
      throw err;
    }
  } catch (e) {
    next(e);
  }
});

routes.post("/getPriceHistoryUrls", async (req, res, next) => {
  try {
    if (req.body.urls) {
      let data = await service.getPriceHistoryUrls(req.body.urls);
      res.send({ data }).status(200);
    }
  } catch (error) {
    next(error);
  }
});

module.exports = routes;
