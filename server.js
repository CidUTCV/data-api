const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta para recibir datos
app.post('/uploads', (req, res) => {
  const gpsData = req.body.gps_data || '';
  const sensorData = req.body.sensor_data || '';

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
  const fileName = `data_${timestamp}.csv`;
  const filePath = path.join(__dirname, 'uploads', fileName);

  const line = `${timestamp},${gpsData},${sensorData}\n`;

  fs.mkdir(path.dirname(filePath), { recursive: true }, (err) => {
    if (err) {
      console.error('Error al crear directorio:', err);
      res.status(500).send('Error al crear directorio');
      return;
    }

    fs.writeFile(filePath, line, { flag: 'a' }, (err) => {
      if (err) {
        console.error('Error al escribir en el archivo:', err);
        res.status(500).send('Error al guardar los datos');
        return;
      }
      
      console.log('Datos almacenados en el archivo CSV');
      res.status(200).send('Datos recibidos y almacenados');
    });
  });
});

app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  res.sendFile(filePath);
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
