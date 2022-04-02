import React, { useState, useCallback, useEffect } from 'react';
import { Table } from 'react-virtualized';
import unescape from 'lodash/unescape';
import debounce from 'lodash/debounce';
import "./Subtitles.scss";
/**
 * 展示字幕列表
 * @param param0 
 * @returns 
 */
export default function Subtitles({ currentIndex, subtitle, checkSub, player, updateSub }) {
    const [height, setHeight] = useState(100);

    const resize = useCallback(() => {
        let ele = document.getElementById("sub-player");
        if (!ele) return;
        setHeight(ele.clientHeight - 170);
    }, [setHeight]);

    useEffect(() => {
        resize();
        if (!resize.prototype.init) {
            resize.prototype.init = true;
            const debounceResize = debounce(resize, 500);
            window.addEventListener('resize', debounceResize);
        }
    }, [resize]);

    return (
        <div className="subtitles">
            <Table
                headerHeight={40}
                width={400}
                height={height}
                rowHeight={80}
                scrollToIndex={currentIndex}
                rowCount={subtitle.length}
                rowGetter={({ index }) => subtitle[index]}
                headerRowRenderer={() => null}
                rowRenderer={(props) => {
                    return (
                        <div
                            key={props.key}
                            className={props.className}
                            style={props.style}
                            onClick={() => {
                                if (player) {
                                    player.pause();
                                    if (player.duration >= props.rowData.startTime) {
                                        player.currentTime = props.rowData.startTime + 0.001;
                                    }
                                }
                            }}
                        >
                            <div className="item">
                                <textarea
                                    maxLength={200}
                                    spellCheck={false}
                                    className={[
                                        'textarea',
                                        currentIndex === props.index ? 'highlight' : '',
                                        checkSub(props.rowData) ? 'illegal' : '',
                                    ]
                                        .join(' ')
                                        .trim()}
                                    value={unescape(props.rowData.text)}
                                    onChange={(event) => {
                                        updateSub(props.rowData, {
                                            text: event.target.value,
                                        });
                                    }}
                                />
                                <textarea
                                    maxLength={200}
                                    spellCheck={false}
                                    className={[
                                        'textarea',
                                        currentIndex === props.index ? 'highlight' : '',
                                        checkSub(props.rowData) ? 'illegal' : '',
                                    ]
                                        .join(' ')
                                        .trim()}
                                    value={unescape(props.rowData.text2)}
                                    onChange={(event) => {
                                        updateSub(props.rowData, {
                                            text2: event.target.value,
                                        });
                                    }}
                                />
                            </div>
                        </div>
                    );
                }}
            ></Table>
        </div>
    );
}

export function renderSubtitle(config: Config, subtitle: Subtitle) {
    return `
    <div class='player-subtitle'
            style='
                color: ${config.primaryColor};
                font-size: ${config.fontSize}px;
                font-family: ${config.fontName};
                letter-spacing: ${config.spacing}px;
                font-weight: ${config.bold ? 'bold' : 'normal'};
                font-style: ${config.italic ? 'italic' : 'normal'};
                bottom: ${config.marginBottom}px;
            '>
            ${config.visibleText1 ? `<div>${subtitle.text2}</div>` : ''}
            ${config.visibleText2 ? `<div style='font-size: ${config.secondaryFontSize}px; color: ${config.secondaryColor}'>${subtitle.text}</div>` : ''}
        </div>
    `;
}