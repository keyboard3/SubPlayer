import './Tabs.scss';
import { CompactPicker } from 'react-color';
import { useState } from 'react';
import Tool from './Tool';
interface LocalProps { config: Config, setConfig: (config: Config) => void }
type TabType = "style" | "tool";
export default (props: LocalProps & any) => {
  const [type, setType] = useState<TabType>('style');
  return (
    <div className='tabs-inner'>
      <div className='tabs-header'>
        <div className={tabItemClass('style', type)} onClick={setType.bind(this, 'style')}>样式</div>
        <div className={tabItemClass('tool', type)} onClick={setType.bind(this, 'tool')}>工具</div>
      </div>
      {(() => {
        if (type == "style") return renderStyle();
        else if (type == "tool") return renderTool();
        return null;
      })()}
    </div>
  );
  function tabItemClass(originalType, type) {
    if (originalType == type) return "tabs-header-item tabs-item-active";
    return "tabs-header-item";
  }
  function renderStyle() {
    return (
      <div className='tabs-content'>
        <div className='tabs-item'>
          <div className='item-title'>英文字幕:</div>
          <SubtitleBox {...props} />
          <ColorBox {...props} label={'文字颜色'} propertyKey={'primaryColor'} />
          <FontSize {...props} />
          <WordSpace {...props} />
          <BottomDistance {...props} />
        </div>
        <div className='tabs-item'>
          <div className='item-title'>中文字幕:</div>
          <SecondarySubtitleBox {...props} />
          <ColorBox  {...props} label={'文字颜色'} propertyKey={'secondaryColor'} />
          <SecondaryFontSize {...props} />
        </div>
      </div>
    );
  }
  function renderTool() {
    return <div className='tabs-content'><Tool {...props} /></div>
  }
}
function SubtitleBox({ config, setConfig }: LocalProps) {
  return <input type='checkbox' checked={config.visibleText1} onChange={(event => {
    setConfig({ ...config, visibleText1: event.target.checked })
  })}></input>;
}
function SecondarySubtitleBox({ config, setConfig }: LocalProps) {
  return <input type='checkbox' checked={config.visibleText2} onChange={(event => {
    setConfig({ ...config, visibleText2: event.target.checked })
  })}></input>;
}
function FontSize({ config, setConfig }: LocalProps) {
  return (
    <div className='item-content'>
      <div className='sub-title'>字号</div>
      <div className='sub-value'>
        <input className="range" type="range" min="0" max="50" step="1" value={config.fontSize}
          onChange={(event) => {
            setConfig({ ...config, fontSize: parseInt(event.target.value) })
          }}></input>
      </div>
      <div className='sub-text'>{config.fontSize}px</div>
    </div>
  );
}
function SecondaryFontSize({ config, setConfig }: LocalProps) {
  return (
    <div className='item-content'>
      <div className='sub-title'>字号</div>
      <div className='sub-value'>
        <input className="range" type="range" min="0" max="30" step="1" value={config.secondaryFontSize}
          onChange={(event) => {
            setConfig({ ...config, secondaryFontSize: parseInt(event.target.value) })
          }}></input>
      </div>
      <div className='sub-text'>{config.secondaryFontSize}px</div>
    </div>
  );
}
function WordSpace({ config, setConfig }: LocalProps) {
  return (
    <div className='item-content'>
      <div className='sub-title'>字距</div>
      <div className='sub-value'>
        <input className="range" type="range" min="0" max="10" step="1" value={config.spacing}
          onChange={(event) => {
            setConfig({ ...config, spacing: parseInt(event.target.value) })
          }}></input>
      </div>
      <div className='sub-text'>{config.spacing}px</div>
    </div>
  );
}
function BottomDistance({ config, setConfig }: LocalProps) {
  return (
    <div className='item-content'>
      <div className='sub-title'>底距</div>
      <div className='sub-value'>
        <input className="range" type="range" min="0" max="40" step="1" value={config.marginBottom}
          onChange={(event) => {
            setConfig({ ...config, marginBottom: parseInt(event.target.value) })
          }}></input>
      </div>
      <div className='sub-text'>{config.marginBottom}px</div>
    </div>
  );
}
function ColorBox({ config, setConfig, label, propertyKey }: LocalProps & { label: string, propertyKey: string, width?: number }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className='item-content'>
      <div className='sub-title'>{label}</div>
      <div className='sub-value'>
        <div className='color-box' onClick={() => setVisible(!visible)}>
          <div className='color-area' style={{ background: config[propertyKey] }} />
          <div className='color-picker' hidden={!visible}>
            <CompactPicker color={config[propertyKey]} onChangeComplete={(color) => {
              setConfig({ ...config, [propertyKey]: color.hex })
              setVisible(false);
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}