const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
const dotenv = require('dotenv');
const stream = require('stream');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Create a new JWT client using the service account
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
const jwtClient = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/drive.file']
);

// Create a new Drive client
const drive = google.drive({ version: 'v3', auth: jwtClient });

async function uploadFile(fileBuffer, originalname, mimetype) {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileBuffer);

  const response = await drive.files.create({
    requestBody: {
      name: originalname,
      mimeType: mimetype,
      parents: ["1iggYuOCX_92JWfIqxS8D7o49JU_r5jJy"] // Your folder ID
    },
    media: {
      mimeType: mimetype,
      body: bufferStream
    },
  });

  return response.data.id;
}

app.post('/upload', express.raw({ type: 'image/*', limit: '5mb' }), async (req, res) => {
  if (!req.body || req.body.length === 0) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    const fileId = await uploadFile(req.body, req.headers['x-file-name'], req.headers['content-type']);
    res.json({ message: 'File uploaded successfully', fileId: fileId });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Error uploading file', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
