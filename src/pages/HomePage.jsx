import React, { useMemo, useState } from 'react'
import Header from '../components/Header'
import { normalizeCategories } from '../utils/tmpCategories'
import rawMalls from '../assets/malls.json'
import rawStores from '../assets/stores.json'
import rawCategories from '../assets/categories.json'
import CategoryBar from '../components/CategoryBar';
import { normalizeMalls, normalizeStores } from '../utils/tmpMallsAndStores'
function HomePage() {
  const categories = useMemo(()=> normalizeCategories(rawCategories) , [rawCategories]);
  const malls = useMemo(()=>normalizeMalls(rawMalls),[rawMalls]);
  const stores = useMemo(()=>normalizeStores(rawStores),[rawStores]);

  const [selectedCategoryId , setSelectedCategoryId] = useState(null);
  const [selectedMallId , setSelectedMallId] = useState(null);
  const [selectedStoreId , setSelectedStoreId] = useState(null);
  return (
    <div>
      <Header />
      <CategoryBar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        malls={malls}
        stores={stores}
        selectedStoreId={selectedStoreId}
        selectedMallId={selectedMallId}
        onSelectMall={setSelectedMallId}
        onSelectStore={setSelectedStoreId}
      />
    </div>
  )
}

export default HomePage