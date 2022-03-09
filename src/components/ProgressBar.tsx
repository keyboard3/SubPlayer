import './ProgressBar.scss';

export default function Component({ processing }) {
    return (
        <div className='progressBar'>
            <div className="inner" style={{ width: `${processing}%` }}>
                <span>{`${processing.toFixed(2)}%`}</span>
            </div>
        </div>
    );
}