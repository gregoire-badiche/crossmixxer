'use strict';

const https = require('https');

// Short function to perform HTTPS request
const get = async ({ hostname = 'www.deezer.com', path, cookies = {}, body = '', parse = true, method = 'POST' }) => {
    if (typeof body == 'object') body = JSON.stringify(body);

    // Parsing the cookies, which came in the form of a JSON {"name1": "value1", "name2", "value2"} into name1=value1;name2=value2;
    let parsedCookies = '';
    for (const key in cookies) {
        if (Object.hasOwnProperty.call(cookies, key)) {
            const element = cookies[key];
            parsedCookies += `${key}=${element};`;
        }
    }
    let options;
    if(method == 'POST') {
        options = {
            hostname,
            path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Lenght': body.length,
                'Cookie': parsedCookies
            }
        }
    } else {
        options = {
            hostname,
            path,
            method: method,
            headers: {
                'Cookie': parsedCookies
            }
        }
    }

    // Wrapping the request inside a Promise

    return new Promise((resolve, reject) => {
        // Performing the request
        let req = https.request(options, res => {
            let sum = '';
            res.on('data', data => {
                sum += data;
            })
            res.on('end', () => {
                if (parse) sum = JSON.parse(sum);
                resolve(sum)
            });

        });

        req.on('error', err => {
            reject(err)
        })

        if(method == 'POST')
            req.write(body);
        req.end();
    })
}

class DeezerConnection {
    async auth() {
        let json = await get({
            path: '/ajax/gw-light.php?method=deezer.getUserData&input=3&api_version=1.0&api_token='
        })
        let credentials = {
            sid: json.results.SESSION_ID,
            api_token: json.results.checkForm,
            license_token: json.results.USER.OPTIONS.license_token
        };
        this.credentials = credentials
        return this;
    }

    async playlist(url) {
        return await new Promise((resolve, reject) => {
            let req = https.request({
                hostname: 'deezer.page.link',
                path: url.slice(24),
                method: 'GET'
            }, (res) => {
                if(res.headers.hasOwnProperty('location')) {
                    let link = res.headers.location.match(/^https:\/\/www\.deezer\.com\/playlist\/[0-9]+/)[0];
                    resolve(link.match(/\d+$/)[0]);
                } else {
                    reject('Error')
                }
            });
            req.on('error', err => {
                reject(err)
            })
            req.end();
        })
            .then(id => get({
                path: `/ajax/gw-light.php?method=deezer.pagePlaylist&input=3&api_version=1.0&api_token=${this.credentials.api_token}`,
                cookies: { 'sid': this.credentials.sid },
                body: {"nb":2000,"start":0,"playlist_id":id,"lang":"us","tab":0,"tags":true,"header":true}
            }))
            .then(res => {
                return {
                    title: res.results.DATA.TITLE,
                    picture: `https://e-cdns-images.dzcdn.net/images/cover/${res.results.DATA.PLAYLIST_PICTURE}/264x264-000000-80-0-0.jpg`,
                    owner: res.results.DATA.PARENT_USERNAME,
                    size: res.results.DATA.NB_SONG,
                    duration: res.results.DATA.DURATION
                }
            })
    }
}

let d = new DeezerConnection();
d.auth().then(d => d.playlist('https://deezer.page.link/kstk67fbZzfAPXhcA').then(t => console.log(t)))