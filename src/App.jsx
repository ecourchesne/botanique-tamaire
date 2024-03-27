import './app.scss'
import { useEffect, useState } from 'react'
import WebFont from 'webfontloader'
import mqtt from 'mqtt'
import Chart from 'chart.js/auto'

import Nav from './components/Navbar/Navbar'

let chartInstance

function App() {
    const [connection, setConnection] = useState({ status: false, garden: '' })
    const [error, setError] = useState('')
    const [temperature, setTemperature] = useState(null)
    const [humidity, setHumidity] = useState(null)
    const [localHumidity, setLocalHumidity] = useState([null, null, null, null])
    const [graphData, setGraphData] = useState(null)

    useEffect(() => {
        WebFont.load({
            google: {
                families: [
                    'Montserrat:200,300,400,500,600,700,800',
                    'Montserrat Alternates:200,300,400,500,600,700,800',
                    'sans-serif',
                ],
            },
        })

        const timeout = setTimeout(() => {
            const client = mqtt.connect('ws://172.16.72.223:9001')

            // change connection state
            client.on('connect', () => {
                setConnection({ status: true, garden: 'Plante IOT' })
                console.log('connected')

                client.subscribe('iot/tempglobal', err => {
                    if (err) {
                        setError(err.message)
                    } else {
                        setError('')
                    }
                })
                client.subscribe('iot/humglobal', err => {
                    if (err) {
                        setError(err.message)
                    } else {
                        setError('')
                    }
                })
                client.subscribe('iot/humlocal', err => {
                    if (err) {
                        setError(err.message)
                    } else {
                        setError('')
                    }
                })
                client.subscribe('iot/errors', err => {
                    if (err) {
                        setError(err.message)
                    } else {
                        setError('')
                    }
                })
            })

            // handle incoming messages
            client.on('message', (topic, message) => {
                if (topic === 'iot/tempglobal') {
                    const data = Number(message.toString())
                    setTemperature(data)
                } else if (topic === 'iot/humglobal') {
                    const data = Number(message.toString())
                    setHumidity(data)
                } else if (topic === 'iot/humlocal') {
                    const data = JSON.parse(message.toString())
                    setLocalHumidity(data)
                } else if (topic === 'iot/errors') {
                    const data = JSON.parse(message.toString())
                    console.log('Error: ', data)
                    if (data?.state === 'on') setError(data?.msg)
                    else setError('')
                }
            })

            client.on('error', err => {
                setError(err.message)
            })

            client.on('close', () => {
                setConnection({ status: false, garden: '' })
            })

            fetchHumidity()
        }, 1500)

        const interval = setInterval(() => {
            fetchHumidity()
        }, 5000)

        return () => {
            clearTimeout(timeout)
            clearInterval(interval)
        }
    }, [])

    const fetchHumidity = async () => {
        const response = await fetch('http://172.16.72.223/getHumidity.php')
        const _data = await response.json()

        console.log(_data)
        setGraphData(_data)
    }

    useEffect(() => {
        if (graphData) drawGraph()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [graphData])

    const drawGraph = () => {
        const ctx = document.querySelector('.graph-wrap')?.getContext('2d')

        // Destroy the previous chart instance if it exists
        if (chartInstance) {
            chartInstance.destroy()
        }

        // Create a new chart instance
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: graphData.map((item, i) => 10 - i),
                datasets: [
                    {
                        label: 'Plante 1',
                        data: graphData.map(item => item?.plant1),
                    },
                    {
                        label: 'Plante 2',
                        data: graphData.map(item => item?.plant2),
                    },
                    {
                        label: 'Plante 3',
                        data: graphData.map(item => item?.plant3),
                    },
                    {
                        label: 'Plante 4',
                        data: graphData.map(item => item?.plant4),
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: false,
                    },
                    legend: {
                        display: true,
                        position: 'bottom',
                    },
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10,
                    },
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: false,
                            text: 'Month',
                        },
                        ticks: {
                            display: false,
                        },
                    },
                    y: {
                        display: true,
                        title: {
                            display: false,
                            text: 'Humidity',
                        },
                    },
                },
                elements: {
                    line: {
                        borderColor: '#b5f0a1', // Change line color to green
                        backgroundColor: '#e5f9e0', // Fill color (if desired)
                    },
                },
            },
        })
    }

    return (
        <div id="app">
            <Nav connection={connection} error={error} />

            <main>
                <div className="card white-green stats">
                    <h2>Qualité de l&apos;air</h2>
                    <div className="card light-green global">
                        <p>
                            Humidité globale: <span>{humidity}%</span>
                        </p>
                        <p>
                            Température: <span>{temperature}&deg;</span>
                        </p>
                    </div>
                    <div className="card inner light-green">
                        <h2>Plante 1</h2>
                        <p className="big-text">{localHumidity?.[0]}%</p>
                    </div>
                    <div className="card inner light-green">
                        <h2>Plante 2</h2>
                        <p className="big-text">{localHumidity?.[1]}%</p>
                    </div>
                    <div className="card inner light-green">
                        <h2>Plante 3</h2>
                        <p className="big-text">{localHumidity?.[2]}%</p>
                    </div>
                    <div className="card inner light-green">
                        <h2>Plante 4</h2>
                        <p className="big-text">{localHumidity?.[3]}%</p>
                    </div>
                </div>
                <div className="graphs">
                    <h2>Statistiques</h2>
                    <canvas className="graph-wrap"></canvas>
                </div>
            </main>
        </div>
    )
}

export default App
