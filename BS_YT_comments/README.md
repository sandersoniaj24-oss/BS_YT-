# BS YouTube Comments

YouTubeチャンネルのコメント一覧を表示するWebサイトです。

## 機能

1. **TOPページ（動画一覧）**
   - チャンネル内のすべての動画を一覧表示
   - 各動画のサムネイル、タイトル、投稿日、視聴回数を表示

2. **動画毎のコメント一覧**
   - プルダウンメニューから動画を選択
   - 選択した動画のコメントを一覧表示
   - コメント投稿者名、投稿日時、コメント内容を表示

3. **コメント投稿者のコメント回数一覧**
   - 各投稿者のコメント数を集計
   - コメント数の多い順にランキング表示
   - 割合を視覚的に表示（バーグラフ）

## プロジェクト構造

```
BS_YT_comments/
├─ index.html              # メインHTMLファイル
├─ assets/
│  ├─ css/
│  │  ├─ reset.css        # CSSリセット
│  │  └─ style.css        # メインスタイル
│  ├─ js/
│  │  ├─ config.js        # 設定ファイル（スプレッドシートURL等）
│  │  ├─ data.js          # 動画データ・コメントデータ（ローカル用）
│  │  ├─ data-loader.js   # スプレッドシート読み込みモジュール
│  │  └─ app.js           # アプリケーションロジック
│  └─ img/
│     ├─ thumbnails/      # 動画サムネイル画像
│     └─ icons/           # アイコン画像
└─ README.md
```

## 使い方

1. `index.html`をブラウザで開く
2. 上部のナビゲーションボタンで各機能にアクセス
   - **動画一覧**: チャンネル内の動画を一覧表示
   - **コメント一覧**: プルダウンで動画を選択してコメントを表示
   - **投稿者統計**: 投稿者ごとのコメント回数を表示

## データの編集

### 方法1: スプレッドシートから読み込む（推奨）

Googleスプレッドシートからデータを読み込むことができます。

#### 1. Googleスプレッドシートの準備

**動画データ用シート:**
- 列: `id`, `title`, `thumbnail`, `date`, `viewCount`
- または日本語列名: `ID`, `タイトル`, `サムネイル`, `日付`, `視聴回数`

**コメントデータ用シート:**
- 列: `id`, `videoId`, `author`, `date`, `text`
- または日本語列名: `ID`, `動画ID`, `投稿者`, `日付`, `コメント`

#### 2. スプレッドシートをJSON形式で公開

1. Googleスプレッドシートを開く
2. 「ファイル」→「ウェブに公開」を選択
3. 「公開」をクリック
4. URLをコピー（例: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`）

#### 3. 設定ファイルの編集

`assets/js/config.js`を編集してください:

```javascript
const CONFIG = {
    spreadsheetUrl: {
        videos: "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/gviz/tq?tqx=out:json&sheet=動画",
        comments: "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/gviz/tq?tqx=out:json&sheet=コメント"
    },
    useLocalData: false  // falseに変更
};
```

**URLの形式:**
- `YOUR_SHEET_ID`を実際のスプレッドシートIDに置き換え
- `sheet=動画`の部分はシート名に合わせて変更
- 複数シートがある場合は、それぞれのシート名を指定

#### 4. CORSエラーが発生する場合

GoogleスプレッドシートのJSON形式はCORS制限がある場合があります。その場合は、Google Apps Scriptを使用する方法があります。

### 方法2: ローカルデータを使用

`assets/js/data.js`のデータを直接編集してください。

### 動画データの追加・編集
`assets/js/data.js`の`videosData`配列を編集してください。

```javascript
{
    id: 1,                    // 動画ID（一意）
    title: "動画タイトル",    // 動画タイトル
    thumbnail: "画像パス",    // サムネイル画像のパス
    date: "2024-01-15",      // 投稿日
    viewCount: 1250          // 視聴回数
}
```

### コメントデータの追加・編集
`assets/js/data.js`の`commentsData`配列を編集してください。

```javascript
{
    id: 1,                    // コメントID（一意）
    videoId: 1,               // 動画ID（videosDataのidと対応）
    author: "投稿者名",       // 投稿者名
    date: "2024-01-15 10:30", // 投稿日時
    text: "コメント内容"      // コメント本文
}
```

## カスタマイズ

- **スタイル**: `assets/css/style.css`を編集
- **レイアウト**: `index.html`を編集
- **機能追加**: `assets/js/app.js`を編集

## ブラウザ対応

- Chrome（推奨）
- Firefox
- Safari
- Edge

## 注意事項

- サムネイル画像が存在しない場合、プレースホルダーが表示されます
- スプレッドシートを使用する場合は、`config.js`で`useLocalData: false`に設定してください
- スプレッドシートの列名は、英語または日本語のどちらでも対応しています
- CORSエラーが発生する場合は、Google Apps Scriptを使用するか、CSVファイルをローカルに配置して使用してください

## トラブルシューティング

### スプレッドシートが読み込めない場合

1. **CORSエラー**: ブラウザのコンソールでCORSエラーが表示される場合
   - Google Apps Scriptを使用する方法に切り替える
   - または、CSVファイルをローカルに配置して使用する

2. **データが表示されない**: 
   - `config.js`の`useLocalData`が`false`になっているか確認
   - スプレッドシートのURLが正しいか確認
   - スプレッドシートが「ウェブに公開」されているか確認

3. **列名が認識されない**:
   - `data-loader.js`の`convertVideosData`と`convertCommentsData`関数で列名のマッピングを確認・編集してください
