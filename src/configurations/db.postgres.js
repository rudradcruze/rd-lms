import { Sequelize } from "sequelize";
import config from "./environment.js";
import logger from "./logger.js";

const sequelize = new Sequelize(
    config.postgres.name,
    config.postgres.user,
    config.postgres.password,
    {
        host: config.postgres.host,
        port: config.postgres.port,
        dialect: "postgres",

        logging: false,

        pool: {
            max: 20,
            min: 2,
            acquire: 30000,
            idle: 10000,
        },

        dialectOptions: {
            connectTimeout: 30000,
        },

        define: {
            timestamps: true,
            underscored: true,
        },
    }
);

export const connectPostgres = async () => {
    try {
        await sequelize.authenticate();

        logger.info("PostgreSQL Connected");
    } catch (error) {
        logger.error("PostgreSQL Connection Failed");

        logger.error(error.message);

        process.exit(1);
    }
};

export default sequelize;
