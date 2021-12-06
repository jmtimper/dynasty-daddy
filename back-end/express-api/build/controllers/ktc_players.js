"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getHistoricalPlayerValueById = exports.getPrevPlayerValues = exports.getCurrentPlayerValues = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _model = _interopRequireDefault(require("../models/model"));

var playersModel = new _model["default"]('players_info');

var getCurrentPlayerValues = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(req, res) {
    var data;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return playersModel.selectQuery('Select * From (select distinct on (player_info.name_id)\n' + '           player_info.name_id as name_id,\n' + '           pi.sleeper_id as sleeper_id,\n' + '           player_info.full_name as full_name,\n' + '           player_info.first_name as first_name,\n' + '           player_info.last_name as last_name,\n' + '           player_info.team as team,\n' + '           player_info.position as position,\n' + '           player_info.age as age,\n' + '           player_info.experience as experience,\n' + '           pv.trade_value as trade_value,\n' + '           pv.sf_trade_value as sf_trade_value,\n' + '           pv.sf_position_rank as sf_position_rank,\n' + '           pv.position_rank as position_rank,\n' + '           pv.created_at as date\n' + '         from player_info\n' + '            left join player_values pv on player_info.name_id = pv.name_id\n' + '            left join player_ids pi on player_info.name_id = pi.name_id\n' + '       order by player_info.name_id, pv.id desc\n' + '     ) as T\n' + '      order by sf_trade_value desc');

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
            return playersModel.selectQuery('select  player_info.name_id    as name_id,\n' + '                                               player_info.full_name  as full_name,\n' + '                                               pv.trade_value         as trade_value,\n' + '                                               pv.sf_trade_value    as sf_trade_value,\n' + '                                               pv.sf_position_rank    as sf_position_rank,\n' + '                                               pv.position_rank       as position_rank,\n' + '                                               pv.created_at          as date\n' + '      from player_info\n' + '               left join player_values pv on player_info.name_id = pv.name_id', " WHERE pv.created_at::date = now()::date - ".concat(intervalDays, " order by pv.sf_trade_value desc "));

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
/**
 * query to get player comp table datapoints
 * @param req
 * @param res
 * @return {Promise<void>}
 */


exports.getPrevPlayerValues = getPrevPlayerValues;

var getHistoricalPlayerValueById = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(req, res) {
    var id, _ref5, isAllTime, sqlClause, data;

    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            id = req.params.id;
            _ref5 = req.query || 'false', isAllTime = _ref5.isAllTime; // updated where to include all time data if specified

            sqlClause = isAllTime === 'false' ? " WHERE pv.name_id = '".concat(id, "' AND pv.created_at::date >= now()::date - 180") : " WHERE pv.name_id = '".concat(id, "'");
            _context3.next = 6;
            return playersModel.selectQuery('select  player_info.name_id    as name_id,\n' + '                                               player_info.full_name  as full_name,\n' + '                                               pv.trade_value         as trade_value,\n' + '                                               pv.sf_trade_value    as sf_trade_value,\n' + '                                               pv.sf_position_rank    as sf_position_rank,\n' + '                                               pv.position_rank       as position_rank,\n' + '                                               pv.created_at          as date\n' + '      from player_info\n' + '               left join player_values pv on player_info.name_id = pv.name_id', sqlClause);

          case 6:
            data = _context3.sent;
            res.status(200).json(data.rows);
            _context3.next = 13;
            break;

          case 10:
            _context3.prev = 10;
            _context3.t0 = _context3["catch"](0);
            res.status(405).json(_context3.t0.stack);

          case 13:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[0, 10]]);
  }));

  return function getHistoricalPlayerValueById(_x5, _x6) {
    return _ref4.apply(this, arguments);
  };
}();

exports.getHistoricalPlayerValueById = getHistoricalPlayerValueById;