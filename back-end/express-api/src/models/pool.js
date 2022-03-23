import { Pool } from 'pg';
import dotenv from 'dotenv';
// eslint-disable-next-line import/named
import {DB_DB, DB_HOST, DB_PORT, DB_PWD, DB_USER} from '../settings';

dotenv.config();

export const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PWD,
  database: DB_DB
});
