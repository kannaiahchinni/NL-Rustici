const request = require('request');
const lzwCompress = require("./lzwcompress");

const serviceNowUrl = 'https://nowlearningsedev.service-now.com/api/x_snc_lrs_lxp';
const stateUrl = '/activities/state';
const statementUrl= '/statements';

exports.addState = (req, res, next) => {

    /*const params = [];
    params.push('stateId='+ req.query.stateId);
    params.push('agent='+ req.query.agent);
    params.push('activityId='+ req.query.activityId);
    params.push('registrationId='+ req.query.registration);
    params.push('externalRegistration='+ req.query.externalRegistration);
    params.push('content_endpoint='+ req.query.content_endpoint); */

    const params ={};
    params.stateId= req.query.stateId;
    params.agent=req.query.agent;
    params.activityId= req.query.activityId;
    params.registration= req.query.registration;
    params.externalRegistration= req.query.externalRegistration;
    params.content_endpoint=  req.query.content_endpoint;

    var percentage = ''; 
    if(req.query.stateId === 'suspend_data') {
        const data = JSON.parse(req.rawBody);
        percentage = JSON.parse(lzwCompress.unpack(data.d));
    }

    const url = serviceNowUrl+ stateUrl; // + '?'+ params.join('&');
    const body = JSON.stringify({body: req.rawBody, progress: percentage});
    request(url, {method: 'PUT', qs:params, body: body}, (error, ress, body) => {
        if(error) {
            res.next(error);
        }
        res.send("");
    });
};

exports.getState = (req, res, next) => {

    const url = serviceNowUrl+ stateUrl + '?stateId='+ req.query.stateId+'&registration='+ req.query.registration;
    request(url, (error, ress, body) => {
        console.log(body);
        if(req.query.stateId === 'cumulative_time') {
            res.setHeader('content-type', 'application/octet-stream');
            res.json(body.result);
        }else if(req.query.stateId === 'bookmark') {
            res.setHeader('content-type', 'application/octet-stream');
            res.send(body.result);
        }else if( req.query.stateId === 'suspend_data') {
            res.json(body.result);
        }
        if(error) {
            console.log(error);
            res.next(error);
        }
    })
};

exports.addStatement = (req, res, next ) => {
    const url = serviceNowUrl + statementUrl;
    request(url, {method: 'PUT', body: JSON.stringify(req.body)}, (error, ress, body) => {
        if(error) {
            console.log(error);
            res.next(error);
        }
        res.json("");
    });
};

exports.getStatement = (req, res, next ) => {
    res.json("");
};
