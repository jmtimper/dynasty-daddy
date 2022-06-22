import express from 'express';
import {getCurrentPlayerValues, getHistoricalPlayerValueById, getPrevPlayerValues, indexPage} from '../controllers';
import {getConfigValues} from '../controllers/config';

const indexRouter = express.Router();
indexRouter.get('/', indexPage);
indexRouter.get('/player/all/today', getCurrentPlayerValues);
indexRouter.get('/player/all/prev/:intervalDays', getPrevPlayerValues);
indexRouter.get('/player/sleeper/:id', getHistoricalPlayerValueById);
indexRouter.get('/config/all', getConfigValues);

export default indexRouter;
