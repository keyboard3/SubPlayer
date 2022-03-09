import React, { useState, useCallback, useEffect } from 'react';
import { Table } from 'react-virtualized';
import unescape from 'lodash/unescape';
import debounce from 'lodash/debounce';
import "./Subtitles.scss";

export default function Subtitles({ currentIndex, subtitle, checkSub, player, updateSub }) {
    const [height, setHeight] = useState(100);

    const resize = useCallback(() => {
        setHeight(document.body.clientHeight - 170);
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
                width={250}
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
                            </div>
                        </div>
                    );
                }}
            ></Table>
        </div>
    );
}
