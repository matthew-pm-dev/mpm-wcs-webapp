<template>
  <div>
    <TopBar
      :signed-in-email="signedInEmail"
      @open-sign-in="showSignIn = true"
      @open-sign-up="showSignUp = true"
      @update-signed-in-email="updateSignedInEmail"
    />
    <MainContent :is-dialog-open="showSignIn || showSignUp" />
    <SignInDialog
      :show-sign-in="showSignIn"
      @close-sign-in="showSignIn = false"
      @update-signed-in-email="updateSignedInEmail"
      @open-sign-up-from-sign-in="openSignUpFromSignIn"
    />
    <SignUpDialog
      :show-sign-up="showSignUp"
      @close-sign-up="showSignUp = false"
      @update-signed-in-email="updateSignedInEmail"
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
    const signedInEmail = ref(null);
    const showSignIn = ref(false);
    const showSignUp = ref(false);

    const checkAuthState = async () => {
      try {
        const session = await fetchAuthSession();
        console.log('Current session:', session);
        if (session.tokens?.idToken) {
          const email = session.tokens.signInDetails?.loginId;
          if (email) {
            signedInEmail.value = email;
            console.log('User is authenticated with email:', email);
          } else {
            console.log('No email found in signInDetails');
            signedInEmail.value = null;
          }
        } else {
          console.log('No authenticated session found');
          signedInEmail.value = null;
        }
      } catch (error) {
        console.log('Error fetching session:', error);
        signedInEmail.value = null;
      }
    };

    onMounted(() => {
      checkAuthState();
    });

    const updateSignedInEmail = (email) => {
      signedInEmail.value = email;
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
      signedInEmail,
      showSignIn,
      showSignUp,
      updateSignedInEmail,
      openSignUpFromSignIn,
      openSignInFromSignUp,
    };
  },
};
</script>