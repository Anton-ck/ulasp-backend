import * as fs from "fs";
import path from "path";
const publicDir = path.resolve("public/");

const defaultAvatar = "avatars/default.png";

const isExistAvatar = (avatarURL) => {
  const avatarPath = publicDir + "/" + avatarURL;

  if (fs.existsSync(avatarPath)) {
    return avatarURL;
  } else {
    return defaultAvatar;
  }
};

export default isExistAvatar;
