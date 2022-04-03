import languages from '../libs/languages';
import { t, Translate } from 'react-i18nify';
import React, { useState, useCallback } from 'react';
import { getExt, download } from '../utils';
import { file2sub, sub2vtt, sub2srt, sub2txt } from '../libs/readSub';
import sub2ass from '../libs/readSub/sub2ass';
import googleTranslate from '../libs/googleTranslate';
import SimpleFS from '@forlagshuset/simple-fs';
import './Tool.scss';

FFmpeg.createFFmpeg({ log: true }).load();
const fs = new SimpleFS.FileSystem();

export default function Header({
    player,
    waveform,
    newSub,
    config,
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
                    text = sub2ass(subtitle, config);
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
        [subtitle, config],
    );

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
            <div className="import">
                <div className="btn">
                    <Translate value="OPEN_SUB" />
                    <input className="file" type="file" onChange={onSubtitleChange} onClick={onInputClick} />
                </div>
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
        </div>
    );
}

export function TopTool({
    player,
    waveform,
    newSub,
    undoSubs,
    clearSubs,
    language,
    subtitle,
    config,
    setLoading,
    formatSub,
    setSubtitle,
    setProcessing,
    notify,
}) {
    const [videoFile, setVideoFile] = useState(null);
    const burnSubtitles = useCallback(async () => {
        try {
            const { createFFmpeg, fetchFile } = FFmpeg;
            const ffmpeg = createFFmpeg({ log: true });
            ffmpeg.setProgress(({ ratio }) => setProcessing(ratio * 100));
            setLoading(t('LOADING_FFMPEG'));
            await ffmpeg.load();
            setLoading(t('LOADING_FONT'));

            await fs.mkdir('/fonts');
            const fontExist = await fs.exists('/fonts/Microsoft-YaHei.ttf');
            if (fontExist) {
                const fontBlob = await fs.readFile('/fonts/Microsoft-YaHei.ttf');
                ffmpeg.FS('writeFile', `tmp/Microsoft-YaHei.ttf`, await fetchFile(fontBlob));
            } else {
                const fontUrl = 'https://cdn.jsdelivr.net/gh/zhw2590582/SubPlayer/docs/Microsoft-YaHei.ttf';
                const fontBlob = await fetch(fontUrl).then((res) => res.blob());
                await fs.writeFile('/fonts/Microsoft-YaHei.ttf', fontBlob);
                ffmpeg.FS('writeFile', `tmp/Microsoft-YaHei.ttf`, await fetchFile(fontBlob));
            }
            setLoading(t('LOADING_VIDEO'));
            ffmpeg.FS(
                'writeFile',
                videoFile ? videoFile.name : 'sample.mp4',
                await fetchFile(videoFile || 'sample.mp4'),
            );
            setLoading(t('LOADING_SUB'));
            const subtitleFile = new File([new Blob([sub2ass(subtitle, config)])], 'subtitle.ass');
            ffmpeg.FS('writeFile', subtitleFile.name, await fetchFile(subtitleFile));
            setLoading('');
            notify({
                message: t('BURN_START'),
                level: 'info',
            });
            const output = `${Date.now()}.mp4`;
            await ffmpeg.run(
                '-i',
                videoFile ? videoFile.name : 'sample.mp4',
                '-vf',
                `ass=${subtitleFile.name}:fontsdir=/tmp`,
                '-preset',
                videoFile ? 'fast' : 'ultrafast',
                output,
            );
            const uint8 = ffmpeg.FS('readFile', output);
            download(URL.createObjectURL(new Blob([uint8])), `${output}`);
            setProcessing(0);
            ffmpeg.setProgress(() => null);
            notify({
                message: t('BURN_SUCCESS'),
                level: 'success',
            });
        } catch (error) {
            setLoading('');
            setProcessing(0);
            notify({
                message: t('BURN_ERROR'),
                level: 'error',
            });
        }
    }, [notify, setProcessing, setLoading, videoFile, subtitle, config]);
    const decodeAudioData = useCallback(
        async (file) => {
            try {
                const { createFFmpeg, fetchFile } = FFmpeg;
                const ffmpeg = createFFmpeg({ log: true });
                ffmpeg.setProgress(({ ratio }) => setProcessing(ratio * 100));
                setLoading(t('LOADING_FFMPEG'));
                await ffmpeg.load();
                ffmpeg.FS('writeFile', file.name, await fetchFile(file));
                setLoading('');
                notify({
                    message: t('DECODE_START'),
                    level: 'info',
                });
                const output = `${Date.now()}.mp3`;
                await ffmpeg.run('-i', file.name, '-ac', '1', '-ar', '8000', output);
                const uint8 = ffmpeg.FS('readFile', output);
                // download(URL.createObjectURL(new Blob([uint8])), `${output}`);
                await waveform.decoder.decodeAudioData(uint8);
                waveform.drawer.update();
                setProcessing(0);
                ffmpeg.setProgress(() => null);
                notify({
                    message: t('DECODE_SUCCESS'),
                    level: 'success',
                });
            } catch (error) {
                setLoading('');
                setProcessing(0);
                notify({
                    message: t('DECODE_ERROR'),
                    level: 'error',
                });
            }
        },
        [waveform, notify, setProcessing, setLoading],
    );
    const onVideoChange = useCallback(
        (event) => {
            const file = event.target.files[0];
            // if (file) {
            //     const ext = getExt(file.name);
            //     const canPlayType = player.canPlayType(file.type);
            //     if (canPlayType === 'maybe' || canPlayType === 'probably') {
            setVideoFile(file);
            decodeAudioData(file);
            const url = URL.createObjectURL(new Blob([file]));
            waveform.decoder.destroy();
            waveform.drawer.update();
            waveform.seek(0);
            player.currentTime = 0;
            clearSubs();
            setSubtitle([
                newSub({
                    start: '00:00:00.000',
                    end: '00:00:01.000',
                    text: t('SUB_TEXT'),
                }),
            ]);
            player.url = url;
            // } else {
            //     notify({
            //         message: `${t('VIDEO_EXT_ERR')}: ${file.type || ext}`,
            //         level: 'error',
            //     });
            // }
            // }
        },
        [newSub, notify, player, setSubtitle, waveform, clearSubs, decodeAudioData],
    );
    const onInputClick = useCallback((event) => {
        event.target.value = '';
    }, []);
    return (
        <div className="top-tool">
            <div className="btn">
                <Translate value="OPEN_VIDEO" />
                <input className="file" type="file" onChange={onVideoChange} onClick={onInputClick} />
            </div>
            {window.crossOriginIsolated ? (
                <div className="burn" onClick={burnSubtitles}>
                    <div className="btn">
                        <Translate value="EXPORT_VIDEO" />
                    </div>
                </div>
            ) : null}
        </div>
    );
}