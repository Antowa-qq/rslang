import 'app/index';
import './speakit.scss';

import EventBus from 'app/js/utils/eventBus';
import api from 'app/js/api';
import settings from 'app/js/settings';

import loader from 'app/js/utils/loader';
import PageIntro from './components/page-intro/page-intro';
import PageMain from './components/page-main/page-main';

// 0. Create instance of Event Bus (some design pattern also called Observer)
const eventBus = new EventBus();

// 1. Check login
api.checkLogin().then(async (user) => {
  // Already logged in
  console.log(user);

  // Settings subscribers
  eventBus.subscribe('settings.getSettings', () => settings.getSettings());
  eventBus.subscribe('settings.initSettings', () => settings.initSettings());
  eventBus.subscribe('settings.update', (...data) => settings.update(...data));

  // 2. Get settings
  await eventBus.emit('settings.getSettings');
  // await eventBus.emit('settings.initSettings');

  // settings.minigames.speakit.isMute = true;
  // await eventBus.emit('settings.update', 'speakit', settings.minigames.speakit);

  console.log(JSON.stringify(settings));

  // const { minigames: { speakit } } = settings;

  // speakit.difficulty = 4;

  // await settings.update('speakit', speakit);
  // await settings.update('learningMode', 'mix');

  // 3. Start render of the page
  const pageIntro = new PageIntro({ eventBus });

  // Intro Page subscribers
  eventBus.subscribe('pageIntro.startGame', async (data) => {
    const { isDefaultMode } = data;
    const {
      minigames: {
        speakit: {
          isMute,
          round,
          difficulty,
        },
      },
    } = settings;
    const pageMain = new PageMain({
      eventBus,
      round: isDefaultMode ? round : -1, // -1 detects that we need to use another mode
      difficulty: isDefaultMode ? difficulty : -1, // -1 detects that we need to use another mode
      volume: isMute ? 0 : 1,
    });

    await pageMain.init();
  });
  eventBus.subscribe('pageMain.ready', () => { pageIntro.hide(); });

  // Be sure that background image is loaded
  await pageIntro.init();

  // Prevent fonts blinking
  await document.fonts.ready;

  // Page Intro is loaded
  pageIntro.show();
  loader.toggle();
}, () => {
  // Redirect to login
  window.location.href = '/';
});
