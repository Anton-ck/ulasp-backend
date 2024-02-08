import express from "express";

import validateBody from "../../middlewares/validateBody.js";
import isEmptyBody from "../../middlewares/isEmptyBody.js";
import { authenticateAdmin } from "../../middlewares/authenticate.js";
import controllers from "../../controllers/controlAdmin.js";
import controllersEmail from "../../controllers/controllEmail.js";
import { permisionsAdmin } from "../../middlewares/permitionsAdmin.js";
import {
  createEditorSchema,
  updateAdminInfo,
  updateAdminPassword,
} from "../../schemas/adminSchema.js";

import {
  createFopUserSchema,
  createCompanyUserSchema,
} from "../../schemas/userSchema.js";
import isValid from "../../middlewares/isValid.js";

const router = express.Router();

router.post(
  "/create-editor",
  authenticateAdmin,
  permisionsAdmin,
  isEmptyBody,
  validateBody(createEditorSchema),
  controllers.createEditorRole
);

router.get("/", authenticateAdmin, permisionsAdmin, controllers.getAllAdmin);

router.get(
  "/users",
  authenticateAdmin,
  permisionsAdmin,
  controllers.getAllUsers
);
router.get(
  "/tracks/count",
  authenticateAdmin,
  permisionsAdmin,
  controllers.countTracks
);
//подсчет пользователей
router.get(
  "/users/count",
  authenticateAdmin,
  permisionsAdmin,
  controllers.countClients
);
//подсчет прослушанных песен
router.post(
  "/users/countlistens",
  authenticateAdmin,
  permisionsAdmin,
  controllers.countListensByUser
);
//подсчет новых клиентов - которым не отправлено письмо status = false и не открыт доступ access = false
router.get(
  "/newclients/count",
  authenticateAdmin,
  permisionsAdmin,
  controllers.countNewClients
);
//подсчет  клиентов -online = true
router.get(
  "/onlineclients/count",
  authenticateAdmin,
  permisionsAdmin,
  controllers.countOnlineClients
);
//отправка письма с доступом -  переключение достпупа access =Оn status=true
router.post(
  "/users/:id/accessemail",
  authenticateAdmin,
  permisionsAdmin,
  controllersEmail.sendEmailByAccess
);
router.get(
  "/newclientsbymonth/count",
  authenticateAdmin,
  permisionsAdmin,
  controllers.countNewClientsByMonth
);

router.get(
  "/users/:id",
  authenticateAdmin,
  permisionsAdmin,
  controllers.getUserById
);
router.get(
  "/users/:id/trackcount",
  authenticateAdmin,
  permisionsAdmin,
  controllers.countTrackByUser
);
router.get(
  "/users/:id/playlistcount",
  authenticateAdmin,
  permisionsAdmin,
  controllers.countPlaylistByUser
);

router.get(
  "/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  controllers.getAdminById
);

router.patch(
  "/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  isEmptyBody,
  validateBody(updateAdminInfo),
  controllers.updateAdminInfo
);
router.patch(
  "/users/:id",
  authenticateAdmin,
  permisionsAdmin,
  // isValid,
  controllers.updateUserInfo
);
router.delete(
  "/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  controllers.deleteAdmin
);

router.patch(
  "/password/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  isEmptyBody,
  validateBody(updateAdminPassword),
  controllers.updateAdminPassword
);

router.post(
  "/create-fop",
  authenticateAdmin,
  isEmptyBody,
  validateBody(createFopUserSchema),
  controllers.createUser
);
router.post(
  "/create-company",
  authenticateAdmin,
  isEmptyBody,
  validateBody(createCompanyUserSchema),
  controllers.createUser
);

router.delete(
  "/users/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  controllers.deleteUser
);

router.patch(
  "/users/status/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  controllers.toggleUserStatus
);
router.patch(
  "/users/access/:id",
  authenticateAdmin,
  permisionsAdmin,
  isValid,
  controllers.toggleUserAccess
);

export default router;
