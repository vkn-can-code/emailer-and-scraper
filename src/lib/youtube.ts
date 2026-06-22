
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
    
    // Handle URL or Handle
    if (input.includes('youtube.com/channel/')) {
      channelId = input.split('channel/')[1].split('/')[0].split('?')[0];
    } else {
      // It's a handle (@name) or a username
      const handle = input.includes('@') ? input.split('@')[1].split('/')[0].split('?')[0] : input;
      
      // Search for the channel by handle/username
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(handle)}&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      
      if (searchData.items && searchData.items.length > 0) {
        channelId = searchData.items[0].id.channelId;
      } else {
        return null;
      }
    }

    if (!channelId) return null;

    // Fetch full channel details
    const detailUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
    const detailRes = await fetch(detailUrl);
    const detailData = await detailRes.json();

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
