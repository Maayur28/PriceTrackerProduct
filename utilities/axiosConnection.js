const axios = require("axios");
const cheerio = require("cheerio");

let axiosConnection = {};

axiosConnection.initialiseAxios = async (URL, useragent) => {
  try {
    if (useragent == null || useragent == undefined || useragent.length <= 10) {
      useragent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36";
    }
    const { data } = await axios.get(URL, {
      headers: { "User-Agent": useragent },
    });
    let $ = cheerio.load(await data);
    return $;
  } catch (error) {
    console.log("Axios connection error: ", error.message);
  }
};

module.exports = axiosConnection;
