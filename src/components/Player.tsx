import React, { useEffect, memo, useRef } from 'react';
import { isPlaying } from '../utils';
import "./Player.scss";
import Artplayer from 'artplayer';

function ArtPlayer({ option, getInstance, ...rest }: { option: typeof Artplayer.option, getInstance: (instance: Artplayer) => void } & any) {
    const artRef = useRef();
    useEffect(() => {
        const instance = new Artplayer({ ...option, container: artRef.current });
        if (getInstance && typeof getInstance == "function") getInstance(instance);
        return () => {
            instance.destroy();
        }
    }, [artRef]);
    return React.createElement('div', {
        ref: artRef,
        ...rest,
    });
}

const Player = memo(
    ({ setPlayer, setCurrentTime, setPlaying, url, poster }: any) => {
        const $video = useRef<Artplayer>();
        useEffect(() => {
            setPlayer($video.current);
            (function loop() {
                window.requestAnimationFrame(() => {
                    if ($video.current) {
                        setPlaying(isPlaying($video.current));
                        setCurrentTime($video.current.currentTime || 0);
                    }
                    loop();
                });
            })();
        }, [setPlayer, setCurrentTime, setPlaying, $video]);
        return (
            <div className="player">
                <div className="video">
                    <ArtPlayer
                        style={{ height: "100%" }}
                        option={{
                            url: url,
                            poster: poster || "",
                            volume: 0.5,
                            isLive: false,
                            muted: false,
                            autoplay: false,
                            pip: true,
                            autoSize: true,
                            autoMini: true,
                            screenshot: true,
                            setting: true,
                            loop: true,
                            flip: true,
                            playbackRate: true,
                            aspectRatio: true,
                            // fullscreen: true,
                            fullscreenWeb: true,
                            subtitleOffset: true,
                            miniProgressBar: true,
                            mutex: true,
                            backdrop: true,
                            theme: '#23ade5',
                            lang: navigator.language.toLowerCase(),
                            whitelist: ['*'],
                        } as typeof Artplayer.option}
                        getInstance={(instance) => {
                            $video.current = instance;
                        }}
                    />
                </div>
            </div>
        );
    },
    () => true,
);
export default Player;
