<template>
  <!-- Main content area, dimmed when a dialog is open -->
  <main :class="{ 'dimmed': isDialogOpen }">
    <h1>Word Count Uploader</h1>
    <p>{{ description }}</p>

    <!-- Mode toggle: Switch between upload and search -->
    <div class="mode-toggle">
      <button :class="{ active: mode === 'upload' }" @click="setMode('upload')">Upload File</button>
      <button :class="{ active: mode === 'search' }" @click="setMode('search')">Search Word</button>
    </div>

    <!-- Upload form: File submission interface -->
    <form v-if="mode === 'upload'" @submit.prevent="handleUpload" id="uploadForm" class="form-container">
      <input type="file" ref="fileInput" required />
      <button type="submit">Upload File</button>
    </form>

    <!-- Search form: Word leaderboard query -->
    <form v-if="mode === 'search'" @submit.prevent="handleSearch" id="searchForm" class="form-container">
      <input type="text" v-model="searchWord" placeholder="Enter a word (e.g., hello)" required />
      <button type="submit">Search Leaderboard</button>
    </form>

    <!-- Status display: Feedback for user actions -->
    <div id="status">{{ status }}</div>

    <!-- Results section: Dynamic output for upload or search -->
    <div id="results">
      <template v-if="mode === 'upload' && uploadResults">
        <h2>Results for {{ uploadResults.originalFilename }}:</h2>
        <table class="upload-table">
          <thead>
            <tr>
              <th>Word</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in uploadResults.frequentWords" :key="index">
              <td>{{ item.word }}</td>
              <td>{{ item.count }}</td>
            </tr>
          </tbody>
        </table>
      </template>

      <template v-if="mode === 'search' && searchResults">
        <h2>Leaderboard for "{{ searchWord }}":</h2>
        <div v-if="!searchResults.entries.length">
          <p>No entries found for the word "{{ searchWord }}".</p>
        </div>
        <table v-else class="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Count</th>
              <th>Filename</th>
              <th>Uploaded By</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in searchResults.entries" :key="item.rank">
              <td>{{ item.rank }}</td>
              <td>{{ item.count }}</td>
              <td>{{ item.filename }}</td>
              <td>{{ item.uploadedBy }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
  </main>
</template>

<script>
import { ref } from 'vue';
import { uploadFile, subscribeToResults, searchLeaderboard } from '../services/api';

export default {
  name: 'MainContent',
  props: {
    isDialogOpen: { type: Boolean, default: false },
    signedInUsername: { type: String, default: null },
  },
  setup(props) {
    // Reactive state for mode, UI, and results
    const mode = ref('upload');
    const description = ref('Upload a text file to analyze word frequency.');
    const status = ref('Ready to upload...');
    const searchWord = ref('');
    const fileInput = ref(null);
    const uploadResults = ref(null);
    const searchResults = ref(null);

    /**
     * Switches between upload and search modes, resetting relevant state.
     * @param {string} newMode - 'upload' or 'search'
     */
    const setMode = (newMode) => {
      mode.value = newMode;
      if (newMode === 'upload') {
        description.value = 'Upload a text file to analyze word frequency.';
        status.value = 'Ready to upload...';
        searchResults.value = null;
      } else {
        description.value = 'Search for a word to see its leaderboard (top 10 files by count).';
        status.value = 'Ready to search...';
        uploadResults.value = null;
      }
    };

    const updateStatus = (message) => {
      status.value = message;
    };

    /**
     * Manages file upload process and subscribes to analysis results.
     */
    const handleUpload = async () => {
      const file = fileInput.value.files[0];
      if (file) {
        try {
          const username = props.signedInUsername || 'anonymous';
          const s3Filename = await uploadFile(file, username, updateStatus);
          subscribeToResults(s3Filename, file.name, updateStatus, (result) => {
            uploadResults.value = result;
          });
        } catch (error) {
          console.error('Upload error:', error);
          updateStatus('Error: Check console for details');
        }
      }
    };

    /**
     * Searches for a word and formats leaderboard results.
     */
    const handleSearch = async () => {
      const word = searchWord.value.trim().toLowerCase();
      if (word) {
        try {
          const searchData = await searchLeaderboard(word, updateStatus);
          searchResults.value = {
            entries: searchData.map((item, index) => ({
              rank: index + 1,
              count: item.count,
              filename: item.originalFilename,
              uploadedBy: item.username,
            })),
          };
        } catch (error) {
          console.error('Search error:', error);
          updateStatus('Error: Check console for details');
        }
      }
    };

    return {
      mode,
      description,
      status,
      searchWord,
      fileInput,
      uploadResults,
      searchResults,
      setMode,
      handleUpload,
      handleSearch,
    };
  },
};
</script>

<style scoped>
main {
  padding: 20px;
  text-align: center;
  width: 100%;
  max-width: 800px;
  margin: 60px auto 0 auto;
  box-sizing: border-box;
}

main p {
  margin: 0 auto 1.5em auto;
}

.mode-toggle {
  margin-bottom: 20px;
}

.mode-toggle button {
  margin: 0 5px;
}

.mode-toggle button.active {
  background-color: var(--background-button-active);
}

input[type="file"],
input[type="text"] {
  display: block;
  margin: 10px 0;
}

#status {
  margin-top: 20px;
  font-size: 1em;
  color: var(--text-secondary);
}

#results {
  margin-top: 20px;
  text-align: center;
}

.upload-table,
.leaderboard-table {
  border-collapse: collapse;
  margin: 10px auto;
  background-color: var(--background-form);
}

th,
td {
  border: 1px solid var(--border-color);
  padding: 8px;
  text-align: left;
}

th {
  background-color: var(--background-button);
}

.form-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--background-form);
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  min-height: 140px;
  width: 340px;
  min-width: 340px;
  max-width: 100%;
  margin: 0 auto;
}

.form-container input[type="file"],
.form-container input[type="text"] {
  width: 300px;
  margin: 0 0 10px 0;
}

.dimmed {
  pointer-events: none;
  opacity: 0.5;
}
</style>