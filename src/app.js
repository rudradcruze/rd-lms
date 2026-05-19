import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import config from "./configurations/environment.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import apiRoutes from "./routes/index.js";

const app = express();

// CORS configuration
const { allowedOrigins, credentials } = config.cors;

app.use(
    cors({
        origin: function (origin, callback) {
            // allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) === -1) {
                const msg =
                    "The CORS policy for this site does not allow access from the specified Origin.";
                return callback(new Error(msg), false);
            }
            return callback(null, true);
        },
        credentials,
    })
);

app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/v1", apiRoutes);

app.use(errorMiddleware);

export default app;
