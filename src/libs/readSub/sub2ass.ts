import defaultConfig from "../config";

const toSubTime = (str) => {
    let n = [];
    let sx: any = '';
    let x = str.split(/[:.]/).map((x) => Number(x));
    x = str.split(/[:.]/).map((x) => Number(x));
    x[3] = '0.' + ('00' + x[3]).slice(-3);
    sx = (x[0] * 60 * 60 + x[1] * 60 + x[2] + Number(x[3])).toFixed(2);
    sx = sx.toString().split('.');
    n.unshift(sx[1]);
    sx = Number(sx[0]);
    n.unshift(('0' + (sx % 60).toString()).slice(-2));
    n.unshift(('0' + (Math.floor(sx / 60) % 60).toString()).slice(-2));
    n.unshift((Math.floor(sx / 3600) % 60).toString());
    return n.slice(0, 3).join(':') + '.' + n[3];
};
export default function covertToAss(sub: Subtitle[], config: Config = defaultConfig) {
    return `
[Script Info]
Synch Point:1
ScriptType:v4.00+
Collisions:Normal

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default, ${config.fontName}, ${config.fontSize}, &H${hexCovert(config.primaryColor)}, &H${hexCovert(config.secondaryColor)}, &H00000000, &H00000000, 0, 0, 0, 0, 100, 100, ${config.spacing}, 0, ${coverBoolean(config.outline)}, ${coverBoolean(config.shadow)}, 0, 2, 10, 10, ${config.marginBottom}, 134

[Events]
Format: Layer, Start, End, Style, Actor, MarginL, MarginR, MarginV, Effect, Text
${sub
            .map((item) => {
                const start = toSubTime(item.start);
                const end = toSubTime(item.end);
                let text = "";
                if (config.visibleText1) text = item.text2.replace(/\r?\n/g, '\\N');
                if (config.visibleText2 && item.text) text += `\\N{\\fs${config.secondaryFontSize}}{\\c&&H${hexCovert(config.secondaryColor)}&}${item.text}`;
                return `Dialogue: 0,${start},${end},Default,NTP,0000,0000,0000,,${text}`;
            })
            .join('\n')}
`.trim();
}

function hexCovert(hex: string) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        return "00" + c[4] + c[5] + c[2] + c[3] + c[1] + [0];
    }
    return hex;
}

function coverBoolean(enable: boolean) {
    return enable ? 1 : 0;
}