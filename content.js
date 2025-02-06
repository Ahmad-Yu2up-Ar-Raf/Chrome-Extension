chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getVideoInfo') {
      const videoId = new URL(window.location.href).searchParams.get('v');

      if (videoId) {
          console.log('Content script: Video ID ditemukan:', videoId);

          fetchVideoDetails(videoId)
              .then(async details => {
                  console.log('Video details:', details);

                  // Ambil transkrip video
                  const transcript = await fetchAllVideoTranscripts();
                  console.log('Video transcript:', transcript);

                  // Jika transkrip ditemukan, lakukan ringkasan
                  if (transcript) {
                      const videoSummary = await generateVideoSummary(transcript);

                      sendResponse({
                          title: details.title,
                          descriptionSummary: generateSummary(details.description),
                          videoSummary: videoSummary || 'Tidak ada ringkasan tersedia.'
                      });
                  } else {
                      sendResponse({
                          title: details.title,
                          descriptionSummary: generateSummary(details.description),
                          videoSummary: 'Tidak ada transkrip tersedia untuk video ini.'
                      });
                  }
              })
              .catch(error => {
                  console.error('Error fetching video details:', error);
                  sendResponse({ error: 'Error fetching video details.' });
              });
      } else {
          sendResponse({ error: 'No video ID found on this page.' });
      }
  }

  return true; // Indicate that the response will be sent asynchronously
});

// Fetch video details
async function fetchVideoDetails(videoId) {
  const apiKey = YOUR_YT_API_KEY; // Ganti dengan API key Anda
  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet`;

  console.log('Fetching URL:', url);

  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log('API Response:', data);

      if (data.items && data.items.length > 0) {
          return data.items[0].snippet;
      } else {
          throw new Error('No video details found for this ID.');
      }
  } catch (error) {
      console.error('Error fetching video details:', error);
      throw new Error(`Failed to fetch video details: ${error.message}`);
  }
}

// Fetch transcripts
async function fetchAllVideoTranscripts() {
  try {
      const transcriptButton = document.querySelector('button[aria-label*="Tampilkan transkrip"], button[aria-label*="Show transcript"]');
      console.log('Transcript button found:', transcriptButton);

      if (transcriptButton) {
          transcriptButton.click();
          console.log('Tombol transkrip diklik. Menunggu untuk memuat transkrip...');

          const transcriptElements = await waitForTranscriptElements();

          if (!transcriptElements || transcriptElements.length === 0) {
              console.warn('Tidak ada elemen transkrip ditemukan. Mungkin video ini tidak memiliki transkrip.');
              return ''; // Mengembalikan string kosong jika tidak ada transkrip
          }

          let transcriptText = '';
          transcriptElements.forEach(element => {
              transcriptText += element.innerText + ' ';
          });
          return transcriptText.trim(); // Mengembalikan seluruh teks transkrip
      } else {
          console.warn('Tombol transkrip tidak ditemukan. Mungkin tidak ada transkrip untuk video ini.');
          return ''; // Mengembalikan string kosong jika tombol tidak ditemukan
      }
  } catch (error) {
      console.error('Error fetching transcripts:', error);
      return ''; // Mengembalikan string kosong jika terjadi kesalahan
  }
}

// Tunggu elemen transkrip muncul
async function waitForTranscriptElements() {
  const maxAttempts = 30;
  const interval = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const transcriptElements = document.querySelectorAll('[class*="cue-group"], [class*="ytd-transcript-segment-list-renderer"]');
      if (transcriptElements.length > 0) {
          return transcriptElements;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
  }
  return null; // Kembalikan null jika elemen tidak ditemukan setelah mencoba
}

// Generate video summary using Gemini AI
async function generateVideoSummary(text) {
  const apiKey = YOUR_AI_API_KEY; // Ganti dengan API key Gemini AI Anda
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey;

  console.log('Generating summary for text:', text);

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({
              contents: [
                  {
                      parts: [
                          {
                              text: `Pls Summarize this video, based this transcript: ${text}`
                          }
                      ]
                  }
              ]
          })
      });

      if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP error! Status: ${response.status}, Body: ${errorText}`);
          throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini AI response:', JSON.stringify(data, null, 2));

      // Pastikan ada data yang valid
      if (data && data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts.length > 0) {
          return data.candidates[0].content.parts[0].text.trim(); // Ambil teks dari bagian yang diinginkan
      } else {
          console.error('No valid summary data found in the response');
          return 'Tidak ada ringkasan tersedia.';
      }
  } catch (error) {
      console.error('Error generating summary:', error.message);
      return 'Error generating summary.';
  }
}

// Generate summary for description
function generateSummary(description) {
  if (!description || description.trim().length === 0) {
      return 'Tidak ada deskripsi tersedia.';
  }

  const sentences = description.split('.').map(sentence => sentence.trim()).filter(sentence => sentence.length > 0);
  return sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '...' : '');
}
