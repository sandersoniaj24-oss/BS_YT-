# Webページの共有方法

このWebページを他の人に共有する方法を説明します。

## 方法1: Netlify（推奨・最も簡単）

Netlifyは無料で、ドラッグ&ドロップで簡単にデプロイできます。

### 手順

1. **Netlifyにアクセス**
   - https://www.netlify.com/ にアクセス
   - 「Sign up」でアカウント作成（GitHubアカウントでログイン可能）

2. **デプロイ**
   - ダッシュボードで「Add new site」→「Deploy manually」を選択
   - プロジェクトフォルダ（`BS_YT_comments`）全体をドラッグ&ドロップ
   - 自動的にデプロイが開始されます

3. **URLの取得**
   - デプロイ完了後、自動的にURLが生成されます（例: `https://random-name-123.netlify.app`）
   - このURLを共有すれば、誰でもアクセスできます

4. **カスタムドメイン（オプション）**
   - 設定からカスタムドメインを設定することも可能

### メリット
- 無料
- ドラッグ&ドロップで簡単
- 自動的にHTTPS対応
- 更新時も再デプロイするだけでOK

---

## 方法2: GitHub Pages

GitHubアカウントがある場合、無料でホスティングできます。

### 手順

1. **GitHubリポジトリの作成**
   ```bash
   # プロジェクトフォルダで実行
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **GitHubにプッシュ**
   - GitHubで新しいリポジトリを作成
   - リポジトリのURLをコピー
   ```bash
   git remote add origin https://github.com/ユーザー名/リポジトリ名.git
   git branch -M main
   git push -u origin main
   ```

3. **GitHub Pagesの有効化**
   - リポジトリの「Settings」→「Pages」に移動
   - Sourceを「main」ブランチに設定
   - 保存すると、`https://ユーザー名.github.io/リポジトリ名/` でアクセス可能

### メリット
- 無料
- バージョン管理も同時にできる
- 更新はGit pushするだけ

---

## 方法3: Vercel

Vercelも無料で、GitHubと連携して自動デプロイできます。

### 手順

1. **Vercelにアクセス**
   - https://vercel.com/ にアクセス
   - GitHubアカウントでログイン

2. **プロジェクトのインポート**
   - 「Add New Project」をクリック
   - GitHubリポジトリを選択（または手動でアップロード）
   - デプロイ設定はそのままでOK

3. **URLの取得**
   - デプロイ完了後、自動的にURLが生成されます

### メリット
- 無料
- GitHubと連携して自動デプロイ
- 高速なCDN配信

---

## 方法4: ローカルサーバーで共有（同じネットワーク内）

同じWi-Fiに接続している人に共有する場合。

### 手順

1. **Pythonがインストールされている場合**
   ```bash
   # プロジェクトフォルダで実行
   python -m http.server 8000
   ```
   - ブラウザで `http://localhost:8000` にアクセス
   - 同じネットワーク内の他の人は `http://あなたのIPアドレス:8000` でアクセス

2. **Node.jsがインストールされている場合**
   ```bash
   # http-serverをインストール（初回のみ）
   npm install -g http-server
   
   # プロジェクトフォルダで実行
   http-server -p 8000
   ```

3. **IPアドレスの確認（Windows）**
   ```bash
   ipconfig
   ```
   - 「IPv4アドレス」を確認（例: 192.168.1.100）

### メリット
- すぐに試せる
- インターネット接続不要（ローカルネットワーク内）

### デメリット
- 同じネットワーク内の人しかアクセスできない
- あなたのPCが起動している必要がある

---

## 重要な注意事項

### Google SpreadsheetsのCORS設定

現在、Google Spreadsheetsからデータを読み込んでいます。Webサーバーにデプロイする場合、CORSエラーが発生する可能性があります。

#### 対処法1: Google Apps Scriptを使用（推奨）

1. Google Apps Scriptでプロキシを作成
2. `config.js`のURLを変更

詳細は `SPREADSHEET_SETUP.md` を参照してください。

#### 対処法2: ローカルデータに切り替え

1. `assets/js/config.js`を編集
   ```javascript
   useLocalData: true
   ```
2. `assets/js/data.js`にデータを直接記述

---

## 推奨される手順

1. **まずNetlifyで試す**（最も簡単）
   - ドラッグ&ドロップでデプロイ
   - CORSエラーが出る場合は、Google Apps Scriptを使用

2. **本格的に運用する場合**
   - GitHub PagesまたはVercelを使用
   - バージョン管理も同時に行える

3. **すぐに試したい場合**
   - ローカルサーバーで共有

---

## トラブルシューティング

### CORSエラーが発生する場合

ブラウザのコンソールに「CORS policy」エラーが表示される場合：

1. **Google Apps Scriptを使用**
   - `SPREADSHEET_SETUP.md`の手順に従う

2. **ローカルデータに切り替え**
   - `config.js`で`useLocalData: true`に設定

### データが表示されない場合

1. ブラウザのコンソールでエラーを確認
2. `config.js`の設定を確認
3. スプレッドシートが正しく公開されているか確認

---

## セキュリティについて

- スプレッドシートのURLは公開されるため、機密情報は含めないでください
- 必要に応じて、スプレッドシートのアクセス権限を設定してください

