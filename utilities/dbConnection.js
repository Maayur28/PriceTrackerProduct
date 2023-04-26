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
    priceList: [priceSchema],
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
module.exports = connection;
