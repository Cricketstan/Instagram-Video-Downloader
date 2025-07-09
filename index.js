const express = require('express');
const puppeteer = require('puppeteer');
const app = express();

app.use(express.json());

app.post('/download-video', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Instagram post URL is required' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'networkidle2' });

    const videoUrl = await page.evaluate(() => {
      // Try to get video URL from meta tag
      const meta = document.querySelector('meta[property="og:video"]');
      if (meta) {
        return meta.content;
      }

      // Try to get from window._sharedData JSON
      try {
        const jsonData = window._sharedData;
        const media = jsonData.entry_data.PostPage?.[0]?.graphql?.shortcode_media;
        if (media && media.is_video && media.video_url) {
          return media.video_url;
        }
      } catch (e) {
        // ignore errors
      }

      return null;
    });

    if (!videoUrl) {
      return res.status(404).json({ error: 'Video URL not found' });
    }

    res.json({ videoUrl });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch video URL' });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
