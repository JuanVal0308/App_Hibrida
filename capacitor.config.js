/**
 * @type {import('@capacitor/cli').CapacitorConfig}
 */
const config = {
  appId: 'com.rentaya.app',
  appName: 'Renta Ya',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined
    }
  }
};

export default config;
