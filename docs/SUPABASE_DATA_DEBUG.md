# Supabase で商品データが取得できないときの確認手順

## テーブル設計（参照）

### 1. products（商品マスタ）
- **id** (VARCHAR, PK), name_jp, brand, category, release_date, product_code, image_url
- **is_target** (BOOLEAN): true なら巡回対象 → 一覧に表示対象
- **is_favorite** (BOOLEAN): お気に入り
- **is_blacklisted** (BOOLEAN): true なら非表示（一覧から除外）
- card_description, updated_at

### 2. trade_histories（取引履歴）
- id (UUID), **product_id** (FK), **condition** (状態: "PSA 10", "A" 等), price, trade_date, scraped_at

### 3. app_settings（アプリ設定）
- id (常に 1), ui_preferences (JSONB), **gemrate_urls** (JSONB): キー＝商品ID or pack_key、値＝GemRate URL

### 4. psa_pop_reports（PSA鑑定・GemRateデータ）
- pack_key, card_number, name_en, total_graded, psa10_count, gem_rate, updated_at

---

## 1. 設定画面の「データ接続診断」を確認

**設定** メニュー → **データ接続診断** で次を確認してください。

| 項目 | 意味 |
|------|------|
| 環境変数 | .env.local の NEXT_PUBLIC_SUPABASE_URL / ANON_KEY |
| products 全件数 | 条件なしで読めた件数 |
| products（is_target = true） | 一覧の対象件数 |
| trade_histories 件数 | 取引履歴が読めるか |
| app_settings（id=1） | 設定行が読めるか（Gemrate URL はここ） |

## 2. 一覧に出す条件

- **is_target = true** の行だけ取得
- さらに **is_blacklisted !== true** の行だけ表示（true は非表示で除外）

## 3. 取引履歴の「状態」

- テーブルは **condition** カラム（"PSA 10", "A" 等）。**size** は使っていません。

## 4. Gemrate URL

- products には gemrate_url カラムはありません。
- **app_settings** の **gemrate_urls**（JSONB）で、キー＝商品 id または product_code、値＝URL を管理します。

## 5. RLS・環境変数

- RLS で anon に SELECT が許可されているか確認
- .env.local の NEXT_PUBLIC_* を変更したら開発サーバー再起動
