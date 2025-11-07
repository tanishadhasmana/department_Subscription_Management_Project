import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") }); // ✅ load from backend/.env

const config = {
  development: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    migrations: {
      directory: path.resolve(__dirname, "migrations"),
      extension: "ts",
    },
    seeds: {
      directory: path.resolve(__dirname, "seeds"),
      extension: "ts",
    },
    pool: { min: 0, max: 7 },
  },
};

export default config;
