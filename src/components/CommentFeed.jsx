// src/components/CommentFeed.jsx
import React, { useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';

const CommentFeed = ({ comments, onCommentLike, userLikes }) => {
  const [currentUserIP, setCurrentUserIP] = useState('');

  // IP 가져오기 함수
  const getUserIP = async () => {
    try {
      const services = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://httpbin.org/ip'
      ];
      
      for (const service of services) {
        try {
          const response = await fetch(service);
          const data = await response.json();
          return data.ip || data.origin || data.IPv4 || '127.0.0.1';
        } catch (err) {
          continue;
        }
      }
      return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } catch (err) {
      return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  };

  // IP 로딩
  useEffect(() => {
    const loadIP = async () => {
      const ip = await getUserIP();
      setCurrentUserIP(ip);
    };
    loadIP();
  }, []);

  // ✅ 날짜 포맷 함수 (25-07-23 06:59 형식)
  const formatDateTime = (timestamp) => {
    const date = dayjs(timestamp);
    return date.format("YY-MM-DD HH:mm");
  };

  // ✅ IP 주소 마스킹 함수
  const maskIP = (ipAddress) => {
    if (!ipAddress || ipAddress.startsWith('user_')) {
      return ipAddress?.slice(0, 12) + '...';
    }
    const parts = ipAddress.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.***`;
    }
    return ipAddress;
  };

  // ✅ 댓글 정렬 (인기 댓글 3개 + 최신 댓글)
  const sortedComments = useMemo(() => {
    // 인기 댓글 상위 3개만 선택
    const popularComments = comments
      .filter(comment => comment.isPopular)
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 3);
    
    // 인기 댓글이 아닌 최신 댓글들
    const regularComments = comments
      .filter(comment => !comment.isPopular)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return [...popularComments, ...regularComments];
  }, [comments]);

  return (
    <div className="w-80 p-6 pt-2 h-screen overflow-hidden flex flex-col">
      <div className="mb-3 flex-shrink-0">
        <h2 className="text-lg font-bold mb-1">실시간 댓글</h2>
        <p className="text-sm text-gray-400">총 {comments.length}개의 댓글</p>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {/* 인기 댓글 (상위 3개만) */}
        {sortedComments.some(comment => comment.isPopular) && (
          <>
            <div className="text-orange-400 font-medium text-xs mb-1">🔥 인기 댓글 (상위 3개)</div>
            {sortedComments
              .filter(comment => comment.isPopular)
              .map((comment) => {
                const isLiked = userLikes.has(`${currentUserIP}-${comment.id}`);
                return (
                  <div key={comment.id} className="bg-orange-900/20 border-l-2 border-orange-500 rounded p-2 mb-1">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span className="font-bold">{comment.keyword_name}</span>
                      <span>{formatDateTime(comment.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-100 mb-1 leading-relaxed line-clamp-2">
                      {comment.content}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{maskIP(comment.ip_address)}</span>
                      <button
                        onClick={() => {
                          console.log("🖱️ 추천 버튼 클릭:", comment.id);
                          onCommentLike(comment.id);
                        }}
                        disabled={isLiked}
                        className={`flex items-center space-x-1 text-xs transition-colors ${
                          isLiked 
                            ? 'text-gray-500 cursor-not-allowed' 
                            : 'text-red-400 hover:text-red-300'
                        }`}
                      >
                        <span>{isLiked ? '💖' : '❤️'}</span>
                        <span>{comment.likes}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
          </>
        )}

        {/* 최신 댓글 */}
        <div className="text-blue-400 font-medium text-xs mb-1">💬 최신 댓글</div>
        
        {sortedComments
          .filter(comment => !comment.isPopular)
          .map((comment) => {
            const isLiked = userLikes.has(`${currentUserIP}-${comment.id}`);
            return (
              <div key={comment.id} className="bg-gray-800 rounded p-2 hover:bg-gray-750 transition-colors mb-1">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span className="font-bold">{comment.keyword_name}</span>
                  <span>{formatDateTime(comment.created_at)}</span>
                </div>
                <p className="text-xs text-gray-100 mb-1 leading-relaxed line-clamp-2">
                  {comment.content}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{maskIP(comment.ip_address)}</span>
                  <button
                    onClick={() => {
                      console.log("🖱️ 추천 버튼 클릭:", comment.id);
                      onCommentLike(comment.id);
                    }}
                    disabled={isLiked}
                    className={`flex items-center space-x-1 text-xs transition-colors ${
                      isLiked 
                        ? 'text-gray-500 cursor-not-allowed' 
                        : 'text-gray-400 hover:text-red-400'
                    }`}
                  >
                    <span>{isLiked ? '💖' : '🤍'}</span>
                    <span>{comment.likes}</span>
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default CommentFeed;