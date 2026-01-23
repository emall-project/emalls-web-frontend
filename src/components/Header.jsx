import { FiShoppingBag } from "react-icons/fi";
import { FiShoppingCart } from "react-icons/fi";
import { GrFavorite } from "react-icons/gr";
import { IoIosSearch } from "react-icons/io";
import { VscAccount } from "react-icons/vsc";

function Header() {
  return (
    <header className='sticky top-0 z-50 bg-white'>
      <div className='flex max-w-7x1 mx-auto px-4 pt-3 pb-1 items-center gap-3'>
        {/* logo */}
        <div className='flex items-center gap-1 shrink-0 min-w-30'>
          <FiShoppingBag className='text-[#1A73E8] md:text-2xl text-lg'/>
          <div className='text-lg md:text-2xl font-extrabold text-[#1A73E8]'>سوقَنا</div>
        </div>
        {/* search */}
        <div className='flex-1 min-w-0'>
          <div className='relative'>
            <input 
              className='w-full h-10 md:h-11 rounded-2xl  bg-[#E8F0FE] pr-12 pl-3 md:pl-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-blue-200'
              type="text" 
              placeholder='ما الذي تبحث عنه؟'
            />
            <IoIosSearch className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl' />
          </div>
        </div>

        {/* actions */}
        <div className="flex md:hidden items-center gap-1">
          <button aria-label="favorites" className="h-10 w-10 rounded-xl hover:bg-gray-100 flex items-center justify-center">
            <GrFavorite className="text-[#1A73E8]" size={16} />
          </button>

          <button aria-label="cart" className="h-10 w-10 rounded-xl hover:bg-gray-100 flex items-center justify-center">
            <FiShoppingCart className="text-[#1A73E8]" size={16} />
          </button>

          <a href="#" aria-label="account" className="h-10 w-10 rounded-xl hover:bg-gray-100 flex items-center justify-center">
            <VscAccount className="text-[#1A73E8]" size={16} />
          </a>
        </div>

        <div className='flex shrink-0 gap-2 md:gap-20'>
        <div className='hidden md:flex items-center gap-3'>
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
          className='hidden md:flex h-11 px-3 rounded-xl hover:bg-gray-100 flex items-center gap-2'
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