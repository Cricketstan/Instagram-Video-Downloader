const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

app.post('/download-video', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Instagram post URL is required' });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      },
    });

    const html = response.data;

    const videoUrlMatch = html.match(/<meta property="og:video" content="([^"]+)"/);

    if (!videoUrlMatch) {
      return res.status(404).json({ error: 'Video URL not found' });
    }

    const videoUrl = videoUrlMatch[1];

    res.json({ videoUrl });
  } catch (error) {
    console.error('Error fetching Instagram video URL:', error.message);
    res.status(500).json({ error: 'Failed to fetch video URL' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
