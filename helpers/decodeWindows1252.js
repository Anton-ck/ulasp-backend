import generateLatinTranslation from "../helpers/translateToLatin.js"
const decodeFromWindows1252 = (str) => {
  const brokenChars = /[ÐÑ�]/;

  const brokenString = brokenChars.test(str);

  if (!brokenString) {
    return str;
  }

  let decoder = new TextDecoder("utf-8");
  let bytes = new Uint8Array([...str].map((char) => char.charCodeAt(0)));
  let correctText = generateLatinTranslation(decoder.decode(bytes));

  return correctText;
};

export default decodeFromWindows1252;
