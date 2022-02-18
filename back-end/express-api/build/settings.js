"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.connectionString = void 0;

var _dotenv = _interopRequireDefault(require("dotenv"));

_dotenv["default"].config();

var connectionString = process.env.DATABASE_URL || process.env.CONNECTION_STRING; // export const connectionString = process.env.DATABASE_URL || process.env.CONNECTION_STRING_DOCKER;

exports.connectionString = connectionString;