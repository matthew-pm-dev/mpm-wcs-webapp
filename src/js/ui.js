export function displayResults(result) {
    return `
      <h2>Results for ${result.originalFilename}:</h2>
      <table>
        <thead>
          <tr>
            <th>Word</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          ${result.frequentWords
            .map(
              (item) => `
                <tr>
                  <td>${item.word}</td>
                  <td>${item.count}</td>
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }
  
  export function displayLeaderboardResults(word, results) {
    if (!results || results.length === 0) {
      return `<p>No entries found for the word "${word}".</p>`;
    }
  
    return `
      <h2>Leaderboard for "${word}":</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Original Filename</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          ${results
            .map(
              (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.originalFilename}</td>
                  <td>${item.count}</td>
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }