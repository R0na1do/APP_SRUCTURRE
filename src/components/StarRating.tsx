'use client'
import { useState } from 'react'

interface StarRatingProps {
  value?: number;
  onChange?: (v: number) => void;
}

export default function StarRating({ value = 0, onChange }: StarRatingProps) {
  const [v, setV] = useState(value)
  
  const handleStarClick = (starIndex: number) => {
    const newValue = starIndex + 1;
    setV(newValue);
    if (onChange) {
      onChange(newValue);
    }
  }

  return (
    <div className="flex gap-1 text-xl">
      {[0, 1, 2, 3, 4].map(i => (
        <button 
          key={i} 
          type="button" 
          aria-label={`rate-${i + 1}`} 
          onClick={() => handleStarClick(i)}
        >
          <span className={i < v ? 'opacity-100' : 'opacity-40'}>★</span>
        </button>
      ))}
    </div>
  )
}
