'use strict';

const { OAuth2App } = require('homey-oauth2app');
const YeelightOAuth2Client = require('./YeelightOAuth2Client');

module.exports = class YeelightApp extends OAuth2App {

  static OAUTH2_DEBUG = true;
  static OAUTH2_MULTI_SESSION = true;

  async onOAuth2Init() {
    // EU
    this.setOAuth2Config({
      configId: 'eu',
      client: YeelightOAuth2Client,
      clientId: '2882303761518263720',
      clientSecret: 'qb/Xj9dVTfTa5/AdI37RGg==',
      apiUrl: 'https://open-de.yeelight.com/api/control',
      redirectUrl: `https://open-de.yeelight.com/oauth/callback/${YeelightOAuth2Client.CORPORATION_ID}`,
    });

    // US
    this.setOAuth2Config({
      configId: 'us',
      client: YeelightOAuth2Client,
      clientId: '2882303761518255595',
      clientSecret: '+cNaxJFfHkxaK6Hw15JziA==',
      apiUrl: 'https://open-us.yeelight.com/api/control',
      redirectUrl: `https://open-us.yeelight.com/oauth/callback/${YeelightOAuth2Client.CORPORATION_ID}`,
    });

    // CN
    this.setOAuth2Config({
      configId: 'cn',
      client: YeelightOAuth2Client,
      clientId: '2882303761518266814',
      clientSecret: 'SR+1zsU6c9YRT3ozsD3l5w==',
      apiUrl: 'https://open-cn.yeelight.com/api/control',
      redirectUrl: `https://open-cn.yeelight.com/oauth/callback/${YeelightOAuth2Client.CORPORATION_ID}`,
    });
  }

};
