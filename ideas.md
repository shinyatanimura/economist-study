# The Economist Study App - デザインアイデア

## ユーザー要件まとめ
- The Economistの記事を週→記事の階層で管理
- 段落ごとの英文・日本語訳・語彙リストを保存
- 英文中の単語を「わからなかった」「微妙」でマーキング
- 復習チェック（日時・方法）の記録
- スマホ・PC両対応

---

<response>
<probability>0.08</probability>
<idea>

## アイデア A: Editorial Brutalism（エディトリアル・ブルータリズム）

**Design Movement**: ブルータリズム × 高級雑誌エディトリアル

**Core Principles**:
1. 強いタイポグラフィ主導のレイアウト（文字そのものが装飾）
2. 非対称グリッド、意図的な余白の不均一さ
3. 機能的な情報密度（詰め込みではなく意図的な密度）
4. 生の素材感（ボーダー、下線、タイポグラフィの重さで構造を作る）

**Color Philosophy**:
- ベース：オフホワイト（#F5F0E8）— 印刷紙の温かみ
- プライマリ：ディープレッド（#C41E3A）— The Economistのブランドカラーを参照
- アクセント：チャコール（#1A1A1A）
- マーキング「わからなかった」：アンバー（#D97706）
- マーキング「微妙」：スカイブルー（#0EA5E9）

**Layout Paradigm**:
- 左サイドバー（週・記事ナビゲーション）+ 右メインコンテンツ
- 段落カードは全幅、英文と日本語訳を上下分割
- 語彙リストはインラインポップオーバー

**Signature Elements**:
1. 太い赤いボーダーラインで記事タイトルを区切る
2. 段落番号を大きなタイポグラフィで左端に配置
3. 単語マーキングは背景色ハイライト（選択時にポップオーバー）

**Interaction Philosophy**:
- 英文テキストは単語単位でクリック可能
- マーキング状態はトグル（未マーク→わからなかった→微妙→未マーク）
- 復習チェックはシンプルなモーダルで記録

**Animation**:
- 段落の展開/折りたたみにスライドアニメーション
- マーキング時に色が染まるトランジション（0.2s ease）
- サイドバーのアクティブ状態に左ボーダーがスライドイン

**Typography System**:
- 見出し：Playfair Display（セリフ、重厚感）
- 英文本文：Georgia（読みやすいセリフ）
- 日本語：Noto Serif JP
- UI要素：DM Sans（モダンなサンセリフ）

</idea>
</response>

<response>
<probability>0.07</probability>
<idea>

## アイデア B: Minimal Academic（ミニマル・アカデミック）

**Design Movement**: スカンジナビアン・ミニマリズム × 学術論文スタイル

**Core Principles**:
1. 極限まで削ぎ落とした要素（必要なものだけ）
2. 水平線と余白で情報を分離
3. 一貫したタイポグラフィスケール
4. 色は機能のためだけに使う

**Color Philosophy**:
- ベース：純白（#FFFFFF）
- テキスト：ほぼ黒（#111827）
- アクセント：単色グリーン（#059669）— 学習・成長のイメージ
- マーキング「わからなかった」：オレンジ（#F59E0B）
- マーキング「微妙」：ブルー（#3B82F6）

**Layout Paradigm**:
- トップナビゲーション + 中央カラム（max-w-3xl）
- 段落は縦積み、英文と日本語訳はタブ切り替えまたは並列表示
- 語彙はアコーディオンで折りたたみ

**Signature Elements**:
1. 細い水平ボーダーで段落を区切る
2. 段落タイトルは小さなオールキャップスのラベル
3. 単語マーキングはアンダーライン（色で種類を区別）

**Interaction Philosophy**:
- 英文の単語を選択するとコンテキストメニューが出現
- 復習チェックはチェックボックスとタグ選択

**Animation**:
- フェードイン（opacity 0→1、0.3s）
- ホバー時に薄いグレー背景

**Typography System**:
- 見出し：IBM Plex Serif
- 英文：IBM Plex Serif Regular
- 日本語：Noto Sans JP
- UI：IBM Plex Sans

</idea>
</response>

<response>
<probability>0.06</probability>
<idea>

## アイデア C: Dark Scholar（ダーク・スカラー）

**Design Movement**: ダークモード × 高級ノートアプリ（Obsidianインスパイア）

**Core Principles**:
1. 暗い背景で長時間の読書に最適化
2. 蛍光色のハイライトで重要情報を浮かび上がらせる
3. 左サイドバーによる階層ナビゲーション
4. カードベースのコンテンツ表示

**Color Philosophy**:
- ベース：ダークグレー（#1C1C1E）
- カード：少し明るいグレー（#2C2C2E）
- テキスト：オフホワイト（#E5E5EA）
- アクセント：ゴールド（#F5A623）— 知性・高級感
- マーキング「わからなかった」：コーラル（#FF6B6B）
- マーキング「微妙」：ティール（#4ECDC4）

**Layout Paradigm**:
- 左サイドバー（固定、週・記事ツリー）+ メインエリア
- 段落カードにグラスモーフィズム効果
- 語彙はサイドパネルに表示

**Signature Elements**:
1. グラスモーフィズムカード（backdrop-blur + 半透明ボーダー）
2. ゴールドのアクセントラインで重要な要素を強調
3. 単語マーキングは蛍光ハイライト風

**Interaction Philosophy**:
- 英文テキストは単語クリックでマーキングモードに入る
- 復習チェックはドロワーで記録

**Animation**:
- サイドバーのスムーズなスライド
- カードのホバー時にわずかに浮き上がる（translateY -2px + shadow強化）
- マーキング時にグロー効果

**Typography System**:
- 見出し：Crimson Pro（エレガントなセリフ）
- 英文：Crimson Pro Regular
- 日本語：Noto Serif JP
- UI：Inter（ダークUIに馴染む）

</idea>
</response>

---

## 選択：アイデア A（Editorial Brutalism）

The Economistのブランドイメージ（赤・白・黒・セリフ体）と親和性が高く、
学習ツールとして情報密度と可読性を両立できるため、このアプローチを採用する。
