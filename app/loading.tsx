export default function Loading() {
    // 画面がロードされるまでの間、8個の「仮カード（骨組み）」を表示します
    const skeletons = Array(8).fill(0);
  
    return (
      <div className="flex h-screen bg-gray-50 text-gray-800 font-sans p-8">
        {/* メインコンテンツ領域のスケルトン */}
        <main className="flex-1 w-full max-w-7xl mx-auto">
          
          {/* ヘッダー部分の骨組み */}
          <div className="mb-8 animate-pulse">
            <div className="h-8 bg-gray-200 rounded-md w-64 mb-3"></div>
            <div className="h-4 bg-gray-200 rounded-md w-48"></div>
          </div>
  
          {/* カードグリッドの骨組み */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {skeletons.map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 h-52 p-5 flex flex-col animate-pulse">
                
                {/* 上部：ブランド名とバッジ */}
                <div className="flex justify-between items-start mb-4">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                
                {/* 中部：商品名（2行分） */}
                <div className="space-y-2 mb-6">
                  <div className="h-5 bg-gray-200 rounded w-full"></div>
                  <div className="h-5 bg-gray-200 rounded w-4/5"></div>
                </div>
  
                {/* 下部：金額などの数値 */}
                <div className="mt-auto flex justify-between items-end">
                  <div className="h-4 bg-gray-200 rounded w-12 mb-1"></div>
                  <div className="h-8 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }