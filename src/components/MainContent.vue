<template>
  <main :class="{ 'dimmed': isDialogOpen }">
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

    <!-- Status -->
    <div id="status">{{ status }}</div>

    <!-- Results -->
    <div id="results">
      <!-- Upload Results -->
      <template v-if="mode === 'upload' && uploadResults">
        <h2>Results for {{ uploadResults.originalFilename }}:</h2>
        <table>
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

      <!-- Search Results -->
      <template v-if="mode === 'search' && searchResults">
        <h2>Leaderboard for "{{ searchWord }}":</h2>
        <div v-if="!searchResults.entries.length">
          <p>No entries found for the word "{{ searchWord }}".</p>
        </div>
        <table v-else>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Original Filename</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in searchResults.entries" :key="item.rank">
              <td>{{ item.rank }}</td>
              <td>{{ item.originalFilename }}</td>
              <td>{{ item.count }}</td>
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
    isDialogOpen: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const mode = ref('upload');
    const description = ref('Upload a text file to analyze word frequency.');
    const status = ref('Ready to upload...');
    const searchWord = ref('');
    const fileInput = ref(null);
    const uploadResults = ref(null); // Store upload results data
    const searchResults = ref(null); // Store search results data

    const setMode = (newMode) => {
      mode.value = newMode;
      if (newMode === 'upload') {
        description.value = 'Upload a text file to analyze word frequency.';
        status.value = 'Ready to upload...';
        searchResults.value = null; // Clear search results
      } else {
        description.value = 'Search for a word to see its leaderboard (top 10 files by count).';
        status.value = 'Ready to search...';
        uploadResults.value = null; // Clear upload results
      }
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
            uploadResults.value = result; // Store the raw result directly
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
          const searchData = await searchLeaderboard(word, updateStatus);
          // Transform the raw data by adding rank
          searchResults.value = {
            entries: searchData.map((item, index) => ({
              rank: index + 1,
              originalFilename: item.originalFilename,
              count: item.count,
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
  box-sizing: border-box;
  margin-top: 60px;
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

table {
  border-collapse: collapse;
  margin-top: 10px;
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

.dimmed {
  pointer-events: none;
  opacity: 0.5;
}
</style>