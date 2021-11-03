"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = _interopRequireDefault(require("express"));

var _controllers = require("../controllers");

var indexRouter = _express["default"].Router();

indexRouter.get('/', _controllers.indexPage);
indexRouter.get('/player/all/today', _controllers.getCurrentPlayerValues);
indexRouter.get('/player/all/prev/:intervalDays', _controllers.getPrevPlayerValues);
indexRouter.get('/player/sleeper/:id', _controllers.getHistoricalPlayerValueById);
var _default = indexRouter;
exports["default"] = _default;