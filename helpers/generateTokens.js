import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const { ACCESS_SECRET_KEY, REFRESH_SECRET_KEY } = process.env;

const expiresInAccessToken = '1d';
const expiresInRefreshToken = '7d';

export const generateToken = (userId, expiresIn = expiresInAccessToken) => {
  const token = jwt;
  return token.sign(userId, ACCESS_SECRET_KEY, {
    expiresIn,
  });
};

export const generateRefreshToken = (
  userId,
  expiresIn = expiresInRefreshToken,
) => {
  const token = jwt;

  return token.sign(userId, REFRESH_SECRET_KEY, {
    expiresIn,
  });
};
