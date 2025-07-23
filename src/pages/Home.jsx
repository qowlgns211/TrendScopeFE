// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { supabase } from "../api/supabaseClient";
import CircleChart from "../components/CircleChart";
import CommentFeed from "../components/CommentFeed";
import CommentInput from "../components/CommentInput";
import SentimentChart from "../components/SentimentChart";

// ✅ 실시간 시간 업데이트 함수
const useCurrentTime = () => {
  const [currentTime, setCurrentTime] = useState(dayjs());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return currentTime;
};

// ✅ 카테고리 매핑 (넷플릭스 추가)
const CATEGORY_CONFIG = {
  1: { name: 'google', displayName: '구글', icon: '🔍', color: 'bg-blue-500' },
  2: { name: 'netflix', displayName: '넷플릭스', icon: '🎬', color: 'bg-red-500' },
  3: { name: 'naver', displayName: '네이버', icon: '🌐', color: 'bg-green-600' },
  4: { name: 'daum', displayName: '다음', icon: '🌐', color: 'bg-blue-600' },
  5: { name: 'youtube', displayName: '유튜브', icon: '▷', color: 'bg-red-600' }
};

const Home = () => {
  // ✅ 실시간 시간 훅 사용
  const currentTime = useCurrentTime();
  const formattedTime = currentTime.format("YYYY년 M월 D일 HH:mm:ss");
  const [lastKeywordUpdate, setLastKeywordUpdate] = useState(null);

  // ✅ 백엔드 연동 상태
  const [keywords, setKeywords] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(1); // 구글이 기본값
  const [comments, setComments] = useState({});
  const [sentimentData, setSentimentData] = useState({});

  // ✅ UI 상태
  const [selectedKeyword, setSelectedKeyword] = useState(null);
  const [hoveredKeyword, setHoveredKeyword] = useState(null);
  const [chartPosition, setChartPosition] = useState({ x: 0, y: 0 });
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [allComments, setAllComments] = useState([]);

  // ✅ 추천 중복 방지용 로컬 저장소
  const [userLikes, setUserLikes] = useState(new Set());
  const [currentUserIP, setCurrentUserIP] = useState('');

  // ✅ 호버 안정화 상태
  const [hoverTimeout, setHoverTimeout] = useState(null);
  const [isChartStable, setIsChartStable] = useState(false);

  // ✅ 실제 IP 주소 가져오는 함수
  const getUserIP = async () => {
    try {
      // 여러 IP 서비스를 시도
      const services = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://httpbin.org/ip'
      ];
      
      for (const service of services) {
        try {
          const response = await fetch(service);
          const data = await response.json();
          
          // 각 서비스마다 IP 속성명이 다름
          return data.ip || data.origin || data.IPv4 || '127.0.0.1';
        } catch (err) {
          console.warn(`IP 서비스 ${service} 실패:`, err);
          continue;
        }
      }
      
      // 모든 서비스 실패시 fallback
      return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    } catch (err) {
      console.error('IP 주소 가져오기 실패:', err);
      return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  };

  // ✅ 카테고리 불러오기
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("category")
          .select("category_id, category_name");
        if (!error) {
          setCategories(data);
          console.log("✅ 카테고리 로딩 성공:", data);
        }
      } catch (err) {
        console.error("❌ 카테고리 로딩 실패:", err);
      }
    };
    fetchCategories();
  }, []);

  // ✅ 키워드 불러오기 (5분마다) + 갱신시각 업데이트
  useEffect(() => {
    const fetchKeywords = async () => {
      try {
        const { data, error } = await supabase
          .from("search_term_keyword")
          .select("keyword_id, keyword_name, rank, category_id, created_at")
          .eq("is_active", true)
          .eq("category_id", selectedCategory)
          .order("rank", { ascending: true })
          .limit(12);

        if (!error) {
          console.log("✅ 키워드 로딩 성공:", data);
          
          // 가장 최신 created_at 찾기
          if (data.length > 0) {
            const latestCreatedAt = data.reduce((latest, keyword) => {
              return new Date(keyword.created_at) > new Date(latest) ? keyword.created_at : latest;
            }, data[0].created_at);
            
            setLastKeywordUpdate(dayjs(latestCreatedAt).format("HH:mm:ss"));
            console.log("📅 최신 키워드 갱신시각:", latestCreatedAt);
          }
          
          const transformedKeywords = data.map((keyword, index) => ({
            id: keyword.keyword_id,
            text: keyword.keyword_name,
            rank: keyword.rank,
            angle: (index / Math.max(data.length, 12)) * 360,
            category_id: keyword.category_id,
            sentiment: { positive: 500, negative: 500 }
          }));
          
          setKeywords(transformedKeywords);
        }
      } catch (err) {
        console.error("❌ 키워드 로딩 실패:", err);
      }
    };

    if (selectedCategory) {
      fetchKeywords();
      const interval = setInterval(fetchKeywords, 300000);
      return () => clearInterval(interval);
    }
  }, [selectedCategory]);

  // ✅ 실시간 댓글 불러오기
  useEffect(() => {
    const fetchAllComments = async () => {
      try {
        const { data, error } = await supabase
          .from("comment")
          .select(`
            comment_id,
            keyword_id,
            comment_contents,
            nickname,
            created_at,
            comment_recommendation,
            ip_address,
            search_term_keyword(keyword_name, category_id)
          `)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!error) {
          const transformedComments = data.map(comment => ({
            id: comment.comment_id,
            keyword_id: comment.keyword_id,
            keyword_name: comment.search_term_keyword?.keyword_name || '알 수 없음',
            category_name: CATEGORY_CONFIG[comment.search_term_keyword?.category_id]?.name || 'google',
            content: comment.comment_contents,
            nickname: comment.nickname,
            created_at: comment.created_at,
            likes: comment.comment_recommendation || 0,
            ip_address: comment.ip_address,
            isPopular: (comment.comment_recommendation || 0) > 5
          }));
          
          setAllComments(transformedComments);
        }
      } catch (err) {
        console.error("❌ 댓글 로딩 실패:", err);
      }
    };

    fetchAllComments();
    const interval = setInterval(fetchAllComments, 60000);
    return () => clearInterval(interval);
  }, []);

  // ✅ 사용자 추천 이력 로딩 (단순화)
  useEffect(() => {
    const loadUserLikes = async () => {
      try {
        const userIP = await getUserIP();
        setCurrentUserIP(userIP);
        console.log("🔍 IP 로딩:", userIP);
        
        const { data: likes } = await supabase
          .from("comment_ecommendation")
          .select("comment_id")
          .eq("ip_address", userIP);

        if (likes) {
          const likeSet = new Set(likes.map(like => `${userIP}-${like.comment_id}`));
          setUserLikes(likeSet);
          console.log("✅ 추천 이력 로딩:", likes.length, "개");
        }
      } catch (err) {
        console.warn("추천 이력 로딩 실패:", err);
      }
    };

    loadUserLikes();
  }, []);

  // ✅ 댓글 저장 함수 (실제 IP 사용)
  const saveCommentToSupabase = async (keywordId, text) => {
    try {
      const userIP = await getUserIP(); // 실제 IP 가져오기
      
      const { error } = await supabase.from("comment").insert([
        {
          keyword_id: keywordId,
          comment_contents: text,
          nickname: "익명",
          ip_address: userIP, // 실제 IP 사용
          comment_recommendation: 0,
        },
      ]);
      return !error;
    } catch (err) {
      console.error("❌ 댓글 저장 에러:", err);
      return false;
    }
  };

  // ✅ 댓글 추천 핸들러 (단순하고 확실한 방법)
  const handleCommentLike = async (commentId) => {
    try {
      const userIP = await getUserIP();
      console.log("🔍 추천 시도:", { userIP, commentId });
      
      // 단계 1: 중복 확인
      const { data: existingLike } = await supabase
        .from("comment_recommendation")
        .select("*")
        .eq("comment_id", commentId)
        .eq("ip_address", userIP)
        .maybeSingle();

      if (existingLike) {
        console.log("❌ 이미 추천함");
        return;
      }

      // 단계 2: 현재 댓글 정보 가져오기
      const { data: comment } = await supabase
        .from("comment")
        .select("comment_recommendation")
        .eq("comment_id", commentId)
        .single();

      if (!comment) {
        console.log("❌ 댓글 없음");
        return;
      }

      const newLikes = (comment.comment_recommendation || 0) + 1;
      console.log("📈 추천 수 증가:", comment.comment_recommendation, "→", newLikes);

      // 단계 3: 추천 이력 추가
      const { error: insertError } = await supabase
        .from("comment_recommendation")
        .insert({ comment_id: commentId, ip_address: userIP });

      if (insertError) {
        console.error("❌ 추천 이력 저장 실패:", insertError);
        return;
      }

      // 단계 4: 추천 수 업데이트
      const { error: updateError } = await supabase
        .from("comment")
        .update({ comment_recommendation: newLikes })
        .eq("comment_id", commentId);

      if (updateError) {
        console.error("❌ 추천 수 업데이트 실패:", updateError);
        return;
      }

      // 단계 5: UI 업데이트
      setUserLikes(prev => new Set([...prev, `${userIP}-${commentId}`]));
      
      setAllComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, likes: newLikes, isPopular: newLikes > 5 }
          : c
      ));

      console.log("✅ 추천 완료!", { commentId, newLikes });

    } catch (error) {
      console.error("❌ 추천 전체 실패:", error);
    }
  };

  // ✅ 키워드 클릭 핸들러
  const handleKeywordClick = async (keyword) => {
    if (selectedKeyword?.id === keyword.id && showCommentInput) {
      setShowCommentInput(false);
      setSelectedKeyword(null);
    } else {
      setSelectedKeyword(keyword);
      setShowCommentInput(true);
      setCommentText("");

      try {
        const { data: commentData, error: commentError } = await supabase
          .from("comment")
          .select("comment_contents, created_at, comment_recommendation")
          .eq("keyword_id", keyword.id)
          .order("created_at", { ascending: true });

        if (!commentError) {
          const formattedComments = commentData.map((c) => ({
            text: c.comment_contents,
            created_at: c.created_at,
            recommendation: c.comment_recommendation || 0,
          }));
          setComments((prev) => ({
            ...prev,
            [keyword.text]: formattedComments,
          }));
        }

        // ✅ 감정 분석 결과 불러오기
        try {
          const { data: sentimentRes, error: sentimentError } = await supabase
            .from("sentiment_by_comments")
            .select("positive_rate, negative_rate")
            .eq("keyword_id", keyword.id)
            .order("analyzed_at", { ascending: false })
            .limit(1);

          if (!sentimentError && sentimentRes.length > 0) {
            const updatedSentiment = {
              positive: Math.round(sentimentRes[0].positive_rate * 1000),
              negative: Math.round(sentimentRes[0].negative_rate * 1000),
              error: false
            };
            
            setSentimentData(updatedSentiment);
            
            setKeywords(prev => prev.map(kw => 
              kw.id === keyword.id 
                ? { ...kw, sentiment: updatedSentiment }
                : kw
            ));
          } else {
            const errorSentiment = {
              positive: 500,
              negative: 500,
              error: true,
              errorMessage: "비율 계산 안됨"
            };
            
            setSentimentData(errorSentiment);
            
            setKeywords(prev => prev.map(kw => 
              kw.id === keyword.id 
                ? { ...kw, sentiment: errorSentiment }
                : kw
            ));
          }
        } catch (sentimentErr) {
          console.error("감정 분석 로딩 실패:", sentimentErr);
          const errorSentiment = {
            positive: 500,
            negative: 500,
            error: true,
            errorMessage: "비율 계산 안됨"
          };
          
          setSentimentData(errorSentiment);
          
          setKeywords(prev => prev.map(kw => 
            kw.id === keyword.id 
              ? { ...kw, sentiment: errorSentiment }
              : kw
          ));
        }
      } catch (err) {
        console.error("❌ 키워드 상세 로딩 실패:", err);
      }
    }
  };

  // ✅ 안정적인 호버 핸들러 (마우스 이동시 차트 안정화)
  const handleKeywordHover = async (keyword, event) => {
    if (keyword && keyword.sentiment) {
      setHoveredKeyword(keyword);
      
      // 호버 안정화: 200ms 후에 차트를 고정 위치에 표시
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }

      const timeout = setTimeout(async () => {
        setIsChartStable(true);
        
        // ✅ 호버시에도 감정분석 데이터 로딩
        if (!keyword.sentiment || keyword.sentiment.positive === 500) {
          try {
            const { data: sentimentRes, error: sentimentError } = await supabase
              .from("sentiment_by_comments")
              .select("positive_rate, negative_rate")
              .eq("keyword_id", keyword.id)
              .order("analyzed_at", { ascending: false })
              .limit(1);

            if (!sentimentError && sentimentRes.length > 0) {
              const updatedSentiment = {
                positive: Math.round(sentimentRes[0].positive_rate * 1000),
                negative: Math.round(sentimentRes[0].negative_rate * 1000),
                error: false
              };
              
              // 키워드 감정 데이터 업데이트
              setKeywords(prev => prev.map(kw => 
                kw.id === keyword.id 
                  ? { ...kw, sentiment: updatedSentiment }
                  : kw
              ));
              
              // 호버된 키워드 업데이트
              setHoveredKeyword({...keyword, sentiment: updatedSentiment});
            } else {
              const errorSentiment = {
                positive: 500,
                negative: 500,
                error: true,
                errorMessage: "비율 계산 안됨"
              };
              
              setKeywords(prev => prev.map(kw => 
                kw.id === keyword.id 
                  ? { ...kw, sentiment: errorSentiment }
                  : kw
              ));
              
              setHoveredKeyword({...keyword, sentiment: errorSentiment});
            }
          } catch (sentimentErr) {
            console.error("감정 분석 로딩 실패:", sentimentErr);
            const errorSentiment = {
              positive: 500,
              negative: 500,
              error: true,
              errorMessage: "비율 계산 안됨"
            };
            
            setKeywords(prev => prev.map(kw => 
              kw.id === keyword.id 
                ? { ...kw, sentiment: errorSentiment }
                : kw
            ));
            
            setHoveredKeyword({...keyword, sentiment: errorSentiment});
          }
        }
      }, 200);

      setHoverTimeout(timeout);
      
      // 차트 위치 계산 (고정된 위치)
      const chartHeight = 200;
      const chartWidth = 224;
      const margin = 20;
      
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      let x = event.clientX;
      let y = event.clientY;
      
      if (y - chartHeight - margin < 0) {
        y = event.clientY + margin;
      } else {
        y = event.clientY - margin;
      }
      
      if (x + chartWidth / 2 > viewportWidth - margin) {
        x = viewportWidth - chartWidth / 2 - margin;
      } else if (x - chartWidth / 2 < margin) {
        x = chartWidth / 2 + margin;
      }
      
      if (y + chartHeight > viewportHeight - margin) {
        y = viewportHeight - chartHeight - margin;
      }
      
      setChartPosition({ x, y });
    }
  };

  const handleKeywordLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    setHoveredKeyword(null);
    setIsChartStable(false);
  };

  // ✅ 댓글 제출 핸들러
  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !selectedKeyword) return;

    const success = await saveCommentToSupabase(selectedKeyword.id, commentText);
    
    if (success) {
      const userIP = await getUserIP();
      const newComment = {
        id: Date.now(),
        keyword_id: selectedKeyword.id,
        keyword_name: selectedKeyword.text,
        category_name: CATEGORY_CONFIG[selectedCategory]?.name || 'google',
        content: commentText,
        nickname: "익명",
        created_at: new Date().toISOString(),
        likes: 0,
        ip_address: userIP,
        isPopular: false
      };

      setAllComments(prev => [newComment, ...prev]);

      setComments(prev => ({
        ...prev,
        [selectedKeyword.text]: [...(prev[selectedKeyword.text] || []), {
          text: commentText,
          created_at: new Date().toISOString(),
          recommendation: 0,
        }],
      }));

      setCommentText("");
      setShowCommentInput(false);
      
      setTimeout(async () => {
        try {
          const { data: sentimentRes, error: sentimentError } = await supabase
            .from("sentiment_by_comments")
            .select("positive_rate, negative_rate")
            .eq("keyword_id", selectedKeyword.id)
            .order("analyzed_at", { ascending: false })
            .limit(1);

          if (!sentimentError && sentimentRes.length > 0) {
            const updatedSentiment = {
              positive: Math.round(sentimentRes[0].positive_rate * 1000),
              negative: Math.round(sentimentRes[0].negative_rate * 1000)
            };
            
            setSentimentData(updatedSentiment);
            
            setKeywords(prev => prev.map(kw => 
              kw.id === selectedKeyword.id 
                ? { ...kw, sentiment: updatedSentiment }
                : kw
            ));
          }
        } catch (err) {
          console.error("감정 분석 업데이트 실패:", err);
        }
      }, 2000);
      
    } else {
      alert('댓글 작성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // ✅ UI 핸들러들
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedKeyword(null);
    setShowCommentInput(false);
    setHoveredKeyword(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* ✅ 헤더 - 문구 최종 수정 */}
      <header className="flex justify-between items-center p-8 pb-6">
        <h1 className="text-xl font-bold">
          갱신된 시각({lastKeywordUpdate || "로딩중..."}) 기준 실시간 검색어
        </h1>
      </header>

      <div className="flex">
        {/* ✅ 좌측 사이드바 - 완전히 중앙으로 */}
        <div className="w-80 p-6 pt-6 space-y-4">
          <div className="bg-gray-700 text-white px-4 py-3 rounded-lg">
            <span className="font-medium">사이트 별 검색어</span>
          </div>

          <div className="space-y-2">
            {Object.entries(CATEGORY_CONFIG).map(([categoryId, config]) => (
              <div 
                key={categoryId}
                className={`flex items-center space-x-3 p-3 rounded cursor-pointer transition-colors ${
                  selectedCategory === parseInt(categoryId)
                    ? `${config.color} text-white` 
                    : 'hover:bg-gray-800'
                }`}
                onClick={() => handleCategoryChange(parseInt(categoryId))}
              >
                <span>{config.icon}</span>
                <span>{config.displayName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ 중앙 원형 차트 - 완전히 중앙으로 */}
        <CircleChart
          keywords={keywords}
          selectedKeyword={selectedKeyword}
          onKeywordClick={handleKeywordClick}
          onKeywordHover={handleKeywordHover}
          onKeywordLeave={handleKeywordLeave}
        />

        {/* ✅ 우측 댓글 피드 */}
        <CommentFeed
          comments={allComments}
          onCommentLike={handleCommentLike}
          userLikes={userLikes}
        />
      </div>

      {/* ✅ 감정 분석 차트 - 안정화된 버전 */}
      <SentimentChart
        keyword={hoveredKeyword?.text}
        sentiment={hoveredKeyword?.sentiment}
        isVisible={!!hoveredKeyword && isChartStable}
        position={chartPosition}
      />

      {/* ✅ 댓글 입력창 */}
      <CommentInput
        isVisible={showCommentInput}
        selectedKeyword={selectedKeyword}
        selectedCategory={selectedCategory}
        commentText={commentText}
        onCommentTextChange={setCommentText}
        onSubmit={handleCommentSubmit}
        onClose={() => setShowCommentInput(false)}
        categoryConfig={CATEGORY_CONFIG}
      />
    </div>
  );
};

export default Home;