var https = require('https');
var querystring = require('querystring');
const config = require('../config');

export function aws_saveTaskData(encryptedMetadata, data) {
  return new Promise(function(resolve, reject) {
    // Call api endpoint for update
    const postData = querystring.stringify({
        encrypted_metadata: encryptedMetadata,
        data: data,
    });

    const postOptions = {
      hostname: config.awsLambda.saveTaskData.host,
      port: 443,
      path: config.awsLambda.saveTaskData.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(postOptions, (res) => {
      res.setEncoding('utf8');
      res.on('data', () => {});
      res.on('end', resolve);
    });

    req.on('error', (e) => {
      if (config.debug) {
        console.log("ERROR:");
        console.log(e);
      }
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}


export function aws_fetchLink(encryptedMetadata) {
  return new Promise(function(resolve, reject) {
    // Call api endpoint for update
    const postData = querystring.stringify({
        encrypted_metadata: encryptedMetadata,
    });

    const postOptions = {
      hostname: config.awsLambda.fetchLink.host,
      port: 443,
      path: config.awsLambda.fetchLink.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(postOptions, (res) => {
      res.setEncoding('utf8');
      var body = '';
      res.on('data', function(d) {
          body += d;
       });
      res.on('end', () => resolve(body));
    });

    req.on('error', (e) => {
      if (config.debug) {
        console.log("ERROR:");
        console.log(e);
      }
      reject(e);
    });

    req.write(postData);
    req.end();
  });
}
