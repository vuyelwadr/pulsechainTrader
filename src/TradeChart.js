import React, { useEffect, useState, useRef } from 'react';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, Title, Tooltip, Legend, TimeScale, PointElement, LineElement, ScatterController, LineController } from 'chart.js';
import 'chartjs-adapter-luxon';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(zoomPlugin,CategoryScale, LinearScale, CandlestickController,LineController, CandlestickElement, ScatterController, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

const TradeChart = () => {
    const [chartData, setChartData] = useState({ datasets: [] });
    const [stats, setStats] = useState({});
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            // Replace this with your actual endpoint or method to fetch data
            const response = await fetch('/chart-data');
            const data = await response.json();

            setChartData({
                datasets: [
                    {
                        type: 'line',
                        label: 'SMA',
                        data: data.timestamps.map((timestamp, index) => ({ x: timestamp, y: data.sma[index] })),
                        backgroundColor: 'rgba(255, 165, 0, 0.2)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 2,
                        pointRadius: 0,
                    },
                    {
                        type: 'line',
                        label: 'Price',
                        data: data.timestamps.map((timestamp, index) => ({ x: timestamp, y: data.price[index] })),
                        backgroundColor: 'rgba(0, 0, 0, 0.2)', 
                        borderColor: 'rgba(0, 0, 0, 1)',  
                        borderWidth: 2,
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
/*
    useEffect(() => {
        const updateChart = () => {
            if (!chartRef.current) return;
            const chart = chartRef.current.chartInstance;

            const type = document.getElementById('type').value;
            chart.config.type = type;

            const scaleType = document.getElementById('scale-type').value;
            chart.config.options.scales.y.type = scaleType;

            const colorScheme = document.getElementById('color-scheme').value;
            if (colorScheme === 'neon') {
                chart.config.data.datasets[0].backgroundColors = {
                    up: '#01ff01',
                    down: '#fe0000',
                    unchanged: '#999',
                };
            } else {
                delete chart.config.data.datasets[0].backgroundColors;
            }

            const border = document.getElementById('border').value;
            if (border === 'false') {
                chart.config.data.datasets[0].borderColor = 'rgba(0, 0, 0, 0)';
            } else {
                chart.config.data.datasets[0].borderColor = 'rgba(0, 0, 0, 0.5)';
            }

            const mixed = document.getElementById('mixed').value;
            chart.config.data.datasets[1].hidden = mixed !== 'true';

            chart.update();
        };

        const selectors = ['type', 'scale-type', 'color-scheme', 'border', 'mixed'];
        selectors.forEach(id => document.getElementById(id).addEventListener('change', updateChart));

        return () => {
            selectors.forEach(id => document.getElementById(id).removeEventListener('change', updateChart));
        };
    }, []);
*/

const options = {
    scales: {
        x: {
            type: 'time',
            time: {
                unit: 'day',
                tooltipFormat: 'MMM DD',
            },
            // time: {
            //     unit: 'hour',  // Display the time in hours
            //     tooltipFormat: 'MMM DD, HH:mm', // Format for the tooltip
            // },
            title: {
                display: true,
                text: 'Time (Hours)',  // Label for the x-axis
            }
        },
        y: {
            beginAtZero: false,
            title: {
                display: true,
                text: 'Value',  // Label for the y-axis
            },
            ticks: {
                callback: function(value) {
                    return value.toFixed(10);  // Format the tick values to 5 decimal places
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
                <p>Buy and Hold Profit: {stats.buyAndHoldProfit} {stats.buyAndHoldProfit / stats.initialCapital * 100}%</p>
                <p>Total Profit: {stats.totalProfit} {stats.totalProfit / stats.initialCapital * 100}%</p>
                <p>Ending Account Size: {stats.endingAccountSize}</p>
                <p>Number of Trades: {stats.trades}</p>
                <p>Days Traded: {stats.daysTraded}</p>
            </div>
        </div>
    );
};

export default TradeChart;
