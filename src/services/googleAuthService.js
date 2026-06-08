import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      '28186262069-saskpnmu4ippu735knnddfsbe2bk0khn.apps.googleusercontent.com',

    webClientId:
      '28186262069-saskpnmu4ippu735knnddfsbe2bk0khn.apps.googleusercontent.com',

    androidClientId:
      '28186262069-hgjblnp1re1n4m5rvcdd3op6egcm416r.apps.googleusercontent.com',

    iosClientId:
      '28186262069-3orhfk839b3ont1ohl9k79m1s5c9qqsf.apps.googleusercontent.com',

    scopes: ['profile', 'email']
  });

  return {
    request,
    response,
    promptAsync
  };
};