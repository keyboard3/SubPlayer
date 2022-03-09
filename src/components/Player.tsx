import React, { useState, useEffect, createRef, useCallback, useMemo, memo } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Translate } from 'react-i18nify';
import backlight from '../libs/backlight';
import { isPlaying } from '../utils';
import "./Player.scss";

const VideoWrap = memo(
    ({ setPlayer, setCurrentTime, setPlaying }: any) => {
        const $video = createRef<any>();

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

        const onClick = useCallback(() => {
            if ($video.current) {
                if (isPlaying($video.current)) {
                    $video.current.pause();
                } else {
                    $video.current.play();
                }
            }
        }, [$video]);

        return <video onClick={onClick} src="/sample.mp4" ref={$video} />;
    },
    () => true,
);

export default function Player(props) {
    const [currentSub, setCurrentSub] = useState(null);
    const [focusing, setFocusing] = useState(false);
    const [inputItemCursor, setInputItemCursor] = useState(0);
    const $player = createRef<any>();

    useEffect(() => {
        if ($player.current && props.player && !backlight.prototype.state) {
            backlight.prototype.state = true;
            backlight($player.current, props.player);
        }
    }, [$player, props.player]);

    useMemo(() => {
        setCurrentSub(props.subtitle[props.currentIndex]);
    }, [props.subtitle, props.currentIndex]);

    const onChange = useCallback(
        (event) => {
            props.player.pause();
            props.updateSub(currentSub, { text: event.target.value });
            if (event.target.selectionStart) {
                setInputItemCursor(event.target.selectionStart);
            }
        },
        [props, currentSub],
    );

    const onClick = useCallback(
        (event) => {
            props.player.pause();
            if (event.target.selectionStart) {
                setInputItemCursor(event.target.selectionStart);
            }
        },
        [props],
    );

    const onFocus = useCallback((event) => {
        setFocusing(true);
        if (event.target.selectionStart) {
            setInputItemCursor(event.target.selectionStart);
        }
    }, []);

    const onBlur = useCallback(() => {
        setTimeout(() => setFocusing(false), 500);
    }, []);

    const onSplit = useCallback(() => {
        props.splitSub(currentSub, inputItemCursor);
    }, [props, currentSub, inputItemCursor]);

    return (
        <div className="player">
            <div className="video" ref={$player}>
                <VideoWrap {...props} />
                {props.player && currentSub ? (
                    <div className="subtitle">
                        {focusing ? (
                            <div className="operate" onClick={onSplit}>
                                <Translate value="SPLIT" />
                            </div>
                        ) : null}
                        <TextareaAutosize
                            className={`textarea ${!props.playing ? 'pause' : ''}`}
                            value={currentSub.text}
                            onChange={onChange}
                            onClick={onClick}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            onKeyDown={onFocus}
                            spellCheck={false}
                        />
                    </div>
                ) : null}
            </div>
        </div>
    );
}
