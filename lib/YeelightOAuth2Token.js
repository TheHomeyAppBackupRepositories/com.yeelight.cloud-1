/* eslint-disable camelcase */

'use strict';

const { OAuth2Token } = require('homey-oauth2app');

module.exports = class YeelightOAuth2Token extends OAuth2Token {

  constructor({
    token_type,
    scope,
    mac_algorithm,
    mac_key,
    openId,
    union_id,
    ...props
  }) {
    super({ ...props });

    this.token_type = token_type || null;
    this.scope = scope || null;
    this.mac_algorithm = mac_algorithm || null;
    this.mac_key = mac_key || null;
    this.openId = openId || null;
    this.union_id = union_id || null;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      token_type: this.token_type,
      scope: this.scope,
      mac_algorithm: this.mac_algorithm,
      mac_key: this.mac_key,
      openId: this.openId,
      union_id: this.union_id,
    };
  }

};
