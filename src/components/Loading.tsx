import { t } from 'react-i18nify';
import './Loading.scss';

export default function Component({ loading }) {
    return (
        <div className='loading'>
            <div className="loading-inner">
                <img src="/loading.svg" alt="loading" />
                <div>{loading || t('LOADING')}</div>
            </div>
        </div>
    );
}
