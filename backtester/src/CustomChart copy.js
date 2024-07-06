import React, { useEffect, useState } from 'react';
import { Chart } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import 'chartjs-adapter-luxon';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';

ChartJS.register(CategoryScale, LinearScale, CandlestickController, CandlestickElement, LineElement, Title, Tooltip, Legend);

const CustomChart = () => {
    const [chartData, setChartData] = useState({ datasets: [] });

    useEffect(() => {
        const fetchData = async () => {
            const response = await fetch('/chart-data');
            const data = await response.json();

            setChartData({
                datasets: [
                    {
                        label: 'Candlestick',
                        data: data,
                        type: 'candlestick',
                        borderColor: '#000000',
                        borderWidth: 1,
                    },
                    {
                        type: 'line',
                        label: 'Close Prices',
                        data: data.map(d => ({ x: d.t, y: d.c })),
                        backgroundColor: 'rgba(75,192,192,0.2)',
                        borderColor: 'rgba(75,192,192,1)',
                        borderWidth: 1,
                    }
                ]
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
