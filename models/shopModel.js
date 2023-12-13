import { Schema, SchemaType, model } from "mongoose";

import handleMongooseError from "../helpers/handleMongooseError.js";

const shopSchema = new Schema(
  {
    shopCategoryName: {
      type: String,
      required: true,
    },
    shopAvatarURL: {
      type: String,
      default: null,
    },
  },
  { versionKey: false, timestamps: true }
);

shopSchema.post("findOneAndUpdate", handleMongooseError);
shopSchema.post("save", handleMongooseError);

const Shop = model("shop", shopSchema);

export default Shop;
