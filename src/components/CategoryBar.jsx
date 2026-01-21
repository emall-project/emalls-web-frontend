import React, { useMemo, useState } from 'react'
import { getParentCategories } from '../utils/tmpCategories';

function CategoryBar({categories , selectedCategoryId , onSelectCategory}) {
  const parents = useMemo(()=> getParentCategories(categories) ,[categories]);
  const [open , setOpen] = useState(false);
  return (
    <section>
      <div>
        <div>
          {/* dropdown+all categories */}
          <div
            onMouseEnter={() => setOpen(ture)}
            onMouseLeave={() => setOpen(false)}
          >
            <button></button>
            
          </div>
        </div>
      </div>
    </section>
  )
}

export default CategoryBar