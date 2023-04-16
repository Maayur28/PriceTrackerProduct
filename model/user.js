const dbModel = require("../utilities/dbConnection");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const util = require("../utilities/util");
let userModel = {};

userModel.addTracker = async (price, URL, pId) => {
  try {
    const model = await dbModel.getTrackerConnection();
    const tracker = await model.findOne({ pId: pId });
    if (tracker) {
      const updated = await model.updateOne(
        { pId: pId },
        {
          $push: {
            priceList: {
              price: price,
              date: (
                moment().utcOffset("+05:30").format("DD-MM-YYYY") +
                "T" +
                moment().utcOffset("+05:30").format("LT")
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
      obj.pId = pId;
      let priceList = [
        {
          price: price,
          date: (
            moment().utcOffset("+05:30").format("DD-MM-YYYY") +
            "T" +
            moment().utcOffset("+05:30").format("LT")
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

userModel.getPriceHistory = async (pId) => {
  let data = {};
  const model = await dbModel.getTrackerConnection();
  const tracker = await model.findOne({ pId: pId }, { priceList: 1, _id: 0 });
  if (
    tracker != null &&
    tracker !== "" &&
    tracker != undefined &&
    tracker.priceList != null &&
    tracker.priceList !== "" &&
    tracker.priceList != undefined &&
    tracker.priceList.length > 0
  ) {
    data = util.convertToChartForm(tracker.priceList);
  }
  return data;
};

userModel.getPriceHistoryUrls = async (pIds) => {
  let data;
  const model = await dbModel.getTrackerConnection();
  const tracker = await model.find({ pId: { $in: pIds } });
  if (
    tracker != null &&
    tracker !== "" &&
    tracker != undefined &&
    tracker.length > 0
  ) {
    data = util.convertToCurrMinMaxPrice(tracker);
  }
  return data;
};

module.exports = userModel;
