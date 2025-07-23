// src/components/SentimentChart.jsx
import React from 'react';

const SentimentChart = ({ keyword, sentiment, isVisible, position }) => {
  if (!isVisible || !sentiment) return null;

  // ✅ 에러 상태 체크
  if (sentiment.error) {
    return (
      <div 
        className={`fixed z-50 pointer-events-none transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        style={{
          left: position.x,
          top: position.y,
          transform: position.y > window.innerHeight / 2 ? 'translate(-50%, -100%)' : 'translate(-50%, 0%)'
        }}
      >
        <div className="bg-gray-900 rounded-lg p-4 shadow-2xl border border-red-500 min-w-56">
          <h4 className="text-white font-medium text-center mb-3 text-lg">{keyword}</h4>
          <div className="text-center text-red-400">
            <span className="text-2xl">❌</span>
            <p className="text-sm mt-2">{sentiment.errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  const total = sentiment.positive + sentiment.negative;
  const positivePercent = total > 0 ? (sentiment.positive / total) * 100 : 0;
  const negativePercent = total > 0 ? (sentiment.negative / total) * 100 : 0;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  const positiveStroke = (positivePercent / 100) * circumference;
  const negativeStroke = (negativePercent / 100) * circumference;

  const isPositionedBelow = position.y > window.innerHeight / 2;

  return (
    <div 
      className={`fixed z-50 pointer-events-none transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{
        left: position.x,
        top: position.y,
        transform: isPositionedBelow ? 'translate(-50%, -100%)' : 'translate(-50%, 0%)'
      }}
    >
      <div className="bg-gray-900 rounded-lg p-4 shadow-2xl border border-gray-600 min-w-56">
        <h4 className="text-white font-medium text-center mb-3 text-lg">{keyword}</h4>
        
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="#374151"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="#10B981"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${positiveStroke * 1.125} ${circumference * 1.125}`}
                strokeDashoffset="0"
                className="transition-all duration-500 ease-out"
              />
              <circle
                cx="48"
                cy="48"
                r="36"
                stroke="#EF4444"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${negativeStroke * 1.125} ${circumference * 1.125}`}
                strokeDashoffset={`-${positiveStroke * 1.125}`}
                className="transition-all duration-500 ease-out"
                style={{ transitionDelay: '200ms' }}
              />
            </svg>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-300">긍정</span>
            </div>
            <span className="text-lg text-white font-bold">
              {Math.round(positivePercent)}%
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-300">부정</span>
            </div>
            <span className="text-lg text-white font-bold">
              {Math.round(negativePercent)}%
            </span>
          </div>
        </div>
      </div>

      {isPositionedBelow ? (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1">
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      ) : (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 translate-y-1">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default SentimentChart;