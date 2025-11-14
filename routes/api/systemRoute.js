import expess from 'express';

import sysControllers from '../../controllers/controlsSystem.js';

const router = expess.Router();

router.post('/trackupdate', sysControllers.updateTracksPictureInPlaylist);

router.post('/img_delete', sysControllers.deleteAllPicture);

router.get('/ai', sysControllers.enrichDatabase);

router.post('/delete_track_covers', sysControllers.deleteUnusedTracksCovers);

router.post('/img_delete_playlist', sysControllers.deletePictureInPlaylist);

export default router;
