import React, { useMemo, useState } from 'react'
import Header from '../components/Header'
import { normalizeCategories } from '../utils/tmpCategories'
import rawMalls from '../assets/malls.json'
import rawStores from '../assets/stores.json'
import rawCategories from '../assets/categories.json'
import CategoryBar from '../components/CategoryBar';
import { normalizeMalls, normalizeStores } from '../utils/tmpMallsAndStores'
import AdvSection from '../components/advSection'
import CategoriesBanner from '../components/CategoriesBanner'

const imgsUrl = [
  {
    id:1,
    image:"../../public/adv4.jpg",
    alt:"adv1"
  },
  {
    id:2,
    image:"../../public/adv1.jpg",
    alt:"adv2"
  },
  {
    id:3,
    image:"../../public/adv3.jpg",
    alt:"adv3"
  },
]
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
      <AdvSection
        imgsUrl={imgsUrl}
        intervalMs={4000}
      />
      
      <CategoriesBanner
        categories={categories}
        onSelectCategory={setSelectedCategoryId}
      />
    </div>
  )
}

export default HomePage