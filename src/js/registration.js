import Api from './api';

export default class Registration {
  constructor() {
    this.api = new Api();
    this.inputEmail = document.querySelector('#signup-email');
    this.inputPassword = document.querySelector('#signup-password');
    this.formRegistration = document.querySelector('.form-registration');
    this.errorEmail = document.querySelector('.form-registration__email-error');
    this.errorPassword = document.querySelector('.form-registration__password-error');
    this.formLogin = document.querySelector('.form-registration');
    this.formLogin.addEventListener('submit', this.onSubmit.bind(this));
  }

  onSubmit(event) {
    event.preventDefault();
    const email = this.inputEmail.value;
    const password = this.inputPassword.value;
    if (!email) {
      this.showEmailErrors('Введите почту');
    } else {
      this.showEmailErrors('');
    }
    if (!password) {
      this.showPassErrors('Введите пароль');
    } else {
      this.showPassErrors('');
    }
    const isValidPassword = /[A-ZА-Я]/.test(password) && /[a-zа-я]/.test(password)
      && /\d/.test(password) && /[+\-_@$!%*?&#.,;:[\]{}]/.test(password);
    if (!isValidPassword) {
      const errText = 'Пароль должен содержать не менее 8 символов, '
      + 'как минимум одну прописную букву, одну заглавную букву, одну цифру и один '
      + 'спецсимвол из +-_@$!%*?&#.,;:[]{}';
      this.showPassErrors(errText);
    } else {
      this.showPassErrors('');
    }
    if (!email || !password || !isValidPassword) {
      return false;
    }
    this.registrationRequest({ email, password });
    return false;
  }

  registrationRequest(user) {
    this.api.createUser(user)
      .then(() => {
        // Заменить url, когда создадим основную страницу приложения
        window.location.href = './app.html';
      }, (response) => {
        if (response === 'user with this e-mail exists') {
          this.showEmailErrors('Пользователь уже существует');
        } else {
          this.showEmailErrors('Ошибка регистрации');
        }
      });
  }

  showPassErrors(text) {
    this.inputPassword.setCustomValidity(text);
  }

  showEmailErrors(text) {
    this.inputEmail.setCustomValidity(text);
  }
}
