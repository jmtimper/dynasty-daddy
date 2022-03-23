import dotenv from 'dotenv';

dotenv.config();
export const connectionString = process.env.DATABASE_URL || process.env.CONNECTION_STRING;
// export const connectionString = process.env.DATABASE_URL || process.env.CONNECTION_STRING_DOCKER;

export const DB_USER = process.env.DO_DB_USER;
export const DB_PWD = process.env.DO_DB_PASSWORD;
export const DB_HOST = process.env.DO_DB_HOST;
export const DB_DB = process.env.DO_DATABASE;
export const DB_PORT = process.env.DO_DB_PORT;
