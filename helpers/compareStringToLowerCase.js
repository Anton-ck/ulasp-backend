const isExistStringToLowerCase = (strOne, strTwo) => {
  console.log(strTwo);

  if (strOne === undefined || strTwo === undefined) {
    return false;
  }

  const string = strOne.toLowerCase().trim() === strTwo.toLowerCase().trim();

  return string;
};

export default isExistStringToLowerCase;
