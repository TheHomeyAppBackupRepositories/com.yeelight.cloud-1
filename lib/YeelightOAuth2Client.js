'use strict';

const { OAuth2Client, OAuth2Util } = require('homey-oauth2app');
const YeelightOAuth2Token = require('./YeelightOAuth2Token');

module.exports = class YeelightOAuth2Client extends OAuth2Client {

  static CORPORATION_ID = '311b5256-e445-11eb-a6f7-02103209b450';
  static TOKEN = YeelightOAuth2Token;
  static TOKEN_URL = 'https://account.xiaomi.com/oauth2/token';
  // static API_URL = 'https://open-de.yeelight.com/api/control';
  static AUTHORIZATION_URL = 'https://account.xiaomi.com/oauth2/authorize?skip_confirm=false';
  // static REDIRECT_URL = `https://open-de.yeelight.com/oauth/callback/${this.CORPORATION_ID}`;

  async onHandleResult({
    result,
    status,
    statusText,
    headers,
  }) {
    if (result.payload && result.payload.errorCode) {
      throw new Error(result.payload.errorCode);
    }

    return result;
  }

  async onShouldRefreshToken(response) {
    const result = await response.json();

    if (result.payload && result.payload.errorCode === 'authFailure') {
      return true;
    }

    // Hack
    response.json = async () => {
      return result;
    };

    return false;
  }

  async getDevices() {
    const token = await this.getToken();
    return this.post({
      path: '/',
      headers: {
        key: this.constructor.CORPORATION_ID,
        unionId: token.union_id,
      },
      json: {
        requestId: OAuth2Util.getRandomId(),
        inputs: [
          {
            intent: 'action.devices.SYNC',
          },
        ],
      },
    }).then(result => result.payload.devices);
  }

  async query({ devices }) {
    const token = await this.getToken();
    return this.post({
      path: '/',
      headers: {
        key: this.constructor.CORPORATION_ID,
        unionId: token.union_id,
      },
      json: {
        requestId: OAuth2Util.getRandomId(),
        inputs: [
          {
            intent: 'action.devices.QUERY',
            payload: { devices },
          },
        ],
      },
    }).then(result => result.payload.devices);
  }

  async execute({ commands }) {
    const token = await this.getToken();
    return this.post({
      path: '/',
      headers: {
        key: this.constructor.CORPORATION_ID,
        unionId: token.union_id,
      },
      json: {
        requestId: OAuth2Util.getRandomId(),
        inputs: [
          {
            intent: 'action.devices.EXECUTE',
            payload: { commands },
          },
        ],
      },
    });
  }

};
