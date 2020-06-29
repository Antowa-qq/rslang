import ProgressBar from 'progressbar.js';
import Words from 'app/js/words';
import Settings from 'app/js/settings';
import Statistics from 'app/js/statistics';
import Api from '../../js/api';
import StartPage from './components/start-page/start-page';

const INCREASE_SCORE_EVERY = 4;
const AUDIO_RIGHT = 'assets/audio/sprint/right.mp3';
const AUDIO_WRONG = 'assets/audio/sprint/wrong.mp3';
const MUTE = 'mute';
const PROGRESS_CLASS = 'icon-progress_';
const MAX_SCORE = 'max-score';
const SPRINT = 'sprint';

export default class Sprint {
  constructor(selector) {
    this.container = document.querySelector(selector);
    this.init();
  }

  async init() {
    this.api = new Api();
    this.loaderSprint = document.querySelector('.loader-sprint');
    this.loaderSprint.classList.remove('hidden');
    this.api.checkLogin()
      .then(async () => {
        this.settings = new Settings();
        await this.settings.getSettings();
        this.loaderSprint.classList.add('hidden');
        this.wordsService = new Words({
          settings: this.settings,
          gameNameInSettings: SPRINT,
        });
        this.countCorrectAnswer = 0;
        this.totalScore = 0;
        this.mute = localStorage.getItem(MUTE) || false;
        this.maxScore = localStorage.getItem(MAX_SCORE) || 0;
        this.wordsArrayFull = await this.getWordsList();
        this.createStartPage();
        this.statisticsService = new Statistics();
        this.arrayCorrectAnswer = [];
        this.arrayIncorrectAnswer = [];
      }, () => {
        // document.location.href = '/';
        console.log('Логин');
        this.api.loginUser({
          email: 'ta.nusha@mail.ru',
          password: '123Leo*!',
        });
      });
  }

  createStartPage() {
    this.startPage = new StartPage({
      selector: '#minigame-sprint',
      name: 'Спринт',
      description: 'Языковой Cпринт потребует от тебя организованности и регулярности.<br>'
        + ' Помни, что с каждым пройденным уроком ты становишься ближе к своей цели. '
        + 'Брось себе вызов, и потом ты сможешь заслуженно гордиться результатами проделанной работы.',
      onGameStart: this.createElement.bind(this),
      settings: this.settings,
      gameNameInSettings: SPRINT,
    });
    this.wordsService.resetToSettings();
  }

  createElement() {
    this.container.classList.add('sprint');
    this.container.innerHTML = `
    <div class="close-game"></div>
    <div class="score">0</div>
    <div id="timer" class="timer"></div>
    <div class="card">
      <div class="answer-correct">
        <ul class="answer-correct__list">
          <li class="answer-correct__list-item"></li>
          <li class="answer-correct__list-item"></li>
          <li class="answer-correct__list-item"></li>
        </ul>
      </div>
      <div class="bonus fadeInDown hidden">
        <ul class="answer-correct__list">
          <li class="answer-correct__list-item active"></li>
        </ul>
        <div class="current-bonus">
            +<span class="current-score-plus"></span> очков
        </div>
      </div>
      <div class="progress-images"></div>
      <div class="word"></div>
      <div class="word-translate"></div>
      <div class="answer-incorrect invisible">&#10006;</div>
      <div class="control-buttons">
        <button type="button" class="button button-wrong">Неверно</button>
        <button type="button" class="button button-right">Верно</button>
        <div class="image-sound"></div>
      </div>
    </div>
    <div class="addition">
      <div class="control-arrow">
        <button type="button" class="button-arrow left">&larr;</button>
        <button type="button" class="button-arrow right">&rarr;</button>
      </div>
    </div>
    `;
    const bar = new ProgressBar.Circle('#timer', {
      color: '#aaa',
      // This has to be the same size as the maximum width to
      // prevent clipping
      strokeWidth: 4,
      trailWidth: 1,
      duration: 60000,
      text: {
        autoStyleContainer: false,
      },
      from: { color: '#aaa', width: 1 },
      to: { color: '#179298', width: 4 },
      // Set default step function for all animate calls
      step(state, circle) {
        circle.path.setAttribute('stroke', state.color);
        circle.path.setAttribute('stroke-width', state.width);

        const value = Math.round(circle.value() * 60);
        if (value === 0) {
          circle.setText('');
        } else {
          circle.setText(value);
        }
      },
    });
    bar.animate(1.0, {}, this.finishGame.bind(this)); // Number from 0.0 to 1.0
    this.progressImages = this.container.querySelector('.progress-images');
    this.wordElement = this.container.querySelector('.word');
    this.wordTranslateElement = this.container.querySelector('.word-translate');
    this.countScore = this.container.querySelector('.score');
    this.buttonRight = this.container.querySelector('.button-right');
    this.buttonWrong = this.container.querySelector('.button-wrong');
    this.buttonRight.addEventListener('click', this.onAnswerClick.bind(this));
    this.buttonWrong.addEventListener('click', this.onAnswerClick.bind(this));
    this.blockBonus = this.container.querySelector('.bonus');
    this.blockCurrentScorePlus = this.container.querySelector('.current-score-plus');
    this.answerIncorrect = this.container.querySelector('.answer-incorrect');
    this.answerCorrectList = this.container.querySelectorAll('.answer-correct .answer-correct__list-item');
    document.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        this.buttonWrong.click();
      }
      if (event.key === 'ArrowRight') {
        this.buttonRight.click();
      }
    });
    this.sound = this.container.querySelector('.image-sound');
    this.sound.addEventListener('click', () => {
      this.mute = !this.mute;
      localStorage.setItem(MUTE, this.mute);
      if (this.mute) {
        this.sound.classList.add('active');
      } else {
        this.sound.classList.remove('active');
      }
    });
    if (this.mute) {
      this.sound.classList.add('active');
    }
    this.buttonClose = this.container.querySelector('.close-game');
    this.dropGame = document.querySelector('.drop-game');
    this.dropGameWindowExit = document.querySelector('.drop-game-window__exit');
    this.dropGameWindowCansel = document.querySelector('.drop-game-window__cancel');
    let progressBarTime;
    this.buttonClose.addEventListener('click', () => {
      this.dropGame.classList.remove('hidden');
      bar.stop();
      progressBarTime = bar.value();
    });
    this.dropGameWindowExit.addEventListener('click', () => {
      document.location.href = '/';
      this.wordsService.resetToSettings();
    });
    this.dropGameWindowCansel.addEventListener('click', () => {
      this.dropGame.classList.add('hidden');
      bar.animate(1 - progressBarTime, {}, this.finishGame.bind(this));
    });
    this.updateCard();
  }

  getCurrentScorePlus() {
    return 10 * (2 ** Math.floor((this.countCorrectAnswer) / INCREASE_SCORE_EVERY));
  }

  async getWordsList() {
    const words = await this.wordsService.getWords(true);
    return Sprint.getGameWords(words);
  }

  static getGameWords(wordsArray) {
    return wordsArray.map((element, index) => {
      const correct = 0.5 - Math.random() > 0;
      if (correct) {
        return {
          wordId: element.id,
          word: element.word,
          wordTranslate: element.wordTranslate,
          correct: true,
          wordData: element,
        };
      }
      let elementIncorrect = wordsArray[index + 2];
      if (elementIncorrect === undefined) {
        [elementIncorrect] = wordsArray;
      }
      return {
        wordId: element.id,
        word: element.word,
        wordTranslate: elementIncorrect.wordTranslate,
        correct: false,
        wordData: element,
      };
    });
  }

  async updateCard() {
    this.word = this.wordsArrayFull.shift();
    if (this.wordsArrayFull.length === 0) {
      this.wordsArrayFull = await this.getWordsList();
    }
    this.wordElement.innerHTML = this.word.word;
    this.wordTranslateElement.innerHTML = this.word.wordTranslate;
  }

  onAnswerClick(event) {
    const isCorrectButton = event.target.classList.contains('button-right');
    const isCorrectAnswer = isCorrectButton === this.word.correct;
    if (isCorrectButton) {
      this.buttonRight.classList.add('tada');
      setTimeout(() => {
        this.buttonRight.classList.remove('tada');
      }, 1000);
    } else {
      this.buttonWrong.classList.add('tada');
      setTimeout(() => {
        this.buttonWrong.classList.remove('tada');
      }, 1000);
    }
    if (isCorrectAnswer) {
      this.totalScore += this.getCurrentScorePlus();
      this.countScore.innerHTML = this.totalScore;
      this.countCorrectAnswer += 1;
      const correctAnswers = this.countCorrectAnswer % INCREASE_SCORE_EVERY;
      this.playSound(AUDIO_RIGHT);
      this.wordsService.updateRepetition(this.word.wordId, this.word.wordData.group.toString());
      this.arrayCorrectAnswer.push(this.word.wordData);
      if (correctAnswers === 0) {
        this.switchImages(Math.floor(this.countCorrectAnswer / INCREASE_SCORE_EVERY) + 1);
        this.blockCurrentScorePlus.innerHTML = this.getCurrentScorePlus();
        this.blockBonus.classList.remove('hidden');
        this.answerCorrectList.forEach((element) => {
          element.classList.remove('active');
        });
        setTimeout(() => {
          this.blockBonus.classList.add('hidden');
        }, 1000);
      } else {
        this.answerCorrectList[correctAnswers - 1].classList.add('active');
      }
    } else {
      this.countCorrectAnswer = 0;
      this.switchImages(1);
      this.playSound(AUDIO_WRONG);
      this.answerIncorrect.classList.remove('invisible');
      this.answerIncorrect.classList.add('tada');
      setTimeout(() => {
        this.answerIncorrect.classList.add('invisible');
        this.answerIncorrect.classList.remove('tada');
      }, 1000);
      this.answerCorrectList.forEach((element) => {
        element.classList.remove('active');
      });
      this.arrayIncorrectAnswer.push(this.word.wordData);
    }
    this.updateCard();
  }

  playSound(src) {
    if (this.mute) {
      return;
    }
    const audio = new Audio(src);
    audio.play();
  }

  switchImages(level) {
    let l = level;
    if (l > 5) {
      l = 5;
    }
    for (let i = 1; i <= 5; i += 1) {
      this.progressImages.classList.remove(PROGRESS_CLASS + i);
    }
    this.progressImages.classList.add(PROGRESS_CLASS + l);
  }

  finishGame() {
    this.container.innerHTML = `
    <div class="card finish">
      <span class="finish-header">Поздравляем!!!</span> 
      <div class="image-smile"></div>
      <div class="total-score_row">Вы набрали - <span class="score-end-of-game">0</span> баллов</div>
      <div class="max-score_row">Ваш рекорд - <span class="max-score"></span> баллов</div>
      <div class="word-list-of-game">
        <div class="word-list-of-game__words">
            <div class="bold">Правильные ответы</div>
            <ul class="word-list-of-game__words-correct"></ul>
        </div>
        <div class="word-list-of-game__words">
            <div class="bold">Неправильные ответы</div>
            <ul class="word-list-of-game__words-incorrect"></ul>
        </div>
      </div>
      <div class="control-buttons control-buttons__end-of-game">
        <button type="button" class="button button-wrong button-start">Повторить</button>
        <button type="button" class="button button-right button-close">Выход</button>
      </div>
    </div>`;
    this.totalScoreEndOfGame = this.container.querySelector('.score-end-of-game');
    this.maxScoreElement = this.container.querySelector('.max-score');
    this.totalScoreEndOfGame.innerHTML = this.totalScore;
    if (this.maxScore < this.totalScore) {
      this.maxScore = this.totalScore;
      localStorage.setItem(MAX_SCORE, this.maxScore);
    }
    this.maxScoreElement.innerHTML = this.maxScore;
    this.buttonClose = this.container.querySelector('.button-close');
    this.buttonClose.addEventListener('click', () => {
      document.location.href = '/';
    });
    this.buttonStart = this.container.querySelector('.button-start');
    this.buttonStart.addEventListener('click', () => {
      document.location.href = '/sprint.html';
      this.wordsService.resetToSettings();
    });
    this.statisticsService.updateGameResult(SPRINT, this.totalScore);
    this.listCorrect = this.container.querySelector('.word-list-of-game__words-correct');
    this.listIncorrect = this.container.querySelector('.word-list-of-game__words-incorrect');
    this.listCorrect.innerHTML = '';
    this.listIncorrect.innerHTML = '';
    this.arrayCorrectAnswer.forEach((element) => {
      this.listCorrect.innerHTML += `
      <li class="word-item">
        <span class="image-sound"></span>
        <span class="bold">${element.word}</span>
        <span>${element.wordTranslate}</span>
      </li>`;
    });
    this.arrayIncorrectAnswer.forEach((element) => {
      this.listIncorrect.innerHTML += `
      <li class="word-item">
        <span class="image-sound"></span>
        <span class="bold">${element.word}</span>
        <span>${element.wordTranslate}</span>
      </li>`;
    });
  }
}
