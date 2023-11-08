import { Schema, model } from "mongoose";

import handleMongooseError from "../helpers/handleMongooseError.js";

const picsSchema = new Schema(
  {
    picsURL: {
      type: String,
      require: true,
    },
    type: {
      type: String,
      default: null,
    },
  },
  { versionKey: false, timestamps: true }
);

picsSchema.post("save", handleMongooseError);

const Pics = model("pics", picsSchema);

export default Pics;
