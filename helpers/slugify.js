import generateLatinTranslation from './translateToLatin.js';

const slugify = (str) => {
  str
    .replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

  return generateLatinTranslation(str);
};

export default slugify;
