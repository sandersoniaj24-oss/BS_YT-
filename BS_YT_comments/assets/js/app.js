// アプリケーションのメインロジック
let currentView = 'videos';
let sortColumn = null;
let sortDirection = 'asc'; // 'asc' or 'desc'
let commentSortColumn = null;
let commentSortDirection = 'asc'; // 'asc' or 'desc'

document.addEventListener('DOMContentLoaded', async function() {
    // データを読み込んでから初期化
    await loadAllData();
    initializeApp();
    initializeScrollToTop();
});

// ページトップへボタンの初期化
function initializeScrollToTop() {
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    
    if (!scrollToTopBtn) return;
    
    // スクロール時の表示/非表示を制御
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });
    
    // クリックでトップにスクロール
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

function initializeApp() {
    // ナビゲーションボタンのイベントリスナー
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            switchView(view);
        });
    });

    // 動画選択のイベントリスナー
    const videoSelect = document.getElementById('video-select');
    if (videoSelect) {
        videoSelect.addEventListener('change', function() {
            const videoId = parseInt(this.value);
            if (videoId) {
                renderCommentsForVideo(videoId);
            } else {
                document.getElementById('comments-container').innerHTML = '<p>動画を選択してください。</p>';
            }
        });
    }

    // 初期表示
    renderVideos();
    populateVideoSelect();
    renderAuthorStats();
    
    // コメントボタンのイベントリスナー（動的要素なのでイベント委譲を使用）
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('view-comments-btn')) {
            const videoId = parseInt(e.target.getAttribute('data-video-id'));
            if (videoId) {
                // コメント一覧ビューに切り替え
                switchView('comments');
                // プルダウンで該当動画を選択
                const videoSelect = document.getElementById('video-select');
                if (videoSelect) {
                    videoSelect.value = videoId;
                    // コメントを表示
                    renderCommentsForVideo(videoId);
                }
            }
        }
    });
}

// ビューの切り替え
function switchView(viewName) {
    currentView = viewName;
    
    // ナビゲーションボタンの状態更新
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // ビューの表示/非表示
    document.querySelectorAll('.view').forEach(view => {
        if (view.id === `${viewName}-view`) {
            view.classList.add('active');
        } else {
            view.classList.remove('active');
        }
    });
}

// 動画一覧の表示
function renderVideos() {
    const container = document.getElementById('videos-container');
    let videos = window.videosData || videosData;
    const comments = window.commentsData || commentsData;
    
    if (!container || !videos || videos.length === 0) {
        container.innerHTML = '<p>動画がありません。</p>';
        return;
    }
    
    // 各動画の最終コメント日を計算
    videos = videos.map(video => {
        const videoComments = (comments || []).filter(comment => {
            const commentVideoNo = comment.videoNo || comment.videoId || 0;
            return parseInt(commentVideoNo) === parseInt(video.id);
        });
        
        if (videoComments.length > 0) {
            // コメントの日付を取得して最も新しいものを探す
            let latestDate = null;
            let latestDateValue = 0;
            
            videoComments.forEach(comment => {
                const commentDate = comment.date || comment['投稿日時'] || comment['日付'] || '';
                if (commentDate) {
                    const dateValue = parseDateTimeForSort(commentDate);
                    if (dateValue > latestDateValue) {
                        latestDateValue = dateValue;
                        latestDate = commentDate;
                    }
                }
            });
            
            video.lastCommentDate = latestDate;
        } else {
            video.lastCommentDate = null;
        }
        
        return video;
    });
    
    // 並び替えを実行
    if (sortColumn) {
        videos = [...videos].sort((a, b) => {
            return sortVideos(a, b, sortColumn, sortDirection);
        });
    }
    
    // 並び替えアイコンの生成
    const getSortIcon = (column) => {
        if (sortColumn === column) {
            return sortDirection === 'asc' ? ' ▲' : ' ▼';
        }
        return ' ↕';
    };
    
    container.innerHTML = `
        <table class="videos-table">
            <thead>
                <tr>
                    <th class="sortable" data-column="id">#${getSortIcon('id')}</th>
                    <th>サムネイル</th>
                    <th class="sortable" data-column="title">タイトル${getSortIcon('title')}</th>
                    <th class="sortable" data-column="date">投稿日${getSortIcon('date')}</th>
                    <th class="sortable" data-column="duration">動画尺${getSortIcon('duration')}</th>
                    <th class="sortable" data-column="viewCount">再生数${getSortIcon('viewCount')}</th>
                    <th class="sortable" data-column="likeCount">高評価数${getSortIcon('likeCount')}</th>
                    <th class="sortable" data-column="commentCount">コメント数${getSortIcon('commentCount')}</th>
                    <th class="sortable" data-column="lastCommentDate">最終コメント日${getSortIcon('lastCommentDate')}</th>
                </tr>
            </thead>
            <tbody>
                ${videos.map(video => {
                    const lastCommentDateFormatted = video.lastCommentDate ? formatDate(video.lastCommentDate) : '-';
                    return `
                    <tr>
                        <td class="video-number-cell">${video.id}</td>
                        <td class="video-thumbnail-cell">
                            <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" class="video-thumbnail-small" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'68\'%3E%3Crect fill=\'%23ddd\' width=\'120\' height=\'68\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'12\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\'%3Eサムネイル%3C/text%3E%3C/svg%3E'">
                        </td>
                        <td class="video-title-cell">${escapeHtml(video.title || '-')}</td>
                        <td class="video-date-cell">${formatDate(video.date)}</td>
                        <td class="video-duration-cell">${formatDuration(video.duration)}</td>
                        <td class="video-views-cell">${video.viewCount ? video.viewCount.toLocaleString() : '-'}</td>
                        <td class="video-likes-cell">${video.likeCount ? video.likeCount.toLocaleString() : '-'}</td>
                        <td class="video-comments-cell">
                            <div class="comment-count-wrapper">
                                <span>${video.commentCount ? video.commentCount.toLocaleString() : '-'}</span>
                                <button class="view-comments-btn" data-video-id="${video.id}" title="コメント一覧を見る">一覧を見る</button>
                            </div>
                        </td>
                        <td class="video-last-comment-date-cell">${lastCommentDateFormatted}</td>
                    </tr>
                `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    // 並び替え可能なヘッダーにクリックイベントを追加
    container.querySelectorAll('.sortable').forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', function() {
            const column = this.getAttribute('data-column');
            if (sortColumn === column) {
                // 同じ列をクリックした場合は昇順/降順を切り替え
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                // 新しい列をクリックした場合は昇順で並び替え
                sortColumn = column;
                sortDirection = 'asc';
            }
            renderVideos();
        });
    });
}

// 動画の並び替え関数
function sortVideos(a, b, column, direction) {
    let aValue, bValue;
    
    switch(column) {
        case 'id':
            aValue = a.id || 0;
            bValue = b.id || 0;
            break;
        case 'title':
            aValue = (a.title || '').toLowerCase();
            bValue = (b.title || '').toLowerCase();
            break;
        case 'date':
            aValue = parseDateForSort(a.date);
            bValue = parseDateForSort(b.date);
            break;
        case 'duration':
            aValue = parseDurationForSort(a.duration);
            bValue = parseDurationForSort(b.duration);
            break;
        case 'viewCount':
            aValue = a.viewCount || 0;
            bValue = b.viewCount || 0;
            break;
        case 'likeCount':
            aValue = a.likeCount || 0;
            bValue = b.likeCount || 0;
            break;
        case 'commentCount':
            aValue = a.commentCount || 0;
            bValue = b.commentCount || 0;
            break;
        case 'lastCommentDate':
            const aDate = a.lastCommentDate || '';
            const bDate = b.lastCommentDate || '';
            aValue = aDate ? parseDateTimeForSort(aDate) : 0;
            bValue = bDate ? parseDateTimeForSort(bDate) : 0;
            break;
        default:
            return 0;
    }
    
    if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
    } else if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
    }
    return 0;
}

// 日付を並び替え用にパース
function parseDateForSort(dateString) {
    if (!dateString) return new Date(0);
    
    try {
        // Date(2020,8,11)形式をパース
        const dateMatch = String(dateString).match(/Date\((\d+),(\d+),(\d+)\)/);
        if (dateMatch) {
            const year = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]);
            const day = parseInt(dateMatch[3]);
            return new Date(year, month, day).getTime();
        }
        
        // ISO 8601形式
        if (dateString.includes('T') || dateString.includes(' ')) {
            return new Date(dateString).getTime();
        }
        
        // yyyy-mm-dd形式
        if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
            return new Date(dateString).getTime();
        }
        
        // yyyy/mm/dd形式
        if (/^\d{4}\/\d{2}\/\d{2}/.test(dateString)) {
            return new Date(dateString.replace(/\//g, '-')).getTime();
        }
    } catch (e) {
        console.warn('日付のパースに失敗:', dateString);
    }
    
    return new Date(0).getTime();
}

// 動画尺を並び替え用にパース（秒数に変換）
function parseDurationForSort(duration) {
    if (!duration) return 0;
    
    try {
        const durationStr = String(duration);
        
        // hh:mm:ss形式
        const timeMatch = durationStr.match(/(\d+):(\d+):(\d+)/);
        if (timeMatch) {
            const hours = parseInt(timeMatch[1]) || 0;
            const minutes = parseInt(timeMatch[2]) || 0;
            const seconds = parseInt(timeMatch[3]) || 0;
            return hours * 3600 + minutes * 60 + seconds;
        }
        
        // mm:ss形式
        const minSecMatch = durationStr.match(/(\d+):(\d+)/);
        if (minSecMatch) {
            const minutes = parseInt(minSecMatch[1]) || 0;
            const seconds = parseInt(minSecMatch[2]) || 0;
            return minutes * 60 + seconds;
        }
        
        // Date(1899,11,30,H,M,S)形式
        const dateMatch = durationStr.match(/Date\(1899,11,30,(\d+),(\d+),(\d+)\)/);
        if (dateMatch) {
            const hours = parseInt(dateMatch[1]) || 0;
            const minutes = parseInt(dateMatch[2]) || 0;
            const seconds = parseInt(dateMatch[3]) || 0;
            return hours * 3600 + minutes * 60 + seconds;
        }
        
        // 数値のみ（秒数として扱う）
        const numMatch = durationStr.match(/^\d+$/);
        if (numMatch) {
            return parseInt(durationStr);
        }
    } catch (e) {
        console.warn('動画尺のパースに失敗:', duration);
    }
    
    return 0;
}

// 動画選択プルダウンの作成
function populateVideoSelect() {
    const select = document.getElementById('video-select');
    const videos = window.videosData || videosData;
    
    if (!select || !videos) return;
    
    // 既存のオプションをクリア（最初のオプション以外）
    while (select.children.length > 1) {
        select.removeChild(select.lastChild);
    }
    
    videos.forEach(video => {
        const option = document.createElement('option');
        option.value = video.id; // 動画番号（#）を値として使用
        option.textContent = `${video.id}｜${video.title}`; // #｜タイトル形式で表示
        select.appendChild(option);
    });
}


// 選択された動画のコメントを表示
function renderCommentsForVideo(videoId) {
    const container = document.getElementById('comments-container');
    const videos = window.videosData || videosData;
    const comments = window.commentsData || commentsData;
    
    if (!container) return;
    
    if (!videoId) {
        container.innerHTML = '<p>動画を選択してください。</p>';
        return;
    }
    
    // 動画情報を取得
    const video = videos.find(v => v.id === videoId);
    if (!video) {
        container.innerHTML = '<p>動画が見つかりません。</p>';
        return;
    }
    
    // 動画番号（#）でコメントをフィルタリング
    // ALLコメントシートのA列（動画No）とdateシートのA列（#）が連動
    console.log('=== コメントフィルタリング開始 ===');
    console.log('選択された動画ID:', videoId);
    console.log('全コメント数:', comments.length);
    
    // 最初の5件のコメントの構造を確認
    if (comments.length > 0) {
        console.log('サンプルコメント（最初の5件）:');
        comments.slice(0, 5).forEach((c, i) => {
            console.log(`コメント${i + 1}:`, {
                id: c.id,
                videoNo: c.videoNo,
                videoId: c.videoId,
                author: c.author,
                text: c.text ? c.text.substring(0, 50) + '...' : 'なし'
            });
        });
    }
    
    const videoComments = comments.filter(comment => {
        // 複数の方法で動画Noを取得
        const commentVideoNo = comment.videoNo || 
                               comment.videoId || 
                               (comment.id && comment.id.toString()) ||
                               0;
        
        const match = parseInt(commentVideoNo) === parseInt(videoId);
        
        // 最初の数件のみログ出力
        if (comments.indexOf(comment) < 5) {
            console.log(`コメント動画No: ${commentVideoNo} (型: ${typeof commentVideoNo}), 比較: ${commentVideoNo} === ${videoId} → ${match}`);
        }
        
        return match;
    });
    
    console.log('フィルタリング後のコメント数:', videoComments.length);
    console.log('=== コメントフィルタリング終了 ===');
    
    // 動画情報を表示
    const formattedDate = formatDate(video.date);
    const videoInfoHtml = `
        <div class="selected-video-info">
            <table class="video-info-table">
                <tr>
                    <td class="video-title-row" colspan="3">${video.id} ${escapeHtml(video.title)}</td>
                </tr>
                <tr>
                    <td rowspan="4" class="video-thumbnail-cell-large">
                        <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" class="video-thumbnail-large" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'320\' height=\'180\'%3E%3Crect fill=\'%23ddd\' width=\'320\' height=\'180\'/%3E%3Ctext fill=\'%23999\' font-family=\'sans-serif\' font-size=\'14\' x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\'%3Eサムネイル%3C/text%3E%3C/svg%3E'">
                    </td>
                    <td class="video-info-label">投稿日</td>
                    <td class="video-info-value">${formattedDate}</td>
                </tr>
                <tr>
                    <td class="video-info-label">再生数</td>
                    <td class="video-info-value">${video.viewCount ? video.viewCount.toLocaleString() : '-'}</td>
                </tr>
                <tr>
                    <td class="video-info-label">高評価数</td>
                    <td class="video-info-value">${video.likeCount ? video.likeCount.toLocaleString() : '-'}</td>
                </tr>
                <tr>
                    <td class="video-info-label">コメント数</td>
                    <td class="video-info-value">${videoComments.length}件</td>
                </tr>
            </table>
        </div>
    `;
    
    if (videoComments.length === 0) {
        container.innerHTML = videoInfoHtml + `
            <p style="margin-top: 20px;">「${videoId} ${escapeHtml(video.title)}」にはコメントがありません。</p>
        `;
        return;
    }
    
    // コメントを並び替え
    let sortedComments = [...videoComments];
    if (commentSortColumn) {
        sortedComments.sort((a, b) => {
            return sortComments(a, b, commentSortColumn, commentSortDirection);
        });
    }
    
    // 並び替えアイコンの生成
    const getCommentSortIcon = (column) => {
        if (commentSortColumn === column) {
            return commentSortDirection === 'asc' ? ' ▲' : ' ▼';
        }
        return ' ↕';
    };
    
    container.innerHTML = videoInfoHtml + `
        <table class="comments-table">
            <thead>
                <tr>
                    <th>投稿者</th>
                    <th class="sortable" data-column="date">投稿日時${getCommentSortIcon('date')}</th>
                    <th>コメント本文</th>
                    <th class="sortable" data-column="likeCount">高評価数${getCommentSortIcon('likeCount')}</th>
                </tr>
            </thead>
            <tbody>
                ${sortedComments.map(comment => {
                    const commentDate = comment.date || comment['投稿日時'] || comment['日付'] || '';
                    const formattedDateTime = formatDateTime(commentDate);
                    return `
                    <tr>
                        <td class="comment-author-cell">${escapeHtml(comment.author || comment['投稿者'] || comment['投稿者名'] || '')}</td>
                        <td class="comment-date-cell">${escapeHtml(formattedDateTime)}</td>
                        <td class="comment-text-cell">${escapeHtml(comment.text || comment['コメント'] || comment['コメント内容'] || '')}</td>
                        <td class="comment-likes-cell">${comment.likeCount ? comment.likeCount.toLocaleString() : '0'}</td>
                    </tr>
                `;
                }).join('')}
            </tbody>
        </table>
    `;
    
    // 並び替え可能なヘッダーにクリックイベントを追加
    container.querySelectorAll('.comments-table .sortable').forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', function() {
            const column = this.getAttribute('data-column');
            if (commentSortColumn === column) {
                // 同じ列をクリックした場合は昇順/降順を切り替え
                commentSortDirection = commentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                // 新しい列をクリックした場合は昇順で並び替え
                commentSortColumn = column;
                commentSortDirection = 'asc';
            }
            renderCommentsForVideo(videoId);
        });
    });
}

// コメントの並び替え関数
function sortComments(a, b, column, direction) {
    let aValue, bValue;
    
    switch(column) {
        case 'date':
            const aDate = a.date || a['投稿日時'] || a['日付'] || '';
            const bDate = b.date || b['投稿日時'] || b['日付'] || '';
            aValue = parseDateTimeForSort(aDate);
            bValue = parseDateTimeForSort(bDate);
            break;
        case 'likeCount':
            aValue = parseInt(a.likeCount || a['高評価数'] || '0') || 0;
            bValue = parseInt(b.likeCount || b['高評価数'] || '0') || 0;
            break;
        default:
            return 0;
    }
    
    if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
    } else if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
    }
    return 0;
}

// 日時を並び替え用にパース（ミリ秒に変換）
function parseDateTimeForSort(dateTimeString) {
    if (!dateTimeString) return new Date(0).getTime();
    
    try {
        // Date(2020,8,11,10,30)形式をパース
        const dateTimeMatch = String(dateTimeString).match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+))?\)/);
        if (dateTimeMatch) {
            const year = parseInt(dateTimeMatch[1]);
            const month = parseInt(dateTimeMatch[2]);
            const day = parseInt(dateTimeMatch[3]);
            const hour = dateTimeMatch[4] ? parseInt(dateTimeMatch[4]) : 0;
            const minute = dateTimeMatch[5] ? parseInt(dateTimeMatch[5]) : 0;
            return new Date(year, month, day, hour, minute).getTime();
        }
        
        // ISO 8601形式
        if (dateTimeString.includes('T') || dateTimeString.includes(' ')) {
            return new Date(dateTimeString).getTime();
        }
        
        // yyyy/mm/dd hh:mm形式
        const dateTimeMatch2 = String(dateTimeString).match(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/);
        if (dateTimeMatch2) {
            const year = parseInt(dateTimeMatch2[1]);
            const month = parseInt(dateTimeMatch2[2]) - 1; // 月は0ベース
            const day = parseInt(dateTimeMatch2[3]);
            const hour = parseInt(dateTimeMatch2[4]);
            const minute = parseInt(dateTimeMatch2[5]);
            return new Date(year, month, day, hour, minute).getTime();
        }
        
        // yyyy-mm-dd形式
        if (/^\d{4}-\d{2}-\d{2}/.test(dateTimeString)) {
            return new Date(dateTimeString).getTime();
        }
        
        // yyyy/mm/dd形式
        if (/^\d{4}\/\d{2}\/\d{2}/.test(dateTimeString)) {
            return new Date(dateTimeString.replace(/\//g, '-')).getTime();
        }
    } catch (e) {
        console.warn('日時のパースに失敗:', dateTimeString);
    }
    
    return new Date(0).getTime();
}

// 投稿者統計の表示
function renderAuthorStats() {
    const container = document.getElementById('authors-container');
    const comments = window.commentsData || commentsData;
    
    if (!container) return;
    
    const authorCounts = getAuthorCommentCounts(comments);
    
    if (authorCounts.length === 0) {
        container.innerHTML = '<p>コメントデータがありません。</p>';
        return;
    }
    
    const totalComments = comments.length;
    
    container.innerHTML = `
        <div class="stats-summary">
            <p>総コメント数: <strong>${totalComments}</strong>件</p>
            <p>投稿者数: <strong>${authorCounts.length}</strong>人</p>
        </div>
        <table class="authors-table">
            <thead>
                <tr>
                    <th>順位</th>
                    <th>投稿者名</th>
                    <th>コメント数</th>
                    <th>最終投稿日</th>
                </tr>
            </thead>
            <tbody>
                ${authorCounts.map((author, index) => {
                    const lastDateFormatted = author.lastDate ? formatDate(author.lastDate) : '-';
                    return `
                        <tr>
                            <td class="rank">${index + 1}</td>
                            <td class="author-name">${escapeHtml(author.author)}</td>
                            <td class="comment-count">${author.count}件</td>
                            <td class="last-date">${lastDateFormatted}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// HTMLエスケープ関数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 日付をyyyy/mm/dd形式に変換
function formatDate(dateString) {
    if (!dateString || dateString === '-') return '-';
    
    try {
        // Date(2020,8,11)形式をパース
        const dateMatch = String(dateString).match(/Date\((\d+),(\d+),(\d+)\)/);
        if (dateMatch) {
            const year = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]) + 1; // 月は0ベースなので+1
            const day = parseInt(dateMatch[3]);
            return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
        }
        
        // 既にyyyy/mm/dd形式の場合
        if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        // yyyy-mm-dd形式の場合
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString.replace(/-/g, '/');
        }
        
        // Dateオブジェクトに変換を試みる
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}/${month}/${day}`;
        }
        
        return dateString;
    } catch (e) {
        return dateString;
    }
}

// 日時をyyyy/mm/dd hh:mm形式に変換
function formatDateTime(dateTimeString) {
    if (!dateTimeString || dateTimeString === '-') return '-';
    
    try {
        // ISO 8601形式 (2020-12-01T11:00:43Z) をパース
        const isoMatch = String(dateTimeString).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if (isoMatch) {
            const year = isoMatch[1];
            const month = isoMatch[2];
            const day = isoMatch[3];
            const hour = isoMatch[4];
            const minute = isoMatch[5];
            return `${year}/${month}/${day} ${hour}:${minute}`;
        }
        
        // Dateオブジェクトに変換を試みる
        const date = new Date(dateTimeString);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');
            return `${year}/${month}/${day} ${hour}:${minute}`;
        }
        
        return dateTimeString;
    } catch (e) {
        return dateTimeString;
    }
}

// 動画尺をhh:mm:ss形式に変換
function formatDuration(duration) {
    if (!duration || duration === '-') return '-';
    
    try {
        // Date(1899,11,30,0,6,59)形式をパース（時分秒のみ使用）
        const dateMatch = String(duration).match(/Date\(\d+,\d+,\d+,(\d+),(\d+),(\d+)\)/);
        if (dateMatch) {
            const hours = parseInt(dateMatch[1]);
            const minutes = parseInt(dateMatch[2]);
            const seconds = parseInt(dateMatch[3]);
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        
        // 既にhh:mm:ss形式の場合
        if (/^\d{2}:\d{2}:\d{2}$/.test(duration)) {
            return duration;
        }
        
        // h:mm:ss形式の場合（1桁の時間）
        if (/^\d{1,2}:\d{2}:\d{2}$/.test(duration)) {
            const parts = duration.split(':');
            if (parts.length === 3) {
                const hours = String(parseInt(parts[0])).padStart(2, '0');
                const minutes = String(parseInt(parts[1])).padStart(2, '0');
                const seconds = String(parseInt(parts[2])).padStart(2, '0');
                return `${hours}:${minutes}:${seconds}`;
            }
        }
        
        // mm:ss形式の場合
        if (/^\d{1,2}:\d{2}$/.test(duration)) {
            const parts = duration.split(':');
            if (parts.length === 2) {
                const minutes = String(parseInt(parts[0])).padStart(2, '0');
                const seconds = String(parseInt(parts[1])).padStart(2, '0');
                return `00:${minutes}:${seconds}`;
            }
        }
        
        // 秒数のみの場合
        const secondsOnly = parseInt(duration);
        if (!isNaN(secondsOnly)) {
            const hours = Math.floor(secondsOnly / 3600);
            const minutes = Math.floor((secondsOnly % 3600) / 60);
            const secs = secondsOnly % 60;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        
        return duration;
    } catch (e) {
        return duration;
    }
}
