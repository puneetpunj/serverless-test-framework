// @ts-check
// "use strict"

// @ts-ignore
var lov = require('../config/lov.json'),
    envConfig = {}, //require(`../config/config.${env}.json`),
    // @ts-ignore
    addressListJSON = require('../config/address-list.json'),
    // @ts-ignore
    entities = require('./entities'),
    editJsonFile = require("edit-json-file"),
    path = require('path'),
    fs = require('fs'),
    moment = require('moment-timezone'),
    csvtojson = require("csvtojson"),
    DateGenerator = require('random-date-generator'),
    faker = require('faker');
faker.locale = "en_AU";
var randomAddressIndex = Math.floor(Math.random() * addressListJSON["BillingStreet"].length),
    inputdir = path.resolve(__dirname, "../data/input/");
const awslib = require('./aws');

module.exports.getRandomValue = function (nodeValue, nodeName) {
    // const getRandomValue = (nodeValue, nodeName) => {
    return mappers[nodeValue](nodeName);
}

const grv = (nodeValue, nodeName) => {
    // const getRandomValue = (nodeValue, nodeName) => {
    return mappers[nodeValue](nodeName);
}
const mappers = {
    randomNumber: () => Math.random().toString().slice(2, 10),
    randomMEID: () => '30' + Math.random().toString().slice(2, 9),
    randomCGID: () => '40' + Math.random().toString().slice(2, 12),
    randomCorrelationId: () => Math.floor(Math.random() * Math.floor(9999999999999)),
    randomMobileNumber: () => "+614" + Math.random().toString().slice(2, 10),
    randomConcatMobNum: () => "+614" + Math.random().toString().slice(2, 10),
    randomEmail: () => faker.internet.email(),
    randomOrgName: () => `${faker.company.companyName()} ${faker.company.companySuffix()}`,
    randomLandlineNumber: () => "+613" + Math.random().toString().slice(2, 10),
    randomString: () => 'PS' + Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5),
    randomLastName: () => faker.name.lastName(),
    randomFirstName: () => faker.name.firstName(),
    randomMiddleName: () => faker.name.firstName(),
    randomDate: () => {
        const startDate = new Date(1950, 0, 1);
        const endDate = new Date(2018, 0, 1);
        const unformattedDate = DateGenerator.getRandomDateInRange(startDate, endDate);

        return getFormattedDate(unformattedDate);
    },
    randomFutureDate: () => getFormattedDate(DateGenerator.getRandomDateInRange(new Date(), new Date(2020, 0, 1))),
    randomtimestamp: () => moment(new Date()).format('YYYYMMDDHHmmSSSSSS'),
    randomDateTimestamp: () => moment(new Date()).format('YYYY-MM-DDThh:mm:ssZ'),
    todayPlusNinetyDays: () => moment(new Date().setDate(new Date().getDate() + 90)),
    // 2017-11-01T01:10:34Z
    randomAddress: (nodeName) => addressListJSON[nodeName][randomAddressIndex],
    randomAmount: () => Math.random().toString().slice(2, 6)
};
// function getRandomLOVValue (nodeName) {
module.exports.getRandomLOVValue = function (nodeName) {
    let nodeValue = '';
    Object.keys(lov).forEach(function (key) {
        if (key == nodeName) {
            // // console.log(`array index is : ${lov[key].length}`)    
            nodeValue = lov[key][Math.floor(Math.random() * lov[key].length)];
            // console.log(`randomly generated value for ${nodeName} is : ${nodeValue}`)
        }

    })
    return nodeValue;
}

function getFormattedDate(date) {
    const year = date.getFullYear();

    let month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;

    let day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;

    return year + '-' + month + '-' + day;
}
async function processEntity(csvfile, requestType, numberofrecords) {
    let csvJSON, entityType;

    if (requestType.toLowerCase() == "dynamic") {
        csvJSON = dynamiccsvJSON(numberofrecords);
        entityType = csvfile.toLowerCase();
    } else if (requestType.toLowerCase() == "static") {
        csvJSON = await covertcsvtojson(csvfile);
        entityType = csvfile.split(".")[0].toLowerCase();
    }

    return Promise.all(csvJSON.map(csvrow => getQuery(csvrow, entityType)));
};

function dynamiccsvJSON(numberofrecords) {
    let finalJSON = [];
    for (let i = 0; i < numberofrecords; i++) {
        finalJSON.push({})
    }
    return finalJSON;
}
async function getQuery(csvrow, entityType) {

    let query
    // const entityType = csvfile.split(".")[0].toLowerCase();

    if (entities[entityType]) {
        query = entities[entityType].runDataLine(csvrow);
    }
    // console.log('my query : ' + JSON.stringify(query));
    return query;
    // return invokeSalesforce(query).catch(err => {
    //     console.error(err);
    //     return false;
    // });
}
async function covertcsvtojson(file) {
    // console.log(`${inputdir}${file}`)
    return csvtojson().fromFile(`${inputdir}/${file}`)
        .then(jsonObj => {
            // console.log(jsonObj);
            return jsonObj
        })
}

// let invokeSalesforce = (sfFinalRequest) => salesforceManager.sendMessages(sfFinalRequest, '', '', 'postcompositerequest');
// let sendpostrequest = (request, endpoint) => salesforceManager.sendMessages(request, '', '', 'sendpostrequest', endpoint);
// let salesforceQueryDetails = (objname, id) => salesforceManager.sendMessages('', objname, id, 'queryusingidfromcommonconfig');
// let sendSalesforceQuery = (querykeyname) => salesforceManager.sendMessages('', querykeyname, '', 'directqueryfromcommonconfig');
// let getMetadataDetails = (objname) => salesforceManager.sendMessages('', objname, '', 'metadata');
// let sendGetRequest = (endpoint) => salesforceManager.sendMessages('', '', '', 'sendgetrequest', endpoint);
// let sendQueryRequest = (endpoint) => salesforceManager.sendMessages('', '', '', 'sendqueryrequest', endpoint);
// let sendpatchrequest = (request, endpoint) => salesforceManager.sendMessages(request, '', '', 'sendpatchrequest', endpoint);


module.exports.validBlock = function (block) {
    if (typeof (block) != "undefined" && (block.toLowerCase() == 'y' || block.toLowerCase() == 'yes')) {
        return true
    }
    return false;
}

const getrequestbody = (request, objectName) => {
    switch (objectName) {
        case 'lead':
            return request.compositeRequest[1].body
        case 'opportunity':
            return request.compositeRequest[2].body
        case 'drawdown':
            return request.compositeRequest[4].body
        case 'contact':
            return request.compositeRequest[2].body
        case 'referral':
            return request.compositeRequest[3].body
        case 'payback':
            return request.compositeRequest[3].body

    }
}

function getrandomExpectedValue(request, expectedKey, objectName) {
    return getrequestbody(request, objectName)[expectedKey];
}

const updatebody = (request, objectName, field, referenceData) => {
    switch (objectName) {
        case 'contact':
            request.compositeRequest[2].body[field] = referenceData;
            break;
        case 'opportunity':
            request.compositeRequest[2].body[field] = referenceData;
            break;
        case 'drawdown':
            request.compositeRequest[4].body[field] = referenceData;
            break;
        case 'lead':
            request.compositeRequest[1].body[field] = referenceData;
            break;
        case 'referral':
            request.compositeRequest[3].body[field] = referenceData;
            break;
        case 'payback':
            request.compositeRequest[3].body[field] = referenceData;
            break;

    }
    return request;
}

let getactualvalue = (isErrorExpected, expectedKey, recordDetails, errormessage) => {
    if (!isErrorExpected) {
        if (expectedKey.includes('.')) {
            let finalKey = expectedKey.split('.');
            console.log(finalKey[1]);
            console.log(`actual value ${recordDetails.records[0][finalKey[0]][finalKey[1]]}`)
            return recordDetails.records[0][finalKey[0]][finalKey[1]]
        } else {
            return recordDetails.records[0][expectedKey]
        }
    } else if (isErrorExpected) {
        return errormessage;
    }
}

const writeDataForReference = async (datadetails, dataIsFor, filepath) => {
    // write id on the json file for future usage
    if (process.env.DATASTORE == 'dynamodb') {
        let details = {
            dataIsFor,
            datadetails,
            createdDate: moment().tz('Australia/Sydney').format('MM-DD-YYYY hh:mm:ss')
        }
        await awslib.putDataIntoDynamo('QE-TM-Data-Details', details);
        console.log('write successfully on dynamodb');
    } else if (process.env.DATASTORE == 's3') {
        console.log(datadetails, dataIsFor)
        await awslib.putItemonS3(dataIsFor, datadetails);
        console.log('write successfully on s3')
    } else {
        // @ts-ignore
        let file = editJsonFile(`${__dirname}${filepath}`);
        //let file = editJsonFile(`${__dirname}/../../test-scripts/territory-management/id-details/tmday1data.json`);
        file.set(dataIsFor, datadetails);
        file.save();
    }
}

const getReferenceDataId = async (dataIsFor, filepath) => {
    if (process.env.DATASTORE == 'dynamodb') {
        let details = await awslib.queryDynamo('QE-TM-Data-Details', dataIsFor)
        console.log('data picked from dynamodb successfully')
        // @ts-ignore
        return details.Items[0].id
    } else if (process.env.DATASTORE == 's3') {
        const data = await awslib.getFileFromS3(dataIsFor);
        console.log('data received from s3');
        return data.Body.toString();
    }
    else {
        // pickup existing record id based on object from day1 data sheet
        // @ts-ignore
        //let day1data = JSON.parse(fs.readFileSync(`${__dirname}/../../test-scripts/territory-management/id-details/tmday1data.json`))
        let day1data = JSON.parse(fs.readFileSync(`${__dirname}${filepath}`))
        return day1data[dataIsFor]
    }
}
module.exports = {
    processEntity,
    getQuery,
    // invokeSalesforce,
    // salesforceQueryDetails,
    getrandomExpectedValue,
    getactualvalue,
    writeDataForReference,
    getReferenceDataId,
    // getMetadataDetails,
    // sendGetRequest,
    // sendSalesforceQuery,
    // sendpostrequest,
    // sendQueryRequest,
    grv,
    // sendpatchrequest,
    getrequestbody,
    updatebody
    // validBlock,
    // getRandomLOVValue,
    // getRandomValue
};

// console.log(module.exports);