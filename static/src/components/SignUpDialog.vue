<template>
  <AuthDialog
    :show="showSignUp"
    title="Sign Up"
    @close="handleClose"
  >
    <template #form-content>
      <form v-if="!showVerification" @submit.prevent="handleSignUp" class="sign-in-form">
        <label for="signUpUsername">Username:</label>
        <input type="text" id="signUpUsername" v-model="signUpUsername" required />
        <label for="signUpEmail">Email:</label>
        <input type="email" id="signUpEmail" v-model="signUpEmail" required />
        <label for="signUpPassword">Password:</label>
        <input type="password" id="signUpPassword" v-model="signUpPassword" required />
        <label for="signUpConfirmPassword">Confirm Password:</label>
        <input type="password" id="signUpConfirmPassword" v-model="signUpConfirmPassword" required />
        <div v-if="passwordMismatch" class="error-message">
          Passwords do not match.
        </div>
        <button type="submit">Register</button>
        <p class="register-link">
          Already have an account? <a href="#" @click.prevent="$emit('open-sign-in-from-sign-up')">Login</a>
        </p>
      </form>
      <form v-else @submit.prevent="handleVerify" class="sign-in-form">
        <p>Check your email for a verification code.</p>
        <label for="verificationCode">Verification Code:</label>
        <input type="text" id="verificationCode" v-model="verificationCode" required />
        <button type="submit">Verify</button>
      </form>
    </template>
  </AuthDialog>
</template>

<script>
import { ref } from 'vue';
import { signUp, confirmSignUp, fetchAuthSession } from 'aws-amplify/auth';
import AuthDialog from './AuthDialog.vue';

export default {
  name: 'SignUpDialog',
  components: {
    AuthDialog,
  },
  props: {
    showSignUp: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const signUpUsername = ref('');
    const signUpEmail = ref('');
    const signUpPassword = ref('');
    const signUpConfirmPassword = ref('');
    const showVerification = ref(false);
    const verificationCode = ref('');
    const passwordMismatch = ref(false);

    const handleSignUp = async () => {
      passwordMismatch.value = false;

      if (signUpPassword.value !== signUpConfirmPassword.value) {
        passwordMismatch.value = true;
        return;
      }

      try {
        await signUp({
          username: signUpUsername.value,
          password: signUpPassword.value,
          options: {
            userAttributes: {
              email: signUpEmail.value,
            },
          },
        });
        console.log('Sign-up successful, verification code sent to:', signUpEmail.value);
        showVerification.value = true;
      } catch (error) {
        console.error('Sign-up error:', error);
      }
    };

    const handleVerify = async () => {
      try {
        await confirmSignUp({
          username: signUpUsername.value,
          confirmationCode: verificationCode.value,
        });
        console.log('Verification successful for:', signUpUsername.value);
        emit('close-sign-up');
        emit('update-signed-in-email', signUpEmail.value);
        clearForm();
      } catch (error) {
        console.error('Verification error:', error);
      }
    };

    const clearForm = () => {
      signUpUsername.value = '';
      signUpEmail.value = '';
      signUpPassword.value = '';
      signUpConfirmPassword.value = '';
      verificationCode.value = '';
      showVerification.value = false;
      passwordMismatch.value = false;
    };

    const handleClose = () => {
      emit('close-sign-up');
      clearForm();
    };

    return {
      signUpUsername,
      signUpEmail,
      signUpPassword,
      signUpConfirmPassword,
      showVerification,
      verificationCode,
      passwordMismatch,
      handleSignUp,
      handleVerify,
      handleClose,
    };
  },
};
</script>

<style scoped>
.sign-in-form {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 45%;
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  box-shadow: none;
}

.sign-in-form label {
  align-self: flex-start;
  margin-bottom: 5px;
  color: var(--text-primary);
}

.sign-in-form input {
  width: 100%;
  margin-bottom: 10px;
  align-self: center;
}

.sign-in-form button {
  white-space: nowrap;
}

.register-link {
  margin-top: 10px;
  text-align: right;
  color: var(--text-secondary);
  font-size: 0.85em;
}

.register-link a {
  color: var(--text-primary);
  text-decoration: underline;
  cursor: pointer;
}

.register-link a:hover {
  color: #fff;
}

.error-message {
  align-self: flex-start;
}
</style>