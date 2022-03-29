"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DB_PORT = exports.DB_DB = exports.DB_HOST = exports.DB_PWD = exports.DB_USER = exports.connectionString = void 0;

var _dotenv = _interopRequireDefault(require("dotenv"));

_dotenv["default"].config();

var connectionString = process.env.DATABASE_URL || process.env.CONNECTION_STRING; // export const connectionString = process.env.DATABASE_URL || process.env.CONNECTION_STRING_DOCKER;

exports.connectionString = connectionString;
var DB_USER = process.env.DO_DB_USER;
exports.DB_USER = DB_USER;
var DB_PWD = process.env.DO_DB_PASSWORD;
exports.DB_PWD = DB_PWD;
var DB_HOST = process.env.DO_DB_HOST;
exports.DB_HOST = DB_HOST;
var DB_DB = process.env.DO_DATABASE;
exports.DB_DB = DB_DB;
var DB_PORT = process.env.DO_DB_PORT;
exports.DB_PORT = DB_PORT;