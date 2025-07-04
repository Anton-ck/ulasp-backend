import express from 'express';

import {
  loginUserSchema,
  createFopUserSchema,
  createCompanyUserSchema,
} from '../../schemas/userSchema.js';

import validateBody from '../../middlewares/validateBody.js';
import isEmptyBody from '../../middlewares/isEmptyBody.js';

import upload from '../../middlewares/upload.js';
import { authenticatUser } from '../../middlewares/authenticate.js';
import controllers from '../../controllers/authUser.js';
import controllersUser from '../../controllers/controlUser.js';

const router = express.Router();

router.post(
  '/signin',
  isEmptyBody,
  validateBody(loginUserSchema),
  controllers.userSignIn,
);

// router.post(
//   "/createfop",
//   validateBody(createFopUserSchema),
//   controllers.createUser
// );
// router.post(
//   "/createcompany",
//   validateBody(createCompanyUserSchema),
//   controllers.createUser
// );

router.post('/refresh', controllers.getRefreshToken);

router.get('/current', authenticatUser, controllers.getCurrentUser);

router.post('/logout', authenticatUser, controllers.logoutUser);

router.post(
  '/playlist/create',
  authenticatUser,
  controllersUser.createPlayList,
);
router.patch(
  '/avatars',
  authenticatUser,
  upload.single('avatarURL'),
  controllers.updateUserAvatar,
);

export default router;
