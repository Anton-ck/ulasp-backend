import express from 'express';
import controllersPlaylist from '../../../controllers/controlsEditor/playlistsEditorCTRL.js';
import { authenticateAdmin } from '../../../middlewares/authenticate.js';
import { permisionsEditor } from '../../../middlewares/permitionsEditor.js';
import validateBody from '../../../middlewares/validateBody.js';
import isValid from '../../../middlewares/isValid.js';
import upload from '../../../middlewares/upload.js';
import { playListSchema } from '../../../schemas/editorShema.js';

import isValidImageUrl from '../../../middlewares/isValidImage.js';

const router = express.Router();

router.post(
  '/playlist/create',
  authenticateAdmin,
  permisionsEditor,
  upload.single('picsURL'),
  validateBody(playListSchema),
  controllersPlaylist.createPlayList,
);

router.get('/playlist/latest', controllersPlaylist.latestPlaylists);

router.patch(
  '/playlist/replaceTracksToPlaylists',
  controllersPlaylist.replaceTracksToPlaylists,
);

router.get(
  '/playlist/without/track/:id',
  controllersPlaylist.getPlaylistsWithOutCurrentTrack,
);

router.get(
  '/playlist/:id',
  authenticateAdmin,
  permisionsEditor,
  isValid,

  controllersPlaylist.findPlayListById,
);

router.patch(
  '/playlist/updatePublication/:id',
  authenticateAdmin,
  permisionsEditor,
  isValid,
  controllersPlaylist.updatePlaylistPublication,
);

router.patch(
  '/playlist/update/:id',
  authenticateAdmin,
  permisionsEditor,
  upload.single('picsURL'),

  isValid,
  controllersPlaylist.updatePlaylistById,
);

router.patch(
  '/playlist/sortupdate/:id',
  authenticateAdmin,
  permisionsEditor,
  isValid,
  controllersPlaylist.updatePlaylistsSortedTracks,
);

router.delete(
  '/playlist/delete/:id',
  authenticateAdmin,
  permisionsEditor,
  isValid,
  controllersPlaylist.deletePlaylist,
);

router.post(
  '/genre/playlist/create/:id',
  authenticateAdmin,
  permisionsEditor,
  isValid,
  upload.single('picsURL'),
  validateBody(playListSchema),
  controllersPlaylist.createPlayListByGenre,
);

router.post(
  '/shoplibrary/playlist/create/:idShopLibrary',
  authenticateAdmin,
  permisionsEditor,
  upload.single('picsURL'),
  validateBody(playListSchema),
  controllersPlaylist.createPlayListInShopLibrary,
);

router.post('/trackupdate', controllersPlaylist.updateTracksPictureInPlaylist);

export default router;
