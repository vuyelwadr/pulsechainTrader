import React, { useEffect, useState, useRef } from 'react';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, Title, Tooltip, Legend, TimeScale, PointElement, LineElement } from 'chart.js';
import 'chartjs-adapter-luxon';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';

ChartJS.register(CategoryScale, LinearScale, CandlestickController, CandlestickElement,PointElement,LineElement,  Title, Tooltip, Legend, TimeScale);

const CustomChart = () => {
    const [chartData, setChartData] = useState({ datasets: [] });
    const chartRef = useRef(null);
    useEffect(() => {
        const fetchData = async () => {
            // Replace this with your actual endpoint or method to fetch data
            const response = await fetch('/chart-data');
            const data = await response.json();

            setChartData({
                datasets: [
                    {
                        type: 'candlestick',
                        label: 'Candlestick',
                        data: data.timestamps.map((timestamp, index) => ({
                            x: timestamp,
                            o: data.openPrices[index],
                            h: data.highPrices[index],
                            l: data.lowPrices[index],
                            c: data.closePrices[index],
                        })),
                        borderColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black border
                        
                        borderWidth: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)', // Slightly transparent black background
                    
                    },
                    {
                        type: 'line',
                        label: 'SMA',
                        data: data.timestamps.map((timestamp, index) => ({ x: timestamp, y: data.sma[index] })),
                        backgroundColor: 'rgba(255, 165, 0, 0.2)',
                        borderColor: 'rgba(255, 206, 86, 1)',
                        borderWidth: 4,
                        pointRadius: 0,
                    }
                ]
            });
        };

        fetchData();
    }, []);

    useEffect(() => {
        const updateChart = () => {
            if (!chartRef.current) return;
            // const chart = chartRef.current;
            const chart = chartRef.current.chartInstance;
            console.log(chart)

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

    const options = {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'day',
                    tooltipFormat: 'MMM DD',
                }
            },
            y: {
                beginAtZero: false,
            }
        }
    };

    return <Chart type='candlestick' data={chartData} options={options} />;
};

export default CustomChart;