"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getHistoricalPlayerValueById = exports.getPrevPlayerValues = exports.getCurrentPlayerValues = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _model = _interopRequireDefault(require("../models/model"));

var playersModel = new _model["default"]('ktc_players');

var getCurrentPlayerValues = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
    var data;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return playersModel.selectSubQuery('*', '(\n' + '    select distinct on (name_id) * \n' + '    from ktc_players \n' + '    order by name_id, id desc \n' + ') as T \n' + '  order by sf_trade_value desc  ');

          case 3:
            data = _context.sent;
            res.status(200).json(data.rows);
            _context.next = 10;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context["catch"](0);
            res.status(405).json(_context.t0.stack);

          case 10:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 7]]);
  }));

  return function getCurrentPlayerValues(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

exports.getCurrentPlayerValues = getCurrentPlayerValues;

var getPrevPlayerValues = /*#__PURE__*/function () {
  var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(req, res) {
    var _ref3, intervalDays, data;

    return _regenerator["default"].wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _ref3 = req.params || 30, intervalDays = _ref3.intervalDays;
            _context2.next = 4;
            return playersModel.select('*', " WHERE date::date = now()::date - ".concat(intervalDays, " order by sf_trade_value desc "));

          case 4:
            data = _context2.sent;
            res.status(200).json(data.rows.map(function (player) {
              return {
                name_id: player.name_id,
                full_name: player.full_name,
                sf_position_rank: player.sf_position_rank,
                position_rank: player.position_rank,
                sf_trade_value: player.sf_trade_value,
                trade_value: player.trade_value,
                date: player.date
              };
            }));
            _context2.next = 11;
            break;

          case 8:
            _context2.prev = 8;
            _context2.t0 = _context2["catch"](0);
            res.status(405).json(_context2.t0.stack);

          case 11:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[0, 8]]);
  }));

  return function getPrevPlayerValues(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

exports.getPrevPlayerValues = getPrevPlayerValues;

var getHistoricalPlayerValueById = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(req, res) {
    var id, data;
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            id = req.params.id;
            _context3.next = 4;
            return playersModel.select('*', " WHERE name_id = '".concat(id, "'"));

          case 4:
            data = _context3.sent;
            res.status(200).json(data.rows.map(function (player) {
              return {
                name_id: player.name_id,
                full_name: player.full_name,
                sf_position_rank: player.sf_position_rank,
                position_rank: player.position_rank,
                sf_trade_value: player.sf_trade_value,
                trade_value: player.trade_value,
                date: player.date
              };
            }));
            _context3.next = 11;
            break;

          case 8:
            _context3.prev = 8;
            _context3.t0 = _context3["catch"](0);
            res.status(405).json(_context3.t0.stack);

          case 11:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[0, 8]]);
  }));

  return function getHistoricalPlayerValueById(_x5, _x6) {
    return _ref4.apply(this, arguments);
  };
}();

exports.getHistoricalPlayerValueById = getHistoricalPlayerValueById;