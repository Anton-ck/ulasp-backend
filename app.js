import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';

import authRouter from './routes/api/authAdmin.js';
import controlAdminRouter from './routes/api/controlAdmin.js';

import controlEditorRouter from './routes/api/controlEditor.js';
import genreEditorAPI from './routes/api/controlEditor/genreAPI.js';
import playlistEditorAPI from './routes/api/controlEditor/playlistAPI.js';
import shopsEditorAPI from './routes/api/controlEditor/shopAPI.js';
import trackEditorAPI from './routes/api/controlEditor/trackAPI.js';

import authUserRouter from './routes/api/authUser.js';
import controlUserRouter from './routes/api/controlUser.js';

import startOnlineCleanup from './services/common/onlineCleanup.js';
import sysRouter from './routes/api/systemRoute.js';

dotenv.config();

const app = express();

const formatsLogger = app.get('env') === 'development' ? 'dev' : 'short';

startOnlineCleanup();

app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(compression());

app.use('/sys', sysRouter);

app.use('/admin', authRouter);
app.use('/admin', controlAdminRouter);

app.use('/editor', controlEditorRouter);
app.use('/editor', genreEditorAPI);
app.use('/editor', playlistEditorAPI);
app.use('/editor', shopsEditorAPI);
app.use('/editor', trackEditorAPI);

app.use('/user', authUserRouter);
app.use('/user', controlUserRouter);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  const { status = 500, message = 'Server error' } = err;

  res.status(status).json({ message });
});

export default app;
