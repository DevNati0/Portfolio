import { writeFileSync } from 'node:fs';

const API_KEY = process.env.YOUTUBE_API_KEY;
const PLAYLIST_ID = 'PLD4fnr0MFCzE';
const MAX_VIDEOS = 20;

async function fetchPlaylistItems() {
    const items = [];
    let pageToken = '';
    do {
        const url = 'https://www.googleapis.com/youtube/v3/playlistItems'
            + '?part=snippet,contentDetails&maxResults=50'
            + '&fields=nextPageToken,items(snippet(title,description,thumbnails(maxres/url,standard/url,high/url,medium/url,default/url)),contentDetails(videoId,videoPublishedAt))'
            + '&playlistId=' + encodeURIComponent(PLAYLIST_ID)
            + '&key=' + encodeURIComponent(API_KEY)
            + (pageToken ? '&pageToken=' + encodeURIComponent(pageToken) : '');
        const response = await fetch(url);
        if (!response.ok) throw new Error('API YouTube : erreur ' + response.status);
        const data = await response.json();
        items.push(...data.items);
        pageToken = data.nextPageToken || '';
    } while (pageToken);
    return items;
}

function toVideo(item) {
    const thumbnails = item.snippet.thumbnails || {};
    const thumbnail = thumbnails.maxres || thumbnails.standard || thumbnails.high || thumbnails.medium || thumbnails.default;
    return {
        id: item.contentDetails.videoId,
        title: item.snippet.title,
        description: item.snippet.description.slice(0, 200),
        publishedAt: Date.parse(item.contentDetails.videoPublishedAt),
        thumbnail: thumbnail && thumbnail.url
    };
}

const videos = (await fetchPlaylistItems())
    .map(toVideo)
    .filter(video => video.thumbnail && !isNaN(video.publishedAt))
    .reverse()
    .slice(0, MAX_VIDEOS);

writeFileSync('playlist.json', JSON.stringify(videos, null, 2));
console.log(videos.length + ' vidéos enregistrées');