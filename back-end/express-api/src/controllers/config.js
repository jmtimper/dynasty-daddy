import Model from '../models/model';

const configRepository = new Model('players_info');

/**
 * fetch all config options for application
 */
export const getConfigValues = async (req, res) => {
  try {
    const data = await configRepository.selectQuery('Select config_key, '
      + '       config_value '
      + 'from config;');
    res.status(200).json(data.rows);
  } catch (err) {
    res.status(500).json(err.stack);
  }
};
