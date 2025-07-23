// src/components/CircleChart.jsx
import React from 'react';

const CircleChart = ({ 
  keywords, 
  selectedKeyword, 
  onKeywordClick, 
  onKeywordHover, 
  onKeywordLeave 
}) => {
  // ✅ 키워드 위치 계산 함수
  const getKeywordPosition = (angle, radius = 180) => {
    const radian = (angle * Math.PI) / 180;
    const x = Math.cos(radian - Math.PI/2) * radius;
    const y = Math.sin(radian - Math.PI/2) * radius;
    return { x, y };
  };

  return (
    <div className="flex-1 flex items-start justify-center pt-6 pb-20">
      <div className="relative w-96 h-96">
        {/* 중앙 원 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white text-black rounded-full flex items-center justify-center font-bold text-sm z-20 shadow-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <div className="text-center">
            <div>실시간</div>
            <div>검색어</div>
          </div>
        </div>
        
        {/* 원형 테두리 */}
        <div className="absolute inset-0 border-2 border-gray-600 rounded-full"></div>
        
        {/* 연결선들 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          {keywords.map((keyword) => {
            const innerPos = getKeywordPosition(keyword.angle, 48);
            const outerPos = getKeywordPosition(keyword.angle, 180);
            return (
              <line
                key={`line-${keyword.id}`}
                x1={192 + innerPos.x}
                y1={192 + innerPos.y}
                x2={192 + outerPos.x}
                y2={192 + outerPos.y}
                stroke="#4B5563"
                strokeWidth="2"
                opacity="0.7"
              />
            );
          })}
        </svg>

        {/* 키워드들 */}
        {keywords.map((keyword) => {
          const { x, y } = getKeywordPosition(keyword.angle, 250); // 280에서 250으로 조정
          const { x: numX, y: numY } = getKeywordPosition(keyword.angle, 170); // 200에서 170으로 조정
          const isSelected = selectedKeyword?.id === keyword.id;
          
          return (
            <div key={keyword.id}>
              {/* 순위 원 - 조정된 위치 */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
                style={{
                  left: `calc(50% + ${numX}px)`,
                  top: `calc(50% + ${numY}px)`
                }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isSelected 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white text-black'
                }`}>
                  {keyword.rank}
                </div>
              </div>

              {/* 키워드 블록 - 조정된 위치 */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 z-15"
                style={{
                  left: `calc(50% + ${x}px)`,
                  top: `calc(50% + ${y}px)`
                }}
                onClick={() => onKeywordClick(keyword)}
                onMouseEnter={(e) => onKeywordHover(keyword, e)}
                onMouseLeave={onKeywordLeave}
                onMouseMove={(e) => onKeywordHover(keyword, e)}
              >
                <div className={`border rounded-lg px-3 py-2 shadow-lg transition-all duration-200 max-w-40 ${
                  isSelected 
                    ? 'bg-orange-500 border-orange-400 text-white' 
                    : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                }`}>
                  <span className="text-xs whitespace-nowrap font-medium block truncate">
                    {keyword.text}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CircleChart;