import express from 'express';
import controllersGenre from '../../../controllers/controlsEditor/genreEditorCTRL.js';
import { authenticateAdmin } from '../../../middlewares/authenticate.js';
import { permisionsEditor } from '../../../middlewares/permitionsEditor.js';
import validateBody from '../../../middlewares/validateBody.js';
import upload from '../../../middlewares/upload.js';
import {
  createGenreSchema,
  updateGenreSchema,
} from '../../../schemas/genreSchema.js';

const router = express.Router();

router.get(
  '/genres/all',
  authenticateAdmin,
  permisionsEditor,
  controllersGenre.allGenres,
);

router.post(
  '/genres/create',
  authenticateAdmin,
  permisionsEditor,
  validateBody(createGenreSchema),
  controllersGenre.createGenre,
);

router.get(
  '/genres/:id',
  authenticateAdmin,
  permisionsEditor,
  controllersGenre.findGenreById,
);

router.patch(
  '/genres/update/:id',
  authenticateAdmin,
  permisionsEditor,

  upload.single('picsURL'),
  validateBody(updateGenreSchema),
  controllersGenre.updateGenreById,
);

router.delete(
  '/genres/delete/:id',
  authenticateAdmin,
  permisionsEditor,
  controllersGenre.deleteGenre,
);

export default router;
