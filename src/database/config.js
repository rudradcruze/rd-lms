import { config } from '../../configurations/environment.js';

export const sequelizeConfig = {
  development: {
    username: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    host: config.DB_HOST,
    port: config.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl: config.NODE_ENV === 'production' ? true : false,
    },
  },
  test: {
    username: config.DB_USER,
    password: config.DB_PASSWORD,
    database: `${config.DB_NAME}_test`,
    host: config.DB_HOST,
    port: config.DB_PORT,
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    host: config.DB_HOST,
    port: config.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      ssl: true,
    },
    logging: false,
  },
};

export default sequelizeConfig[config.NODE_ENV || 'development'];
