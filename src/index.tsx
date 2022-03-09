import 'core-js';
import 'normalize.css';
import './libs/contextmenu.css';
import ReactDOM from 'react-dom';
import { isMobile } from './utils';
import { setLocale, setTranslations } from 'react-i18nify';
import i18n from './i18n';
import App from './App';
import Mobile from './Mobile';
import './global.scss';

setTranslations(i18n);
const language = navigator.language.toLowerCase();
const defaultLang = i18n[language as keyof typeof i18n] ? language : 'en';
setLocale(defaultLang);

ReactDOM.render(
    isMobile ? <Mobile /> : <App defaultLang={defaultLang} />,
    document.getElementById('root'),
);
