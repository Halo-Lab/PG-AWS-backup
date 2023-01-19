const fs = require('fs');
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const uploadFileAWS = async (filePath, folder) => {
  try {

    const fileContent = fs.readFileSync(filePath);
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: filePath,
      Body: fileContent
    };

    await s3.upload(params, async function (err, data) {
      if (err) {
        console.error(err);
        return err;
      }
      console.log(`File uploaded successfully. ${data.Location}`);

      // delete old backups
      await deleteFileAWS(folder)
    });

    fs.unlinkSync(filePath, (err) => {
      if (err) {
        console.error(err);
        return err;
      }
      console.log(`Local compressed file removed: ${filePath}`);
    })
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const deleteFileAWS = async (folder) => {
  console.log('Checking old backups from AWS.')
  s3.listObjectsV2(
    {
      Bucket: process.env.BUCKET_NAME,
      Prefix: folder
    }, function (err, data) {
      if (err) throw err;

      const currentDate = new Date();
      data.Contents.forEach(backupItem => {
        const backupDate = new Date(backupItem.LastModified);
        const timeDiff = currentDate.getTime() - backupDate.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

        if (diffDays > process.env.BACKUP_STORAGE_DURATION_DAYS) {
          s3.deleteObject({
            Bucket: process.env.BUCKET_NAME,
            Key: backupItem.Key
          }, function (err, data) {
            if (err) console.log(err, err.stack);

            console.log(`AWS backup removed: ${backupItem.Key}`);
          });
        } else {
          console.log(`AWS backups in folder ${folder} older ${process.env.BACKUP_STORAGE_DURATION_DAYS} day(s) not found.`)
        }
      })
    }
  );
}

module.exports = { uploadFileAWS }