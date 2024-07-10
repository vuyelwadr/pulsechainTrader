import React, { useEffect, useState, useRef } from 'react';
import { Chart } from 'react-chartjs-2';
import {
    Chart as ChartJS, CategoryScale, LinearScale, Title, Tooltip, Legend,
    TimeScale, PointElement, LineElement, ScatterController, LineController
} from 'chart.js';
import 'chartjs-adapter-luxon';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(
    CategoryScale, LinearScale, CandlestickController, CandlestickElement,
    ScatterController, PointElement, LineElement, LineController,
    Title, Tooltip, Legend, TimeScale, zoomPlugin
);

const BacktestChart = () => {
    const [chartData, setChartData] = useState({ datasets: [] });
    const [stats, setStats] = useState({});
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('/backtest-data');
            const data = await response.json();

            setChartData({
                datasets: [
                    {
                        type: 'line',
                        label: 'SMA',
                        data: data.timestamps.map((timestamp, index) => ({ x: timestamp, y: data.sma[index] })),
                        backgroundColor: 'rgba(255, 165, 0, 0.2)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 4,
                        pointRadius: 0,
                    },
                    {
                        type: 'line',
                        label: 'Price',
                        data: data.timestamps.map((timestamp, index) => ({ x: timestamp, y: data.price[index] })),
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        borderColor: 'rgba(0, 0, 0, 1)',
                        borderWidth: 4,
                        pointRadius: 0,
                    },
                    {
                        type: 'scatter',
                        label: 'Buy/Sell Points',
                        data: data.buySellPoints.map(point => ({
                            x: point.timestamp,
                            y: point.sma,
                        })),
                        backgroundColor: data.buySellPoints.map(point => point.type === 'buy' ? 'green' : 'red'),
                        borderColor: data.buySellPoints.map(point => point.type === 'buy' ? 'green' : 'red'),
                        borderWidth: 4,
                        pointRadius: 4,
                    }
                ]
            });

            setStats({
                initialCapital: data.initialCapital,
                buyAndHoldProfit: data.buyAndHoldProfit,
                totalProfit: data.totalProfit,
                endingAccountSize: data.endingAccountSize,
                trades: data.trades,
                daysTraded: data.daysTraded
            });
        };

        fetchData();
    }, []);

    const options = {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    tooltipFormat: 'MMM DD',
                },
                title: {
                    display: true,
                    text: 'Time (days)',
                }
            },
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: 'Value',
                },
                ticks: {
                    callback: function (value) {
                        return value.toFixed(10);
                    }
                }
            }
        },
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'xy',
                    onPanComplete: () => {
                        chartRef.current.update();
                    }
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true,
                    },
                    mode: 'xy',
                    onZoomComplete: () => {
                        chartRef.current.update();
                    }
                }
            }
        }
    };

    return (
        <div>
            <Chart ref={chartRef} type='candlestick' data={chartData} options={options} />
            <div className="stats">
                <h2>Statistics</h2>
                <p>Initial Capital: {stats.initialCapital}</p>
                <p>Buy and Hold Profit: {stats.buyAndHoldProfit} ({(stats.buyAndHoldProfit / stats.initialCapital * 100).toFixed(2)}%)</p>
                <p>Total Profit: {stats.totalProfit} ({(stats.totalProfit / stats.initialCapital * 100).toFixed(2)}%)</p>
                <p>Ending Account Size: {stats.endingAccountSize}</p>
                <p>Number of Trades: {stats.trades}</p>
                <p>Days Traded: {stats.daysTraded}</p>
            </div>
        </div>
    );
};

export default BacktestChart;
