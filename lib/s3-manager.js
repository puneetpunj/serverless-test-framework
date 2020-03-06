const AWS = require("aws-sdk"),
  fs = require("fs"),
  path = require("path");
AWS.config.update({
  region: "ap-southeast-2"
});
var s3 = new AWS.S3({ apiVersion: "2006-03-01" }),
  folderPath = process.env.folderPath || "/tmp/";

module.exports.getFileFromS3 = async function(bucket, filename) {
  var params = { Bucket: bucket, Key: filename };
  try {
    const headCode = await s3.headObject(params).promise();
    const signedUrl = await s3.getSignedUrl("getObject", params);
    var file = require("fs").createWriteStream(folderPath + filename);
    s3.getObject(params)
      .createReadStream()
      .pipe(file);
    return "success";
  } catch (headErr) {
    if (headErr.code === "NotFound") {
      console.log(
        filename + " not found in bucket: " + bucket + " due to: " + headErr
      );
    }
    return "failure " + headErr;
  }
};

module.exports.getRandomRecordFromcsvfile = async function(csvFileName, index) {
  try {
    //pick one record from output file
    var fileContents = fs.readFileSync(folderPath + csvFileName);
    var lines = fileContents.toString().split("\n");
    return lines[index];
  } catch (err) {
    return err;
  }
};

module.exports.uploadFileOnS3 = async function(
  bucketName,
  distFolderPath,
  bucketFolder
) {
  s3 = new AWS.S3({
    apiVersion: "2006-03-01"
  });
  // read zip file
  var zipStream = fs.createReadStream(distFolderPath);

  // upload file to S3
  s3.putObject(
    {
      Bucket: bucketName,
      Key: bucketFolder,
      Body: zipStream
    },
    res => {
      console.log(
        `Successfully uploaded '${distFolderPath}' on '${bucketName}' ! '${res}'`
      );
    }
  );
};

module.exports.uploadDir = function(s3Path, bucketName, folderName) {
  s3 = new AWS.S3({
    apiVersion: "2006-03-01"
  });

  walkSync(s3Path, function(filePath, stat) {
    let bucketPath = folderName + "/" + filePath.substring(s3Path.length + 1);

    let params = {
      Bucket: bucketName,
      Key: bucketPath,
      Body: fs.readFileSync(filePath)
    };
    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log(
          "Successfully uploaded " + bucketPath + " to " + bucketName
        );
      }
    });
  });
};

function walkSync(currentDirPath, callback) {
  fs.readdirSync(currentDirPath).forEach(function(name) {
    var filePath = path.join(currentDirPath, name);
    var stat = fs.statSync(filePath);
    if (stat.isFile()) {
      callback(filePath, stat);
    } else if (stat.isDirectory()) {
      walkSync(filePath, callback);
    }
  });
}

module.exports.copyFile = function(fileFullPath, bucketName, fileName) {
  s3 = new AWS.S3({
    apiVersion: "2006-03-01"
  });
  fs.readFile(fileFullPath, function(err, data) {
    if (err) {
      throw err;
    }
    params = { Bucket: bucketName, Key: fileName, Body: data };
    s3.putObject(params, function(err, data) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully uploaded data to myBucket/myKey" + JSON.stringify(data));
      }
    });
  });
};
