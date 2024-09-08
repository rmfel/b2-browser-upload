const fetch = require('node-fetch');
const config = require('../config.js');
const Debug  = require('debug');
const debug = Debug('b2-browser-upload:getB2UploadInfo');
const fs = require('fs')
const path = require('path');

const dataFilePath = path.join(__dirname, 'b2data.json');

function saveDataLocally(data) {
    const now = new Date();
    const item = {
        data: data,
        timestamp: now.getTime()
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(item), 'utf8');
}

async function getDataLocally(fetchNewData) {
    if (fetchNewData || !fs.existsSync(dataFilePath)) {
        // get data from local
        const newData = await getB2UploadInfo();
        saveDataLocally(newData);
        return newData;
    }

    const itemStr = fs.readFileSync(dataFilePath, 'utf8');
    const item = JSON.parse(itemStr);
    const now = new Date();
    const timestamp = item.timestamp;
    const data = item.data;
  

    // check in 24h
    if (now.getTime() - timestamp > 24 * 60 * 60 * 1000) {
        const newData = await getB2UploadInfo();
        saveDataLocally(newData);
        return newData;
    }

    return data;
}

async function getB2UploadInfo() {
    const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
        headers: {
            'Authorization': 'Basic ' + Buffer.from(config.b2ApplicationKeyId + ":" + config.b2ApplicationKey).toString('base64')
        }
    });
    const auth = await authResponse.json();

    const getUploadResponse = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
        method: 'POST',
        headers: {
            'Authorization': auth.authorizationToken,
        },
        body: JSON.stringify({
            bucketId: config.b2BucketId,
        }),
    });

    const uploadInfo = await getUploadResponse.json();
    debug("uploadInfo: %j", uploadInfo);

    return uploadInfo;
}

module.exports = getDataLocally;
