// 動画データ
const videosData = [
    {
        id: 1,
        title: "サンプル動画1 - タイトル",
        thumbnail: "assets/img/thumbnails/video1.jpg",
        date: "2024-01-15",
        viewCount: 1250
    },
    {
        id: 2,
        title: "サンプル動画2 - タイトル",
        thumbnail: "assets/img/thumbnails/video2.jpg",
        date: "2024-01-16",
        viewCount: 890
    },
    {
        id: 3,
        title: "サンプル動画3 - タイトル",
        thumbnail: "assets/img/thumbnails/video3.jpg",
        date: "2024-01-17",
        viewCount: 2100
    }
];

// コメントデータ
const commentsData = [
    {
        id: 1,
        videoId: 1,
        author: "ユーザーA",
        date: "2024-01-15 10:30",
        text: "素晴らしい動画でした！とても参考になりました。"
    },
    {
        id: 2,
        videoId: 1,
        author: "ユーザーB",
        date: "2024-01-15 11:15",
        text: "次回も楽しみにしています。"
    },
    {
        id: 3,
        videoId: 1,
        author: "ユーザーA",
        date: "2024-01-15 12:00",
        text: "質問があります。詳しく教えてください。"
    },
    {
        id: 4,
        videoId: 2,
        author: "ユーザーC",
        date: "2024-01-16 09:20",
        text: "とても分かりやすい説明でした。"
    },
    {
        id: 5,
        videoId: 2,
        author: "ユーザーA",
        date: "2024-01-16 10:45",
        text: "このシリーズ続きが気になります。"
    },
    {
        id: 6,
        videoId: 3,
        author: "ユーザーB",
        date: "2024-01-17 14:30",
        text: "最高の動画でした！"
    },
    {
        id: 7,
        videoId: 3,
        author: "ユーザーC",
        date: "2024-01-17 15:00",
        text: "ありがとうございます。"
    },
    {
        id: 8,
        videoId: 3,
        author: "ユーザーA",
        date: "2024-01-17 16:20",
        text: "また見ます！"
    }
];

// 投稿者ごとのコメント回数と最終投稿日を計算
function getAuthorCommentCounts(comments = commentsData) {
    const authorData = {};
    comments.forEach(comment => {
        if (!authorData[comment.author]) {
            authorData[comment.author] = {
                count: 0,
                lastDate: null
            };
        }
        authorData[comment.author].count++;
        
        // 最終投稿日を更新（より新しい日付を保持）
        if (comment.date) {
            const commentDate = parseDate(comment.date);
            if (commentDate) {
                if (!authorData[comment.author].lastDate || commentDate > authorData[comment.author].lastDate) {
                    authorData[comment.author].lastDate = commentDate;
                    authorData[comment.author].lastDateString = comment.date; // 元の文字列も保持
                }
            }
        }
    });
    
    return Object.entries(authorData)
        .map(([author, data]) => ({ 
            author, 
            count: data.count,
            lastDate: data.lastDateString || null
        }))
        .sort((a, b) => b.count - a.count);
}

// 日付文字列をDateオブジェクトに変換（比較用）
function parseDate(dateString) {
    if (!dateString) return null;
    
    try {
        // Date(2020,8,11,10,30)形式をパース
        const dateTimeMatch = String(dateString).match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+))?\)/);
        if (dateTimeMatch) {
            const year = parseInt(dateTimeMatch[1]);
            const month = parseInt(dateTimeMatch[2]);
            const day = parseInt(dateTimeMatch[3]);
            const hour = dateTimeMatch[4] ? parseInt(dateTimeMatch[4]) : 0;
            const minute = dateTimeMatch[5] ? parseInt(dateTimeMatch[5]) : 0;
            return new Date(year, month, day, hour, minute);
        }
        
        // ISO 8601形式
        if (dateString.includes('T') || dateString.includes(' ')) {
            return new Date(dateString);
        }
        
        // yyyy-mm-dd形式
        if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
            return new Date(dateString);
        }
        
        // yyyy/mm/dd形式
        if (/^\d{4}\/\d{2}\/\d{2}/.test(dateString)) {
            return new Date(dateString.replace(/\//g, '-'));
        }
    } catch (e) {
        console.warn('日付のパースに失敗:', dateString, e);
    }
    
    return null;
}
