import Model from '../models/model';

const playersModel = new Model('ktc_players');

export const getCurrentPlayerValues = async (req, res) => {
  try {
    const data = await playersModel.selectSubQuery('*', '(\n'
      + '    select distinct on (name_id) * \n'
      + '    from ktc_players \n'
      + '    order by name_id, id desc \n'
      + ') as T \n'
      + '  order by sf_trade_value desc  ');
    res.status(200).json(data.rows);
  } catch (err) {
    res.status(405).json(err.stack);
  }
};

export const getPrevPlayerValues = async (req, res) => {
  try {
    const {intervalDays} = req.params || 30;
    const data = await playersModel.select(
      '*',
      ` WHERE date::date = now()::date - ${intervalDays} order by sf_trade_value desc `
    );
    res.status(200).json(data.rows.map(player =>
      (
        {
          name_id: player.name_id,
          full_name: player.full_name,
          sf_position_rank: player.sf_position_rank,
          position_rank: player.position_rank,
          sf_trade_value: player.sf_trade_value,
          trade_value: player.trade_value,
          date: player.date
        }
      )));
  } catch (err) {
    res.status(405).json(err.stack);
  }
};

/**
 * query to get player comp table datapoints
 * @param req
 * @param res
 * @return {Promise<void>}
 */
export const getHistoricalPlayerValueById = async (req, res) => {
  try {
    const {id} = req.params;
    const {isAllTime} = req.query || 'false';
    // updated where to include all time data if specified
    const sqlClause = isAllTime === 'false' ? ` WHERE name_id = '${id}' AND date::date >= now()::date - 180` : ` WHERE name_id = '${id}'`;
    const data = await playersModel.select('*', sqlClause);
    res.status(200).json(data.rows.map(player =>
      (
        {
          name_id: player.name_id,
          full_name: player.full_name,
          sf_position_rank: player.sf_position_rank,
          position_rank: player.position_rank,
          sf_trade_value: player.sf_trade_value,
          trade_value: player.trade_value,
          date: player.date
        }
      )));
  } catch (err) {
    res.status(405).json(err.stack);
  }
};
