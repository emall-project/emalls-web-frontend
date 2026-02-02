import React, { useEffect, useState } from 'react'

function AdvSection({imgsUrl , intervalMs , page}) {
  const [index , setIndex] = useState(0);
  //auto Slide
  useEffect(() => {
    if(!imgsUrl.length) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % imgsUrl.length);
    }, intervalMs);

    return () => clearInterval(id);
  }, [imgsUrl.length , intervalMs]);

  if(!imgsUrl.length) return null;

  const currentImg = imgsUrl[index];
  return (
    <section className={`mx-auto  ${page == "mall" ? 'px-10 mt-7' : 'px-4 mt-5'}`}>
      <a
        href={null}
        className='block shadow-[0_8px_10px_-6px_rgba(0,0,0,0.25)] relative overflow-hidden rounded-2xl border border-gray-300 bg-white '
      >
        <img
          src={currentImg.image}
          alt={currentImg.alt || "Ad"}
          loading='lazy'
          className='
            w-full h-35 sm:h-45 md:h-104
            object-full
          '
        />
        {/* dot */}
        <div className='absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2'>
          {
            imgsUrl.map((_, i) => (
              <button
                key={i}
                type='button'
                aria-label={`slide ${i + 1}`}
                onClick={(e) => {
                  e.preventDefault();
                  setIndex(i);
                }}
                className={[
                  "h-1 w-10 rounded-full transition ",
                  i === index ? "bg-gray-600" : "bg-[#1A73E8]",
                ].join(" ")}
              />
            ))
          }
        </div>
      </a>
    </section>
  )
}

export default AdvSection