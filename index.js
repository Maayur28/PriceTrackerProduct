const express = require("express");
const cors = require("cors");
const requestLogger = require("./utilities/requestLogger");
const routing = require("./routes/routing");
const errorLogger = require("./utilities/errorLogger");
const helmet = require("helmet");
const moment = require("moment");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(requestLogger);
app.use("/", routing);
app.use(errorLogger);

app.listen(process.env.PORT || 9000, (err) => {
  if (!err) {
    console.log(`Server started at port ${[process.env.PORT || 9000]}`);
  } else {
    console.log(`Error in setting up price tracker server`);
  }
});

module.exports = app;
