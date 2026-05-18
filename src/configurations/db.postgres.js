import { Sequelize } from "sequelize";

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
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

    console.log("PostgreSQL Connected");
  } catch (error) {
    console.error("PostgreSQL Connection Failed");

    console.error(error.message);

    process.exit(1);
  }
};

export default sequelize;