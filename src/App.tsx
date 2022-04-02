import React, { useState, useEffect, useCallback, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import NotificationSystem from 'react-notification-system';
import DT from 'duration-time-conversion';
import isEqual from 'lodash/isEqual';
import Tabs from './components/Tabs';
import Subtitles, { renderSubtitle } from './components/Subtitles';
import Player from './components/Player';
import Footer from './components/Footer';
import Loading from './components/Loading';
import ProgressBar from './components/ProgressBar';
import { getKeyCode } from './utils';
import * as KeyCode from 'keycode-js';
import Sub from './libs/Sub';
import './App.scss';
import { setLocale, setTranslations } from 'react-i18nify';
import i18n from './i18n';
import './libs/contextmenu.css';
import 'core-js';
import 'normalize.css';
import covertToAss from './libs/readSub/sub2ass';
setTranslations(i18n);
setLocale('zh');

const App = forwardRef((appProps: PlayerEditorProps, ref) => {
    const subtitleHistory = useRef([]);
    const notificationSystem = useRef(null);
    const [player, setPlayer] = useState<Artplayer>(null);

    const [loading, setLoading] = useState('');
    const [processing, setProcessing] = useState(0);
    const [language, setLanguage] = useState('zh');

    const [waveform, setWaveform] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(-1);

    const { url, poster, audio, config, subtitles: pureSubtitle, onSubtitleChange: setSubtitleOriginal, onConfigChange: setConfig } = appProps;
    const subtitle = useMemo(() => pureSubtitle.map(item => new Sub(item)), [pureSubtitle]);
    useImperativeHandle(ref, () => ({
        covertToAss,
        destroy: () => {
            try {
                player.pause();
            } catch (err) {
                console.error(err);
            }
        }
    }));
    //拷贝创建个新字幕
    const newSub = useCallback((item) => new Sub(item), []);
    //判断字幕列表中是否存在该字幕对象
    const hasSub = useCallback((sub) => subtitle.indexOf(sub), [subtitle]);
    //拷贝创建一组或一个字幕
    const formatSub = useCallback(
        (sub) => {
            if (Array.isArray(sub)) {
                return sub.map((item) => newSub(item));
            }
            return newSub(sub);
        },
        [newSub],
    );
    //同上拷贝字幕
    const copySubs = useCallback(() => formatSub(subtitle), [subtitle, formatSub]);
    //将字幕数据设置到页面上，同时写到缓存上
    const setSubtitle = useCallback(
        (newSubtitle, saveToHistory = true) => {
            if (!isEqual(newSubtitle, subtitle)) {
                if (saveToHistory) {
                    if (subtitleHistory.current.length >= 1000) {
                        subtitleHistory.current.shift();
                    }
                    subtitleHistory.current.push(formatSub(subtitle));
                }
                window.localStorage.setItem('subtitle', JSON.stringify(newSubtitle));
                setSubtitleOriginal(newSubtitle);
                appProps.onSubtitleChange(newSubtitle);
            }
        },
        [subtitle, setSubtitleOriginal, formatSub],
    );

    const undoSubs = useCallback(() => {
        const subs = subtitleHistory.current.pop();
        if (subs) {
            setSubtitle(subs, false);
        }
    }, [setSubtitle, subtitleHistory]);
    //清空页面字幕和字幕操作历史
    const clearSubs = useCallback(() => {
        setSubtitle([]);
        subtitleHistory.current.length = 0;
    }, [setSubtitle, subtitleHistory]);
    //检查当前字幕是否被选中
    const checkSub = useCallback(
        (sub) => {
            const index = hasSub(sub);
            if (index < 0) return;
            const previous = subtitle[index - 1];
            return (previous && sub.startTime < previous.endTime) || !sub.check || sub.duration < 0.2;
        },
        [subtitle, hasSub],
    );
    //封装的页面通知提示
    const notify = useCallback(
        (obj) => {
            // https://github.com/igorprado/react-notification-system
            const notification = notificationSystem.current;
            notification.clearNotifications();
            notification.addNotification({
                position: 'tc',
                dismissible: 'none',
                autoDismiss: 2,
                message: obj.message,
                level: obj.level,
            });
        },
        [notificationSystem],
    );
    // 删除指定那条字幕
    const removeSub = useCallback(
        (sub) => {
            const index = hasSub(sub);
            if (index < 0) return;
            const subs = copySubs() as Sub[];
            subs.splice(index, 1);
            setSubtitle(subs);
        },
        [hasSub, copySubs, setSubtitle],
    );
    //添加指定条字幕
    const addSub = useCallback(
        (index, sub) => {
            const subs = copySubs() as Sub[];
            subs.splice(index, 0, formatSub(sub) as Sub);
            setSubtitle(subs);
        },
        [copySubs, setSubtitle, formatSub],
    );
    //修改指定条字幕
    const updateSub = useCallback(
        (sub, obj) => {
            const index = hasSub(sub);
            if (index < 0) return;
            const subs = copySubs();
            const subClone = formatSub(sub) as Sub;
            Object.assign(subClone, obj);
            if (subClone.check) {
                subs[index] = subClone;
                setSubtitle(subs);
            }
        },
        [hasSub, copySubs, setSubtitle, formatSub],
    );
    //合并字幕是指当前和后面的字幕合并在一起显示，换行且时间区域合并
    const mergeSub = useCallback(
        (sub) => {
            const index = hasSub(sub);
            if (index < 0) return;
            const subs = copySubs() as Sub[];
            const next = subs[index + 1];
            if (!next) return;
            const merge = newSub({
                start: sub.start,
                end: next.end,
                text: sub.text.trim() + '\n' + next.text.trim(),
            });
            subs[index] = merge;
            subs.splice(index + 1, 1);
            setSubtitle(subs);
        },
        [hasSub, copySubs, setSubtitle, newSub],
    );
    //在播放视频显示字幕的位置上点击可以拆分字幕
    const splitSub = useCallback(
        (sub, start) => {
            const index = hasSub(sub);
            if (index < 0 || !sub.text || !start) return;
            const subs = copySubs() as Sub[];
            const text1 = sub.text.slice(0, start).trim();
            const text2 = sub.text.slice(start).trim();
            if (!text1 || !text2) return;
            const splitDuration = parseFloat((sub.duration * (start / sub.text.length)).toFixed(3));
            if (splitDuration < 0.2 || sub.duration - splitDuration < 0.2) return;
            subs.splice(index, 1);
            const middleTime = DT.d2t(sub.startTime + splitDuration);
            subs.splice(
                index,
                0,
                newSub({
                    start: sub.start,
                    end: middleTime,
                    text: text1,
                }),
            );
            subs.splice(
                index + 1,
                0,
                newSub({
                    start: middleTime,
                    end: sub.end,
                    text: text2,
                }),
            );
            setSubtitle(subs);
        },
        [hasSub, copySubs, setSubtitle, newSub],
    );

    const onKeyDown = useCallback(
        (event) => {
            const keyCode = getKeyCode(event);
            switch (keyCode) {
                case KeyCode.KEY_SPACE:
                    event.preventDefault();
                    if (player) {
                        if (playing) {
                            player.pause();
                        } else {
                            player.play();
                        }
                    }
                    break;
                case KeyCode.KEY_Z:
                    event.preventDefault();
                    if (event.metaKey) {
                        undoSubs();
                    }
                    break;
                default:
                    break;
            }
        },
        [player, playing, undoSubs],
    );

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onKeyDown]);
    // 通过字幕的播放时间和当前播放进度的时间选中当前高亮字幕
    useMemo(() => {
        const currentIndex = subtitle.findIndex((item) => item.startTime <= currentTime && item.endTime > currentTime);
        setCurrentIndex(currentIndex);
    }, [currentTime, subtitle]);

    useEffect(() => {
        if (!player) return;
        const subtitleEle = player.template.$subtitle;
        if (subtitle[currentIndex]) subtitleEle.innerHTML = renderSubtitle(config, subtitle[currentIndex]);
        else subtitleEle.innerHTML = '';
    }, [currentIndex, subtitle, player, config]);

    const props = {
        url,
        poster,
        audio,
        player,
        setPlayer,
        subtitle,
        setSubtitle,
        waveform,
        setWaveform,
        currentTime,
        setCurrentTime,
        currentIndex,
        setCurrentIndex,
        playing,
        setPlaying,
        language,
        setLanguage,
        loading,
        setLoading,
        setProcessing,
        subtitleHistory,
        config,
        setConfig,

        notify,
        newSub,
        hasSub,
        checkSub,
        removeSub,
        addSub,
        undoSubs,
        clearSubs,
        updateSub,
        formatSub,
        mergeSub,
        splitSub,
    };

    return (
        <div id='sub-player' className='app'>
            <div className="main">
                <div className='content'>
                    <Player {...props} />
                    <Tabs {...props} />
                </div>
                <Subtitles {...props} />
            </div>
            <Footer {...props} />
            {loading ? <Loading loading={loading} /> : null}
            {processing > 0 && processing < 100 ? <ProgressBar processing={processing} /> : null}
            <NotificationSystem ref={notificationSystem} allowHTML={true} />
        </div>
    );
})
export default App;