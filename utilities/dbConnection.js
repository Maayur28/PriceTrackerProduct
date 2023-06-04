const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
require("dotenv").config();

const url = process.env.MONGODB_URL;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const priceSchema = mongoose.Schema({
  price: { type: Number },
  date: { type: String },
});

const trackerSchema = mongoose.Schema(
  {
    trackerId: {
      type: String,
      required: [true, "trackerId is required"],
      unique: true,
    },
    pId: {
      type: String,
    },
    url: { type: String, required: [true, "Url is required"], unique: true },
    image: { type: String },
    title: { type: String },
    originalPrice: { type: Number },
    priceList: [priceSchema],
  },
  { timestamps: true }
);

const packageSchema = mongoose.Schema(
  {
    trackerId: {
      type: String,
      required: [true, "trackerId is required"],
      unique: true,
    },
    userId: {
      type: String,
      required: [true, "userId is required"],
    },
    pId: {
      type: String,
    },
    url: { type: String, required: [true, "Url is required"], unique: true },
    domain: { type: String },
    provider: { type: String },
    status: { type: String },
    arriving: { type: String },
    currentLocation: { type: String },
    previousLocation: { type: [String] },
    orderDetails: { type: [String] },
  },
  { timestamps: true }
);

const droppedPriceSchema = mongoose.Schema(
  {
    pId: {
      type: String,
      required: [true, "pId is required"],
      unique: true,
    },
    url: { type: String, required: [true, "Url is required"], unique: true },
    domain: { type: String },
    image: { type: String },
    title: { type: String },
    originalPrice: { type: Number },
    previousPrice: priceSchema,
    droppedPrice: priceSchema,
    minimumPrice: priceSchema,
    maximumPrice: priceSchema,
    date: { type: String },
  },
  { timestamps: true }
);

let connection = {};
connection.getTrackerConnection = async () => {
  try {
    let dbConnection = await mongoose.connect(url, options);
    let model = dbConnection.model("trackers", trackerSchema);
    return model;
  } catch (error) {
    let err = new Error("Could not establish connection with tracker database");
    err.status = 500;
    throw err;
  }
};

connection.getDroppedPriceConnection = async () => {
  try {
    let dbConnection = await mongoose.connect(url, options);
    let model = dbConnection.model("droppedPrice", droppedPriceSchema);
    return model;
  } catch (error) {
    let err = new Error("Could not establish connection with tracker database");
    err.status = 500;
    throw err;
  }
};

connection.getPackageConnection = async () => {
  try {
    let dbConnection = await mongoose.connect(url, options);
    let model = dbConnection.model("trackPackage", packageSchema);
    return model;
  } catch (error) {
    let err = new Error("Could not establish connection with tracker database");
    err.status = 500;
    throw err;
  }
};
module.exports = connection;
