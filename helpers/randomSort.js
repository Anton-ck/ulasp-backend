const getRandomNumber = (min, max) => {
  let random = Math.floor(Math.random() * (max - min + 1)) + min;
  if (random === 0) {
    random = -1;
  }

  return random;
};

const randomFn = (typeSwitch) => {
  let sortOptions;
  switch (typeSwitch) {
    case "1":
      sortOptions = {
        trackName: getRandomNumber(-1, 1),
        artist: getRandomNumber(-1, 1),
        trackDuration: getRandomNumber(-1, 1),
        createdAt: getRandomNumber(-1, 1),
      };

      return sortOptions;

    case "2":
      sortOptions = {
        createdAt: getRandomNumber(-1, 1),
        trackName: getRandomNumber(-1, 1),
        trackDuration: getRandomNumber(-1, 1),
        artist: getRandomNumber(-1, 1),
      };

      return sortOptions;
    case "3":
      sortOptions = {
        artist: getRandomNumber(-1, 1),
        trackName: getRandomNumber(-1, 1),
        trackDuration: getRandomNumber(-1, 1),
        createdAt: getRandomNumber(-1, 1),
      };

      return sortOptions;
    case "4":
      sortOptions = {
        trackName: getRandomNumber(-1, 1),
        trackDuration: getRandomNumber(-1, 1),
        artist: getRandomNumber(-1, 1),
        createdAt: getRandomNumber(-1, 1),
      };

      return sortOptions;
    default:
      sortOptions = {
        trackDuration: getRandomNumber(-1, 1),
        trackName: getRandomNumber(-1, 1),
        artist: getRandomNumber(-1, 1),
        createdAt: getRandomNumber(-1, 1),
      };
      return sortOptions;
  }
};

export default randomFn;
