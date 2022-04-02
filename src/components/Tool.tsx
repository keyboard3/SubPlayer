import languages from '../libs/languages';
import { t, Translate } from 'react-i18nify';
import React, { useState, useCallback } from 'react';
import { getExt, download } from '../utils';
import { file2sub, sub2vtt, sub2srt, sub2txt } from '../libs/readSub';
import sub2ass from '../libs/readSub/sub2ass';
import googleTranslate from '../libs/googleTranslate';
import './Tool.scss';
import defaultConfig from 'src/libs/config';

export default function Header({
    player,
    waveform,
    newSub,
    undoSubs,
    clearSubs,
    language,
    subtitle,
    setLoading,
    formatSub,
    setSubtitle,
    setProcessing,
    notify,
}) {
    const [translate, setTranslate] = useState('en');
    /**
     * 切换本地字幕文件
     */
    const onSubtitleChange = useCallback(
        (event) => {
            const file = event.target.files[0];
            if (file) {
                const ext = getExt(file.name);
                if (['ass', 'vtt', 'srt', 'json'].includes(ext)) {
                    file2sub(file)
                        .then((res) => {
                            clearSubs();
                            setSubtitle(res);
                        })
                        .catch((err) => {
                            notify({
                                message: err.message,
                                level: 'error',
                            });
                        });
                } else {
                    notify({
                        message: `${t('SUB_EXT_ERR')}: ${ext}`,
                        level: 'error',
                    });
                }
            }
        },
        [notify, setSubtitle, clearSubs],
    );

    const onInputClick = useCallback((event) => {
        event.target.value = '';
    }, []);
    /**
     * 将字幕转换成各种类型文件
     */
    const downloadSub = useCallback(
        (type) => {
            let text = '';
            const name = `${Date.now()}.${type}`;
            switch (type) {
                case 'vtt':
                    text = sub2vtt(subtitle);
                    break;
                case 'srt':
                    text = sub2srt(subtitle);
                    break;
                case 'ass':
                    text = sub2ass(subtitle, defaultConfig);
                    break;
                case 'txt':
                    text = sub2txt(subtitle);
                    break;
                case 'json':
                    text = JSON.stringify(subtitle);
                    break;
                default:
                    break;
            }
            const url = URL.createObjectURL(new Blob([text]));
            download(url, name);
        },
        [subtitle],
    );
    /**
     * 利用google翻译引擎翻译字幕
     */
    const onTranslate = useCallback(() => {
        setLoading(t('TRANSLATING'));
        googleTranslate(formatSub(subtitle), translate)
            .then((res) => {
                setLoading('');
                setSubtitle(formatSub(res));
                notify({
                    message: t('TRANSLAT_SUCCESS'),
                    level: 'success',
                });
            })
            .catch((err) => {
                setLoading('');
                notify({
                    message: err.message,
                    level: 'error',
                });
            });
    }, [subtitle, setLoading, formatSub, setSubtitle, translate, notify]);

    return (
        <div className="tool">
            <div className="top">
                <div className="import">
                    <div className="btn">
                        <Translate value="OPEN_SUB" />
                        <input className="file" type="file" onChange={onSubtitleChange} onClick={onInputClick} />
                    </div>
                </div>
                <div className="export">
                    <div className="btn" onClick={() => downloadSub('ass')}>
                        <Translate value="EXPORT_ASS" />
                    </div>
                    <div className="btn" onClick={() => downloadSub('srt')}>
                        <Translate value="EXPORT_SRT" />
                    </div>
                    <div className="btn" onClick={() => downloadSub('vtt')}>
                        <Translate value="EXPORT_VTT" />
                    </div>
                </div>
                <div className="operate">
                    <div
                        className="btn"
                        onClick={() => {
                            if (window.confirm(t('CLEAR_TIP')) === true) {
                                clearSubs();
                                window.location.reload();
                            }
                        }}
                    >
                        <Translate value="CLEAR" />
                    </div>
                    <div className="btn" onClick={undoSubs}>
                        <Translate value="UNDO" />
                    </div>
                </div>
                <div className="translate">
                    <select value={translate} onChange={(event) => setTranslate(event.target.value)}>
                        {(languages[language] || languages.en).map((item) => (
                            <option key={item.key} value={item.key}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                    <div className="btn" onClick={onTranslate}>
                        <Translate value="TRANSLATE" />
                    </div>
                </div>
                <div className="hotkey">
                    <span>
                        <Translate value="HOTKEY_01" />
                    </span>
                    <span>
                        <Translate value="HOTKEY_02" />
                    </span>
                </div>
            </div>
        </div >
    );
}
