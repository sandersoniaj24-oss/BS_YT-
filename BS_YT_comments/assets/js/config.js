// 設定ファイル
const CONFIG = {
    // GoogleスプレッドシートのURL（JSON形式で公開する必要があります）
    // スプレッドシートID: 1wxjL8Pv0fhHwpyRElFundN1cjyHVvF8rzjWn1SR4U3E
    spreadsheetUrl: {
        videos: "https://docs.google.com/spreadsheets/d/1wxjL8Pv0fhHwpyRElFundN1cjyHVvF8rzjWn1SR4U3E/gviz/tq?tqx=out:json&gid=2085692452",  // 動画データ
        comments: "https://docs.google.com/spreadsheets/d/1wxjL8Pv0fhHwpyRElFundN1cjyHVvF8rzjWn1SR4U3E/gviz/tq?tqx=out:json&gid=1406871946" // コメントデータ
    },
    
    // ローカルデータを使用するか（true: data.jsを使用、false: スプレッドシートから読み込み）
    useLocalData: false,
    
    // CSVファイルのパス（スプレッドシートが使えない場合の代替）
    csvFiles: {
        videos: "data/videos.csv",
        comments: "data/comments.csv"
    }
};

