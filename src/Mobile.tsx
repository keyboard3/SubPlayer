import { Translate } from 'react-i18nify';
import './Mobile.scss';

export default function Mobile() {
    return (
        <div className='mobile'>
            <Translate value="MOBILE_TIP" />
        </div>
    );
}
