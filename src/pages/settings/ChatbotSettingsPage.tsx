import React, { useState, useEffect } from 'react';
import { Bot, Save, MessageSquare, AlertCircle, Loader2, Sparkles, Plus, TrendingUp, Settings2, Trash2, Info, Hash, MousePointer2 } from 'lucide-react';
import axios from '../../api/axios';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageWrapper } from '../../components/layout/PageWrapper';
import { cn } from '../../utils/cn';

interface TrendingQuestion {
  content: string;
  count: number;
}

export const ChatbotSettingsPage: React.FC = () => {
  const toast = useToast();
  const [suggestions, setSuggestions] = useState<string[]>(['', '', '', '']);
  const [trendingQuestions, setTrendingQuestions] = useState<TrendingQuestion[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [stopwords, setStopwords] = useState<string[]>([]);
  const [newStopword, setNewStopword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, trendingRes, advancedRes] = await Promise.all([
        axios.get('/admin/chatbot/suggestions'),
        axios.get('/admin/chatbot/trending'),
        axios.get('/admin/chatbot/advanced')
      ]);

      if (settingsRes.data.data) {
        setSuggestions([...settingsRes.data.data, '', '', '', ''].slice(0, 4));
      }

      if (trendingRes.data.data) {
        setTrendingQuestions(trendingRes.data.data);
      }

      if (advancedRes.data.data) {
        setSystemPrompt(advancedRes.data.data.system_prompt || '');
        setWelcomeMessage(advancedRes.data.data.welcome_message || '');
        setStopwords(advancedRes.data.data.stopwords || []);
      }
    } catch (error) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (activeTab === 'basic') {
        const filteredSuggestions = suggestions.filter(s => s.trim() !== '');
        await axios.put('/admin/chatbot/suggestions', { suggestions: filteredSuggestions });
      } else {
        await axios.put('/admin/chatbot/advanced', {
          system_prompt: systemPrompt,
          welcome_message: welcomeMessage,
          stopwords: stopwords
        });
      }
      toast.success('Lưu cấu hình thành công');
    } catch (error) {
      toast.error('Không thể lưu cấu hình');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSuggestion = (index: number, value: string) => {
    const newSuggestions = [...suggestions];
    newSuggestions[index] = value;
    setSuggestions(newSuggestions);
  };

  const addStopword = () => {
    if (!newStopword.trim()) return;
    if (stopwords.includes(newStopword.trim().toLowerCase())) {
      toast.error('Từ khóa này đã tồn tại');
      return;
    }
    setStopwords([...stopwords, newStopword.trim().toLowerCase()]);
    setNewStopword('');
  };

  const removeStopword = (word: string) => {
    setStopwords(stopwords.filter(w => w !== word));
  };

  return (
    <PageWrapper 
      title="Cấu hình Dược sĩ AI" 
      subtitle="Tùy chỉnh trí tuệ nhân tạo và các câu hỏi gợi ý thông minh cho khách hàng"
      actions={
        <Button 
          onClick={handleSave} 
          loading={isSaving}
          className="rounded-xl shadow-lg shadow-[var(--accent-primary)]/10 font-bold uppercase text-xs tracking-wider px-6"
        >
          <Save size={16} className="mr-2" />
          Lưu cấu hình
        </Button>
      }
    >
      <div className="flex gap-2 p-1 bg-[var(--bg-elevated)] rounded-xl mb-8 w-fit border border-[var(--bg-border)]">
        <button
          onClick={() => setActiveTab('basic')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
            activeTab === 'basic' ? "bg-white text-[var(--accent-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          <MousePointer2 size={14} />
          Gợi ý câu hỏi
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={cn(
            "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
            activeTab === 'advanced' ? "bg-white text-[var(--accent-primary)] shadow-sm" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          )}
        >
          <Settings2 size={14} />
          Cấu hình AI
        </button>
      </div>

      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-3 opacity-40">
          <Loader2 className="animate-spin text-[var(--accent-primary)]" size={32} />
          <p className="text-sm font-medium">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Content */}
          <div className={cn(
            activeTab === 'basic' ? "lg:col-span-8" : "lg:col-span-12 max-w-4xl mx-auto w-full",
            "space-y-6"
          )}>
            {activeTab === 'basic' ? (
              <div className="space-y-6">
                <Card className="overflow-hidden border border-[var(--bg-border)] shadow-xl shadow-black/5">
                  <div className="px-6 py-4 border-b border-[var(--bg-border)] flex items-center justify-between bg-[var(--bg-surface)]">
                    <div className="flex items-center gap-2">
                      <Hash className="w-5 h-5 text-[var(--accent-primary)]" />
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">4 Gợi ý đang hiển thị</h2>
                    </div>
                    <button 
                      onClick={() => setSuggestions(['', '', '', ''])}
                      className="text-xs font-bold text-red-500 uppercase tracking-wider hover:underline"
                    >
                      Xóa tất cả
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {suggestions.map((s, i) => (
                      <div key={i} className="flex items-center gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--bg-border)] flex items-center justify-center text-sm font-bold text-[var(--text-secondary)] group-focus-within:border-[var(--accent-primary)] group-focus-within:text-[var(--accent-primary)] transition-all">
                          {i + 1}
                        </div>
                        <input
                          type="text"
                          value={s}
                          onChange={(e) => updateSuggestion(i, e.target.value)}
                          placeholder={`Nhập câu hỏi gợi ý số ${i + 1}...`}
                          className="flex-1 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl px-4 py-3 outline-none focus:border-[var(--accent-primary)] transition-all text-sm font-medium pr-12"
                        />
                        {s && (
                          <button
                            onClick={() => updateSuggestion(i, '')}
                            className="absolute right-3 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Xóa gợi ý này"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="px-6 py-4 bg-blue-50/50 border-t border-[var(--bg-border)] flex gap-3">
                    <Info className="w-5 h-5 text-blue-500 shrink-0" />
                    <p className="text-xs text-blue-800 font-medium leading-relaxed">
                      Các câu hỏi này sẽ xuất hiện ngay khi khách hàng mở khung chat để định hướng tư vấn. 
                      Bạn có thể chọn nhanh từ danh sách <b>Xu hướng</b> bên cạnh.
                    </p>
                  </div>
                </Card>
              </div>
            ) : (
              <div className="space-y-6">
                {/* System Prompt */}
                <Card className="border border-[var(--bg-border)] shadow-xl shadow-black/5">
                  <div className="px-6 py-4 border-b border-[var(--bg-border)] bg-[var(--bg-surface)] flex items-center gap-2">
                    <Bot className="w-5 h-5 text-[var(--accent-primary)]" />
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">System Prompt</h2>
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-[var(--text-muted)] mb-3 font-medium uppercase tracking-wider">Nguyên tắc hoạt động và kiến thức của AI</p>
                    <textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      className="w-full h-72 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-4 outline-none focus:border-[var(--accent-primary)] text-sm font-medium leading-relaxed custom-scrollbar"
                    />
                  </div>
                </Card>

                {/* Welcome Message */}
                <Card className="border border-[var(--bg-border)] shadow-xl shadow-black/5">
                  <div className="px-6 py-4 border-b border-[var(--bg-border)] bg-[var(--bg-surface)] flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Lời chào khởi đầu</h2>
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-[var(--text-muted)] mb-3 font-medium uppercase tracking-wider">Tin nhắn đầu tiên AI gửi cho khách hàng</p>
                    <textarea
                      value={welcomeMessage}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      className="w-full h-32 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl p-4 outline-none focus:border-emerald-500 text-sm font-medium leading-relaxed custom-scrollbar"
                    />
                  </div>
                </Card>

                {/* Stopwords */}
                <Card className="border border-[var(--bg-border)] shadow-xl shadow-black/5">
                  <div className="px-6 py-4 border-b border-[var(--bg-border)] bg-[var(--bg-surface)] flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Danh sách Stopwords</h2>
                  </div>
                  <div className="p-6">
                    <div className="flex gap-2 mb-6">
                      <input
                        type="text"
                        value={newStopword}
                        onChange={(e) => setNewStopword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addStopword()}
                        placeholder="Thêm từ khóa cần AI bỏ qua..."
                        className="flex-1 bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-rose-500"
                      />
                      <Button onClick={addStopword} variant="danger" className="rounded-xl px-6 font-bold text-xs uppercase tracking-wider">Thêm</Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {stopwords.map(word => (
                        <div key={word} className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg group">
                          <span className="text-xs font-bold text-rose-700">{word}</span>
                          <button onClick={() => removeStopword(word)} className="text-rose-400 hover:text-rose-600">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          {activeTab === 'basic' && (
            <div className="lg:col-span-4">
              <Card className="sticky top-6 border border-[var(--bg-border)] shadow-xl shadow-black/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--bg-border)] bg-[var(--bg-surface)] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[var(--accent-primary)]" />
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Xu hướng 30 ngày</h2>
                </div>
                
                <div className="p-4 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar space-y-2">
                  {Array.isArray(trendingQuestions) && trendingQuestions.length > 0 ? (
                    trendingQuestions.map((q, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-[var(--bg-border)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/40 transition-all group">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{q.content}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Sparkles size={10} className="text-[var(--accent-primary)]" />
                            <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">{q.count} quan tâm</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            const emptyIndex = suggestions.findIndex(s => s === '');
                            if (emptyIndex !== -1) {
                              updateSuggestion(emptyIndex, q.content);
                            } else {
                              toast.error('Đã đủ 4 gợi ý');
                            }
                          }}
                          className="w-8 h-8 rounded-lg border border-[var(--bg-border)] bg-[var(--bg-surface)] flex items-center justify-center text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-all shadow-sm group-hover:scale-105"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-[var(--text-muted)] text-sm italic">
                      Chưa có dữ liệu xu hướng
                    </div>
                  )}
                </div>

                <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--bg-border)]">
                  <p className="text-[10px] text-[var(--text-muted)] font-medium italic">
                    * Dữ liệu tự động cập nhật mỗi 24h dựa trên câu hỏi của khách hàng.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
};
