import React from 'react';
import CustomChart from './CustomChart';

function Backtest() {
    return (
        <div className="Backtest">
            <h1>Trading Chart</h1>
            <CustomChart />
            {/* <div>
                Bar Type:
                <select id="type">
                    <option value="candlestick" selected>Candlestick</option>
                    <option value="ohlc">OHLC</option>
                </select>
                Scale Type:
                <select id="scale-type">
                    <option value="linear" selected>Linear</option>
                    <option value="logarithmic">Logarithmic</option>
                </select>
                Color Scheme:
                <select id="color-scheme">
                    <option value="muted" selected>Muted</option>
                    <option value="neon">Neon</option>
                </select>
                Border:
                <select id="border">
                    <option value="true" selected>Yes</option>
                    <option value="false">No</option>
                </select>
                Mixed:
                <select id="mixed">
                    <option value="true">Yes</option>
                    <option value="false" selected>No</option>
                </select>
            </div> */}
        </div>
    );
}

export default Backtest;
