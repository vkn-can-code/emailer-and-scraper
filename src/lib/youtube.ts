
export interface YouTubeChannelData {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  description?: string;
}

export async function fetchChannelData(input: string): Promise<YouTubeChannelData | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("YOUTUBE_API_KEY is missing");
    return null;
  }

  try {
    let channelId = '';
    
    // Check if it's a video link
    let videoId = '';
    if (input.includes('youtube.com/watch')) {
      const urlString = input.startsWith('http') ? input : `https://${input}`;
      try {
        const urlObj = new URL(urlString);
        videoId = urlObj.searchParams.get('v') || '';
      } catch (e) {
        // Fallback if URL parsing fails
        if (input.includes('?v=')) {
          videoId = input.split('?v=')[1].split('&')[0];
        }
      }
    } else if (input.includes('youtu.be/')) {
      videoId = input.split('youtu.be/')[1].split('?')[0];
    }

    if (videoId) {
      // Fetch video details to get the channel ID
      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`;
      const videoRes = await fetch(videoUrl);
      const videoData = await videoRes.json();
      
      if (videoData.error) {
        console.error("YouTube API Video Error:", videoData.error.message);
        return null;
      }
      
      if (videoData.items && videoData.items.length > 0) {
        channelId = videoData.items[0].snippet.channelId;
      } else {
        return null; // Video not found
      }
    } else if (input.includes('youtube.com/channel/')) {
      channelId = input.split('channel/')[1].split('/')[0].split('?')[0];
    } else {
      // It's a handle (@name) or a username
      const handle = input.includes('@') ? input.split('@')[1].split('/')[0].split('?')[0] : input.split('/').pop()?.split('?')[0] || input;
      
      if (handle) {
        // Try to fetch by handle first (costs 1 unit instead of 100)
        // Ensure handle starts with @ for the forHandle query
        const handleQuery = handle.startsWith('@') ? handle : `@${handle}`;
        const detailUrlByHandle = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(handleQuery)}&key=${apiKey}`;
        const detailResByHandle = await fetch(detailUrlByHandle);
        const detailDataByHandle = await detailResByHandle.json();
        
        if (detailDataByHandle.items && detailDataByHandle.items.length > 0) {
          const item = detailDataByHandle.items[0];
          return {
            id: item.id,
            name: item.snippet.title,
            handle: item.snippet.customUrl || '',
            avatar: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            subscriberCount: item.statistics.subscriberCount,
            viewCount: item.statistics.viewCount,
            videoCount: item.statistics.videoCount,
            description: item.snippet.description,
          };
        }

        // Try forUsername (costs 1 unit) if forHandle fails (for older youtube.com/username links)
        const usernameQuery = handle.replace(/^@/, '');
        const detailUrlByUsername = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forUsername=${encodeURIComponent(usernameQuery)}&key=${apiKey}`;
        const detailResByUsername = await fetch(detailUrlByUsername);
        const detailDataByUsername = await detailResByUsername.json();

        if (detailDataByUsername.items && detailDataByUsername.items.length > 0) {
          const item = detailDataByUsername.items[0];
          return {
            id: item.id,
            name: item.snippet.title,
            handle: item.snippet.customUrl || '',
            avatar: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
            subscriberCount: item.statistics.subscriberCount,
            viewCount: item.statistics.viewCount,
            videoCount: item.statistics.videoCount,
            description: item.snippet.description,
          };
        }

        // Fallback to Search API (costs 100 units!)
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${apiKey}`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        
        if (searchData.error) {
          console.error("YouTube API Error:", searchData.error.message);
          return null;
        }
        
        if (searchData.items && searchData.items.length > 0) {
          channelId = searchData.items[0].id.channelId;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }

    if (!channelId) return null;

    // Fetch full channel details using channelId
    const detailUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

    if (detailData.error) {
      console.error("YouTube API Error:", detailData.error.message);
      return null;
    }

    if (detailData.items && detailData.items.length > 0) {
      const item = detailData.items[0];
      return {
        id: item.id,
        name: item.snippet.title,
        handle: item.snippet.customUrl || '',
        avatar: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default?.url,
        subscriberCount: item.statistics.subscriberCount,
        viewCount: item.statistics.viewCount,
        videoCount: item.statistics.videoCount,
        description: item.snippet.description,
      };
    }
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
  }

  return null;
}
