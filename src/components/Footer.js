import DT from 'duration-time-conversion';
import React, { useState, useEffect, useCallback, createRef, memo } from 'react';
import WFPlayer from 'wfplayer';
import clamp from 'lodash/clamp';
import throttle from 'lodash/throttle';
import Timeline from './Timeline';
import Metronome from './Metronome';
import "./Footer.scss";

const Waveform = memo(
    ({ player, setWaveform, setRender }) => {
        const $waveform = createRef();

        useEffect(() => {
            [...WFPlayer.instances].forEach((item) => item.destroy());

            const waveform = new WFPlayer({
                scrollable: true,
                useWorker: false,
                duration: 10,
                padding: 1,
                wave: true,
                pixelRatio: 2,
                container: $waveform.current,
                mediaElement: player,
                backgroundColor: 'rgba(0, 0, 0, 0)',
                waveColor: 'rgba(255, 255, 255, 0.2)',
                progressColor: 'rgba(255, 255, 255, 0.5)',
                gridColor: 'rgba(255, 255, 255, 0.05)',
                rulerColor: 'rgba(255, 255, 255, 0.5)',
                paddingColor: 'rgba(0, 0, 0, 0)',
            });

            setWaveform(waveform);
            waveform.on('update', setRender);
            waveform.load('/sample.mp3');
        }, [player, $waveform, setWaveform, setRender]);

        return <div className="waveform" ref={$waveform} />;
    },
    () => true,
);

const Grab = (props) => {
    const [grabStartX, setGrabStartX] = useState(0);
    const [grabStartTime, setGrabStartTime] = useState(0);
    const [grabbing, setGrabbing] = useState(false);

    const onGrabDown = useCallback(
        (event) => {
            if (event.button !== 0) return;
            setGrabStartX(event.pageX);
            setGrabStartTime(props.player.currentTime);
            setGrabbing(true);
        },
        [props.player],
    );

    const onGrabUp = () => {
        setGrabStartX(0);
        setGrabStartTime(0);
        setGrabbing(false);
    };

    const onGrabMove = useCallback(
        (event) => {
            if (grabbing && props.player && props.waveform) {
                const currentTime = clamp(
                    grabStartTime - ((event.pageX - grabStartX) / document.body.clientWidth) * 10,
                    0,
                    props.player.duration,
                );
                props.player.currentTime = currentTime;
                props.waveform.seek(currentTime);
            }
        },
        [grabbing, props.player, props.waveform, grabStartX, grabStartTime],
    );

    useEffect(() => {
        document.addEventListener('mouseup', onGrabUp);
        return () => document.removeEventListener('mouseup', onGrabUp);
    }, []);

    return (
        <div className={`grab ${grabbing ? 'grabbing' : ''}`} onMouseDown={onGrabDown} onMouseMove={onGrabMove}></div>
    );
};

const Progress = (props) => {
    const [grabbing, setGrabbing] = useState(false);

    const onProgressClick = useCallback(
        (event) => {
            if (event.button !== 0) return;
            const currentTime = (event.pageX / document.body.clientWidth) * props.player.duration;
            props.player.currentTime = currentTime;
            props.waveform.seek(currentTime);
        },
        [props],
    );

    const onGrabDown = useCallback(
        (event) => {
            if (event.button !== 0) return;
            setGrabbing(true);
        },
        [setGrabbing],
    );

    const onGrabMove = useCallback(
        (event) => {
            if (grabbing) {
                const currentTime = (event.pageX / document.body.clientWidth) * props.player.duration;
                props.player.currentTime = currentTime;
            }
        },
        [grabbing, props.player],
    );

    const onDocumentMouseUp = useCallback(() => {
        if (grabbing) {
            setGrabbing(false);
            props.waveform.seek(props.player.currentTime);
        }
    }, [grabbing, props.waveform, props.player.currentTime]);

    useEffect(() => {
        document.addEventListener('mouseup', onDocumentMouseUp);
        document.addEventListener('mousemove', onGrabMove);
        return () => {
            document.removeEventListener('mouseup', onDocumentMouseUp);
            document.removeEventListener('mousemove', onGrabMove);
        };
    }, [onDocumentMouseUp, onGrabMove]);

    return (
        <div className="progress" onClick={onProgressClick}>
            <div className="bar" style={{ width: `${(props.currentTime / props.player.duration) * 100}%` }}>
                <div className="handle" onMouseDown={onGrabDown}></div>
            </div>
            <div className="subtitle">
                {props.subtitle.length <= 200
                    ? props.subtitle.map((item, index) => {
                        const { duration } = props.player;
                        return (
                            <span
                                key={index}
                                className="item"
                                style={{
                                    left: `${(item.startTime / duration) * 100}%`,
                                    width: `${(item.duration / duration) * 100}%`,
                                }}
                            ></span>
                        );
                    })
                    : null}
            </div>
        </div>
    );
};

const Duration = (props) => {
    const getDuration = useCallback((time) => {
        time = time === Infinity ? 0 : time;
        return DT.d2t(time).split('.')[0];
    }, []);

    return (
        <div className="duration">
            <span>
                {getDuration(props.currentTime)} / {getDuration(props.player.duration || 0)}
            </span>
        </div>
    );
};

export default function Footer(props) {
    const $footer = createRef();
    const [render, setRender] = useState({
        padding: 2,
        duration: 10,
        gridGap: 10,
        gridNum: 110,
        beginTime: -5,
    });

    const onWheel = useCallback(
        (event) => {
            if (
                !props.player ||
                !props.waveform ||
                props.player.playing ||
                !$footer.current ||
                !$footer.current.contains(event.target)
            ) {
                return;
            }

            const deltaY = Math.sign(event.deltaY) / 5;
            const currentTime = clamp(props.player.currentTime + deltaY, 0, props.player.duration);
            props.player.currentTime = currentTime;
            props.waveform.seek(currentTime);
        },
        [props.waveform, props.player, $footer],
    );

    useEffect(() => {
        const onWheelThrottle = throttle(onWheel, 100);
        window.addEventListener('wheel', onWheelThrottle);
        return () => window.removeEventListener('wheel', onWheelThrottle);
    }, [onWheel]);

    return (
        <div className="footer" ref={$footer}>
            {props.player ? (
                <React.Fragment>
                    <Progress {...props} />
                    <Duration {...props} />
                    <Waveform {...props} setRender={setRender} />
                    <Grab {...props} render={render} />
                    <Metronome {...props} render={render} />
                    <Timeline {...props} render={render} />
                </React.Fragment>
            ) : null}
        </div>
    );
}
