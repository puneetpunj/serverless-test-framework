const AWS = require("aws-sdk");
AWS.config.update({
  region: "ap-southeast-2"
});
const s3 = new AWS.S3({
  apiVersion: "2006-03-01"
});
const docClient = new AWS.DynamoDB.DocumentClient();

// const putDataIntoDynamo = async (id, dataisfor) => {
module.exports.putDataIntoDynamo = async (tablename, details) => {
  let params = {
    TableName: tablename,
    Item: details
  };
  console.log(params);
  return docClient.put(params).promise();
};

module.exports.queryDynamo = async (tablename, existingdatafrom) => {
  params = {
    TableName: tablename,
    KeyConditionExpression: "dataIsFor = :dataisforvalue",
    // ExpressionAttributeNames: {
    //     "#dataisforkey": "dataIsFor"
    // },
    ExpressionAttributeValues: {
      ":dataisforvalue": existingdatafrom
    }
  };
  return await docClient.query(params).promise();
};

module.exports.putItemonS3 = async function(dataisfor, id) {
  const bucketName = "scrmnonprod-scrm-buid-siebel-to-sf-sit4-qa-artefacts";

  const params = {
    Bucket: bucketName,
    Key: dataisfor,
    Body: id
  };
  let putObjectPromise = s3.putObject(params).promise();
  return putObjectPromise;
};

module.exports.getFileFromS3 = async function(existingdatafrom) {
  const bucketName = "scrmnonprod-scrm-buid-siebel-to-sf-sit4-qa-artefacts";
  const params = { Bucket: bucketName, Key: existingdatafrom };

  // try {
  //     const headCode = await s3.headObject(params).promise();
  //     const signedUrl = await s3.getSignedUrl('getObject', params);
  //     var file = require('fs').createWriteStream(existingdatafrom);
  //     s3.getObject(params).createReadStream().pipe(file);
  //     return 'success'
  // } catch (headErr) {
  //     if (headErr.code === 'NotFound') {
  //         console.log(filename + ' not found in bucket: ' + bucket + " due to: " + headErr)
  //     }
  //     return 'failure ' + headErr
  // }
  return s3.getObject(params).promise();
};
