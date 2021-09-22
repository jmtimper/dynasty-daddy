import express from 'express';
import {addMessage, getCurrentPlayerValues, getHistoricalPlayerValueById, getPrevPlayerValues, indexPage, messagesPage} from '../controllers';
import {modifyMessage, performAsyncAction} from '../middleware';

const indexRouter = express.Router();
indexRouter.get('/', indexPage);
indexRouter.get('/messages', messagesPage);
indexRouter.post('/messages', modifyMessage, performAsyncAction, addMessage);
indexRouter.get('/player/all/today', getCurrentPlayerValues);
indexRouter.get('/player/all/prev/:intervalDays', getPrevPlayerValues);
indexRouter.get('/player/sleeper/:id', getHistoricalPlayerValueById);

export default indexRouter;
