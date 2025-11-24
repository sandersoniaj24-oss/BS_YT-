# スプレッドシート設定ガイド

このドキュメントでは、Googleスプレッドシートからデータを読み込む方法を詳しく説明します。

## スプレッドシートの準備

### 1. 動画データ用シート

以下の列を含むシートを作成してください：

| id | title | thumbnail | date | viewCount |
|----|-------|-----------|------|-----------|
| 1 | サンプル動画1 | https://... | 2024-01-15 | 1250 |
| 2 | サンプル動画2 | https://... | 2024-01-16 | 890 |

**列名のバリエーション（日本語も対応）:**
- `id` / `ID`
- `title` / `タイトル` / `動画タイトル`
- `thumbnail` / `サムネイル` / `画像URL`
- `date` / `日付` / `投稿日`
- `viewCount` / `視聴回数` / `views`

### 2. コメントデータ用シート

以下の列を含むシートを作成してください：

| id | videoId | author | date | text |
|----|---------|--------|------|------|
| 1 | 1 | ユーザーA | 2024-01-15 10:30 | 素晴らしい動画でした！ |
| 2 | 1 | ユーザーB | 2024-01-15 11:15 | 次回も楽しみにしています。 |

**列名のバリエーション（日本語も対応）:**
- `id` / `ID`
- `videoId` / `動画ID` / `video_id`
- `author` / `投稿者` / `投稿者名`
- `date` / `日付` / `投稿日時`
- `text` / `コメント` / `コメント内容`

## スプレッドシートの公開設定

### 方法1: Google Sheets JSON形式（簡単）

1. Googleスプレッドシートを開く
2. 「共有」ボタンをクリック
3. 「リンクを知っている全員」に変更し、「閲覧者」を選択
4. URLをコピー

**URLの変換:**
元のURL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`

JSON形式のURL:
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/gviz/tq?tqx=out:json&sheet=シート名
```

- `YOUR_SHEET_ID`: スプレッドシートID（URLから取得）
- `シート名`: シートの名前（例: "動画", "コメント"）

### 方法2: Google Apps Script（CORSエラー回避）

1. Googleスプレッドシートを開く
2. 「拡張機能」→「Apps Script」を選択
3. 以下のコードを貼り付けて保存:

```javascript
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const videosSheet = sheet.getSheetByName('動画');
  const commentsSheet = sheet.getSheetByName('コメント');
  
  const videos = getSheetData(videosSheet);
  const comments = getSheetData(commentsSheet);
  
  return ContentService.createTextOutput(JSON.stringify({
    videos: videos,
    comments: comments
  })).setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}
```

4. 「デプロイ」→「新しいデプロイ」を選択
5. 「種類の選択」→「ウェブアプリ」を選択
6. 実行ユーザーを「自分」に設定
7. アクセスできるユーザーを「全員」に設定
8. 「デプロイ」をクリック
9. 表示されたURLをコピー

## config.jsの設定

`assets/js/config.js`を編集してください:

```javascript
const CONFIG = {
    spreadsheetUrl: {
        videos: "ここに動画データのURLを貼り付け",
        comments: "ここにコメントデータのURLを貼り付け"
    },
    useLocalData: false  // スプレッドシートを使用する場合はfalse
};
```

### 単一URLの場合（Google Apps Script使用時）

```javascript
const CONFIG = {
    spreadsheetUrl: {
        videos: "",  // 空欄
        comments: "" // 空欄
    },
    useLocalData: false,
    appsScriptUrl: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
};
```

この場合、`data-loader.js`を少し修正する必要があります。

## CSVファイルを使用する場合

スプレッドシートをCSV形式でエクスポートし、`data/`フォルダに配置してください:

```
BS_YT_comments/
└─ data/
   ├─ videos.csv
   └─ comments.csv
```

`config.js`でCSVファイルのパスを指定:

```javascript
const CONFIG = {
    csvFiles: {
        videos: "data/videos.csv",
        comments: "data/comments.csv"
    },
    useLocalData: false
};
```

## 列名のカスタマイズ

スプレッドシートの列名が標準と異なる場合は、`assets/js/data-loader.js`の以下の関数を編集してください:

- `convertVideosData()`: 動画データの変換ロジック
- `convertCommentsData()`: コメントデータの変換ロジック

例:
```javascript
function convertVideosData(spreadsheetData) {
    return spreadsheetData.map((row, index) => {
        return {
            id: parseInt(row['動画ID'] || index + 1),
            title: row['動画名'] || '',
            thumbnail: row['画像'] || '',
            date: row['公開日'] || '',
            viewCount: parseInt(row['再生数'] || 0)
        };
    });
}
```

## トラブルシューティング

### データが表示されない

1. ブラウザのコンソール（F12）でエラーを確認
2. スプレッドシートのURLが正しいか確認
3. スプレッドシートが公開されているか確認
4. 列名が正しいか確認

### CORSエラー

- Google Apps Scriptを使用する方法に切り替える
- または、CSVファイルをローカルに配置して使用する

### データ形式エラー

- スプレッドシートのデータ型を確認（数値は数値、日付は文字列など）
- `data-loader.js`の変換関数を確認

