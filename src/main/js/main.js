import 'app/index';
import 'app/scss/main.scss';
import api from 'app/js/api';
import './animate';
import mainPage from './mainPage';

api.checkLogin().then(async (user) => {
  mainPage.init();

  console.log(user);
}, () => {
  console.log('Couldnt login');
});

// api.loginUser({ email: 'test3@mail.ru', password: 'QQQwww123.' }).then(() => {
//   mainPage.init();
// });