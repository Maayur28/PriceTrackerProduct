const express = require("express");
const routes = express.Router();
const validUrl = require("valid-url");
const axios = require("axios");
const util = require("../utilities/util");
const service = require("../service/service");
const telegram = require("../utilities/telegram");
const moment = require("moment");
const getUserAgents = require("../utilities/useragents");

require("dotenv").config();

const fetchUserAgent = async () => {
  let response = await axios.get(
    `${process.env.DOMAIN_FETCH_CONFIDENTIAL_INFO_IOT}${process.env.IOT_API_KEY}/${process.env.KEY_USERAGENT}`
  );
  await delay(1000);
  if (
    response == null ||
    response == undefined ||
    response.status != 200 ||
    response.data == null ||
    response.data == undefined ||
    response.data.length < 20
  ) {
    response = await axios.get(
      `${process.env.DOMAIN_FETCH_CONFIDENTIAL_INFO_IAM}${process.env.IAM_API_KEY}/${process.env.KEY_USERAGENT}`
    );
    await delay(1000);
  }
  if (response == null || response == undefined) {
    throw new Error("Invalid Useragents");
  }
  response = await axios.get(
    `${process.env.DOMAIN_FETCH_VALUE}${response.data}`
  );
  return await response.data;
};

routes.get("/", async (req, res, next) => {
  try {
    res.json("Ping Successful").status(200);
  } catch (error) {
    next(error);
  }
});

routes.get("/trackpackage", async (req, res, next) => {
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
    const URL = req.query.url.trim();
    let response = await service.scrapPackage(URL);
    res.json(response).status(200);
  } catch (error) {
    console.log(error);
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
      let useragent = await fetchUserAgent();
      let data = {};
      switch (domain) {
        case "AMAZON":
          data = await service.scrapAmazon(
            URL,
            domain,
            useragent[getUserAgents(useragent.length)]
          );
          break;
        case "FLIPKART":
          data = await service.scrapFlipkart(
            URL,
            domain,
            useragent[getUserAgents(useragent.length)]
          );
          break;
        case "MYNTRA":
          data = await service.scrapMyntra(
            URL,
            domain,
            useragent[getUserAgents(useragent.length)]
          );
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
      let useragent = await fetchUserAgent();
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
                    product.emailSentPrice,
                    useragent[getUserAgents(useragent.length)]
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
                    product.emailSentPrice,
                    useragent[getUserAgents(useragent.length)]
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
      let useragent = await fetchUserAgent();
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
                product.priceList,
                useragent[getUserAgents(useragent.length)]
              );
              break;
            case "FLIPKART":
              await service.scrapFlipkartPriceOnlyRegular(
                URL,
                product.originalPrice,
                product.pId,
                product.priceList,
                useragent[getUserAgents(useragent.length)]
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
    let droppedPriceDB = await service.getDroppedPriceList();
    let newDroppedPriceDB = [];
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
      let useragent = await fetchUserAgent();
      telegram.sendAutoScrapStarted(response.length, droppedPriceDB.length);
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
          let droppedPrice = null,
            priceHistory = null;
          if (droppedPriceDB) {
            droppedPrice = droppedPriceDB.find((val) => val.pId == product.pId);
          }
          switch (domain) {
            case "AMAZON":
              priceHistory = await service.scrapAmazonPriceOnlyRegular(
                URL,
                product.originalPrice,
                product.pId,
                product.priceList,
                useragent[getUserAgents(useragent.length)]
              );
              break;
            case "FLIPKART":
              priceHistory = await service.scrapFlipkartPriceOnlyRegular(
                URL,
                product.originalPrice,
                product.pId,
                product.priceList,
                useragent[getUserAgents(useragent.length)]
              );
              break;
            default:
              break;
          }
          console.log(
            `Completed on index ${j} for product ${response[j].url} on  ` +
              new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
          );
          console.log(
            "DroppedPrice : ",
            droppedPrice,
            "PriceHistory : ",
            priceHistory
          );
          if (
            priceHistory &&
            Object.keys(priceHistory).length == 3 &&
            priceHistory.comparePreviousPrice &&
            priceHistory.comparePreviousPrice.price &&
            priceHistory.droppedPrice &&
            priceHistory.droppedPrice.price
          ) {
            if (droppedPrice == null || droppedPrice == undefined) {
              if (
                priceHistory.comparePreviousPrice.price >
                priceHistory.droppedPrice.price
              ) {
                let obj = {};
                obj.pId = product.pId;
                obj.url = URL;
                obj.domain = domain;
                obj.image = product.image;
                obj.title = product.title;
                obj.originalPrice = product.originalPrice;
                obj.previousPrice = {
                  price: priceHistory.previousPrice.price,
                  date: priceHistory.previousPrice.date,
                };
                obj.droppedPrice = {
                  price: priceHistory.droppedPrice.price,
                  date: priceHistory.droppedPrice.date,
                };

                if (product.priceList && product.priceList.length > 0) {
                  let minimumPrice = {
                    price: Number.MAX_SAFE_INTEGER,
                    date: null,
                  };
                  let maximumPrice = {
                    price: Number.MIN_SAFE_INTEGER,
                    date: null,
                  };
                  product.priceList.forEach((val) => {
                    if (val.price < minimumPrice.price) {
                      minimumPrice.price = val.price;
                      minimumPrice.date = val.date;
                    }
                    if (val.price > maximumPrice.price) {
                      maximumPrice.price = val.price;
                      maximumPrice.date = val.date;
                    }
                  });
                  obj.minimumPrice = minimumPrice;
                  obj.maximumPrice = maximumPrice;
                }
                obj.date = (
                  moment().utcOffset("+05:30").format("DD-MM-YYYY") +
                  "T" +
                  moment().utcOffset("+05:30").format("LT")
                ).toString();
                newDroppedPriceDB.push(obj);
              }
            } else {
              if (
                priceHistory.comparePreviousPrice.price >
                  priceHistory.droppedPrice.price ||
                (droppedPrice.droppedPrice &&
                  droppedPrice.droppedPrice.price &&
                  droppedPrice.droppedPrice.price >=
                    priceHistory.droppedPrice.price)
              ) {
                let obj = droppedPrice;
                obj.previousPrice = {
                  price: priceHistory.previousPrice.price,
                  date: priceHistory.previousPrice.time,
                };
                obj.droppedPrice = {
                  price: priceHistory.droppedPrice.price,
                  date: priceHistory.droppedPrice.time,
                };

                if (product.priceList && product.priceList.length > 0) {
                  let minimumPrice = {
                    price: Number.MAX_SAFE_INTEGER,
                    date: null,
                  };
                  let maximumPrice = {
                    price: Number.MIN_SAFE_INTEGER,
                    date: null,
                  };
                  product.priceList.forEach((val) => {
                    if (val.price < minimumPrice.price) {
                      minimumPrice.price = val.price;
                      minimumPrice.date = val.date;
                    }
                    if (val.price > maximumPrice.price) {
                      maximumPrice.price = val.price;
                      maximumPrice.date = val.date;
                    }
                  });
                  obj.minimumPrice = minimumPrice;
                  obj.maximumPrice = maximumPrice;
                }
                obj.date = (
                  moment().utcOffset("+05:30").format("DD-MM-YYYY") +
                  "T" +
                  moment().utcOffset("+05:30").format("LT")
                ).toString();
                newDroppedPriceDB.push(obj);
              }
            }
          }
          console.log(
            "Index :",
            j,
            " NewDroppedPriceDB :",
            newDroppedPriceDB.length
          );
          await delay(2000);
        }
      }
      await service.updateDroppedPrice(newDroppedPriceDB);
      telegram.sendAutoScrapCompleted(newDroppedPriceDB.length);
      console.log("success");
    } else {
      console.log("no products found");
    }
  } catch (e) {
    console.log(e.message);
  }
}, process.env.AUTO_SCRAP_INTERVAL_IN_HRS * 60 * 60 * 1000);

setInterval(async () => {
  try {
    let response = await service.getPackageList();
    let useragent = await fetchUserAgent();
    await telegram.sendAutoTrackPackageStarted(
      response ? response.length : null
    );
    if (response != null && response != undefined && response.length > 0) {
      for (let j = 0; j < response.length; j++) {
        console.log(
          `Waiting on index ${j} for package ${response[j].url} on  ` +
            new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        await delay(3000);
        let package = response[j];
        console.log(package);
        if (
          package != null &&
          package != undefined &&
          package.url != null &&
          package.url != undefined
        ) {
          await telegram.scheduledTrackPackage(package.url, useragent);
        }
        console.log(
          `Completed on index ${j} for package ${response[j].url} on  ` +
            new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
        );
        await delay(2000);
      }
      console.log("success");
    } else {
      console.log("no packages found");
    }
    await telegram.sendAutoTrackPackageCompleted();
  } catch (e) {
    console.log(e.message);
  }
}, process.env.AUTO_TRACK_PACKAGE_INTERVAL_IN_HRS * 60 * 60 * 1000);

setInterval(async () => {
  try {
    let response = await service.getPackageList();
    if (response != null && response != undefined && response.length > 0) {
      for (let j = 0; j < response.length; j++) {
        let package = response[j];
        if (
          package == null ||
          package == undefined ||
          package.url == null ||
          package.url == undefined ||
          package.status.toUpperCase() == "DELIVERED"
        ) {
          await service.removePackage(package.trackerId);
        }
      }
      console.log("delete success");
    } else {
      console.log("no packages found");
    }
  } catch (e) {
    console.log(e.message);
  }
}, process.env.AUTO_REMOVE_PACKAGE_INTERVAL_IN_HRS * 60 * 60 * 1000);

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

routes.get("/getDroppedPrice", async (req, res, next) => {
  try {
    let data = await service.getDroppedPriceList();
    res.send({ data }).status(200);
  } catch (error) {
    next(error);
  }
});

module.exports = routes;
