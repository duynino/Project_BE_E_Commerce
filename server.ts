import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import Router from './src/index'
import { AppDataSource } from './src/config/db-config'
import { defaultErrorHandler } from './src/middlewares/error.middlewares'
import { redisClient } from'./src/config/redis-config';

const app = express();
const PORT = process.env.PORT;

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use('/', Router);
app.use(defaultErrorHandler);

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected successfully');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error during Data Source initialization:', error);
  });

redisClient.connect().then(() => {
    console.log('Connected to Redis successfully');
  }).catch((error) => {
    console.error('Error connecting to Redis:', error);
  });




