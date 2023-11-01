import HttpError from "../helpers/HttpError.js";

const validateBody = (schema) => {
  const func = (req, res, next) => {

    const { error } = schema.validate(req.body);
    const requireField = schema.validate(req.body);

    console.log(error);

    if (error) {
      const requireFieldError = requireField.error.details[0].path[0];
      const errorContext = error.details[0].context;
      console.log(error.details[0].type);
      switch (error.details[0].type) {
        case "any.required":
          throw HttpError(400, `Missing required ${requireFieldError} field!`);

        case "array.min":
          throw HttpError(
            400,
            `Please add at least ${errorContext.limit} ${requireFieldError}`
          );

        case "string.min":
          throw HttpError(400, `${error.details[0].message}`);

        case "string.pattern.base":
          console.log(error);
          throw HttpError(400, `${error.details[0].message}`);

        case "any.only":
          throw HttpError(
            400,
            `${requireFieldError} must be one of the allowed values`
          );

        default:
          throw HttpError(400, `${error.message}`);
      }
    }

    next();
  };
  return func;
};

export default validateBody;
