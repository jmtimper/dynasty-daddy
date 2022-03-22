import logger from 'morgan';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import indexRouter from './routes/index';

const app = express();

const originsWhitelist = [
  'http://localhost:4200',
  'https://dynasty-daddy.com/'
];
const corsOptions = {
  origin(origin, callback) {
    const isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
    callback(null, isWhitelisted);
  },
  credentials: true
};

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use('/api/v1', indexRouter);
app.use((err, req, res, next) => {
  res.status(400).json({ error: err.stack });
});

export default app;
