import iconv from "iconv-lite";
const decodeFromIso8859 = (str) => {
  const buf = iconv.encode(str, "iso-8859-1");

  const result = iconv.decode(Buffer.from(buf), "cp1251").toString("utf8");
  if (result.includes("?")) {
    return str;
  }
console.log("result ====>>>", result);
  return result;
};

export default decodeFromIso8859;
