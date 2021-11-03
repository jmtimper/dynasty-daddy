import express from 'express';
import {getCurrentPlayerValues, getHistoricalPlayerValueById, getPrevPlayerValues, indexPage} from '../controllers';

const indexRouter = express.Router();
indexRouter.get('/', indexPage);
indexRouter.get('/player/all/today', getCurrentPlayerValues);
indexRouter.get('/player/all/prev/:intervalDays', getPrevPlayerValues);
indexRouter.get('/player/sleeper/:id', getHistoricalPlayerValueById);

export default indexRouter;
