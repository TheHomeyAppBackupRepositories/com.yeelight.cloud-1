'use strict';

const { OAuth2Device } = require('homey-oauth2app');
const TinyColor = require('tinycolor2');

module.exports = class YeelightDevice extends OAuth2Device {

  async onOAuth2Init() {
    this.onCapabilities = this.onCapabilities.bind(this);
    this.onPoll = this.onPoll.bind(this);

    this.registerMultipleCapabilityListener(this.getCapabilities(), this.onCapabilities);
  }

  async onOAuth2Deleted() {
    if (this.onPollInterval) {
      this.homey.clearInterval(this.onPollInterval);
    }
  }

  async onCapabilities(values) {
    const devices = [{
      id: this.getData().id,
      customData: this.getData().customData,
    }];

    const execution = [];

    if (typeof values['onoff'] === 'boolean') {
      execution.push({
        command: 'action.devices.commands.OnOff',
        params: {
          on: !!values['onoff'],
        },
      });
    }

    if (typeof values['dim'] === 'number') {
      execution.push({
        command: 'action.devices.commands.BrightnessAbsolute',
        params: {
          brightness: Math.round(values['dim'] * 100),
        },
      });

      if (this.hasCapability('onoff')) {
        this.setCapabilityValue('onoff', values['dim'] > 0).catch(this.error);
      }
    }

    if (typeof values['light_hue'] === 'number' || typeof values['light_saturation'] === 'number') {
      const color = TinyColor({
        h: (typeof values['light_hue'] === 'number'
          ? values['light_hue']
          : this.getCapabilityValue('light_hue')) * 360,
        s: typeof values['light_saturation'] === 'number'
          ? values['light_saturation']
          : this.getCapabilityValue('light_saturation'),
        v: typeof values['dim'] === 'number'
          ? values['dim']
          : this.getCapabilityValue('dim'),
      });

      execution.push({
        command: 'action.devices.commands.ColorAbsolute',
        params: {
          color: {
            name: 'white',
            spectrumRGB: parseInt(color.toHexString().replace('#', '0x'), 16),
          },
        },
      });

      if (this.hasCapability('light_mode')) {
        this.setCapabilityValue('light_mode', 'color').catch(this.error);
      }
    } else if (typeof values['light_temperature'] === 'number') {
      const { attributes } = this.getData();
      const {
        temperatureMaxK = 6500,
        temperatureMinK = 2700,
      } = attributes;

      execution.push({
        command: 'action.devices.commands.ColorAbsolute',
        params: {
          color: {
            name: 'white',
            temperature: temperatureMinK + ((1 - values['light_temperature']) * (temperatureMaxK - temperatureMinK)),
          },
        },
      });

      if (this.hasCapability('light_mode')) {
        this.setCapabilityValue('light_mode', 'temperature').catch(this.error);
      }
    }

    if (!execution.length) return;

    await this.oAuth2Client.execute({
      commands: [{
        devices,
        execution,
      }],
    });
  }

  async onPoll(device) {
    if (this.hasCapability('onoff') && typeof device.on === 'boolean') {
      this.setCapabilityValue('onoff', device.on).catch(this.error);
    }

    if (this.hasCapability('dim') && typeof device.brightness === 'number') {
      this.setCapabilityValue('dim', device.brightness / 100).catch(this.error);
    }

    if (this.hasCapability('light_hue')
     && this.hasCapability('light_saturation')
     && device.color
     && typeof device.color.spectrumRGB === 'number') {
      const { h, s } = TinyColor(`#${Number(device.color.spectrumRGB).toString(16)}`).toHsv();

      this.setCapabilityValue('light_hue', h / 360).catch(this.error);
      this.setCapabilityValue('light_saturation', s).catch(this.error);

      if (this.hasCapability('light_mode')) {
        this.setCapabilityValue('light_mode', 'color').catch(this.error);
      }
    } else if (this.hasCapability('light_temperature')
     && device.color
     && typeof device.color.temperature === 'number') {
      const { attributes } = this.getData();
      const {
        temperatureMaxK = 6500,
        temperatureMinK = 2700,
      } = attributes;

      const temperature = 1 - ((device.color.temperature - temperatureMinK) / (temperatureMaxK - temperatureMinK));
      this.setCapabilityValue('light_temperature', temperature).catch(this.error);

      if (this.hasCapability('light_mode')) {
        this.setCapabilityValue('light_mode', 'temperature').catch(this.error);
      }
    }

    if (typeof device.online === 'boolean') {
      if (device.online) {
        this.setAvailable().catch(this.error);
      } else {
        this.setUnavailable(this.homey.__('offline')).catch(this.error);
      }
    }
  }

};
