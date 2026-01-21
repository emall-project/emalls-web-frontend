import React from 'react'
import { FiShoppingBag } from "react-icons/fi";
import { FiShoppingCart } from "react-icons/fi";
import { GrFavorite } from "react-icons/gr";
import { IoIosSearch } from "react-icons/io";
import { VscAccount } from "react-icons/vsc";

function Header() {
  return (
    <header className='sticky top-0 z-50 bg-white shadow-[0_8px_10px_-6px_rgba(0,0,0,0.25)]'>
      <div className='flex max-w-7x1 mx-auto px-4 py-3 items-center gap-3'>
        {/* logo */}
        <div className='flex items-center gap-1 min-w-35'>
          <FiShoppingBag className='text-[#1A73E8]' size={32}/>
          <div className='text-2xl font-extrabold text-[#1A73E8]'>سوقَنا</div>
        </div>
        {/* search */}
        <div className='flex-1'>
          <div className='relative'>
            <input 
              className='w-full h-11 rounded-2xl  bg-[#E8F0FE] pr-12 pl-4 outline-none focus:ring-2 focus:ring-blue-200'
              type="text" 
              placeholder='ما الذي تبحث عنه؟'
            />
            <IoIosSearch className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl' />
          </div>
        </div>

        {/* actions */}
        <div className='flex gap-20'>
        <div className='flex items-center gap-3'>
          <button
            aria-label='favorites'
            className='h-11 px-3 rounded-xl hover:bg-gray-100 border-transparent hover:border-gray-200 flex items-center gap-2'
          >
            <GrFavorite className='text-[#1A73E8]' size={16}/>
            <span className='font-extrabold text-sm'>المفضلة</span>
          </button>
          <span className="h-6 w-px bg-gray-300" aria-hidden="true" />
          <button
            aria-label='cart'
            className='h-11 px-3 rounded-xl hover:bg-gray-100 border-transparent hover:border-gray-200 flex items-center gap-2'
          >
            <FiShoppingCart className='text-[#1A73E8]' size={16}/>
            <span className='font-extrabold text-sm'>السلة</span>
          </button>
        </div>

        <a 
          href='#'
          className='h-11 px-3 rounded-xl hover:bg-gray-100 border-transparent hover:border-gray-200 flex items-center gap-2'
        >
          <VscAccount className='text-[#1A73E8]' size={16}/>
          <span className='font-extrabold text-sm'>تسجيل الدخول</span>
        </a>
      </div>
      </div>
    </header>
  )
}

export default Header