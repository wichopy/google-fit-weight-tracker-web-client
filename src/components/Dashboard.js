import React from 'react'

import Card from 'react-bootstrap/Card'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Table from 'react-bootstrap/Table'
import { Line } from 'react-chartjs-2';

const Dashboard = ({
  signOut,
  getWeightData,
  points,
  duration,
  addBodyWeight,
}) => {

  let dataPoints = points.map(dataPoint => dataPoint.value)
  let labels = points.map(dataPoint => {
    if (duration === 'hourly') {
      let date = new Date(Number(dataPoint.time))
      return `${date.toLocaleTimeString()}`
    }

    return new Date(Number(dataPoint.time)).toLocaleDateString()
  })

  const lineData = {
    labels,
    datasets: [
      {
        label: 'My weight',
        fill: true,
        lineTension: 0.1,
        backgroundColor: 'rgba(75,192,192,0.4)',
        borderColor: 'rgba(75,192,192,1)',
        borderCapStyle: 'butt',
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: 'miter',
        pointBorderColor: 'rgba(75,192,192,1)',
        pointBackgroundColor: '#fff',
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: 'rgba(75,192,192,1)',
        pointHoverBorderColor: 'rgba(220,220,220,1)',
        pointHoverBorderWidth: 2,
        pointRadius: 5,
        pointHitRadius: 10,
        data: [
          ...dataPoints,
        ]
      }
    ]
  };

  return (
    <Container>
      <Row>
        <Col>
          <Button onClick={signOut} variant="danger">Sign Out</Button>
        </Col>

      </Row>

      <Row>
        <Col md={{ span: 8, offset: 2 }} xs={12}>
          History Duration:
          {['weekly', 'daily', 'hourly'].map(period => {
            return <Button
              key={period}
              variant={duration === period ? 'outline-primary' : 'primary'}
              onClick={() => getWeightData(period)}
            >
              {(() => {
                switch (period) {
                  case 'weekly':
                    return '3 Months'
                  case 'daily':
                    return '1 Week'
                  case 'hourly':
                    return '1 Day'
                  default:
                    return 'na';
                }
              })()}
            </Button>
          })}

        </Col>
        <Col md={{ span: 8, offset: 2 }} xs={12}>
          <Card>
            <Line data={lineData} style={{ width: '80%' }} />
          </Card>
        </Col>
      </Row>
      <Row>

        <Col xs={{ span: 8, offset: 2 }}>
          <h2>Log Entries</h2>
        </Col>
        <Col xs={{ span: 8, offset: 2 }}>
          <Card>
            <Table responsive>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight (kg)</th>
                </tr>
              </thead>
              <tbody>
                {
                  points
                    .filter(point => point.value)
                    .sort((a, b) => {
                      if (b.time < a.time) return -1;

                      if (b.time > a.time) return 1

                      return 0
                    })
                    .map(point => {
                      return <tr> <td>
                        {new Date(Number(point.time)).toLocaleDateString()}
                      </td>
                        <td>
                          {point.value}
                        </td>
                      </tr>
                    })}
              </tbody>
            </Table>
          </Card>
        </Col>

      </Row>

      <Button onClick={addBodyWeight}>Add New Entry</Button>
    </Container>
  )
}

export default Dashboard