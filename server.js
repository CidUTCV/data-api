const express = require('express');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DRIVE_CLIENT_ID = process.env.DRIVE_CLIENT_ID;
const DRIVE_CLIENT_SECRET = process.env.DRIVE_CLIENT_SECRET;
const DRIVE_REFRESH_TOKEN = process.env.DRIVE_REFRESH_TOKEN;

const oauth2Client = new google.auth.OAuth2(
  DRIVE_CLIENT_ID,
  DRIVE_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);
oauth2Client.setCredentials({ refresh_token: DRIVE_REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

const filePath = path.join(__dirname, 'data.csv');

// Crear el archivo CSV y escribir los encabezados si no existe
if (!fs.existsSync(filePath)) {
  const header = 'id,Date,Complete_hour,latitude,longitude,altitude,PM1,PM2.5,PM10,CO2,VOC,O3,CO,NO2,CH2O,temperature,humidity\n';
  fs.writeFileSync(filePath, header);
}

app.post('/uploads', (req, res) => {
  const gpsData = req.body.gps_data || '';
  const sensorData = req.body.sensor_data || '';

  // Procesar datos GPS
  let latitude_decimal = '';
  let longitude_decimal = '';
  let altitude = '';

  if (gpsData) {
    const parts = gpsData.split(',');
    if (parts.length >= 4) {
      try {
        const latitude_raw = parseFloat(parts[0]);
        const longitude_raw = parseFloat(parts[1]);
        altitude = parseFloat(parts[2]);

        const latitude_deg = Math.floor(latitude_raw / 100);
        const latitude_min = latitude_raw - (latitude_deg * 100);
        latitude_decimal = latitude_deg + (latitude_min / 60);

        const longitude_deg = Math.floor(longitude_raw / 100);
        const longitude_min = longitude_raw - (longitude_deg * 100);
        longitude_decimal = longitude_deg + (longitude_min / 60);

        longitude_decimal = -longitude_decimal; // Ajuste para longitud negativa en México
      } catch (error) {
        console.error('Error al procesar los datos GPS:', error);
      }
    }
  }

  // Procesar datos del sensor
  let sensorValues = '';
  if (sensorData) {
    sensorValues = sensorData.split(',');
    if (sensorValues.length === 11) {
      const row = [
        Date.now(), // id
        new Date().toISOString().split('T')[0], // Date
        new Date().toTimeString().split(' ')[0], // Complete_hour
        latitude_decimal,
        longitude_decimal,
        altitude,
        ...sensorValues
      ].join(',');

      fs.appendFile(filePath, row + '\n', (err) => {
        if (err) {
          console.error('Error al guardar los datos en el archivo:', err);
          res.status(500).send('Error al guardar los datos');
          return;
        }

        // Subir el archivo a Google Drive
        drive.files.create({
          requestBody: {
            name: `data_${Date.now()}.csv`,
            mimeType: 'text/csv',
            parents: ['1l3C7mBZt9XSjNgdINkg3w5JAAyJOYdW-'] // ID de la carpeta
          },
          media: {
            mimeType: 'text/csv',
            body: fs.createReadStream(filePath)
          }
        }, (err, file) => {
          if (err) {
            console.error('Error al subir el archivo a Google Drive:', err);
            res.status(500).send('Error al subir el archivo a Google Drive');
            return;
          }

          console.log('Archivo subido a Google Drive:', file.data);
          res.status(200).send('Datos recibidos y almacenados en Google Drive');
        });
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
