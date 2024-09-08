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
  'https://developers.google.com/oauthplayground' // Redirige a la Playground
);
oauth2Client.setCredentials({ refresh_token: DRIVE_REFRESH_TOKEN });

const drive = google.drive({ version: 'v3', auth: oauth2Client });

app.post('/uploads', (req, res) => {
  const gpsData = req.body.gps_data || '';
  const sensorData = req.body.sensor_data || '';

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
  const line = `${timestamp},${gpsData},${sensorData}\n`;

  const filePath = path.join(__dirname, 'data.csv');

  fs.writeFile(filePath, line, { flag: 'a' }, (err) => {
    if (err) {
      console.error('Error al guardar los datos:', err);
      res.status(500).send('Error al guardar los datos');
      return;
    }

    // Subir a Google Drive en una carpeta específica
    drive.files.create({
      requestBody: {
        name: `data_${timestamp}.csv`,
        mimeType: 'text/csv',
        parents: ['1l3C7mBZt9XSjNgdINkg3w5JAAyJOYdW-']  // ID de la carpeta
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
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
