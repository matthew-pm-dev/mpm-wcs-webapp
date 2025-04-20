<template>
  <div>
    <TopBar
      :signed-in-username="signedInUsername"
      @open-sign-in="showSignIn = true"
      @open-sign-up="showSignUp = true"
      @update-signed-in-username="updateSignedInUsername"
    />
    <MainContent
      :is-dialog-open="showSignIn || showSignUp"
      :signed-in-username="signedInUsername"
    />
    <SignInDialog
      :show-sign-in="showSignIn"
      @close-sign-in="showSignIn = false"
      @update-signed-in-username="updateSignedInUsername"
      @open-sign-up-from-sign-in="openSignUpFromSignIn"
    />
    <SignUpDialog
      :show-sign-up="showSignUp"
      @close-sign-up="showSignUp = false"
      @open-sign-in-from-sign-up="openSignInFromSignUp"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { fetchAuthSession } from 'aws-amplify/auth';
import TopBar from './components/TopBar.vue';
import MainContent from './components/MainContent.vue';
import SignInDialog from './components/SignInDialog.vue';
import SignUpDialog from './components/SignUpDialog.vue';

export default {
  name: 'App',
  components: {
    TopBar,
    MainContent, 
    SignInDialog,
    SignUpDialog,
  },
  setup() {
    const signedInUsername = ref(null);
    const showSignIn = ref(false);
    const showSignUp = ref(false);

    const checkAuthState = async () => {
      try {
        const session = await fetchAuthSession();
        console.log('Current session:', session);
        if (session.tokens?.idToken) {
          const username = session.tokens.idToken.payload['cognito:username'];
          if (username) {
            signedInUsername.value = username;
            console.log('User is authenticated with username:', username);
          } else {
            console.log('No username found in idToken payload');
            signedInUsername.value = null;
          }
        } else {
          console.log('No authenticated session found');
          signedInUsername.value = null;
        }
      } catch (error) {
        console.log('Error fetching session:', error);
        signedInUsername.value = null;
      }
    };

    onMounted(() => {
      checkAuthState();
    });

    const updateSignedInUsername = (username) => {
      signedInUsername.value = username;
    };

    const openSignUpFromSignIn = () => {
      showSignIn.value = false;
      showSignUp.value = true;
    };

    const openSignInFromSignUp = () => {
      showSignUp.value = false;
      showSignIn.value = true;
    };

    return {
      signedInUsername,
      showSignIn,
      showSignUp,
      updateSignedInUsername,
      openSignUpFromSignIn,
      openSignInFromSignUp,
    };
  },
};
</script>