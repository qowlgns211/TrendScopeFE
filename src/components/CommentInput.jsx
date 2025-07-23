// src/components/CommentInput.jsx
import React from 'react';

const CommentInput = ({ 
  isVisible, 
  selectedKeyword, 
  selectedCategory, 
  commentText, 
  onCommentTextChange, 
  onSubmit, 
  onClose, 
  categoryConfig 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-600 p-4 z-30">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-orange-500 text-white rounded text-xs flex items-center justify-center font-bold">
              {selectedKeyword?.rank}
            </div>
            <span className="text-white font-medium">{selectedKeyword?.text}</span>
            <span className="text-gray-400 text-sm">댓글 등록</span>
            <span className="text-blue-400 text-sm">· {categoryConfig[selectedCategory]?.displayName}</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="flex space-x-3">
          <textarea
            placeholder="의견을 남겨주세요..."
            className="flex-1 bg-gray-700 text-white p-3 rounded border-none resize-none h-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={commentText}
            onChange={(e) => onCommentTextChange(e.target.value)}
            maxLength={500}
          />
          
          <div className="flex space-x-3">
            <button 
              onClick={onSubmit}
              disabled={!commentText.trim()}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors text-sm"
            >
              등록
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              취소
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
          <span>{commentText.length}/500</span>
          <span>익명으로 등록됩니다</span>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;