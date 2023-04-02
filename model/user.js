const dbModel = require("../utilities/dbConnection");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
let userModel = {};

userModel.addTracker = async (price, URL) => {
  try {
    const model = await dbModel.getTrackerConnection();
    const tracker = await model.findOne({ url: URL });
    if (tracker) {
      const updated = await model.updateOne(
        { url: URL },
        {
          $push: {
            priceList: {
              price: price,
              date: (
                moment().format("DD-MM-YYYY") +
                "T" +
                moment().format("LT")
              ).toString(),
            },
          },
        }
      );
      return updated.modifiedCount;
    } else {
      let obj = {};
      obj.trackerId = uuidv4();
      obj.url = URL;
      let priceList = [
        {
          price: price,
          date: (
            moment().format("DD-MM-YYYY") +
            "T" +
            moment().format("LT")
          ).toString(),
        },
      ];
      obj.priceList = priceList;
      const added = await model.create(obj);
      return added.modifiedCount;
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = userModel;
