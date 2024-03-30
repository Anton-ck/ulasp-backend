import express from "express";
import controllersShops from "../../../controllers/controlsEditor/shopsEditorCTRL.js";
import { authenticateAdmin } from "../../../middlewares/authenticate.js";
import { permisionsEditor } from "../../../middlewares/permitionsEditor.js";

const router = express.Router();

router.delete(
  "/shop/:idShop/delete/:idPlaylist",
  authenticateAdmin,
  permisionsEditor,
  controllersShops.deletePlaylistInShop
);

export default router;
