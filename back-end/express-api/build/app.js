"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _morgan = _interopRequireDefault(require("morgan"));

var _express = _interopRequireDefault(require("express"));

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

var _index = _interopRequireDefault(require("./routes/index"));

var _cors = _interopRequireDefault(require("cors"));

var app = (0, _express["default"])();
var originsWhitelist = ['http://localhost:4200'];
var corsOptions = {
  origin: function origin(_origin, callback) {
    var isWhitelisted = originsWhitelist.indexOf(_origin) !== -1;
    callback(null, isWhitelisted);
  },
  credentials: true
};
app.use((0, _morgan["default"])('dev'));
app.use(_express["default"].json());
app.use(_express["default"].urlencoded({
  extended: true
}));
app.use((0, _cookieParser["default"])());
app.use((0, _cors["default"])(corsOptions));
app.use('/v1', _index["default"]);
app.use(function (err, req, res, next) {
  res.status(400).json({
    error: err.stack
  });
});
var _default = app;
exports["default"] = _default;