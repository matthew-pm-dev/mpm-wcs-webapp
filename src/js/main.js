import { createApp } from 'vue';
import App from '../App.vue';
import { Amplify } from 'aws-amplify';
import { fetchAuthSession } from 'aws-amplify/auth';
import { APPSYNC_ENDPOINT, WS_ENDPOINT, IDENTITY_POOL_ID, USER_POOL_ID, USER_POOL_APP_CLIENT_ID } from './config';

// Configure Amplify
Amplify.configure({
  Auth: {
    Cognito: {
      identityPoolId: IDENTITY_POOL_ID,
      region: 'us-east-1',
      allowGuestAccess: true,
      userPoolId: USER_POOL_ID,
      userPoolClientId: USER_POOL_APP_CLIENT_ID,
    },
  },
  API: {
    GraphQL: {
      endpoint: APPSYNC_ENDPOINT,
      realtimeEndpoint: WS_ENDPOINT,
      region: 'us-east-1',
      defaultAuthMode: 'iam',
    },
  },
});

// Verify guest access works
fetchAuthSession()
  .then((session) => {
    console.log('Guest session:', session);
  })
  .catch((err) => {
    console.error('Failed to retrieve guest session:', err);
  });

// Mount Vue app
createApp(App).mount('#app');