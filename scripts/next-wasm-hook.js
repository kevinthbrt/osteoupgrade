if (process.platform === 'win32' && process.arch === 'x64' && !process.versions.webcontainer) {
  Object.defineProperty(process.versions, 'webcontainer', {
    value: 'osteoupgrade-local-wasm',
    configurable: true,
  })
}
