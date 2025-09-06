const slugify = (str) =>
  str
    .replace(/[^a-zA-Zа-яА-Я0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

export default slugify;
