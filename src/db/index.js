import sequelize, { connectPostgres } from "./connections/postgres.js";;

export const connectDatabases = async () => {
  await connectPostgres();
};

export { sequelize };