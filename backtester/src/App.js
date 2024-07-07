import React from 'react';
import { Route, Routes, Link } from 'react-router-dom';
import Backtest from './Backtest';
import Trade from './Trade';

function App() {
    return (
        <div className="App">
            <nav>
                <ul>
                    <li><Link to="/backtest">Backtest</Link></li>
                    <li><Link to="/trade">Trade</Link></li>
                    <li><Link to="/">Home</Link></li>
                </ul>
            </nav>
            <Routes>
                <Route path="/backtest" element={<Backtest />} />
                <Route path="/trade" element={<Trade />} />
                <Route path="/" element={<div><h1>Home Page</h1></div>} />
            </Routes>
        </div>
    );
}

export default App;
