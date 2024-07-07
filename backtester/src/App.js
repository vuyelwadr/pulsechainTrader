import React from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import BacktestCandleStick from './BacktestCandleStick';
import Backtest from './Backtest';
import Trade from './Trade';

function App() {
    return (
        <div className="App">
            <nav>
                <ul>
                    <li><Link to="/BacktestCandleStick">BacktestCandleStick</Link></li>
                    <li><Link to="/Backtest">Backtest</Link></li>
                    <li><Link to="/trade">Trade</Link></li>
                    <li><Link to="/">Home</Link></li>
                </ul>
            </nav>
            <Routes>
                <Route path="/BacktestCandleStick" element={<BacktestCandleStick />} />
                <Route path="/Backtest" element={<Backtest />} />
                <Route path="/trade" element={<Trade />} />
                <Route path="/" element={<div><h1>Home Page</h1></div>} />
            </Routes>
        </div>
    );
}

export default App;
