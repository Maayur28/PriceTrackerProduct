const cheerio = require("cheerio");

let util = {};

util.fetchDelhivery = ($, URL) => {
  let data = "",
    response = {};
  response.pId = URL.split("/")[4];
  response.url = URL;
  response.domain = URL.split("/")[2].toUpperCase();
  response.provider = $(".container > .row > div").text().trim();
  response.status = $(".inside_wrapper > h5").text().trim();
  response.arriving = $(".inside_wrapper > p").text().trim();
  let currentLocation = null,
    previousLocation = [],
    orderDetails = [];
  for (const e of $(".table > tbody > tr")) {
    const $$ = cheerio.load(e);
    for (const ee of $$("td")) {
      data += $(ee).text().trim() + "#$";
    }
    currentLocation =
      data.split("#$")[2] +
      "  " +
      data.split("#$")[3] +
      " on " +
      data.split("#$")[1] +
      "  " +
      data.split("#$")[0];
    break;
  }
  let count = -1;
  for (const e of $(".table > tbody > tr")) {
    count++;
    if (count == 0) continue;
    const $$ = cheerio.load(e);
    let str = "";
    for (const ee of $$("td")) {
      str += $(ee).text().trim() + "#$";
    }
    response.previousLocation = [];
    let data =
      str.split("#$")[2] +
      "  " +
      str.split("#$")[3] +
      " on " +
      str.split("#$")[1] +
      "  " +
      str.split("#$")[0];
    previousLocation.push(data);
  }
  for (const e of $(".ordered_items_details > .order_items_name")) {
    const $$ = cheerio.load(e);
    let str = $$("label").text().trim() + " " + $$("h4").text().trim();
    orderDetails.push(str);
  }
  response.currentLocation = currentLocation;
  response.previousLocation = previousLocation;
  response.orderDetails = orderDetails;
  return response;
};

util.fetchAmazon = ($, URL, domain) => {
  let response = {};
  //title
  if ($(".product-title-word-break.a-size-large").html()) {
    response.title = $(".product-title-word-break.a-size-large").html().trim();
  } else if ($(".product-title-word-break.product-title-resize").html()) {
    response.title = $(".product-title-word-break.product-title-resize")
      .html()
      .trim();
  } else {
    response.title = null;
  }

  //price
  let price = {};

  if ($(".apexPriceToPay > .a-offscreen").html() != null) {
    price.discountPrice = $(".apexPriceToPay > .a-offscreen").html().trim();
  }

  if (
    (price.discountPrice == undefined || price.discountPrice == null) &&
    $(
      ".priceToPay.reinventPricePriceToPayMargin.aok-align-center.a-price > .a-offscreen"
    ).html() != null
  ) {
    price.discountPrice = $(
      ".priceToPay.reinventPricePriceToPayMargin.aok-align-center.a-price > .a-offscreen"
    )
      .html()
      .trim();
  }
  if (
    (price.discountPrice == undefined || price.discountPrice == null) &&
    $(
      ".priceToPay.reinventPricePriceToPayMargin.aok-align-center.a-price > span > .a-price-whole"
    ).html() != null
  ) {
    price.discountPrice = $(
      ".priceToPay.reinventPricePriceToPayMargin.aok-align-center.a-price > span > .a-price-whole"
    )
      .html()
      .trim();
  }

  if (
    price.discountPrice != undefined &&
    price.discountPrice != null &&
    price.discountPrice.length > 0
  ) {
    price.discountPrice = price.discountPrice.replaceAll(",", "");
    if (price.discountPrice.charAt(0) == "₹") {
      price.discountPrice = price.discountPrice.slice(1);
    }
  }
  if (
    $("[data-a-strike=true]") != null &&
    $("[data-a-strike=true]") != undefined
  ) {
    for (const ele of $("[data-a-strike=true]")) {
      let $$ = cheerio.load(ele);
      price.originalPrice = $$(".a-offscreen").html();
      break;
    }
  }
  if (price.originalPrice == null || price.originalPrice == undefined) {
    if (price.discountPrice != undefined)
      price.originalPrice = price.discountPrice;
  }
  if (
    price.originalPrice != null &&
    price.originalPrice != undefined &&
    price.originalPrice.length > 0 &&
    price.originalPrice.charAt(0) == "₹"
  ) {
    price.originalPrice = price.originalPrice.slice(1);
    price.originalPrice = price.originalPrice.replaceAll(",", "");
  }

  if (price.discountPrice == null || price.discountPrice == undefined) {
    if (price.originalPrice != undefined)
      price.discountPrice = price.originalPrice;
  }

  response.price = price;

  //image
  response.image = $("#landingImage").attr().src;

  //badge
  if (
    $(".p13n-best-seller-badge.a-icon-addon.a-icon").text() != "" &&
    $(".p13n-best-seller-badge.a-icon-addon.a-icon").text() != null &&
    $(".p13n-best-seller-badge.a-icon-addon.a-icon").text() != undefined
  ) {
    response.badge = $(".p13n-best-seller-badge.a-icon-addon.a-icon").text();
  } else {
    response.badge = $(
      ".ac-badge-rectangle.aok-float-left.a-size-small"
    ).text();
  }

  //rate
  let rate = {};
  rate.ratingCount = $(
    ".a-declarative.a-popover-trigger > .a-icon-star.a-icon > .a-icon-alt"
  ).html();
  rate.totalRated = $("#acrCustomerReviewLink > .a-size-base").html();
  response.rating = rate;

  //domain
  response.domain = domain;

  //url
  if (URL.includes("amzn")) {
    response.url = $("[data-action=ssf-share-icon]")
      .attr("data-ssf-share-icon")
      .split('"url":')[1]
      .split('"')[1];
  } else {
    response.url = URL;
  }

  return response;
};

util.scrapAmazonPriceOnly = ($) => {
  let price = null;
  if ($(".apexPriceToPay > .a-offscreen").html() != null) {
    price = $(".apexPriceToPay > .a-offscreen").html().trim();
  }
  if (
    price == null &&
    $(
      ".priceToPay.reinventPricePriceToPayMargin.aok-align-center.a-price > span > .a-price-whole"
    ).html() != null
  ) {
    price = $(
      ".priceToPay.reinventPricePriceToPayMargin.aok-align-center.a-price > span > .a-price-whole"
    )
      .html()
      .trim();
  }
  if (price != null && price.length > 0) {
    price = price.replaceAll(",", "");
    if (price.charAt(0) == "₹") {
      price = price.slice(1);
    }
  }
  return price;
};

util.fetchFlipkart = ($, URL, domain) => {
  let response = {};
  //title
  response.title = $(".B_NuCI").text().trim();

  //price
  let price = {};

  if ($("._16Jk6d").text() != null) {
    price.discountPrice = $("._16Jk6d").text().trim();
  }
  if (price.discountPrice.length > 0) {
    price.discountPrice = price.discountPrice.replaceAll(",", "");
    if (price.discountPrice.charAt(0) == "₹") {
      price.discountPrice = price.discountPrice.slice(1);
    }
  }

  if ($("._2p6lqe").text() != null) {
    price.originalPrice = $("._2p6lqe").text().trim();
  } else {
    price.originalPrice = price.discountPrice;
  }
  if (price.originalPrice.length > 0 && price.originalPrice.charAt(0) == "₹") {
    price.originalPrice = price.originalPrice.slice(1);
    price.originalPrice = price.originalPrice.replaceAll(",", "");
  }

  if (
    price.originalPrice == "" ||
    price.originalPrice == null ||
    price.originalPrice == undefined
  ) {
    if (price.discountPrice != undefined)
      price.originalPrice = price.discountPrice;
  }

  if (
    price.discountPrice == "" ||
    price.discountPrice == null ||
    price.discountPrice == undefined
  ) {
    if (price.originalPrice != undefined)
      price.discountPrice = price.originalPrice;
  }

  if (price.discountPrice) response.price = price;

  //image

  if ($("._2amPTt._3qGmMb").html() != null) {
    response.image = $("._2amPTt._3qGmMb").attr().src;
  } else if ($("._2r_T1I._396QI4").html() != null) {
    response.image = $("._2r_T1I._396QI4").attr().src;
  } else {
    response.image = null;
  }

  //badge
  response.badge = null;

  //rate
  let rate = {};

  for (const e of $("._1lRcqv > ._3LWZlK")) {
    rate.ratingCount = $(e).text() + " out of 5 stars";
    break;
  }

  for (const e of $("._2_R_DZ")) {
    rate.totalRated = $(e).text();
    break;
  }
  response.rating = rate;

  //domain
  response.domain = domain;

  //url
  if (URL.includes("dl.flipkart.com")) {
    if ($("link[rel='canonical']").attr("href")) {
      response.url = $("link[rel='canonical']").attr("href");
    } else {
      response.url = $("meta[name='og_url']").attr("content");
    }
  } else {
    response.url = URL;
  }

  return response;
};

util.scrapFlipkartPriceOnly = ($) => {
  let price = null;

  if ($("._16Jk6d").text() != null) {
    price = $("._16Jk6d").text().trim();
  }

  if (price != null && price.length > 0) {
    price = price.replaceAll(",", "");
    if (price.charAt(0) == "₹") {
      price = price.slice(1);
    }
  }

  return price;
};

util.scrapMyntraPriceOnly = ($) => {
  //price
  let price = null;
  if ($(".pdp-price > strong").html() != null) {
    price = $(".pdp-price > strong").html().trim();
  }
  if (price.length > 0 && price.charAt(0) == "₹") {
    price = price.slice(1);
  }
  return price;
};

util.fetchMyntra = ($, URL, domain) => {
  let response = {};

  //title
  response.title = $(".pdp-name").html().trim();

  //price
  let price = {};
  price.originalPrice = $(".pdp-mrp > s").text().trim();
  price.discountPrice = $(".pdp-price > strong").html().trim();
  if (price.originalPrice.length > 0 && price.originalPrice.charAt(0) == "₹") {
    price.originalPrice = price.originalPrice.slice(1);
  }
  if (price.discountPrice.length > 0 && price.discountPrice.charAt(0) == "₹") {
    price.discountPrice = price.discountPrice.slice(1);
  }
  response.price = price;

  //image
  let imageHtml = cheerio.load(
    $("div.image-grid-col50:nth-of-type(1) > .image-grid-imageContainer").html()
  );
  response.image = imageHtml(".image-grid-image")
    .css("background-image")
    .replace(/(url\(|\)|")/g, "");

  //badge
  if (
    $(".xcelerator-pdpXceleratorImageTag").text() != "" &&
    $(".xcelerator-pdpXceleratorImageTag").text() != null &&
    $(".xcelerator-pdpXceleratorImageTag").text() != undefined
  ) {
    response.badge = $(".xcelerator-pdpXceleratorImageTag").text();
  }

  //rating
  let rate = {};
  let rating = $(".index-overallRating").text();
  rate.ratingCount = rating.split("|")[0] + " out of 5 stars";
  rate.totalRated = rating.split("|")[1];
  response.rating = rate;

  //domain
  response.domain = domain;

  //url
  response.url = URL;

  return response;
};

util.convertToChartForm = (priceList) => {
  let dates = [];
  let prices = [];
  priceList.forEach((element) => {
    if (
      dates.length > 0 &&
      dates[dates.length - 1] == element.date.substring(0, 10)
    ) {
      if (prices.length > 0 && prices[prices.length - 1] != element.price) {
        dates.push(element.date.substring(0, 10));
        prices.push(element.price);
      }
    } else {
      dates.push(element.date.substring(0, 10));
      prices.push(element.price);
    }
  });
  let data = {};
  data.dates = dates;
  data.prices = prices;
  return data;
};

util.convertToCurrMinMaxPrice = (tracker) => {
  let data = [];
  tracker.forEach((element) => {
    let obj = {};
    obj.url = element.url;
    let minimumPrice = Number.MAX_SAFE_INTEGER;
    let currentPrice = 0;
    let maximumPrice = Number.MIN_SAFE_INTEGER;

    element.priceList.forEach((val) => {
      if (val.price < minimumPrice) {
        minimumPrice = val.price;
      }
      if (val.price > maximumPrice) {
        maximumPrice = val.price;
      }
      currentPrice = val.price;
    });

    obj.minimumPrice = minimumPrice;
    obj.currentPrice = currentPrice;
    obj.maximumPrice = maximumPrice;
    data.push(obj);
  });
  return data;
};

util.getAmazonProductId = (URL) => {
  let pId = "";
  if (URL.includes("/ref=")) {
    URL = URL.split("/ref=")[0];
  }
  if (URL.includes("?pd_rd_w=")) {
    URL = URL.split("?pd_rd_w=")[0];
  }
  if (URL.includes("/dp/")) {
    let startIndex = URL.indexOf("/dp/");
    let newString = URL.substring(startIndex + 4);
    let endIndex = newString.indexOf("/");
    if (endIndex <= 0) {
      endIndex = newString.indexOf("?");
    }
    if (endIndex > 0) {
      pId = URL.substring(startIndex + 4, endIndex + startIndex + 4);
    } else {
      pId = URL.substring(startIndex + 4);
    }
  }
  return pId;
};

util.getFlipkartProductId = (URL) => {
  let pId = "";
  console.log(URL);
  if (URL.includes("?pid=")) {
    URL = URL.split("?pid=")[0];
  }
  if (URL.includes("/p/")) {
    let startIndex = URL.indexOf("/p/");
    let newString = URL.substring(startIndex + 3);
    let endIndex = newString.indexOf("/");
    if (endIndex <= 0) {
      endIndex = newString.indexOf("?");
    }
    if (endIndex > 0) {
      pId = URL.substring(startIndex + 3, endIndex + startIndex + 3);
    } else {
      pId = URL.substring(startIndex + 3);
    }
  }
  return pId;
};

util.getProductId = (URL, domain) => {
  let pId = "";
  switch (domain) {
    case "AMAZON":
      pId = util.getAmazonProductId(URL);
      break;
    case "FLIPKART":
      pId = util.getFlipkartProductId(URL);
      break;
    default:
      break;
  }
  return pId;
};

util.shortentURL = (URL) => {
  let domain = URL.replace(/.+\/\/|www.|\..+/g, "");
  if (domain != null || domain != undefined || domain != "") {
    domain = domain.toUpperCase();
  }
  switch (domain) {
    case "AMAZON":
      URL = util.shortenAmazonURL(URL);
      break;
    case "FLIPKART":
      URL = URL = util.shortenFlipkartURL(URL);
      break;
    default:
      break;
  }
  return URL;
};

util.shortenAmazonURL = (URL) => {
  if (URL.includes("/ref=")) {
    URL = URL.split("/ref=")[0];
  }
  if (URL.includes("?pd_rd_w=")) {
    URL = URL.split("?pd_rd_w=")[0];
  }
  if (URL.includes("?ref_=")) {
    URL = URL.split("?ref_=")[0];
  }
  return URL;
};

util.shortenFlipkartURL = (URL) => {
  if (URL.includes("?pid=")) {
    URL = URL.split("?pid=")[0];
  }
  return URL;
};

util.scrapAmazonPriceOnlyRegular = ($) => {
  //price
  let price = {};

  if ($(".apexPriceToPay > .a-offscreen").html() != null) {
    price.discountPrice = $(".apexPriceToPay > .a-offscreen").html().trim();
  }

  if (
    (price.discountPrice == undefined || price.discountPrice == null) &&
    $(
      ".priceToPay.reinventPricePriceToPayMargin.aok-align-center.a-price > .a-offscreen"
    ).html() != null
  ) {
    price.discountPrice = $(
      ".priceToPay.reinventPricePriceToPayMargin.aok-align-center.a-price > .a-offscreen"
    )
      .html()
      .trim();
  }
  if (
    (price.discountPrice == undefined || price.discountPrice == null) &&
    $(
      ".priceToPay.reinventPricePriceToPayMargin.aok-align-center.a-price > span > .a-price-whole"
    ).html() != null
  ) {
    price.discountPrice = $(
      ".priceToPay.reinventPricePriceToPayMargin.aok-align-center.a-price > span > .a-price-whole"
    )
      .html()
      .trim();
  }

  if (
    price.discountPrice != undefined &&
    price.discountPrice != null &&
    price.discountPrice.length > 0
  ) {
    price.discountPrice = price.discountPrice.replaceAll(",", "");
    if (price.discountPrice.charAt(0) == "₹") {
      price.discountPrice = price.discountPrice.slice(1);
    }
  }
  if (
    $("[data-a-strike=true]") != null &&
    $("[data-a-strike=true]") != undefined
  ) {
    for (const ele of $("[data-a-strike=true]")) {
      let $$ = cheerio.load(ele);
      price.originalPrice = $$(".a-offscreen").html();
      break;
    }
  }
  if (price.originalPrice == null || price.originalPrice == undefined) {
    if (price.discountPrice != undefined)
      price.originalPrice = price.discountPrice;
  }
  if (
    price.originalPrice != null &&
    price.originalPrice != undefined &&
    price.originalPrice.length > 0 &&
    price.originalPrice.charAt(0) == "₹"
  ) {
    price.originalPrice = price.originalPrice.slice(1);
    price.originalPrice = price.originalPrice.replaceAll(",", "");
  }

  if (price.discountPrice == null || price.discountPrice == undefined) {
    if (price.originalPrice != undefined)
      price.discountPrice = price.originalPrice;
  }
  return price;
};

util.scrapFlipkartPriceOnlyRegular = ($) => {
  //price
  let price = {};

  if ($("._16Jk6d").text() != null) {
    price.discountPrice = $("._16Jk6d").text().trim();
  }
  if (price.discountPrice && price.discountPrice.length > 0) {
    price.discountPrice = price.discountPrice.replaceAll(",", "");
    if (price.discountPrice.charAt(0) == "₹") {
      price.discountPrice = price.discountPrice.slice(1);
    }
  }
  if ($("._2p6lqe").text() != null) {
    price.originalPrice = $("._2p6lqe").text().trim();
  } else {
    price.originalPrice = price.discountPrice;
  }
  if (
    price.originalPrice &&
    price.originalPrice.length > 0 &&
    price.originalPrice.charAt(0) == "₹"
  ) {
    price.originalPrice = price.originalPrice.slice(1);
    price.originalPrice = price.originalPrice.replaceAll(",", "");
  }
  if (
    price.originalPrice == "" ||
    price.originalPrice == null ||
    price.originalPrice == undefined
  ) {
    if (price.discountPrice != undefined)
      price.originalPrice = price.discountPrice;
  }

  if (
    price.discountPrice == "" ||
    price.discountPrice == null ||
    price.discountPrice == undefined
  ) {
    if (price.originalPrice != undefined)
      price.discountPrice = price.originalPrice;
  }
  return price;
};

module.exports = util;
