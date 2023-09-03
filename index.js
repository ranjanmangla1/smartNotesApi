import express from 'express';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());


app.post("/generate", async (req, res) => {
  try {
    const requestPrompt  = req.body.requestPrompt;
    const apiKey = req.header("Authorization"); 
    console.log(`apiKey: ${apiKey} \n req: ${requestPrompt}`)

    if (!apiKey) {
      return res.status(400).json({ error: "API key is required" });
    }
    const configuration = new Configuration({
      apiKey: apiKey,
    });

    const openai = new OpenAIApi(configuration);
    
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: requestPrompt,
      temperature: 0.15,
      max_tokens: 2000
    });
    

    console.log(completion)

    res.json({ response: completion.data.choices[0].text });
    
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "An error occurred" });
  }
});


app.post('/post-hashnode', async (req, res) => {
  try {
      const { title, contentMarkdown, tags, authToken } = req.body;

      const headers = {
          Authorization: authToken,
          'Content-Type': 'application/json',
      };

      const publicationId = '63ff5863186c084437fada8e';

      const createPostMutation = {
          query: `
              mutation ($input: CreateStoryInput!) {
                  createPublicationStory(publicationId: "${publicationId}", input: $input) {
                      message
                      post {
                          _id
                          title
                      }
                  }
              }
          `,
          variables: {
              input: {
                  title,
                  contentMarkdown,
                  tags,
              },
          },
      };

      const response = await axios.post(
          'https://api.hashnode.com',
          createPostMutation,
          {
              headers,
          }
      );

      res.json(response.data);
  } catch (error) {
      console.error('Error posting blog:', error.message);
      res.status(500).json({ error: 'An error occurred while posting the blog.' });
  }
});

app.post('/post-medium', async (req, res) => {
  const { title, content, canonicalUrl, tags } = req.body;
  const apiKey = req.header("Authorization"); 

  const requestBody = {
    title,
    contentFormat: 'markdown',
    content,
    canonicalUrl,
    tags,
    publishStatus: 'public',
  };

  try {
    const mediumResponse = await fetch(MEDIUM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const mediumData = await mediumResponse.json();

    if (mediumResponse.ok) {
      res.status(201).json({ message: 'Blog posted successfully on Medium', data: mediumData });
    } else {
      res.status(mediumResponse.status).json({ error: mediumData });
    }
  } catch (error) {
    console.error('Error posting blog:', error);
    res.status(500).json({ error: 'An error occurred while posting the blog' });
  }
});

app.post('/post-devto', async (req, res) => {
  const requestBody = req.body.article;
  
  const apiKey = req.header("Authorization"); 

  const { title, body_markdown, tags, series, canonical_url, description, main_image } = requestBody;

  console.log(requestBody);

  const article = {
    title,
    published: true,
    body_markdown,
    tags,
    series,
    main_image: main_image, 
    canonical_url: canonical_url, 
    description: description, 
  };

  try {
    const devtoResponse = await fetch("https://dev.to/api/articles", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({ article }),
    });

    const devtoData = await devtoResponse.json();

    if (devtoResponse.ok) {
      res.status(201).json({ message: 'Article posted successfully on dev.to', data: devtoData });
    } else {
      res.status(devtoResponse.status).json({ error: devtoData });
    }
  } catch (error) {
    console.error('Error posting article:', error);
    res.status(500).json({ error: 'An error occurred while posting the article' });
  }
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
