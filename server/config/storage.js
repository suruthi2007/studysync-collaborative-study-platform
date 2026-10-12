const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');

const s3Configured = Boolean(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET
);

let s3Client = null;
if (s3Configured) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
  console.log(' AWS S3 Client initialized.');
} else {
  console.log(' AWS S3 not configured in .env. Using local uploads directory.');
}

// Ensure uploads folder exists for local mode
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const uploadFile = async (file) => {
  if (s3Configured && s3Client) {
    const key = `resources/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const fileContent = fs.readFileSync(file.path);
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileContent,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);
    
    // Clean up temporary local file after S3 upload
    fs.unlinkSync(file.path);

    const region = process.env.AWS_REGION || 'us-east-1';
    const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;
    return {
      fileUrl: s3Url,
      storageType: 's3',
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
    };
  }

  // Local file storage
  const filename = path.basename(file.path);
  const localUrl = `/uploads/${filename}`;
  return {
    fileUrl: localUrl,
    storageType: 'local',
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
  };
};

module.exports = {
  uploadFile,
  s3Configured,
  uploadsDir,
};
