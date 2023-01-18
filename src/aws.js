const fs = require('fs');
const AWS = require('aws-sdk');

const uploadFileAWS = async (filePath) => {
  try {
    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });

    var stats = fs.statSync(filePath)

    if (process.env.AWS_MAX_SIZE >= stats.size) {

      const fileContent = fs.readFileSync(filePath);
      const params = {
        Bucket: process.env.BUCKET_NAME,
        Key: filePath,
        Body: fileContent
      };

      await s3.upload(params, function (err, data) {
        if (err) {
          console.error(err);
          return err;
        }
        console.log(`File uploaded successfully. ${data.Location}`);
      });
    }
    fs.unlinkSync(filePath, (err) => {
      if (err) {
        console.error(err);
        return err;
      }
      console.debug(`Local compressed file removed: ${filePath}`);
    })
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = { uploadFileAWS }