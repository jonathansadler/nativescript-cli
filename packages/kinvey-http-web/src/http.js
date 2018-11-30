import { register as _register } from 'kinvey-http';
import { register as registerSession } from 'kinvey-session-web';
import { TimeoutError, NetworkConnectionError } from 'kinvey-errors';
import axios from 'axios';

let sdkInfo = {
  name: 'SDK unknown (kinvey-http-web)',
  version: 0
};

// Helper function to detect the browser name and version.
function browserDetect(ua) {
  // Cast arguments.
  const userAgent = ua.toLowerCase();

  // User-Agent patterns.
  const rChrome = /(chrome)\/([\w]+)/;
  const rFirefox = /(firefox)\/([\w.]+)/;
  const rIE = /(msie) ([\w.]+)/i;
  const rOpera = /(opera)(?:.*version)?[ /]([\w.]+)/;
  const rSafari = /(safari)\/([\w.]+)/;

  return rChrome.exec(userAgent) || rFirefox.exec(userAgent) || rIE.exec(userAgent) ||
    rOpera.exec(userAgent) || rSafari.exec(userAgent) || [];
}

function deviceInformation() {
  const libraries = [];
  let browser;
  let platform;
  let version;
  let manufacturer;

  // Default platform, most likely this is just a plain web app.
  if ((platform === null || platform === undefined) && window.navigator) {
    browser = browserDetect(window.navigator.userAgent);
    platform = browser[1]; // eslint-disable-line prefer-destructuring
    version = browser[2]; // eslint-disable-line prefer-destructuring
    manufacturer = window.navigator.platform;
  }

  // Libraries.
  if (window.angular !== undefined) { // AngularJS.
    libraries.push(`angularjs/${window.angular.version.full}`);
  }
  if (window.Backbone !== undefined) { // Backbone.js.
    libraries.push(`backbonejs/${window.Backbone.VERSION}`);
  }
  if (window.Ember !== undefined) { // Ember.js.
    libraries.push(`emberjs/${window.Ember.VERSION}`);
  }
  if (window.jQuery !== undefined) { // jQuery.
    libraries.push(`jquery/${window.jQuery.fn.jquery}`);
  }
  if (window.ko !== undefined) { // Knockout.
    libraries.push(`knockout/${window.ko.version}`);
  }
  if (window.Zepto !== undefined) { // Zepto.js.
    libraries.push('zeptojs');
  }

  // Return the device information string.
  const parts = [`js-${sdkInfo.name}/${sdkInfo.version}`];

  if (libraries.length !== 0) { // Add external library information.
    parts.push(`(${libraries.sort().join(', ')})`);
  }

  return parts.concat([platform, version, manufacturer]).map((part) => {
    if (part) {
      return part.toString().replace(/\s/g, '_').toLowerCase();
    }

    return 'unknown';
  }).join(' ');
}

function deviceInformation2() {
  return {
    hv: 1,
    os: window.navigator.appVersion,
    ov: window.navigator.appVersion,
    sdk: sdkInfo,
    pv: window.navigator.userAgent
  };
}

export async function http(request) {
  const kinveyUrlRegex = /kinvey\.com/gm;
  let headers = request.headers;
  let response;

  // Add the X-Kinvey-Device-Information header
  if (kinveyUrlRegex.test(request.url)) {
    headers = Object.assign({}, request.headers, {
      'X-Kinvey-Device-Information': deviceInformation(),
      'X-Kinvey-Device-Info': JSON.stringify(deviceInformation2())
    });
  }

  try {
    response = await axios({
      headers,
      method: request.method,
      url: request.url,
      data: request.body,
      timeout: request.timeout
    });
  } catch (error) {
    if (error.response) {
      // eslint-disable-next-line prefer-destructuring
      response = error.response;
    } else if (error.request) {
      if (error.code === 'ESOCKETTIMEDOUT' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        throw new TimeoutError('The network request timed out.');
      } else if (error.code === 'ENOENT') {
        throw new NetworkConnectionError('You do not have a network connection.');
      }

      throw error;
    } else {
      throw error;
    }
  }

  return { statusCode: response.status, headers: response.headers, data: response.data };
}

export function register(sdk) {
  sdkInfo = sdk;
  _register(http);
  registerSession();
}
