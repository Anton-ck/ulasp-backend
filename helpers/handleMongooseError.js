const handleMongooseError = (error, data, next) => {
  const { name, code } = error;

  const status = name === "MongoServerError" && code === 11000 ? 409 : 400;

  const fieldModel = Object.keys(error.keyValue)[0];
  const valueModel = Object.values(error.keyValue)[0];

  console.log("Монгус еррор", fieldModel);

  error.status = status;
  error.message = `Field "${fieldModel}" with value "${valueModel}" already present in the database. Field "${fieldModel}" must be unique`;

  next();
};

export default handleMongooseError;
