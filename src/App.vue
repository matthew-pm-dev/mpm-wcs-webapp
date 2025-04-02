<template>
  <div>
    <!-- Top Bar -->
    <header class="top-bar">
      <div class="logo">
        <span class="logo-sub">MPM</span>
        <span class="logo-main">WCU</span>
      </div>
      <div class="auth-buttons">
        <template v-if="!signedInEmail">
          <button class="auth-btn" @click="showSignIn = true">Login</button>
          <button class="auth-btn" @click="showSignUp = true">Register</button>
        </template>
        <template v-else>
          <span class="signed-in-text">Signed in as: {{ signedInEmail }}</span>
          <button class="auth-btn" @click="handleSignOut">Sign Out</button>
        </template>
      </div>
    </header>

    <!-- Main Content -->
    <main :class="{ 'dimmed': showSignIn || showSignUp }">
      <h1>Word Count Uploader</h1>
      <p>{{ description }}</p>

      <!-- Mode Toggle -->
      <div class="mode-toggle">
        <button :class="{ active: mode === 'upload' }" @click="setMode('upload')">Upload File</button>
        <button :class="{ active: mode === 'search' }" @click="setMode('search')">Search Word</button>
      </div>

      <!-- Upload Form -->
      <form v-if="mode === 'upload'" @submit.prevent="handleUpload" id="uploadForm">
        <input type="file" ref="fileInput" required />
        <button type="submit">Upload File</button>
      </form>

      <!-- Search Form -->
      <form v-if="mode === 'search'" @submit.prevent="handleSearch" id="searchForm">
        <input type="text" v-model="searchWord" placeholder="Enter a word (e.g., hello)" required />
        <button type="submit">Search Leaderboard</button>
      </form>

      <!-- Status and Results -->
      <div id="status">{{ status }}</div>
      <div id="results" v-html="results"></div>
    </main>

    <!-- Sign-In Dialog -->
    <div v-if="showSignIn" class="dialog-overlay" @click="handleOverlayClick">
      <div class="sign-in-dialog">
        <div class="dialog-header">
          <div class="dialog-logo">
            <span class="logo-sub">MPM</span>
            <span class="logo-main">WCU</span>
            <h2>Sign In</h2>
          </div>
        </div>
        <form @submit.prevent="handleSignIn" class="sign-in-form">
          <label for="signInEmail">Email:</label>
          <input type="email" id="signInEmail" v-model="signInEmail" required />
          <label for="signInPassword">Password:</label>
          <input type="password" id="signInPassword" v-model="signInPassword" required />
          <button type="submit">Login</button>
          <p class="register-link">
            Don't have an account? <a href="#" @click.prevent="openSignUpFromSignIn">Register</a>
          </p>
        </form>
      </div>
    </div>

    <!-- Sign-Up Dialog -->
    <div v-if="showSignUp" class="dialog-overlay" @click="handleOverlayClick">
      <div class="sign-in-dialog">
        <div class="dialog-header">
          <div class="dialog-logo">
            <span class="logo-sub">MPM</span>
            <span class="logo-main">WCU</span>
            <h2>Sign Up</h2>
          </div>
        </div>
        <form v-if="!showVerification" @submit.prevent="handleSignUp" class="sign-in-form">
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
            Already have an account? <a href="#" @click.prevent="openSignInFromSignUp">Login</a>
          </p>
        </form>
        <form v-else @submit.prevent="handleVerify" class="sign-in-form">
          <p>Check your email for a verification code.</p>
          <label for="verificationCode">Verification Code:</label>
          <input type="text" id="verificationCode" v-model="verificationCode" required />
          <button type="submit">Verify</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { signIn, signOut, signUp, confirmSignUp, fetchAuthSession } from 'aws-amplify/auth';
import { uploadFile, subscribeToResults, searchLeaderboard } from './js/api';
import { displayResults, displayLeaderboardResults } from './js/ui';

export default {
  name: 'App',
  setup() {
    // Existing state
    const mode = ref('upload');
    const description = ref('Upload a text file to analyze word frequency.');
    const status = ref('Ready to upload...');
    const results = ref('');
    const searchWord = ref('');
    const fileInput = ref(null);

    // Sign-in state
    const showSignIn = ref(false);
    const signInEmail = ref('');
    const signInPassword = ref('');
    const signedInEmail = ref(null);

    // Sign-up state
    const showSignUp = ref(false);
    const signUpEmail = ref('');
    const signUpPassword = ref('');
    const signUpConfirmPassword = ref('');
    const showVerification = ref(false);
    const verificationCode = ref('');
    const passwordMismatch = ref(false);

    // Updated method to check authentication state
    const checkAuthState = async () => {
      try {
        const session = await fetchAuthSession();
        console.log('Current session:', session);
        // Check if the user is authenticated by looking for tokens
        if (session.tokens?.idToken) {
          // Extract the email from signInDetails.loginId
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
        signedInEmail.value = null; // Ensure signedInEmail is null if there's an error
      }
    };

    // Run the check when the component mounts
    onMounted(() => {
      checkAuthState();
    });

    const setMode = (newMode) => {
      mode.value = newMode;
      if (newMode === 'upload') {
        description.value = 'Upload a text file to analyze word frequency.';
        status.value = 'Ready to upload...';
      } else {
        description.value = 'Search for a word to see its leaderboard (top 10 files by count).';
        status.value = 'Ready to search...';
      }
      results.value = '';
    };

    const updateStatus = (message) => {
      status.value = message;
    };

    const handleUpload = async () => {
      const file = fileInput.value.files[0];
      if (file) {
        try {
          const s3Filename = await uploadFile(file, updateStatus);
          subscribeToResults(s3Filename, file.name, updateStatus, (result) => {
            results.value = displayResults(result);
          });
        } catch (error) {
          console.error('Upload error:', error);
          updateStatus('Error: Check console for details');
        }
      }
    };

    const handleSearch = async () => {
      const word = searchWord.value.trim().toLowerCase();
      if (word) {
        try {
          const searchResults = await searchLeaderboard(word, updateStatus);
          results.value = displayLeaderboardResults(word, searchResults);
        } catch (error) {
          console.error('Search error:', error);
          updateStatus('Error: Check console for details');
        }
      }
    };

    const handleSignIn = async () => {
      try {
        await signIn({
          username: signInEmail.value,
          password: signInPassword.value,
        });
        console.log('Sign-in successful', signInEmail.value);
        const session = await fetchAuthSession();
        console.log('Authenticated session:', session);
        signedInEmail.value = signInEmail.value;
        showSignIn.value = false;
        signInEmail.value = '';
        signInPassword.value = '';
      } catch (error) {
        console.error('Sign-in error:', error);
        // If the error is UserAlreadyAuthenticatedException, check the current user
        if (error.name === 'UserAlreadyAuthenticatedException') {
          await checkAuthState(); // Re-check the auth state to update signedInEmail
          showSignIn.value = false;
          signInEmail.value = '';
          signInPassword.value = '';
        }
      }
    };

    const handleSignOut = async () => {
      try {
        await signOut();
        console.log('Sign-out successful');
        const session = await fetchAuthSession();
        console.log('Guest session:', session);
        signedInEmail.value = null;
      } catch (error) {
        console.error('Sign-out error:', error);
      }
    };

    const handleSignUp = async () => {
      // Reset password mismatch state
      passwordMismatch.value = false;

      // Check if passwords match
      if (signUpPassword.value !== signUpConfirmPassword.value) {
        passwordMismatch.value = true;
        return; // Prevent form submission
      }

      try {
        await signUp({
          username: signUpEmail.value,
          password: signUpPassword.value,
          options: {
            userAttributes: {
              email: signUpEmail.value,
            },
          },
        });
        console.log('Sign-up successful, verification code sent to:', signUpEmail.value);
        showVerification.value = true; // Show verification form
      } catch (error) {
        console.error('Sign-up error:', error);
      }
    };

    const handleVerify = async () => {
      try {
        await confirmSignUp({
          username: signUpEmail.value,
          confirmationCode: verificationCode.value,
        });
        console.log('Verification successful for:', signUpEmail.value);
        // Reset state and close dialog
        showSignUp.value = false;
        showVerification.value = false;
        signUpEmail.value = '';
        signUpPassword.value = '';
        signUpConfirmPassword.value = '';
        verificationCode.value = '';
        // After verification, the user is signed in, so update the state
        await checkAuthState();
      } catch (error) {
        console.error('Verification error:', error);
      }
    };

    const openSignUpFromSignIn = () => {
      showSignIn.value = false; // Close sign-in dialog
      showSignUp.value = true; // Open sign-up dialog
      // Reset sign-up form
      signUpEmail.value = '';
      signUpPassword.value = '';
      signUpConfirmPassword.value = '';
      showVerification.value = false;
      verificationCode.value = '';
    };

    const openSignInFromSignUp = () => {
      showSignUp.value = false; // Close sign-up dialog
      showSignIn.value = true; // Open sign-in dialog
      // Reset sign-in form
      signInEmail.value = '';
      signInPassword.value = '';
    };

    const handleOverlayClick = (event) => {
      if (event.target.classList.contains('dialog-overlay')) {
        showSignIn.value = false;
        showSignUp.value = false;
        showVerification.value = false;
        // Reset forms
        signInEmail.value = '';
        signInPassword.value = '';
        signUpEmail.value = '';
        signUpPassword.value = '';
        signUpConfirmPassword.value = '';
        verificationCode.value = '';
      }
    };

    return {
      mode,
      description,
      status,
      results,
      searchWord,
      fileInput,
      showSignIn,
      signInEmail,
      signInPassword,
      signedInEmail,
      showSignUp,
      signUpEmail,
      signUpPassword,
      signUpConfirmPassword,
      passwordMismatch,
      showVerification,
      verificationCode,
      setMode,
      handleUpload,
      handleSearch,
      handleSignIn,
      handleSignOut,
      handleSignUp,
      handleVerify,
      openSignUpFromSignIn,
      openSignInFromSignUp,
      handleOverlayClick,
    };
  },
};
</script>

<style scoped>
/* Existing styles remain unchanged */
.error-message {
  color: #ff5555;
  font-size: 0.9em;
  margin-bottom: 10px;
  align-self: flex-start;
}
</style>