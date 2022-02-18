import dotenv from 'dotenv';

dotenv.config();
export const connectionString = process.env.DATABASE_URL || process.env.CONNECTION_STRING;
// export const connectionString = process.env.DATABASE_URL || process.env.CONNECTION_STRING_DOCKER;

