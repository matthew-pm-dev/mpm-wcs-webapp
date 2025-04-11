<template>
  <AuthDialog
    :show="showSignIn"
    title="Sign In"
    @close="handleClose"
  >
    <template #form-content>
      <!-- Sign-In Form -->
      <form v-if="!showResetPassword" @submit.prevent="handleSignIn" class="sign-in-form">
        <label for="signInEmail">Email:</label>
        <input type="email" id="signInEmail" v-model="signInEmail" required />
        <label for="signInPassword">Password:</label>
        <input type="password" id="signInPassword" v-model="signInPassword" required />
        <div v-if="signInError" class="error-message">
          {{ signInError }} <a href="#" @click.prevent="startResetPassword">Forgot Password?</a>
        </div>
        <button type="submit">Login</button>
        <p class="register-link">
          Don't have an account? <a href="#" @click.prevent="$emit('open-sign-up-from-sign-in')">Register</a>
        </p>
      </form>
      <!-- Step 1: Verify Code -->
      <form v-else-if="!codeVerified" @submit.prevent="verifyResetCode" class="sign-in-form">
        <p>Enter the verification code sent to your email.</p>
        <label for="resetCode">Verification Code:</label>
        <input type="text" id="resetCode" v-model="resetCode" required />
        <div v-if="resetPasswordError" class="error-message">
          {{ resetPasswordError }}
        </div>
        <button type="submit">Verify Code</button>
        <p class="register-link">
          <a href="#" @click.prevent="cancelResetPassword">Cancel</a>
        </p>
      </form>
      <!-- Step 2: Enter New Password -->
      <form v-else @submit.prevent="handleResetPassword" class="sign-in-form">
        <p>Enter your new password.</p>
        <label for="newPassword">New Password:</label>
        <input type="password" id="newPassword" v-model="newPassword" required />
        <label for="confirmNewPassword">Confirm New Password:</label>
        <input type="password" id="confirmNewPassword" v-model="confirmNewPassword" required />
        <div v-if="resetPasswordError" class="error-message">
          {{ resetPasswordError }}
        </div>
        <button type="submit">Reset Password</button>
        <p class="register-link">
          <a href="#" @click.prevent="cancelResetPassword">Cancel</a>
        </p>
      </form>
    </template>
  </AuthDialog>
</template>

<script>
import { ref } from 'vue';
import { signIn, resetPassword, confirmResetPassword, fetchAuthSession } from 'aws-amplify/auth';
import AuthDialog from './AuthDialog.vue';

export default {
  name: 'SignInDialog',
  components: {
    AuthDialog,
  },
  props: {
    showSignIn: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    const signInEmail = ref('');
    const signInPassword = ref('');
    const signInError = ref('');
    const showResetPassword = ref(false);
    const resetCode = ref('');
    const newPassword = ref('');
    const confirmNewPassword = ref('');
    const resetPasswordError = ref('');
    const codeVerified = ref(false);

    const handleSignIn = async () => {
      signInError.value = '';

      try {
        await signIn({
          username: signInEmail.value,
          password: signInPassword.value,
        });
        console.log('Sign-in successful', signInEmail.value);
        const session = await fetchAuthSession();
        console.log('Authenticated session:', session);
        emit('update-signed-in-email', signInEmail.value);
        emit('close-sign-in');
        clearForm();
      } catch (error) {
        console.error('Sign-in error:', error);
        if (error.name === 'NotAuthorizedException' || error.name === 'UserNotFoundException') {
          signInError.value = 'Invalid email or password.';
        } else if (error.name === 'UserAlreadyAuthenticatedException') {
          const session = await fetchAuthSession();
          const email = session.tokens?.signInDetails?.loginId || null;
          emit('update-signed-in-email', email);
          emit('close-sign-in');
          clearForm();
        } else {
          signInError.value = 'An error occurred. Please try again.';
        }
      }
    };

    const startResetPassword = async () => {
      try {
        await resetPassword({ username: signInEmail.value });
        console.log('Password reset code sent to:', signInEmail.value);
        showResetPassword.value = true;
        signInError.value = '';
      } catch (error) {
        console.error('Error initiating password reset:', error);
        signInError.value = 'Failed to send reset code. Please try again.';
      }
    };

    const verifyResetCode = async () => {
      resetPasswordError.value = '';

      try {
        await confirmResetPassword({
          username: signInEmail.value,
          confirmationCode: resetCode.value,
          newPassword: 'DUMMY_PASSWORD_TO_VERIFY_CODE',
        });
      } catch (error) {
        console.log('Code verification result:', error);
        if (error.name === 'CodeMismatchException') {
          resetPasswordError.value = 'Invalid verification code.';
        } else if (error.name === 'ExpiredCodeException') {
          resetPasswordError.value = 'Verification code has expired. Please request a new one.';
        } else if (error.name === 'InvalidPasswordException') {
          codeVerified.value = true;
          resetPasswordError.value = '';
        } else {
          resetPasswordError.value = 'Failed to verify code. Please try again.';
        }
      }
    };

    const handleResetPassword = async () => {
      resetPasswordError.value = '';

      if (newPassword.value !== confirmNewPassword.value) {
        resetPasswordError.value = 'Passwords do not match.';
        return;
      }

      try {
        await confirmResetPassword({
          username: signInEmail.value,
          confirmationCode: resetCode.value,
          newPassword: newPassword.value,
        });
        console.log('Password reset successful for:', signInEmail.value);
        showResetPassword.value = false;
        codeVerified.value = false;
        emit('close-sign-in');
        clearForm();
      } catch (error) {
        console.error('Error resetting password:', error);
        if (error.name === 'CodeMismatchException') {
          resetPasswordError.value = 'Invalid verification code.';
        } else if (error.name === 'ExpiredCodeException') {
          resetPasswordError.value = 'Verification code has expired. Please request a new one.';
        } else {
          resetPasswordError.value = 'Failed to reset password. Please try again.';
        }
      }
    };

    const cancelResetPassword = () => {
      showResetPassword.value = false;
      codeVerified.value = false;
      resetCode.value = '';
      newPassword.value = '';
      confirmNewPassword.value = '';
      resetPasswordError.value = '';
    };

    const clearForm = () => {
      signInEmail.value = '';
      signInPassword.value = '';
      signInError.value = '';
      showResetPassword.value = false;
      codeVerified.value = false;
      resetCode.value = '';
      newPassword.value = '';
      confirmNewPassword.value = '';
      resetPasswordError.value = '';
    };

    const handleClose = () => {
      emit('close-sign-in');
      clearForm();
    };

    return {
      signInEmail,
      signInPassword,
      signInError,
      showResetPassword,
      resetCode,
      newPassword,
      confirmNewPassword,
      resetPasswordError,
      codeVerified,
      handleSignIn,
      startResetPassword,
      verifyResetCode,
      handleResetPassword,
      cancelResetPassword,
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

.error-message a {
  color: var(--text-primary);
  text-decoration: underline;
  cursor: pointer;
}

.error-message a:hover {
  color: #fff;
}
</style>