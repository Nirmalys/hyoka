import { useState, useRef, useEffect } from 'react';
import { Star, RefreshCw, ChevronDown, Check } from 'lucide-react';

const ReviewFilters = ({ 
  isVisible,
  ratingFilter, 
  setRatingFilter, 
  orderBy, 
  setOrderBy, 
  order, 
  setOrder,
  onClear
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { value: 'created_at|DESC', label: 'Most Recent' },
    { value: 'rating|DESC', label: 'Highest Rated' },
    { value: 'rating|ASC', label: 'Lowest Rated' },
    { value: 'likes|DESC', label: 'Most Helpful' },
  ];

  const currentOption = options.find(opt => opt.value === `${orderBy}|${order}`) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`transition-all duration-500 ease-in-out ${isVisible ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center gap-5 relative z-50">
        {/* Star Rating Group */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Filter by star count</span>
          <div className="flex gap-1.5">
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setRatingFilter(ratingFilter === rating ? 0 : rating)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                  ratingFilter === rating 
                    ? 'bg-orange-50 border-transparent text-orange-600 shadow-sm ring-2 ring-orange-400/20' 
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white active:scale-95'
                }`}
              >
                {rating} 
                <Star 
                  className={`w-3.5 h-3.5 transition-colors ${
                    ratingFilter === rating 
                      ? 'fill-orange-400 text-orange-400' 
                      : 'fill-gray-100 text-gray-300'
                  }`} 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Styled Divider */}
        <div className="w-[1px] h-8 bg-gray-100 mx-1 hidden lg:block"></div>

        {/* Sort Group */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Sort By</span>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-between min-w-[160px] bg-orange-50/50 border border-orange-100/50 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-orange-50 hover:border-orange-200 transition-all duration-300 group shadow-sm focus:outline-none"
            >
              <span>{currentOption.label}</span>
              <ChevronDown className={`w-4 h-4 text-orange-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-orange-100 rounded-xl shadow-xl z-[100] overflow-hidden">
                {options.map((option) => {
                  const isSelected = option.value === `${orderBy}|${order}`;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        const [newOrderBy, newOrder] = option.value.split('|');
                        setOrderBy(newOrderBy);
                        setOrder(newOrder);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-sm ${
                        isSelected 
                          ? 'bg-orange-50 text-orange-600 font-bold' 
                          : 'text-gray-600 hover:bg-orange-50/70 hover:text-orange-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {option.label}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Group */}
        <div className="lg:ml-auto">
          <button 
            onClick={onClear}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase text-orange-600 rounded-lg bg-orange-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to default
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewFilters;
