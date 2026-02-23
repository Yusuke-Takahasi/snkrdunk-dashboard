# タスク: Next.js 一覧ページで「Maximum call stack size exceeded」を解消する

## 現象

- **環境**: Next.js 16.1.6 (Turbopack), React 19.2.3
- **発生箇所**: 一覧ページ（`/`）を開いたあと、ターミナルに以下が出力される
- **画面**: 一覧は問題なく表示される（200 でレスポンスは返っている）
- **エラー**:
  ```
  RangeError: Maximum call stack size exceeded
      at ignore-listed frames
  ⨯ unhandledRejection: RangeError: Maximum call stack size exceeded
      at ignore-listed frames
  ```
  過去のログでは `at Map.has (<anonymous>)` と出ることもある。

## 既に試したこと（効果なし or 部分的な改善のみ）

1. **RSC のシリアライズ対策**
   - 一覧データをクライアントに渡す際、オブジェクトではなく **JSON 文字列**（`itemsJson`）で渡すように変更済み
   - `ProductListControls` / `ProductListPagination` も `currentParamsJson` / `sortOptionsJson` で文字列のみ渡すように変更済み
   - 表示用リストを `JSON.parse(JSON.stringify(list))` でプレーンなオブジェクトにしたうえで `listToShowJson` にしている

2. **クライアントコンポーネント化**
   - 一覧のカード部分は `ProductGrid`（`'use client'`）に分離し、サーバーは `<ProductGrid itemsJson={...} listQueryString={...} />` だけを返す形にしている

3. **ソートのスタック対策**
   - 大量件数時のソートで再帰を避けるため、`fullList.sort(compare)` の代わりに **反復的マージソート**（`sortStackSafe`）を使用している

4. **動的レンダリング**
   - `export const dynamic = 'force-dynamic'` を指定し、`searchParams` を毎リクエストで読むようにしている

5. **計測用 fetch の遅延**
   - デバッグ用の `fetch` を `Promise.resolve().then(() => fetch(...))` で次のティックに回したが、エラーは継続（計測用ログは現在は削除済み）

## 関連ファイル

- **一覧ページ（サーバーコンポーネント）**: `app/(dashboard)/page.tsx`
- **一覧グリッド（クライアント）**: `app/(dashboard)/ProductGrid.tsx` — props: `itemsJson: string`, `listQueryString: string`
- **並び替え・ページネーション（クライアント）**: `app/(dashboard)/ProductListControls.tsx` — props: `sortOptionsJson`, `currentParamsJson`, および数値系
- **レイアウト**: `app/(dashboard)/layout.tsx`（`Sidebar` + `children`）

## 依頼してほしいこと

1. **原因の特定**
   - スタックオーバーフローが「サーバー側の RSC シリアライズ」「クライアント側のデシリアライズ」「Next.js/Turbopack 内部」のどこで起きているか、または複合か、を切り分けてほしい

2. **別アプローチの提案・実装**
   - 例: 一覧データを **API Route**（例: `GET /api/products-list?sort=...&order=...&page=...`）で返し、サーバーコンポーネントは一覧データを RSC ペイロードに含めない。`ProductGrid` は `useSearchParams` + `fetch` で API から取得して表示する、など
   - その他、RSC のペイロードに大きなデータを含めない方法や、Next.js 16 / Turbopack で既知の対策があれば教えてほしい

3. **解消の目標**
   - 一覧表示は維持したまま、`npm run dev` で一覧ページを開いてもターミナルに「Maximum call stack size exceeded」が出ないようにする

## 補足

- 一覧は 1 ページ 25 件（`PAGE_SIZE = 25`）。`listToShowJson` は 25 件ぶんの JSON 文字列（数 KB〜十数 KB 程度の想定）。
- Supabase から商品・取引履歴・gemrate_stats を取得し、メモリ上でフィルタ・ソート・スライスした結果を表示している。
