import bcrypt from 'bcrypt';
import { User, Fop, Company } from '../models/userModel.js';
import Track from '../models/trackModel.js';
import PlayList from '../models/playlistModel.js';
import Admin from '../models/adminModel.js';
import HttpError from '../helpers/HttpError.js';
import ctrlWrapper from '../helpers/ctrlWrapper.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { UserListenCount } from '../models/userListenCountModel.js';

const createEditorRole = async (req, res) => {
  const { login, password } = req.body;

  const editor = await Admin.findOne({ login });

  if (editor) {
    throw HttpError(409, 'login in use');
  }

  const hashPassword = await bcrypt.hash(password, 10);

  const newEditor = await Admin.create({
    ...req.body,
    password: hashPassword,
  });

  res.status(201).json({
    login: newEditor.login,
    editorRole: newEditor.editorRole,
    avararURL: newEditor.avatarURL,
    firstName: newEditor.firstName,
    lastName: newEditor.lastName,
    fatherName: newEditor.fatherName,
    taxCode: newEditor.taxCode,
    dayOfBirthday: newEditor.dayOfBirthday,
    telNumber: newEditor.telNumber,
    email: newEditor.email,
  });
};

const getAllAdmin = async (req, res) => {
  const result = await Admin.find(
    { ...req.query },
    '-createdAt -updatedAt -accessToken -refreshToken -password',
  );

  res.json({
    result,
  });
};

const getAdminById = async (req, res) => {
  const { id } = req.params;

  const admin = await Admin.findById(
    id,
    '-createdAt -updatedAt -accessToken -refreshToken -password',
  );

  if (!admin) {
    throw HttpError(404);
  }

  res.json(admin);
};

const updateAdminInfo = async (req, res) => {
  const { id } = req.params;
  const result = await Admin.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  if (!result) {
    throw HttpError(404, 'Not found');
  }
  res.json({
    id: result.id,
    login: result.login,
    firstName: result.firstName,
    lastName: result.lastName,
    fatherName: result.fatherName,
    avatarURL: result.avatarURL,
    adminRole: result.adminRole,
    editorRole: result.editorRole,
    taxCode: result.taxCode,
    dayOfBirthday: result.dayOfBirthday,
    telNumber: result.telNumber,
    email: result.email,
  });
};

const deleteAdmin = async (req, res) => {
  const { id } = req.params;

  const admin = await Admin.findById(id);
  if (!admin) {
    throw HttpError(404, 'Not found');
  }
  const result = await admin.deleteOne();

  const { _id, firstName, editorRole } = result;

  res.status(200).json({
    message: `${
      editorRole ? 'Editor' : 'Admin'
    } '${firstName}' with ID ${_id} was deleted`,
  });
};

const updateAdminPassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const hashPassword = await bcrypt.hash(password, 10);

  const result = await Admin.findByIdAndUpdate(id, {
    password: hashPassword,
  });

  const { _id, firstName, editorRole } = result;

  res.status(200).json({
    message: `Password for ${
      editorRole ? 'Editor' : 'Admin'
    } '${firstName}' with ID ${_id} has been changed`,
  });
};
const updateEditorLoginPassword = async (req, res) => {
  const { id } = req.params;

  const { login, password } = req.body;

  console.log('req.body :>> ', login, password);
  let updateFields = { login };
  if (password !== '') {
    const hashPassword = await bcrypt.hash(password, 10);
    updateFields.password = hashPassword;
  }

  const result = await Admin.findByIdAndUpdate(id, updateFields, { new: true });
  console.log('result :>> ', result);
  res.status(200).json({
    message: `Password for ${result.editorRole ? 'Editor' : 'Admin'} '${
      result.firstName
    }' with ID ${result._id} has been changed`,
  });
};

const createUser = async (req, res) => {
  const { contractNumber, taxCode, password, userFop } = req.body;
  const user = await User.findOne({ contractNumber });

  if (user) {
    throw HttpError(409, 'contractNumber in use');
  }
  const hashtaxCode = await bcrypt.hash(taxCode, 10);

  let newUser = {};
  console.log('newUser', newUser);
  if (userFop === 'fop') {
    newUser = await Fop.create({
      ...req.body,
      password: hashtaxCode,
    });
  } else {
    newUser = await Company.create({
      ...req.body,
      password: hashtaxCode,
    });
  }

  res.status(201).json({
    user: {
      id: newUser._id,
      contractNumber: newUser.contractNumber,
    },
  });
};

const getAllUsers = async (req, res) => {
  // const allUsers = await User.find({ ...req.body }).sort({ createdAt: -1 });

  const users = await User.find({ ...req.body })
    .sort({ createdAt: -1 })
    .populate({
      path: 'listenCount',
      select: 'totalListens -_id -userId',
    })
    .lean();

  const allUsers = users.map((user) => ({
    ...user,
    listenCount: user.listenCount?.totalListens || 0,
  }));

  res.json({
    allUsers,
  });
};

const getUserById = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(
    id,
    '-createdAt -updatedAt -accessToken -refreshToken -password',
  );

  if (!user) {
    throw HttpError(404);
  }

  res.json(user);
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    throw HttpError(404);
  }

  const result = await User.findByIdAndDelete(id);

  res.status(200).json({ message: 'User deleted ' });
  if (!result) {
    res.status(500).json({ message: 'An error occurred' });
  }
};

const toggleUserStatus = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.status = !user.status;
  await user.save();

  res.status(200).json({
    message: `Status for user '${user.firstName} ${user.lastName}' with ID ${user._id} has been toggled`,
    newStatus: user.status,
  });
};

const toggleUserAccess = async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.access = !user.access;
  await user.save();

  res.status(200).json({
    message: `Access for user '${user.firstName} ${user.lastName}' with ID ${user._id} has been toggled`,
    newAccess: user.access,
  });
};

const updateUserInfo = async (req, res) => {
  const { id } = req.params;
  console.log('id', id);
  console.log('req.body', req.body);
  let userDataOld = {};
  if (req.body.userFop === 'fop') {
    userDataOld = await Fop.findById(id);
  } else {
    userDataOld = await Company.findById(id);
  }

  let result = {};
  if (req.body.userFop === 'fop') {
    result = await Fop.findByIdAndUpdate(id, req.body, {
      new: true,
    });
  } else {
    result = await Company.findByIdAndUpdate(id, req.body, {
      new: true,
    });
  }

  if (userDataOld.taxCode !== result.taxCode) {
    result.password = await bcrypt.hash(result.taxCode, 10);
    await result.save();
  }

  if (!result) {
    throw HttpError(404, 'Not found');
  }
  res.json({
    result,

    // id: result.id,
    // login: result.login,
    // firstName: result.firstName,
    // lastName: result.lastName,
    // fatherName: result.fatherName,
    // avatarURL: result.avatarURL,

    // taxCode: result.taxCode,
    // dayOfBirthday: result.dayOfBirthday,
    // telNumber: result.telNumber,
    // email: result.email,
  });
};

// const deleteAdmin = async (req, res) => {
//   const { id } = req.params;

//   const result = Admin.findByIdAndDelete(id);
//   console.log(result);
//   if (!result) {
//     throw HttpError(404, "Not found!!!!");
//   }

//   res.status(200).json({
//     message: "Contact deleted",
//   });
// };

//счетчик песен
const countTracks = async (req, res) => {
  const countTracks = await Track.find().count();

  res.json({ countTracks });
};

//счетчик новых клиентов

const countNewClients = async (req, res) => {
  const countNewClients = await User.countDocuments({
    access: false,
    status: false,
  });

  res.json({ countNewClients: countNewClients });
};
//счетчик всех клиентов
const countClients = async (req, res) => {
  const countClients = await User.countDocuments();

  res.json({ countClients: countClients });
};

//счетчик онлайн пользователей
const countOnlineClients = async (req, res) => {
  const countOnlineClients = await User.countDocuments({ online: true });

  res.json({ countOnlineClients: countOnlineClients });
};

const countNewClientsByMonth = async (req, res) => {
  const currentDate = new Date();

  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  );

  const countNewClientsByMonth = await User.countDocuments({
    createdAt: {
      $gte: startOfMonth,
      $lt: endOfMonth,
    },
  });

  res.json({ countNewClientsByMonth: countNewClientsByMonth });
};
//отчет по прослушанным песням пользователя
const countListensByUser = async (req, res) => {
  const { userId } = req.body;

  const dateOfStart = new Date(req.body.dateOfStart);
  const dateOfEnd = new Date(req.body.dateOfEnd);
  // console.log("dateOfStart :>> ", dateOfStart.toDateString());
  // console.log("dateOfStart :>> ", dateOfEnd);
  // console.log("dateOfEnd :>> ", dateOfEnd.getTime() + 86400000);
  // console.log("dateOfEnd :>> ", dateOfEnd.getTime());
  const userListenCount = await UserListenCount.findOne({ userId });

  if (userListenCount) {
    const filteredTracks = userListenCount.tracks.map((track) => {
      const filteredListens = track.listens.filter((listen) => {
        const listenDate = new Date(listen.date);
        console.log(' listenDate :>> ', listenDate);
        if (dateOfEnd.getTime() === dateOfStart.getTime()) {
          return listen.date.toDateString() === dateOfStart.toDateString();
        }

        return (
          listenDate.getTime() >= dateOfStart.getTime() &&
          listenDate.getTime() <= dateOfEnd.getTime() + 86400000
        );
      });

      return {
        trackId: track.trackId,
        trackName: track.trackName,
        artist: track.artist,
        listens: filteredListens,
      };
    });

    const filterTracksByDate = filteredTracks.filter(
      (track) => track.listens.length > 0,
    );

    res.json(filterTracksByDate);
  } else {
    res.json([]);
  }
};

const allUsersByListenCount = async (req, res) => {
  const userResult = await User.find({ ...req.query });
  const userListenCount = await UserListenCount.findOne({
    userId: '660fa1fdc4abe84dc4771f5b',
  });

  const u = await UserListenCount.find();

  // const result = await UserListenCount.aggregate([
  //   { $unwind: '$tracks' },
  //   { $unwind: '$tracks.listens' },
  //   {
  //     $group: {
  //       _id: '$userId',
  //       totalListens: { $sum: '$tracks.listens.countOfListenes' },
  //     },
  //   },
  // ]);

  const result = await User.aggregate([
    {
      $lookup: {
        from: 'userlistencounts', // имя коллекции в MongoDB
        localField: '_id',
        foreignField: 'userId',
        as: 'listensData',
      },
    },
    { $unwind: { path: '$listensData', preserveNullAndEmptyArrays: true } },
    {
      $unwind: {
        path: '$listensData.tracks',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: '$listensData.tracks.listens',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        contractNumberDoc: { $first: '$contractNumberDoc' },
        email: { $first: '$email' },
        institution: { $first: '$institution' },
        totalListens: {
          $sum: {
            $ifNull: ['$listensData.tracks.listens.countOfListenes', 0],
          },
        },
      },
    },
    { $sort: { totalListens: -1 } }, // сортировка по убыванию
  ]);

  // const r = userListenCount.map(
  //   (t) => t.listens.reduce((acc, current) => acc + current),
  //   0,
  // );

  // console.log(
  //   '===>>>>',
  //   userListenCount.tracks.map((track) => track.listens).flatMap((e) => e),
  // );

  res.json({
    result,
  });
};

// .reduce((acc, current) => acc + current.countOfListenes, 0),

//счетчик песен добавленных юзером
const countTrackByUser = async (req, res) => {
  const { id } = req.params;
  const objectId = new mongoose.Types.ObjectId(id);

  const addTrackCount = await Track.find(
    { addTrackByUsers: objectId },
    '-addByUsers -createdAt -updatedAt',
  );

  const countAddTrack = addTrackCount.length;
  if (countAddTrack > 0) {
    res.json({ count: countAddTrack }); // Отправляем ответ с количеством треков
  } else {
    res.json({ count: 0 }); // Если пользователя не найдено, отправляем ноль
  }
};

const countPlaylistByUser = async (req, res) => {
  const { id } = req.params;
  // console.log("id", id);
  const objectId = new mongoose.Types.ObjectId(id);
  // console.log("objectId", objectId);
  const add = await PlayList.find(
    { addByUsers: objectId },
    '-addByUsers -createdAt -updatedAt',
  );

  const countAdd = add.length;

  res.json(countAdd);
};

const toggleEditorStatus = async (req, res) => {
  const { id } = req.params;

  const user = await Admin.findById(id);

  if (!user) {
    return res.status(404).json({ error: 'Not found' });
  }

  user.status = !user.status;
  await user.save();

  res.status(200).json({
    message: `Status for user '${user.firstName} ${user.lastName}' with ID ${user._id} has been toggled`,
    newStatus: user.status,
  });
};

const toggleEditorAccess = async (req, res) => {
  const { id } = req.params;

  const user = await Admin.findById(id);

  if (!user) {
    return res.status(404).json({ error: 'Not found' });
  }
  console.log(' user.access :>> ', user.access);
  user.access = !user.access;
  await user.save();

  res.status(200).json({
    message: `Access for user '${user.firstName} ${user.lastName}' with ID ${user._id} has been toggled`,
    newAccess: user.access,
  });
};

const recalculateTotalListens = async (req, res) => {
  const results = await UserListenCount.aggregate([
    {
      $project: {
        userId: 1,
        totalListens: {
          $sum: {
            $map: {
              input: '$tracks',
              as: 'track',
              in: {
                $sum: '$$track.listens.countOfListenes',
              },
            },
          },
        },
      },
    },
  ]);

  const bulkOps = results.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: { totalListens: doc.totalListens } },
    },
  }));

  if (bulkOps.length > 0) {
    await UserListenCount.bulkWrite(bulkOps);

    res.json({ message: `✅ Updated ${bulkOps.length} documents` });
  } else {
    res.json({ message: '⚠️ Nothing to update' });
  }
};

export default {
  createEditorRole: ctrlWrapper(createEditorRole),
  getAllAdmin: ctrlWrapper(getAllAdmin),
  getAdminById: ctrlWrapper(getAdminById),
  updateAdminInfo: ctrlWrapper(updateAdminInfo),
  deleteAdmin: ctrlWrapper(deleteAdmin),
  updateAdminPassword: ctrlWrapper(updateAdminPassword),
  updateEditorLoginPassword: ctrlWrapper(updateEditorLoginPassword),
  createUser: ctrlWrapper(createUser),
  getAllUsers: ctrlWrapper(getAllUsers),
  getUserById: ctrlWrapper(getUserById),
  deleteUser: ctrlWrapper(deleteUser),
  toggleUserStatus: ctrlWrapper(toggleUserStatus),
  toggleUserAccess: ctrlWrapper(toggleUserAccess),
  toggleEditorStatus: ctrlWrapper(toggleEditorStatus),
  toggleEditorAccess: ctrlWrapper(toggleEditorAccess),
  updateUserInfo: ctrlWrapper(updateUserInfo),
  countNewClients: ctrlWrapper(countNewClients),
  countOnlineClients: ctrlWrapper(countOnlineClients),
  countNewClientsByMonth: ctrlWrapper(countNewClientsByMonth),
  countClients: ctrlWrapper(countClients),
  countTracks: ctrlWrapper(countTracks),
  countListensByUser: ctrlWrapper(countListensByUser),
  countTrackByUser: ctrlWrapper(countTrackByUser),
  countPlaylistByUser: ctrlWrapper(countPlaylistByUser),
  allUsersByListenCount: ctrlWrapper(allUsersByListenCount),
  recalculateTotalListens: ctrlWrapper(recalculateTotalListens),
};
