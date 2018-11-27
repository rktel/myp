import { Plates } from '../../../imports/api/collections'
import { streamer } from '../../../imports/api/streamers'

const p = (...arg) => console.log(...arg)

const sql = require("mssql")



const config = {
    server: 'localhost',
    database: 'Antapaccay',
    user: 'sa',
    password: 'HE5B2hyr',
	connectionTimeout : 0,
	requestTimeout : 0,
	pool: {
        max: 20,
        min: 0,
        idleTimeoutMillis: 30000
    },
	/*
    options: {
	    // encrypt: true // Use this if you're on Windows Azure
    }*/
}

Meteor.methods({
    arrayPlatesExist: function () {
        const plates = Plates.findOne({ _id: 1 })
        if (plates && plates.plates.length > 0) {
            return true
        } else {
            return false
        }

    },
    createArrayPlates: function () {
        Plates.upsert({ _id: 1 }, { $set: { plates: [] } })
    },
    updatePlates: function () {
        (async function () {
            try {
                let pool = await sql.connect(config)
                let result = await pool.request().execute('sp_getPlates')
                result.recordset.map((element, index, array) => {
                    Plates.update({ _id: 1 }, { $addToSet: { plates: element.plate } })
                })
                sql.close();
            } catch (err) {
                console.log('Error updatePlates', err);
				sql.close();
            }
        })()
    },
    getReport: function (userID,plates, dateTimeStart, dateTimeEnd) {

        (async function () {
            try {
                let pool = await sql.connect(config)
                let result = await pool.request()
                    .input('plates', plates)
                    .input('dateTimeStart', dateTimeStart)
                    .input('dateTimeEnd', dateTimeEnd)
                    .execute('sp_getReport')

                // generateFullReport(result.rowsAffected, result.recordset, dateTimeStart, dateTimeEnd)
               generateFullReport(userID, result.rowsAffected, result.recordset)
                sql.close();

            } catch (err) {
                console.log('Error getReport', err);
				sql.close();
            }
        })()
    }
});
//function generateFullReport(_rowsTotal, recordset, _dateTimeStart, _dateTimeEnd) {
function generateFullReport(userID, _rowsTotal, recordset) {
    const rowsTotal = _rowsTotal[0]
    let Rows = []
   // p('totalFilas:', rowsTotal);

    //const inputFechaHoraStart = stringToDateTime(_dateTimeStart)
    //const inputFechaHoraEnd = stringToDateTime(_dateTimeEnd)

    if (rowsTotal > 0) {
       
        recordset.map((row, index, rowArray) => {
			//  console.log(row.velocidad)
            if (index > 0 && row.placa != rowArray[index - 1].placa) {
                const dateTime4 = getDateAndTime(row.fechaHora)
                const date4 = dateTime4.date
                const time4 = dateTime4.time
                Rows.push({
                    //fechaHora: row.fechaHora,
                    fecha: date4,
                    hora: time4,
                    estado: row.estado ? 'En movimiento' : 'Detenido',
                    lat: row.lat,
                    lon: row.lon,
                    velocidad: row.velocidad,
                    odometro: row.odometro,
                    direccion: row.direccion,
                    geozona: row.geozona,
                    conductor: row.conductor,
                    placa: row.placa
                })
            } else {
                if (index > 0 && index <= (rowsTotal - 1)) {
                    const diffMinutes = getMinutesDiff(row.fechaHora, rowArray[index - 1].fechaHora)
                    if (diffMinutes > 1) {
                        const beforeRow = rowArray[index - 1]
                        for (let i = 1; i < diffMinutes; i++) {
                            const dateTime0 = getDateAndTime(addMinutes(beforeRow.fechaHora, i))
                            const date0 = dateTime0.date
                            const time0 = dateTime0.time
                            Rows.push({
                                //fechaHora: addMinutes(beforeRow.fechaHora, i),
                                fecha: date0,
                                hora: time0,
                                estado: beforeRow.estado ? 'En movimiento' : 'Detenido',
                                lat: beforeRow.lat,
                                lon: beforeRow.lon,
                                velocidad: beforeRow.velocidad,
                                odometro: beforeRow.odometro,
                                direccion: beforeRow.direccion,
                                geozona: beforeRow.geozona,
                                conductor: beforeRow.conductor,
                                placa: beforeRow.placa
                            })
                        }
                        const dateTime1 = getDateAndTime(row.fechaHora)
                        const date1 = dateTime1.date
                        const time1 = dateTime1.time
                        Rows.push({
                            // fechaHora: row.fechaHora,
                            fecha: date1,
                            hora: time1,
                            estado: row.estado ? 'En movimiento' : 'Detenido',
                            lat: row.lat,
                            lon: row.lon,
                            velocidad: row.velocidad,
                            odometro: row.odometro,
                            direccion: row.direccion,
                            geozona: row.geozona,
                            conductor: row.conductor,
                            placa: row.placa
                        })
                    } else {
                        const dateTime2 = getDateAndTime(row.fechaHora)
                        const date2 = dateTime2.date
                        const time2 = dateTime2.time
                        Rows.push({
                            //  fechaHora: row.fechaHora,
                            fecha: date2,
                            hora: time2,
                            estado: row.estado ? 'En movimiento' : 'Detenido',
                            lat: row.lat,
                            lon: row.lon,
                            velocidad: row.velocidad,
                            odometro: row.odometro,
                            direccion: row.direccion,
                            geozona: row.geozona,
                            conductor: row.conductor,
                            placa: row.placa
                        })
                    }
                } else {
                    const dateTime3 = getDateAndTime(row.fechaHora)
                    const date3 = dateTime3.date
                    const time3 = dateTime3.time
                    Rows.push({
                        //fechaHora: row.fechaHora,
                        fecha: date3,
                        hora: time3,
                        estado: row.estado ? 'En movimiento' : 'Detenido',
                        lat: row.lat,
                        lon: row.lon,
                        velocidad: row.velocidad,
                        odometro: row.odometro,
                        direccion: row.direccion,
                        geozona: row.geozona,
                        conductor: row.conductor,
                        placa: row.placa
                    })
                }
            }

            if (index == 0) { }
            if (index == rowsTotal - 1) { }

        })
        streamer.emit('Rows',userID, Rows)
         p('Rows.length: ', Rows.length)
   
    }else{
        // p('No hay data')
        streamer.emit('NoData',userID, 0)
      
    }
    
}
function addZero(data) {
    return data < 10 ? '0' + data : data
}
function getDateAndTime(dateTime_) {
    const millis = getTimeMillis(dateTime_) + 18000000
    const dateTime = new Date(millis)
    const year = dateTime.getFullYear()
    const month = addZero(dateTime.getMonth() + 1)
    const day = addZero(dateTime.getDate())
    const hour = addZero(dateTime.getHours())
    const minute = addZero(dateTime.getMinutes())
    return {
        date: day + '/' + month + '/' + year,
        time: hour + ':' + minute
    }
}
function addMinutes(dateTime, number) {
    const addMillis = getTimeMillis(dateTime) + number * (60 * 1000)
    return new Date(addMillis)
}
function getMinutesDiff(dateTimeMax, dateTimeMin) {
    const diff = getTimeMillis(dateTimeMax) - getTimeMillis(dateTimeMin)
    return parseInt(diff / (60 * 1000))
}
/*
function stringToDateTime(data) {
    const splitSpace = data.split(' ')
    const date = splitSpace[0]
    const time = splitSpace[1]
    const splitDate = date.split('-')
    const splitTime = time.split(':')
    const preMillis = (new Date(splitDate[0], parseInt(splitDate[1]) - 1, splitDate[2], splitTime[0], splitTime[1], splitTime[2])).getTime()
    const millis = preMillis - 18000000

    return new Date(millis)

}
*/
function getTimeMillis(dateTime) {
    return (new Date(dateTime)).getTime()

}

