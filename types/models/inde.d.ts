
interface Config {
  visibleText2: boolean;
  visibleText1: boolean;
  primaryColor: string,
  secondaryColor: string,
  fontName: string;
  bold: boolean;
  italic: boolean;
  fontSize: number;
  secondaryFontSize: number;
  spacing: number;
  marginBottom: number;
  outline: boolean;
  shadow: boolean;
}
interface Subtitle {
  start: string;
  end: string;
  text: string;
  text2: string;
  endTime: number;
  startTime: number;
}

interface PlayerEditorProps {
  url: string,
  audio: string,
  poster?: string,
  subtitles: Subtitle[],
  config: Config,
  getInstance?: any,
  onSubtitleChange: (subtitles: Subtitle[]) => void,
  onConfigChange: (config: Config) => void,
}