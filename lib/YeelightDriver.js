'use strict';

const { OAuth2Driver } = require('homey-oauth2app');

module.exports = class YeelightDriver extends OAuth2Driver {

  static POLL_INTERVAL = 1000 * 10; // 10s

  async onOAuth2Init() {
    this.onPoll = this.onPoll.bind(this);
    this.onPoll().catch(this.error);
    this.onPollInterval = this.homey.setInterval(async () => {
      if (!this._polling) {
        this._polling = this.onPoll();
        try {
          await this._polling;
        } catch (err) {
          this.error(err);
        } finally {
          delete this._polling;
        }
      }
    }, this.constructor.POLL_INTERVAL);
  }

  async onPoll() {
    // Get Devices
    const devicesHomey = this.getDevices();
    if (!devicesHomey.length) return;

    // Get state for all devices in a single call
    await devicesHomey[0].ready();
    const devicesYeelight = await devicesHomey[0].oAuth2Client.query({
      devices: devicesHomey.map(device => ({
        id: device.getData().id,
        customData: device.getData().customData,
      })),
    });

    // Distribute results to Device
    await Promise.all(devicesHomey.map(async deviceHomey => {
      const deviceHomeyId = deviceHomey.getData().id;
      const deviceYeelight = devicesYeelight[deviceHomeyId];
      if (!deviceYeelight) return;

      await deviceHomey.onPoll(deviceYeelight);
    }));
  }

  async onPair(socket) {
    await super.onPair(socket);

    socket.setHandler('getRegion', async () => {
      return this.homey.settings.get('region');
    });

    socket.setHandler('setRegion', async region => {
      await this.homey.settings.set('region', region);
    });
  }

  async onPairListDevices({ oAuth2Client }) {
    const devices = await oAuth2Client.getDevices();
    return devices.map(device => {
      const capabilities = [];

      if (device.traits.includes('action.devices.traits.OnOff')) {
        capabilities.push('onoff');
      }

      if (device.traits.includes('action.devices.traits.Brightness')) {
        capabilities.push('dim');
      }

      if (device.traits.includes('action.devices.traits.ColorSpectrum')
       || device.traits.includes('action.devices.traits.ColorSetting')) {
        capabilities.push('light_hue');
        capabilities.push('light_saturation');
      }

      if (device.traits.includes('action.devices.traits.ColorTemperature')) {
        capabilities.push('light_temperature');
      }

      if (capabilities.includes('light_temperature')
       && capabilities.includes('light_hue')) {
        capabilities.push('light_mode');
      }

      return {
        capabilities,
        name: device.name.deviceName,
        data: {
          id: device.id,
          customData: device.customData || {},
          attributes: device.attributes || {},
        },
      };
    });
  }

};
