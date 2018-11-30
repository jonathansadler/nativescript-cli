import { register as _register } from 'kinvey-http';
import { request as httpRequest } from 'tns-core-modules/http';

async function http(request) {
  const response = await httpRequest({
    headers: request.headers,
    method: request.method,
    url: request.url,
    content: request.body,
    timeout: request.timeout
  });

  let data = response.content.raw;

  try {
    data = response.content.toString();
  } catch (e) {
    // TODO: Log error
  }

  return {
    statusCode: response.statusCode,
    headers: response.headers,
    data
  };
}

export function register() {
  _register(http);
}
