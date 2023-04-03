const cheerio = require("cheerio");

let util = {};

util.fetchAmazon = ($, URL, domain) => {
  let response = {};
  //title
  response.title = $(".product-title-word-break.a-size-large").html().trim();

  //price
  let price = {};

  if (
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
  if (price.discountPrice.length > 0) {
    price.discountPrice = price.discountPrice.replaceAll(",", "");
  }

  if ($(".a-text-price.a-price > .a-offscreen").html() != null) {
    price.originalPrice = $(".a-text-price.a-price > .a-offscreen")
      .html()
      .trim();
  } else {
    price.originalPrice = price.discountPrice;
  }
  if (price.originalPrice.length > 0 && price.originalPrice.charAt(0) == "₹") {
    price.originalPrice = price.originalPrice.slice(1);
    price.originalPrice = price.originalPrice.replaceAll(",", "");
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
  response.url = URL;

  return response;
};

util.scrapAmazonPriceOnly = ($) => {
  let price = null;
  if (
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
  if (price.length > 0) {
    price = price.replaceAll(",", "");
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

  response.price = price;

  //image

  if ($("._2amPTt._3qGmMb").html() != null) {
    response.image = $("._2amPTt._3qGmMb").attr().src;
  }

  //badge
  response.badge = null;

  //rate
  let rate = {};

  for (const e of $(
    "#productRating_LSTCOMFXEKMGNHZYFH9P56X45_COMFXEKMGNHZYFH9_ > ._3LWZlK"
  )) {
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
  response.url = URL;

  return response;
};

util.scrapFlipkartPriceOnly = ($) => {
  let price = null;

  if ($("._16Jk6d").text() != null) {
    price = $("._16Jk6d").text().trim();
  }

  if (price.length > 0) {
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

module.exports = util;
