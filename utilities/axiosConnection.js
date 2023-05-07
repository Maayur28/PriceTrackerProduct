const axios = require("axios");
const cheerio = require("cheerio");
const getUserAgents = require("./useragents");

let axiosConnection = {};
axiosConnection.initialiseAxios = async (URL) => {
  try {
    const { data } = await axios.get(URL, {
      headers: { "User-Agent": getUserAgents() },
    });
    let $ = cheerio.load(await data);
    return $;
  } catch (error) {
    console.log("Axios connection error: ", error.message);
  }
};

module.exports = axiosConnection;
