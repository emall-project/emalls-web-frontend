import React, { useMemo, useState } from 'react'
import AllCategoriesMenu from './AllCategoriesMenu';
import MallsAndStoresMenu from './MallsAndStoresMenu';
import {getParentCategories} from "../utils/tmpCategories";

function CategoryBar({
  categories, 
  onSelectCategory, 
  selectedCategoryId,
  malls,
  stores,
  selectedMallId,
  selectedStoreId,
  onSelectMall,
  onSelectStore,
}) {
  const mainCategories = useMemo(()=>getParentCategories(categories),[categories])
  
  return (
    <section className='sticky z-50 bg-white shadow-[0_8px_10px_-6px_rgba(0,0,0,0.25)]'>
      <div className='flex max-w-7xl mx-auto px-3 py-2 items-center  gap-2 md:px-4 md:justify-between justify-evenly'>
        <div className=' md:flex-none'>
          <AllCategoriesMenu
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={onSelectCategory}
          />
        </div>
        <div className='hidden flex-1 md:flex justify-around'>
          { mainCategories.map((cate) => {
            return(
              <button
                key={cate.id}
                type='button'
                onClick={() => onSelectCategory?.(cate.id)}
                className='hover:bg-gray-100 border-transparent hover:border hover:border-gray-300 rounded-2xl px-4 cursor-pointer font-semibold py-1'
              >                            
                {cate.name}
              </button>
            )
          })
          }
        </div>
        <div className='md:flex-none'>
          <MallsAndStoresMenu
            malls={malls}
            stores={stores}
            selectedMallId={selectedMallId}
            selectedStoreId={selectedStoreId}
            onSelectMall={onSelectMall}
            onSelectStore={onSelectStore}
          />
        </div>
      </div>
    </section>
  )
}

export default CategoryBar