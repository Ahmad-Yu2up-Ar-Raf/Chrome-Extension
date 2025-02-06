chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');

  // Initial data setup (if needed)
  chrome.storage.local.set({ key: 'value' }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error saving initial data:', chrome.runtime.lastError);
    } else {
      console.log('Initial data saved to chrome.storage.local');
    }
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);

  if (message.action) {
    switch (message.action) {
      case 'getVideoInfo':
        // Implement logic to get video info
        // Example: const videoInfo = await fetchVideoInfo();
        sendResponse({ status: 'Received your message!' });
        return true; // Indicate async response

      default:
        sendResponse({ status: 'Unknown action' });
        break;
    }
  } else {
    sendResponse({ status: 'Invalid message' });
  }
});
