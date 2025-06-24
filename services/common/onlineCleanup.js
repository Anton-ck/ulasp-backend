import { User } from '../../models/userModel.js';

const startOnlineCleanup = (intervalMs = 300000) => {
  setInterval(async () => {
    const threshold = new Date(Date.now() - 5 * 60 * 1000);
    try {
      await User.updateMany(
        { lastSeen: { $lt: threshold }, online: true },
        { $set: { online: false } },
      );
      console.log('[online-cleanup] Выполнена очистка');
    } catch (e) {
      console.error('[online-cleanup] Ошибка:', e);
    }
  }, intervalMs);
};

export default startOnlineCleanup;
