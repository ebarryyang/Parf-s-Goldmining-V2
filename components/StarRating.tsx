
import React, { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingProps {
  rating: number; // 0 to 5
  onRate: (rating: number) => void;
  readonly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRate, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  // Handle click on a star to determine if it's left half (0.5) or right half (1.0)
  const handleClick = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    if (readonly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    // If clicked on left half, value is starIndex - 0.5. If right, starIndex.
    // Example: Click Star 1 (index 1). Left -> 0.5. Right -> 1.
    const isHalf = x < width / 2;
    const newRating = isHalf ? starIndex - 0.5 : starIndex;
    
    onRate(newRating);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, starIndex: number) => {
    if (readonly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const isHalf = x < width / 2;
    setHoverRating(isHalf ? starIndex - 0.5 : starIndex);
  };

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(null)}>
      {[1, 2, 3, 4, 5].map((index) => {
        const isFull = displayRating >= index;
        const isHalf = displayRating >= index - 0.5 && displayRating < index;

        return (
          <div
            key={index}
            className={`relative cursor-pointer transition-transform ${!readonly && 'hover:scale-110'}`}
            onClick={(e) => handleClick(e, index)}
            onMouseMove={(e) => handleMouseMove(e, index)}
          >
             {/* Background Gray Star */}
             <Star 
                size={24} 
                className="text-gray-300" 
                fill="#E5E7EB" 
             />
             
             {/* Overlay Filled Star (Half or Full) */}
             {(isFull || isHalf) && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: isFull ? '100%' : '50%' }}>
                     <Star 
                        size={24} 
                        className="text-mario-yellow" 
                        fill="#FFD600"
                    />
                </div>
             )}
          </div>
        );
      })}
      <span className="ml-2 font-pixel text-mario-yellow text-sm md:text-base drop-shadow-sm w-8 text-right">
          {displayRating.toFixed(1)}
      </span>
    </div>
  );
};

export default StarRating;
