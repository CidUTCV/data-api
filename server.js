const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 10000; // Ajusta el puerto según sea necesario

// Configura el middleware para procesar datos JSON
app.use(bodyParser.json());

// Carga las credenciales de Google Drive desde variables de entorno
const DRIVE_CLIENT_ID = process.env.DRIVE_CLIENT_ID;
const DRIVE_CLIENT_SECRET = process.env.DRIVE_CLIENT_SECRET;
const DRIVE_REFRESH_TOKEN = process.env.DRIVE_REFRESH_TOKEN;

// Verifica si las credenciales están definidas
if (!DRIVE_CLIENT_ID || !DRIVE_CLIENT_SECRET || !DRIVE_REFRESH_TOKEN) {
  console.error('Faltan credenciales de Google Drive en las variables de entorno.');
  process.exit(1);
}

// Configura la autenticación con Google Drive
const oauth2Client = new google.auth.OAuth2(DRIVE_CLIENT_ID, DRIVE_CLIENT_SECRET);
oauth2Client.setCredentials({ refresh_token: DRIVE_REFRESH_TOKEN });
const drive = google.drive({ version: 'v3', auth: oauth2Client });

app.post('/upload', async (req, res) => {
  try {
    const { sensor_data, gps_data } = req.body;

    if (!sensor_data || !gps_data) {
      return res.status(400).send('Faltan datos en la solicitud.');
    }

    // Supongamos que sensor_data es un array de objetos
    const sortedSensorData = sensor_data.sort((a, b) => a.timestamp - b.timestamp);

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `data_${timestamp}.csv`;

    // Crear el archivo CSV en el servidor
    const csvContent = [
      'timestamp,sensor_value,gps_lat,gps_long', // Asegúrate de que estos encabezados coincidan con los datos
      ...sortedSensorData.map(item => `${item.timestamp},${item.sensor_value},${gps_data.lat},${gps_data.long}`)
    ].join('\n');

    fs.writeFileSync(filename, csvContent);

    // Subir el archivo CSV a Google Drive
    const fileMetadata = {
      name: filename,
      parents: ['1l3C7mBZt9XSjNgdINkg3w5JAAyJOYdW-'] // ID de la carpeta en Google Drive
    };
    const media = {
      mimeType: 'text/csv',
      body: fs.createReadStream(filename),
    };
    await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    // Elimina el archivo después de subirlo
    fs.unlinkSync(filename);

    res.status(200).send('Datos subidos correctamente.');
  } catch (error) {
    console.error('Error al subir datos:', error);
    res.status(500).send(`Error al subir datos: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
