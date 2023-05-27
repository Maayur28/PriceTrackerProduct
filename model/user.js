const dbModel = require("../utilities/dbConnection");
const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const util = require("../utilities/util");
let userModel = {};

userModel.addTracker = async (price, URL, pId, image, title) => {
  try {
    const model = await dbModel.getTrackerConnection();
    const tracker = await model.findOne({ pId: pId });
    if (tracker) {
      await model.updateOne(
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
      return await model.countDocuments();
    } else {
      let obj = {};
      obj.trackerId = uuidv4();
      obj.url = URL;
      obj.pId = pId;
      if (image) {
        obj.image = image;
      }
      if (title) {
        obj.title = title;
      }
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
      await model.create(obj);
      return await model.countDocuments();
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

userModel.getProductsList = async () => {
  const model = await dbModel.getTrackerConnection();
  return await model.find();
};

userModel.getDroppedPriceList = async () => {
  const model = await dbModel.getDroppedPriceConnection();
  return await model.find();
};

userModel.updateDroppedPrice = async (arr) => {
  const model = await dbModel.getDroppedPriceConnection();
  await model.deleteMany();
  return await model.insertMany(arr);
};

userModel.addTrackerRegular = async (price, pId, originalPrice) => {
  try {
    const model = await dbModel.getTrackerConnection();
    const tracker = await model.findOne({ pId: pId });
    if (tracker) {
      await model.updateOne(
        { pId: pId },
        {
          $set: { originalPrice: originalPrice },
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
      return await model.countDocuments();
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = userModel;
