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
          <button class="auth-btn">Register</button>
        </template>
        <template v-else>
          <span class="signed-in-text">Signed in as: {{ signedInEmail }}</span>
        </template>
      </div>
    </header>

    <!-- Main Content -->
    <main :class="{ 'dimmed': showSignIn }">
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
            Don't have an account? <a href="#" @click.prevent="showSignIn = false">Register</a>
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { signIn } from 'aws-amplify/auth';
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
        const { user } = await signIn({
          username: signInEmail.value,
          password: signInPassword.value,
        });
        console.log('Sign-in successful:', user);
        signedInEmail.value = signInEmail.value;
        showSignIn.value = false;
        signInEmail.value = '';
        signInPassword.value = '';
      } catch (error) {
        console.error('Sign-in error:', error);
      }
    };

    const handleOverlayClick = (event) => {
      // Check if the click target is the overlay itself (not the dialog)
      if (event.target.classList.contains('dialog-overlay')) {
        showSignIn.value = false; // Close the popup
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
      setMode,
      handleUpload,
      handleSearch,
      handleSignIn,
      handleOverlayClick,
    };
  },
};
</script>

<style scoped>
/* Component-specific styles can go here if needed */
</style>