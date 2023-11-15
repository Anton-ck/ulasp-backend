import * as mm from "music-metadata";
import { inspect } from "util";

const getId3Tags = async (file) => {
  const metadata = await mm.parseFile(file.path, { duration: true });



  // console.log(inspect(metadata, { showHidden: false, depth: null }));
  return metadata;
};

export default getId3Tags;
