const fs = require('fs');
const { exec } = require('child_process');
const compress = require('gzipme');

const { uploadFileAWS } = require('./aws');

const backupDB = async (dbName) => {
  try {
    const date = new Date();
    const currentDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}:${date.getMinutes()}`;
    const backupFolder = `backup/${dbName}`;
    const backupFilePath = `${backupFolder}/${dbName}-backup_${currentDate}`;

    if (!fs.existsSync(backupFolder)) {
      fs.mkdirSync(backupFolder, { recursive: true });
    }
    exec(`sh ./backup.sh ${process.env.DB_PASS} ${process.env.DB_HOST} ${process.env.DB_USER} ${process.env.DB_PORT} ${dbName} ${backupFilePath}`,
      async (err, stdout, stderr) => {
        if (err) {
          return console.error(`exec error: ${err}`);
        };
        if (stderr) {
          return console.error(`stderr: ${stderr}`);
        };

        console.log(`Created a backup of ${dbName} at ${date.toLocaleString()} successfully: ${stdout}`);
        await compress(backupFilePath)
        const compressFilePath = backupFilePath + '.gz'
        console.log(`Compressed file created: ${compressFilePath}`);

        fs.unlink(backupFilePath, (err) => {
          if (err) {
            console.error(err);
            return err;
          }
          console.log(`Local file removed: ${backupFilePath}`);
        })

        await uploadFileAWS(compressFilePath, backupFolder);
      })
  } catch (err) {
    console.error(err);
    return err;
  }
}

module.exports = { backupDB }