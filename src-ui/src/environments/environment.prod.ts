const base_url = new URL(document.baseURI)

export const environment = {
  production: true,
  apiBaseUrl: document.baseURI + 'api/',
  apiVersion: '3',
  appTitle: 'Paperless-ngx',
  version: '2.0.0-beta.rc1',
  webSocketHost: window.location.host,
  webSocketProtocol: window.location.protocol == 'https:' ? 'wss:' : 'ws:',
  webSocketBaseUrl: base_url.pathname + 'ws/',
}
