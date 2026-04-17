import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Dùng .js trong production (sau khi build), .ts khi dev
const entityExtension = isProduction ? '*.js' : '*.ts';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Không dùng synchronize trong production — dùng migrations thay thế
  // synchronize: !isProduction,
  logging: isProduction ? ['error'] : false,
  // dropSchema: true,
  entities: [
    `${__dirname}/../models/schemas/${entityExtension}`,
  ],
});


