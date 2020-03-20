const Mocha = require('mocha-parallel-tests').default;
const fs = require('fs')
const path = require('path')
const moment = require("moment-timezone")
const s3Manager = require('./lib/s3-manager')
const parentFolder = "/tmp/"
const bucketName = 'punj-bucket';
const testDir = 'test-scripts';
const AWS = require('aws-sdk');
const sns = new AWS.SNS({
    region: 'ap-southeast-2',
    apiVersion: '2010-03-31'
});
const params = {
    Message: `Hi there, \n\nLatest test run is Failed. Please see Dashboard for further details. \n Dashboard Link - http://10.0.5.81:3000 \n\n`,
    Subject: `Test Execution Results`,
    TopicArn: `arn:aws:sns:ap-southeast-2:864459042878:TestFailureNotification`
}

// exports.testexecution = (event) => {
    currentdatetime = moment().tz('Australia/Sydney').format('DDMMYYYY-HHmmss')
    const reportDirectory = 'execution-report-' + currentdatetime;
    const mocha = new Mocha({
        reporter: 'mochawesome',
        reporterOptions: {
            reportDir: parentFolder + reportDirectory,
            reportTitle : "Test Execution Report",
            reportPageTitle : "Test Report",
            charts : true
        }
    });

    // Add each .js file to the mocha instance
    fs.readdirSync(testDir).filter(function (file) {
        // Only keep the .js files
        return file.substr(-3) === '.js';
    }).forEach(function (file) {
        mocha.addFile(
            path.join(testDir, file)
        );
    });

    // Run the tests.
    return (new Promise((resolve, reject) => {
        mocha.run(function (failures) {

            process.exitCode = 0;
            console.log('BEFORE UPLOAD FILES');

            s3Manager.copyFile(parentFolder + reportDirectory + '/mochawesome.html', bucketName, `reports/html/execution-report-${currentdatetime}.html`);
            s3Manager.copyFile(parentFolder + reportDirectory + '/mochawesome.json', bucketName, `reports/json/execution-report-${currentdatetime}.json`);

            setTimeout(() => {
                if (failures) {
                    return sns.publish(params, function (err, data) {
                        if (err) return reject('test error and issue with SNS publish' + err)
                        return reject(`test error and successfully sent out comms to topic ${params.TopicArn} subscribers`)
                    })
                } else return resolve('done success')
            }, 1000);

        });
    }));
// }