const fs = require('fs');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const CREDENTIALS = {
  "installed": {
    "client_id": process.env.DRIVE_CLIENT_ID,
    "project_id": "drive-api-project-434005", // Asegúrate de que este ID sea correcto
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": process.env.DRIVE_CLIENT_SECRET,
    "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"]
  }
};

async function uploadFile(auth, fileName, content) {
  const drive = google.drive({ version: 'v3', auth });
  const fileMetadata = {
    name: fileName,
    parents: ['1l3C7mBZt9XSjNgdINkg3w5JAAyJOYdW-'] // Verifica que este ID de carpeta sea correcto
  };
  const media = {
    mimeType: 'text/csv',
    body: content
  };

  try {
    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });
    console.log('Archivo subido con ID:', response.data.id);
  } catch (error) {
    console.error('Error al subir el archivo:', error);
  }
}

async function main() {
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}`;
  const fileName = `data_${timestamp}.csv`;
  const fileContent = fs.readFileSync('data.csv', 'utf8');

  const { client_id, client_secret, redirect_uris } = CREDENTIALS.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  oAuth2Client.setCredentials({
    refresh_token: process.env.DRIVE_REFRESH_TOKEN
  });

  await uploadFile(oAuth2Client, fileName, fileContent);
}

main().catch(console.error);
