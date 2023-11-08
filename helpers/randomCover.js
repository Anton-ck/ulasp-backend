import Pics from "../models/picsModel.js";

const randomCover = async (type) => {
  try {
    const allPics = await Pics.find({ type: type });

    const randomValue = Math.floor(Math.random() * allPics.length);

    const randomPicUrl = allPics[randomValue].picsURL;

    return randomPicUrl;
  } catch (error) {
    console.log(error);
  }
};

export default randomCover;
