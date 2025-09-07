import path from 'path';
import fs from 'fs/promises';
import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

import Track from '../models/trackModel.js';

import ctrlWrapper from '../helpers/ctrlWrapper.js';

import updTracksPicture from '../services/editor/updateTrackPictureService.js';
import PlayList from '../models/playlistModel.js';

dotenv.config();

const { GPT_KEY, GEMINI_KEY, API_GROQ } = process.env;

const prompt = (track) => {
  const prompt = `
Ты музыкальный эксперт. 
Входные данные: 
Исполнитель: ${track.artist} 
Название: ${track.trackName} 


Ответ строго в JSON без пояснений и без оборачивания в блоки json
{
artist: ${track.artist},
title: ${track.trackName}, 
  "language": "en, ua, fr, de",
  "genre": "жанр",
  "mood": "positive, negative, neutral",
 "tempo": "slow | medium | fast",
  "tags": ["список тегов"]
}`;

  return prompt;
};

const groqPrompt = (track) => {
  const messages = [
    {
      role: 'system',
      content:
        'You are a music metadata assistant. Always respond in English. Respond ONLY with a function call',
    },
    {
      role: 'user',
      content: `Определи характеристики трека "${track.artist} - ${track.trackName}.`,
    },
  ];
  const data = `
  Ты музыкальный эксперт. 
Тебе дан трек: "${track.artist}  - ${track.trackName}".
Проанализируй его и верни результат в формате JSON без пояснений (без тега think)

Структура ответа:
{
  "language": "язык песни (например: English, Ukrainian, Instrumental)",
  "genre": "основной музыкальный жанр",
  "mood": "основное настроение (одно или несколько слов) (например: "positive, negative, neutral")",
  "tempo": "slow | medium | fast",
  "tags": ["ключевые теги (5–15 штук)"]
}

Требования:
- Никакого текста вне JSON.
- Если язык определить невозможно — укажи "Instrumental".
- Если информации недостаточно, сделай предположение на основе названия и исполнителя.
- без лишних пояснений
  `;

  const genresEnum = [
    'Pop',
    'Rock',
    'Hip Hop',
    'Rap',
    'Trap',
    'RnB',
    'Soul',
    'Funk',
    'Disco',
    'Jazz',
    'Blues',
    'Classical',
    'Opera',
    'Choral',
    'Instrumental',
    'Electronic',
    'Dance',
    'House',
    'Deep House',
    'Progressive House',
    'Techno',
    'Minimal Techno',
    'Trance',
    'Psytrance',
    'Dubstep',
    'Drum and Bass',
    'Breakbeat',
    'Hardstyle',
    'Industrial',
    'Ambient',
    'Downtempo',
    'Chillout',
    'Lounge',
    'Reggae',
    'Ska',
    'Dancehall',
    'Afrobeat',
    'Latin',
    'Reggaeton',
    'Salsa',
    'Merengue',
    'Bachata',
    'Tango',
    'Flamenco',
    'Bolero',
    'Cumbia',
    'K-Pop',
    'J-Pop',
    'C-Pop',
    'Mandopop',
    'Cantopop',
    'World',
    'Folk',
    'Country',
    'Bluegrass',
    'Celtic',
    'Americana',
    'Singer-Songwriter',
    'Gospel',
    'Christian',
    'Metal',
    'Heavy Metal',
    'Death Metal',
    'Black Metal',
    'Thrash Metal',
    'Power Metal',
    'Symphonic Metal',
    'Nu Metal',
    'Grunge',
    'Punk',
    'Pop Punk',
    'Hardcore Punk',
    'Post-Punk',
    'Indie Rock',
    'Indie Pop',
    'Alternative Rock',
    'Alternative',
    'Shoegaze',
    'Lo-fi',
    'Experimental',
    'Avant-Garde',
    'Soundtrack',
    'Film Score',
    'Game Music',
    'Chiptune',
    'Synthwave',
    'Vaporwave',
    'Electro',
    'Future Bass',
    'Moombahton',
    'Tropical House',
    'EDM',
    'Eurodance',
    'Hardcore',
    'Happy Hardcore',
    'Gabber',
    'Jungle',
    'IDM',
    'Post-Rock',
    'Math Rock',
    'Progressive Rock',
    'Psychedelic Rock',
    'Stoner Rock',
    'Garage Rock',
    'Surf Rock',
    'Krautrock',
    'New Wave',
    'Synthpop',
    'Electropop',
    'Dream Pop',
    'Neo Soul',
    'Funk Rock',
    'Trip Hop',
    'Bossa Nova',
    'Samba',
    'Zouk',
    'Afro House',
    'Amapiano',
    'Gqom',
  ];

  const moodsEnum = [
    'Happy',
    'Sad',
    'Romantic',
    'Calm',
    'Energetic',
    'Dark',
    'Dreamy',
    'Uplifting',
    'Aggressive',
    'Peaceful',
    'Playful',
    'Epic',
    'Chill',
    'Groovy',
    'Spiritual',
    'Nostalgic',
    'Hopeful',
    'Angry',
    'Weird',
  ];

  const tools = [
    {
      type: 'function',
      function: {
        name: 'set_track_metadata',
        description: 'Return structured metadata for a track',
        parameters: {
          type: 'object',
          properties: {
            language: {
              type: 'string',
              description: 'e.g. english, ukrainian, instrumental',
            },
            genre: {
              type: 'string',
              enum: genresEnum,
            },
            mood: {
              type: 'string',
              enum: moodsEnum,
            },
            tempo: { type: 'string', enum: ['slow', 'medium', 'fast'] },
            tags: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
              maxItems: 15,
            },
          },
          required: ['language', 'genre', 'mood', 'tempo', 'tags'],
          additionalProperties: false,
        },
      },
    },
  ];

  return [tools, messages];
};

const deleteAllPicture = async (req, res) => {
  const { idPlaylist } = req.body;

  const checkFile = async (file) => {
    try {
      await fs.access(file);
      console.log("It's OK");
      return true;
    } catch (error) {
      console.log(`file doesn't exist`);
      return false;
    }
  };

  const deletePicture = async (file) => {
    try {
      const isFileExist = await checkFile(file);

      console.log('isFileExist', isFileExist);

      if (isFileExist) await fs.unlink(file);
    } catch (error) {
      console.log('delete picture ERROR');
    }
  };

  const playlist = await PlayList.findById({ _id: idPlaylist }, 'trackList');

  const tracks = await Track.find({ _id: { $in: playlist.trackList } });

  // const trackCovers = path.resolve('public', 'trackCovers');
  const trackCovers = path.resolve('public');
  const tmpFolder = path.resolve('tmp');
  const resizeFolder = path.resolve(tmpFolder, 'resize');

  const trackCoversFiles = await fs.readdir(trackCovers, {
    withFileTypes: true,
  });
  const tmpFiles = await fs.readdir(tmpFolder, { withFileTypes: true });
  const resizeFiles = await fs.readdir(resizeFolder, { withFileTypes: true });

  for await (const track of tracks) {
    const { _id, trackPictureURL } = track;
    console.log('Прошли по записи', _id);

    const fullPictureURL = path.join(trackCovers, trackPictureURL);

    if (trackPictureURL === 'trackCovers/55x36_trackCover_default.jpg') {
      return;
    }
    console.log('Просим удалить файл');
    await deletePicture(fullPictureURL);
  }

  // trackCoversFiles.forEach(async (file) => {
  //   if (
  //     file.name === '55x36_trackCover_default.jpg' ||
  //     file.name === '.gitkeep'
  //   ) {
  //     return;
  //   }
  //   if (file.isFile()) {
  //     await fs.unlink(path.join(trackCovers.toString(), file.name));
  //   }
  // });

  tmpFiles.forEach(async (file) => {
    if (file.isFile()) {
      await fs.unlink(path.join(tmpFolder.toString(), file.name));
    }
  });

  resizeFiles.forEach(async (file) => {
    if (file.name === '.gitkeep') {
      return;
    }

    if (file.isFile()) {
      await fs.unlink(path.join(resizeFolder.toString(), file.name));
    }
  });

  // await Track.updateMany({
  //   trackPictureURL: 'trackCovers/55x36_trackCover_default.jpg',
  // });

  await Track.updateMany(
    { _id: { $in: playlist.trackList } },
    { $set: { trackPictureURL: 'trackCovers/55x36_trackCover_default.jpg' } },
  );

  res.json({ m: 'ok' });
};

const aiHelper = async (track) => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        systemInstruction: 'You are a proffesional musical editor.',
      },
    });

    // const text = result.response.text();

    // Берем первую строку из массива
    let text = result.candidates[0].content.parts[0].text;

    // Убираем ```json и ```
    text = text
      .replace(/```json\n?/g, '')
      .replace(/```/g, '')
      .trim();

    // Теперь это чистый JSON
    const parsed = JSON.parse(text);

    return parsed;

    // return JSON.parse(result.candidates[0].content.parts[0].text);

    // console.log('RESULT', result.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('Ошибка обработки трека:', track, error);
    return JSON.parse(error.message);
  }
};
const groqAiHelper = async (track) => {
  const groqAi = new Groq({ apiKey: API_GROQ });

  const [tools, messages] = groqPrompt(track);

  try {
    const response = await groqAi.chat.completions.create({
      model: 'deepseek-r1-distill-llama-70b',
      messages,
      tools,
      tool_choice: 'required', // заставляем звать функцию
      temperature: 0,
    });
    const call = response.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) throw new Error('Модель не вернула tool_call');

    const args = JSON.parse(call.function.arguments);
    return args; // тут уже чистый JSON-объект
  } catch (err) {
    console.error('Ошибка:', err);
  }
};

const enrichDatabase = async (req, res) => {
  // const openai = new OpenAI({ apiKey: GPT_KEY });

  const tracks = await Track.find({ _id: '68ab50baf1cc84f9fab8a787' });

  const result = await Promise.all(
    tracks.map(async (track) => {
      // const enriched = await aiHelper(track);
      const enriched = await groqAiHelper(track);
      return enriched;
    }),
  );
  console.log(result);
  res.json(result);
};
// обновление картинок треков в БД
const updateTracksPictureInPlaylist = async (req, res) => {
  const { id } = req.body;

  const result = await updTracksPicture(id);

  res.json({ m: result });
};

export default {
  updateTracksPictureInPlaylist: ctrlWrapper(updateTracksPictureInPlaylist),
  deleteAllPicture: ctrlWrapper(deleteAllPicture),
  enrichDatabase: ctrlWrapper(enrichDatabase),
};
