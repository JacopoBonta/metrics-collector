#!/bin/node

require('dotenv').config({ path: `${__dirname}/.env` })
const os = require('os')
const du = require('diskusage')
const Influx = require('influx')

const influx = new Influx.InfluxDB({
  host: process.env.INFLUXDB_HOST || 'localhost',
  port: process.env.INFLUXDB_PORT || 8086,
  database: process.env.INFLUXDB_DB,
  username: process.env.INFLUXDB_USER,
  password: process.env.INFLUXDB_USER_PASSWORD
})

const hostInfo = () => ({
  'user': os.userInfo().username,
  'hostname': os.hostname(),
  'platform': `${os.platform()} ${os.release()} ${os.arch()}`,
  'uptime': os.uptime()
})

const hostMetrics = () => ({
  'cores': os.cpus().length,
  'usage': os.cpus().reduce((acc, cpu) => acc + cpu.times.user, 0) / os.cpus().length,
  'memory_total': os.totalmem(),
  'memory_used': os.freemem(),
  'disk_total': du.checkSync('/').total,
  'disk_free': du.checkSync('/').free,
})

let { uptime, ...info } = hostInfo()
let { ...metrics } = hostMetrics()

datapoint = {
  tags: { ...info },
  fields: { ...metrics, uptime }
}

influx.writeMeasurement('metric', [datapoint])
  .then(() => console.log('Datapoint added'))
  .catch(error => {
    console.error('There was an error adding the data point.')
    console.error(error.stack)
    process.exit()
  })