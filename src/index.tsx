import ReactDOM from 'react-dom';
import Loading from './components/Loading';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import SubPlayerEditor from './App';
import './global.scss';
import defaultConfig from './libs/config';
ReactDOM.render(
    <Suspense fallback={<Loading loading={true} />}>
        <Editor />
    </Suspense>
    , document.getElementById('root'),
);

function Editor() {
    const [config, setOriginalConfig] = useState<Config>(defaultConfig);
    const [subtitle, setSubtitleOriginal] = useState<Subtitle[]>([]);
    const ref = useRef();
    console.log("ref.current", ref.current);
    useEffect(() => {
        //会缓存获取的demo字幕
        const localSubtitleString = window.localStorage.getItem('subtitle');
        const fetchSubtitle = () =>
            fetch('https://subplayer.js.org/sample.json')
                .then((res) => res.json())
                .then((res) => {
                    setSubtitleOriginal(res);
                });
        //根据缓存是否存在来从远端获取字幕
        if (localSubtitleString) {
            try {
                const localSubtitle = JSON.parse(localSubtitleString);
                if (localSubtitle.length) {
                    setSubtitleOriginal(localSubtitle);
                } else {
                    fetchSubtitle();
                }
            } catch (error) {
                fetchSubtitle();
            }
        } else {
            fetchSubtitle();
        }
    }, [setSubtitleOriginal]);
    return (
        <SubPlayerEditor
            ref={ref}
            url={"/sample.mp4"}
            audio={"/sample.mp3"}
            subtitles={subtitle}
            config={config}
            onSubtitleChange={(subtitle) => {
                setSubtitleOriginal(subtitle);
            }}
            onConfigChange={(config) => {
                setOriginalConfig(config)
            }}
        />
    );
}
