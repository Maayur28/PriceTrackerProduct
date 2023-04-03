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
    console.log(error.message);
    let err = new Error();
    err.message = "Could not establish connection with axios server.";
    err.status = 403;
    throw err;
  }
};

module.exports = axiosConnection;
