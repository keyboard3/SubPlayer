import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import React, { useEffect, useCallback } from 'react';
import { Translate } from 'react-i18nify';
import isEqual from 'lodash/isEqual';
import DT from 'duration-time-conversion';
import { getKeyCode } from '../utils';
import "./Timeline.scss";

function getCurrentSubs(subs, beginTime, duration) {
    return subs.filter((item) => {
        return (
            (item.startTime >= beginTime && item.startTime <= beginTime + duration) ||
            (item.endTime >= beginTime && item.endTime <= beginTime + duration) ||
            (item.startTime < beginTime && item.endTime > beginTime + duration)
        );
    });
}

function magnetically(time, closeTime) {
    if (!closeTime) return time;
    if (time > closeTime - 0.1 && closeTime + 0.1 > time) {
        return closeTime;
    }
    return time;
}

let lastTarget = null;
let lastSub = null;
let lastType = '';
let lastX = 0;
let lastIndex = -1;
let lastWidth = 0;
let lastDiffX = 0;
let isDroging = false;

export default React.memo(
    function ({ player, subtitle, render, currentTime, checkSub, removeSub, hasSub, updateSub, mergeSub }) {
        const $blockRef = React.createRef();
        const $subsRef = React.createRef();
        const currentSubs = getCurrentSubs(subtitle, render.beginTime, render.duration);
        const gridGap = document.body.clientWidth / render.gridNum;
        const currentIndex = currentSubs.findIndex(
            (item) => item.startTime <= currentTime && item.endTime > currentTime,
        );

        const onMouseDown = (sub, event, type) => {
            lastSub = sub;
            if (event.button !== 0) return;
            isDroging = true;
            lastType = type;
            lastX = event.pageX;
            lastIndex = currentSubs.indexOf(sub);
            lastTarget = $subsRef.current.children[lastIndex];
            lastWidth = parseFloat(lastTarget.style.width);
        };

        const onDoubleClick = (sub, event) => {
            const $subs = event.currentTarget;
            const index = hasSub(sub);
            const previou = subtitle[index - 1];
            const next = subtitle[index + 1];
            if (previou && next) {
                const width = (next.startTime - previou.endTime) * 10 * gridGap;
                $subs.style.width = `${width}px`;
                const start = DT.d2t(previou.endTime);
                const end = DT.d2t(next.startTime);
                updateSub(sub, {
                    start,
                    end,
                });
            }
        };

        const onDocumentMouseMove = useCallback((event) => {
            if (isDroging && lastTarget) {
                lastDiffX = event.pageX - lastX;
                if (lastType === 'left') {
                    lastTarget.style.width = `${lastWidth - lastDiffX}px`;
                    lastTarget.style.transform = `translate(${lastDiffX}px)`;
                } else if (lastType === 'right') {
                    lastTarget.style.width = `${lastWidth + lastDiffX}px`;
                } else {
                    lastTarget.style.transform = `translate(${lastDiffX}px)`;
                }
            }
        }, []);

        const onDocumentMouseUp = useCallback(() => {
            if (isDroging && lastTarget && lastDiffX) {
                const timeDiff = lastDiffX / gridGap / 10;
                const index = hasSub(lastSub);
                const previou = subtitle[index - 1];
                const next = subtitle[index + 1];

                const startTime = magnetically(lastSub.startTime + timeDiff, previou ? previou.endTime : null);
                const endTime = magnetically(lastSub.endTime + timeDiff, next ? next.startTime : null);
                const width = (endTime - startTime) * 10 * gridGap;

                if ((previou && endTime < previou.startTime) || (next && startTime > next.endTime)) {
                    //
                } else {
                    if (lastType === 'left') {
                        if (startTime >= 0 && lastSub.endTime - startTime >= 0.2) {
                            const start = DT.d2t(startTime);
                            updateSub(lastSub, { start });
                        } else {
                            lastTarget.style.width = `${width}px`;
                        }
                    } else if (lastType === 'right') {
                        if (endTime >= 0 && endTime - lastSub.startTime >= 0.2) {
                            const end = DT.d2t(endTime);
                            updateSub(lastSub, { end });
                        } else {
                            lastTarget.style.width = `${width}px`;
                        }
                    } else {
                        if (startTime > 0 && endTime > 0 && endTime - startTime >= 0.2) {
                            const start = DT.d2t(startTime);
                            const end = DT.d2t(endTime);
                            updateSub(lastSub, {
                                start,
                                end,
                            });
                        } else {
                            lastTarget.style.width = `${width}px`;
                        }
                    }
                }

                lastTarget.style.transform = `translate(0)`;
            }

            lastType = '';
            lastX = 0;
            lastWidth = 0;
            lastDiffX = 0;
            isDroging = false;
        }, [gridGap, hasSub, subtitle, updateSub]);

        const onKeyDown = useCallback(
            (event) => {
                const sub = currentSubs[lastIndex];
                if (sub && lastTarget) {
                    const keyCode = getKeyCode(event);
                    switch (keyCode) {
                        case 37:
                            updateSub(sub, {
                                start: DT.d2t(sub.startTime - 0.1),
                                end: DT.d2t(sub.endTime - 0.1),
                            });
                            player.currentTime = sub.startTime - 0.1;
                            break;
                        case 39:
                            updateSub(sub, {
                                start: DT.d2t(sub.startTime + 0.1),
                                end: DT.d2t(sub.endTime + 0.1),
                            });
                            player.currentTime = sub.startTime + 0.1;
                            break;
                        case 8:
                        case 46:
                            removeSub(sub);
                            break;
                        default:
                            break;
                    }
                }
            },
            [currentSubs, player, removeSub, updateSub],
        );

        useEffect(() => {
            document.addEventListener('mousemove', onDocumentMouseMove);
            document.addEventListener('mouseup', onDocumentMouseUp);
            window.addEventListener('keydown', onKeyDown);
            return () => {
                document.removeEventListener('mousemove', onDocumentMouseMove);
                document.removeEventListener('mouseup', onDocumentMouseUp);
                window.removeEventListener('keydown', onKeyDown);
            };
        }, [onDocumentMouseMove, onDocumentMouseUp, onKeyDown]);

        return (
            <div className='timeline' ref={$blockRef}>
                <div ref={$subsRef}>
                    {currentSubs.map((sub, key) => {
                        return (
                            <div
                                className={[
                                    'sub-item',
                                    key === currentIndex ? 'sub-highlight' : '',
                                    checkSub(sub) ? 'sub-illegal' : '',
                                ]
                                    .join(' ')
                                    .trim()}
                                key={key}
                                style={{
                                    left: render.padding * gridGap + (sub.startTime - render.beginTime) * gridGap * 10,
                                    width: (sub.endTime - sub.startTime) * gridGap * 10,
                                }}
                                onClick={() => {
                                    if (player.duration >= sub.startTime) {
                                        player.currentTime = sub.startTime + 0.001;
                                    }
                                }}
                                onDoubleClick={(event) => onDoubleClick(sub, event)}
                            >
                                <ContextMenuTrigger id="contextmenu" holdToDisplay={-1}>
                                    <div
                                        className="sub-handle"
                                        style={{
                                            left: 0,
                                            width: 10,
                                        }}
                                        onMouseDown={(event) => onMouseDown(sub, event, 'left')}
                                    ></div>

                                    <div
                                        className="sub-text"
                                        title={sub.text}
                                        onMouseDown={(event) => onMouseDown(sub, event)}
                                    >
                                        {`${sub.text}`.split(/\r?\n/).map((line, index) => (
                                            <p key={index}>{line}</p>
                                        ))}
                                    </div>

                                    <div
                                        className="sub-handle"
                                        style={{
                                            right: 0,
                                            width: 10,
                                        }}
                                        onMouseDown={(event) => onMouseDown(sub, event, 'right')}
                                    ></div>
                                    <div className="sub-duration">{sub.duration}</div>
                                </ContextMenuTrigger>
                            </div>
                        );
                    })}
                </div>
                <ContextMenu id="contextmenu">
                    <MenuItem onClick={() => removeSub(lastSub)}>
                        <Translate value="DELETE" />
                    </MenuItem>
                    <MenuItem onClick={() => mergeSub(lastSub)}>
                        <Translate value="MERGE" />
                    </MenuItem>
                </ContextMenu>
            </div>
        );
    },
    (prevProps, nextProps) => {
        return (
            isEqual(prevProps.subtitle, nextProps.subtitle) &&
            isEqual(prevProps.render, nextProps.render) &&
            prevProps.currentTime === nextProps.currentTime
        );
    },
);
