const express = require("express");
const routes = express.Router();
const validUrl = require("valid-url");
const axios = require("axios");
const service = require("../service/service");

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
    const URL = req.query.url;
    if (
      validUrl.isUri(URL) &&
      validUrl.isWebUri(URL) &&
      validUrl.isHttpsUri(URL)
    ) {
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
              let domain = URL.replace(/.+\/\/|www.|\..+/g, "");
              if (domain != null && domain != undefined && domain != "") {
                domain = domain.toUpperCase();
              } else {
                break;
              }
              switch (domain) {
                case "AMAZON":
                  await service.scrapAmazonPriceOnly(
                    URL,
                    domain,
                    data[i],
                    product.alertPrice
                  );
                  break;
                case "FLIPKART":
                  data = await service.scrapFlipkartPriceOnly(
                    URL,
                    domain,
                    data[i],
                    product.alertPrice
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
      res.json({ success: "true" }).status(200);
    }
  } catch (e) {
    next(e);
  }
});

module.exports = routes;
