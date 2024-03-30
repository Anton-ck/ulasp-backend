import express from "express";
import logger from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

import swaggerDocument from "./swagger.json" assert { type: "json" };

import authRouter from "./routes/api/authAdmin.js";
import controlAdminRouter from "./routes/api/controlAdmin.js";

import controlEditorRouter from "./routes/api/controlEditor.js";
import genreEditorAPI from "./routes/api/controlEditor/genreAPI.js";
import playlistEditorAPI from "./routes/api/controlEditor/playlistAPI.js";
import shopsEditorAPI from "./routes/api/controlEditor/shopAPI.js";

import authUserRouter from "./routes/api/authUser.js";
import controlUserRouter from "./routes/api/controlUser.js";

dotenv.config();

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/admin", authRouter);
app.use("/admin", controlAdminRouter);

app.use("/editor", controlEditorRouter);
app.use("/editor", genreEditorAPI);
app.use("/editor", playlistEditorAPI);
app.use("/editor", shopsEditorAPI);

app.use("/user", authUserRouter);
app.use("/user", controlUserRouter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  const { status = 500, message = "Server error" } = err;

  res.status(status).json({ message });
});

export default app;
