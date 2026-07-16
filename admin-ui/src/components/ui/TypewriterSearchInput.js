import { useState, useEffect, useRef } from "react";

const DEFAULT_PHRASES = [
  "Search by customer, product, or keyword...",
  "Search by product name...",
  "Search by reviewer name...",
];

const TypewriterSearchInput = ({
  value,
  onChange,
  className = "",
  wrapperClassName = "",
  phrases = DEFAULT_PHRASES,
  icon: Icon = null,
}) => {
  const [focused, setFocused] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const timersRef = useRef([]);

  const showTypewriter = !focused && !value;

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    if (!showTypewriter) {
      setDisplayText("");
      return undefined;
    }

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let cancelled = false;

    const schedule = (fn, delay) => {
      const id = setTimeout(fn, delay);
      timersRef.current.push(id);
    };

    const tick = () => {
      if (cancelled) return;

      const phrase = phrases[phraseIndex] || phrases[0];

      if (!deleting) {
        charIndex += 1;
        setDisplayText(phrase.slice(0, charIndex));

        if (charIndex >= phrase.length) {
          schedule(() => {
            deleting = true;
            tick();
          }, 1800);
          return;
        }

        schedule(tick, 55);
        return;
      }

      charIndex -= 1;
      setDisplayText(phrase.slice(0, charIndex));

      if (charIndex <= 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        schedule(tick, 350);
        return;
      }

      schedule(tick, 28);
    };

    schedule(tick, 400);

    return () => {
      cancelled = true;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
  }, [showTypewriter, phrases]);

  return (
    <div
      className={`hyoka-search-input-wrap relative flex-1 min-w-[240px] max-w-md group rounded-md border border-gray-200 bg-white focus-within:border-gray-300 transition-colors ${wrapperClassName}`}
    >
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-orange-500 transition-colors z-10" />
      )}
      <input
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder=""
        className={`hyoka-search-input w-full pl-10 pr-4 py-2.5 bg-transparent rounded-md text-[13px] font-medium border-0 shadow-none outline-none focus:ring-0 ${className}`}
      />
      {showTypewriter && (
        <span
          className="absolute left-10 top-1/2 -translate-y-1/2 text-[13px] font-medium text-gray-300 pointer-events-none select-none flex items-center"
          aria-hidden
        >
          {displayText}
          <span className="inline-block w-[2px] h-[14px] bg-gray-300 ml-0.5 animate-pulse" />
        </span>
      )}
    </div>
  );
};

export default TypewriterSearchInput;
