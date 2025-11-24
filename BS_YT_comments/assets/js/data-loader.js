// スプレッドシートデータ読み込みモジュール

// Googleスプレッドシートからデータを読み込む
async function loadDataFromSpreadsheet(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        
        // Google SheetsのJSON形式をパース
        // 形式: google.visualization.Query.setResponse({...})
        const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[1]);
            return parseGoogleSheetsData(data);
        }
        
        // 通常のJSON形式の場合
        return JSON.parse(text);
    } catch (error) {
        console.error('スプレッドシートの読み込みエラー:', error);
        throw error;
    }
}

// Google Sheetsのデータをパース
function parseGoogleSheetsData(data) {
    if (!data.table || !data.table.rows) {
        console.log('Google Sheetsデータの構造が不正:', data);
        return [];
    }
    
    const rows = data.table.rows;
    const cols = data.table.cols;
    
    // ヘッダー行を取得
    const headers = cols.map(col => col.label || '');
    console.log('スプレッドシートのヘッダー:', headers);
    
    // データ行をオブジェクトに変換
    return rows.map((row, rowIndex) => {
        const obj = {};
        row.c.forEach((cell, cellIndex) => {
            const header = headers[cellIndex];
            if (header) {
                // セルの値を取得（数値、日付、文字列など）
                let value = '';
                if (cell) {
                    // cell.v: 実際の値（数値、日付のシリアル値など）
                    // cell.f: フォーマット済みの文字列（表示形式）
                    // cell.t: データ型（'s'=文字列, 'n'=数値, 'd'=日付など）
                    if (cell.v !== undefined && cell.v !== null) {
                        // 数値や日付の場合は、フォーマット済み文字列も確認
                        if (cell.f && (cell.t === 'd' || cell.t === 'n')) {
                            // 日付や数値の場合、フォーマット済み文字列を使用
                            value = cell.f;
                        } else {
                            value = cell.v;
                        }
                    } else if (cell.f !== undefined && cell.f !== null) {
                        value = cell.f;
                    }
                }
                obj[header] = value;
                
                // 最初の数行のみデバッグ情報を出力
                if (rowIndex < 3 && cellIndex === 0) {
                    console.log(`行${rowIndex + 1}, 列${cellIndex + 1} (${header}):`, {
                        値: cell.v,
                        フォーマット: cell.f,
                        型: cell.t,
                        結果: value
                    });
                }
            }
        });
        return obj;
    });
}

// CSVファイルからデータを読み込む
async function loadDataFromCSV(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        return parseCSV(text);
    } catch (error) {
        console.error('CSVファイルの読み込みエラー:', error);
        throw error;
    }
}

// CSVをパース
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    // ヘッダー行を取得
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // データ行をパース
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] || '';
        });
        return obj;
    });
}

// CSV行をパース（カンマと引用符を考慮）
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    
    return values;
}

// 動画データをスプレッドシート形式から変換
function convertVideosData(spreadsheetData) {
    if (!spreadsheetData || spreadsheetData.length === 0) {
        return [];
    }
    
    // ヘッダー行をスキップ（最初の行がヘッダーの場合）
    const dataRows = spreadsheetData.filter((row, index) => {
        // 最初の行がヘッダー行かどうかをチェック
        if (index === 0) {
            // #列が'#'という文字列、またはタイトル列が'タイトル'という文字列の場合はヘッダー行
            if (row['#'] === '#' || row['タイトル'] === 'タイトル' || row['title'] === 'title') {
                return false; // ヘッダー行をスキップ
            }
        }
        // 空行や無効なデータをスキップ
        if (!row['#'] && !row['タイトル'] && !row['title']) {
            return false;
        }
        return true;
    });
    
    return dataRows.map((row, index) => {
        // 実際のスプレッドシートの列名に合わせて変換
        // 列: #, タイトル, 概要文, 投稿日, URL, 動画尺, サムネイル, 再生数, 高評価数, コメント数
        const idValue = row['#'] || row.id || row.ID;
        const id = idValue ? parseInt(idValue) : (index + 1);
        
        // 数値文字列からカンマを削除してパース
        const viewCountStr = (row['再生数'] || row.viewCount || row['視聴回数'] || '0').toString().replace(/,/g, '');
        const likeCountStr = (row['高評価数'] || row.likeCount || '0').toString().replace(/,/g, '');
        const commentCountStr = (row['コメント数'] || row.commentCount || '0').toString().replace(/,/g, '');
        
        return {
            id: id,
            title: row['タイトル'] || row.title || '',
            thumbnail: row['サムネイル'] || row.thumbnail || row['画像URL'] || '',
            date: row['投稿日'] || row.date || row['日付'] || '',
            viewCount: parseInt(viewCountStr) || 0,
            url: row['URL'] || row.url || '',
            description: row['概要文'] || row.description || '',
            duration: row['動画尺'] || row.duration || '',
            likeCount: parseInt(likeCountStr) || 0,
            commentCount: parseInt(commentCountStr) || 0
        };
    }).filter(video => video.id && video.title); // 有効なデータのみ
}

// コメントデータをスプレッドシート形式から変換
function convertCommentsData(spreadsheetData) {
    if (!spreadsheetData || spreadsheetData.length === 0) {
        console.log('コメントデータが空です');
        return [];
    }
    
    console.log('=== コメントデータ変換開始 ===');
    console.log('元データの行数:', spreadsheetData.length);
    if (spreadsheetData.length > 0) {
        console.log('最初の行のキー:', Object.keys(spreadsheetData[0]));
        console.log('最初の行のデータ:', spreadsheetData[0]);
    }
    
    // ヘッダー行をスキップ
    const dataRows = spreadsheetData.filter((row, index) => {
        // 最初の行がヘッダー行かどうかをチェック
        if (index === 0) {
            const firstRowKeys = Object.keys(row);
            console.log('最初の行のキー一覧:', firstRowKeys);
            
            if (row['#'] === '#' || 
                row['id'] === 'id' || 
                row['ID'] === 'ID' ||
                row['動画No'] === '動画No' ||
                row['動画ID'] === '動画ID' ||
                row['動画タイトル'] === '動画タイトル' ||
                row['タイトル'] === 'タイトル' ||
                row['title'] === 'title' ||
                row['投稿者'] === '投稿者' ||
                row['author'] === 'author' ||
                row['コメントID'] === 'コメントID') {
                console.log('ヘッダー行をスキップしました');
                return false; // ヘッダー行をスキップ
            }
        }
        // 空行や無効なデータをスキップ（動画Noがあれば有効）
        if (!row['動画No'] && !row['#'] && !row['id'] && !row['ID'] && !row['動画ID'] && !row['videoId']) {
            return false;
        }
        return true;
    });
    
    console.log('ヘッダー行をスキップ後の行数:', dataRows.length);
    
    const converted = dataRows.map((row, index) => {
        // 実際のスプレッドシートの列名に合わせて変換
        // ALLコメントシートのA列（動画No）とdateシートのA列（#）が連動
        
        // A列から動画Noを取得（これが最も重要）
        // スプレッドシートのA列のヘッダー名は「動画No」
        // 優先順位: 動画No > # > その他
        let videoNoValue = row['動画No'] || row['#'] || row.videoNo || row['動画番号'] || row['videoNo'] || '';
        
        // 数値の場合はそのまま、文字列の場合は数値に変換
        let videoNo = 0;
        if (videoNoValue !== '' && videoNoValue !== null && videoNoValue !== undefined) {
            // 文字列の場合、数値部分を抽出
            if (typeof videoNoValue === 'string') {
                // 数値部分を抽出（例: "13" → 13, "13.0" → 13）
                const numMatch = videoNoValue.toString().match(/^(\d+)/);
                if (numMatch) {
                    videoNo = parseInt(numMatch[1]);
                }
            } else if (typeof videoNoValue === 'number') {
                videoNo = parseInt(videoNoValue);
            } else {
                videoNo = parseInt(videoNoValue) || 0;
            }
        }
        
        // 動画ID（C列）を取得（YouTubeの動画ID、文字列）
        const videoId = row['動画ID'] || row.videoId || row['video_id'] || row.video_id || '';
        
        // 最初の数件のみログ出力
        if (index < 3) {
            console.log(`行${index + 1}の変換:`, {
                元データのキー: Object.keys(row),
                動画No列の値: row['動画No'],
                '#列の値': row['#'],
                動画No変換後: videoNo,
                動画ID: videoId
            });
        }
        
        // コメントID（E列のコメントIDを使用、なければ行番号）
        const idValue = row['コメントID'] || row['コメントid'] || row.commentId || row['#'] || row.id || row.ID || (index + 1).toString();
        const id = idValue ? (typeof idValue === 'string' ? idValue : idValue.toString()) : (index + 1).toString();
        
        // 動画タイトルを取得（B列）
        const videoTitle = row['動画タイトル'] || row['タイトル'] || row.title || row.videoTitle || row['動画名'] || '';
        
        // 高評価数を取得（J列）
        const likeCountStr = (row['高評価数'] || row.likeCount || row['いいね数'] || row.likes || '0').toString().replace(/,/g, '');
        const likeCount = parseInt(likeCountStr) || 0;
        
        return {
            id: id,
            videoId: videoId, // 動画ID（C列、YouTubeの動画ID）
            videoNo: videoNo, // 動画No（A列）を追加 - これがdateシートの#と連動
            title: videoTitle, // 動画タイトル（B列）
            author: row['投稿者'] || row.author || row['投稿者名'] || row['ユーザー名'] || row['ユーザー'] || '',
            date: row['投稿日時'] || row['日付'] || row.date || row['投稿日'] || row['datetime'] || '',
            text: row['コメント本文'] || row['コメント'] || row.text || row['コメント内容'] || row['内容'] || row['comment'] || '',
            likeCount: likeCount // 高評価数（J列）
        };
    });
    
    const filtered = converted.filter(comment => {
        // 有効なデータのみ（動画Noまたはauthorとtextがあれば有効）
        const isValid = (comment.videoNo > 0 || comment.id) && comment.author && comment.text;
        if (!isValid && converted.indexOf(comment) < 3) {
            console.log('無効なコメントをスキップ:', comment);
        }
        return isValid;
    });
    
    console.log('変換後のコメント数:', filtered.length);
    if (filtered.length > 0) {
        const uniqueVideoNos = [...new Set(filtered.map(c => c.videoNo))].slice(0, 10);
        console.log('コメント内の動画No（サンプル）:', uniqueVideoNos);
    }
    console.log('=== コメントデータ変換終了 ===');
    
    return filtered;
}

// データを読み込む（メイン関数）
async function loadAllData() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
        loadingElement.style.display = 'block';
    }
    
    console.log('=== データ読み込み開始 ===');
    console.log('設定:', CONFIG);
    
    try {
        let videos = [];
        let comments = [];
        
        if (CONFIG.useLocalData) {
            console.log('ローカルデータを使用');
            // ローカルデータを使用
            videos = videosData || [];
            comments = commentsData || [];
        } else {
            console.log('スプレッドシートから読み込み');
            // スプレッドシートから読み込み
            if (CONFIG.spreadsheetUrl.videos) {
                console.log('動画データを読み込み中:', CONFIG.spreadsheetUrl.videos);
                try {
                    const videosRaw = await loadDataFromSpreadsheet(CONFIG.spreadsheetUrl.videos);
                    console.log('動画データ読み込み成功、行数:', videosRaw.length);
                    videos = convertVideosData(videosRaw);
                    console.log('動画データ変換後:', videos.length);
                } catch (error) {
                    console.error('動画データ読み込みエラー:', error);
                }
            } else if (CONFIG.csvFiles.videos) {
                console.log('動画データをCSVから読み込み中');
                try {
                    const videosRaw = await loadDataFromCSV(CONFIG.csvFiles.videos);
                    videos = convertVideosData(videosRaw);
                } catch (error) {
                    console.error('動画データCSV読み込みエラー:', error);
                }
            }
            
            if (CONFIG.spreadsheetUrl.comments) {
                console.log('コメントデータを読み込み中:', CONFIG.spreadsheetUrl.comments);
                try {
                    const commentsRaw = await loadDataFromSpreadsheet(CONFIG.spreadsheetUrl.comments);
                    console.log('コメントデータ読み込み成功、行数:', commentsRaw.length);
                    comments = convertCommentsData(commentsRaw);
                    console.log('コメントデータ変換後:', comments.length);
                } catch (error) {
                    console.error('コメントデータ読み込みエラー:', error);
                    console.error('エラー詳細:', error.message, error.stack);
                }
            } else if (CONFIG.csvFiles.comments) {
                console.log('コメントデータをCSVから読み込み中');
                try {
                    const commentsRaw = await loadDataFromCSV(CONFIG.csvFiles.comments);
                    comments = convertCommentsData(commentsRaw);
                } catch (error) {
                    console.error('コメントデータCSV読み込みエラー:', error);
                }
            }
        }
        
        console.log('最終的なデータ数 - 動画:', videos.length, 'コメント:', comments.length);
        
        // グローバル変数に設定
        window.videosData = videos;
        window.commentsData = comments;
        
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        console.log('=== データ読み込み完了 ===');
        return { videos, comments };
    } catch (error) {
        console.error('データ読み込みエラー:', error);
        console.error('エラー詳細:', error.message, error.stack);
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
        
        // エラー時はローカルデータにフォールバック
        window.videosData = videosData || [];
        window.commentsData = commentsData || [];
        
        console.log('フォールバック後のデータ数 - 動画:', window.videosData.length, 'コメント:', window.commentsData.length);
        
        return { videos: window.videosData, comments: window.commentsData };
    }
}

