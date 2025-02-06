document.getElementById("summarizeButton").addEventListener("click", () => {
  const loadingIndicator = document.getElementById('loading');
  loadingIndicator.style.display = 'block'; // Tampilkan loading

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
          document.getElementById('summary').textContent = 'No active tab found.';
          loadingIndicator.style.display = 'none'; // Sembunyikan loading
          return;
      }

      const tabId = tabs[0].id;

      chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
      }, () => {
          // Kirim pesan ke content.js setelah di-load
          chrome.tabs.sendMessage(tabId, { action: "getVideoInfo" }, (response) => {
              loadingIndicator.style.display = 'none'; // Sembunyikan loading

              // Periksa jika ada kesalahan dari Chrome API
              if (chrome.runtime.lastError) {
                  document.getElementById('summary').textContent = 'Failed to communicate with the content script: ' + chrome.runtime.lastError.message;
                  return;
              }

              // Periksa apakah ada response dari content.js
              if (response) {
                  const { title, descriptionSummary, videoSummary, error } = response;

                  if (error) {
                      document.getElementById('summary').textContent = error;
                  } else {
                      document.getElementById('summary').innerHTML = `
                          <h2>Title:</h2>
                          <p>${title || 'No title available.'}</p>
                          <h2>Description Summary:</h2>
                          <p>${descriptionSummary || 'No description available.'}</p>
                          <h2>Video Summary:</h2>
                          <p>${videoSummary || 'No summary available.'}</p>
                      `;
                  }
              } else {
                  document.getElementById('summary').textContent = 'No response from content script.';
              }
          });
      });
  });
});
