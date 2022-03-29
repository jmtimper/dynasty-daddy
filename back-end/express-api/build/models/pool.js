"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.pool = void 0;

var _pg = require("pg");

var _dotenv = _interopRequireDefault(require("dotenv"));

var _settings = require("../settings");

// eslint-disable-next-line import/named
_dotenv["default"].config();

var pool = new _pg.Pool({
  host: _settings.DB_HOST,
  port: _settings.DB_PORT,
  user: _settings.DB_USER,
  password: _settings.DB_PWD,
  database: _settings.DB_DB
});
exports.pool = pool;