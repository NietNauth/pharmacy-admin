import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Send, Headphones, Loader2, MessageSquare, CheckCircle2, Clock, Paperclip, X } from 'lucide-react'
import { PageWrapper } from '../components/layout/PageWrapper'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Skeleton } from '../components/ui/Skeleton'
import { Avatar } from '../components/ui/Avatar'
import { chatApi } from '../api/chat'
import type { Conversation, Message } from '../api/chat'
import { useAuthStore } from '../stores/authStore'
import { cn } from '../utils/cn'
import { formatDateTime } from '../utils/format'

const Chat: React.FC = () => {
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollingRef = useRef<any>(null)

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await chatApi.getConversations()
      setConversations(res.data.data)
    } catch (err) {
      console.error('Failed to fetch conversations', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  const fetchMessages = useCallback(async (id: string, silent = false) => {
    if (!silent) setMessagesLoading(true)
    try {
      const res = await chatApi.getMessages(id)
      setMessages(res.data.data.messages)
    } catch (err) {
      console.error('Failed to fetch messages', err)
    } finally {
      if (!silent) setMessagesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(() => fetchConversations(true), 10000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id)
      if (pollingRef.current) clearInterval(pollingRef.current)
      pollingRef.current = setInterval(() => fetchMessages(activeConv.id, true), 5000)
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [activeConv, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if ((!message.trim() && !selectedFile) || !activeConv || sending) return

    const body = message.trim()
    const file = selectedFile
    
    setMessage('')
    setSelectedFile(null)
    setPreviewUrl(null)
    setSending(true)
    
    try {
      const res = await chatApi.sendMessage(activeConv.id, body, file || undefined)
      setMessages(prev => [...prev, res.data.data])
    } catch (err) {
      console.error('Failed to send message', err)
      setMessage(body)
    } finally {
      setSending(false)
    }
  }

  const filteredConversations = conversations.filter(c => 
    c.user?.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.last_message?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageWrapper title="Hỗ trợ khách hàng" subtitle="Tư vấn trực tuyến 24/7">
      <div className="flex h-[calc(100vh-180px)] gap-6 overflow-hidden">
        {/* Left pane: Conversations List */}
        <Card className="w-80 flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b border-[var(--bg-border)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Tìm khách hàng..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-xl text-sm outline-none focus:border-[var(--accent-primary)] transition-all"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="p-4 flex gap-3 border-b border-[var(--bg-border)] last:border-0">
                  <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-[var(--text-muted)] italic text-sm">
                Không tìm thấy cuộc hội thoại nào
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={cn(
                    'w-full p-4 flex gap-3 border-b border-[var(--bg-border)] last:border-0 text-left transition-all hover:bg-[var(--bg-elevated)]',
                    activeConv?.id === conv.id && 'bg-[var(--accent-muted)] border-l-4 border-l-[var(--accent-primary)]'
                  )}
                >
                  <Avatar name={conv.user?.full_name || 'Khách'} size="sm" className="shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="font-bold text-sm text-[var(--text-primary)] truncate">
                        {conv.user?.full_name || 'Khách vãng lai'}
                      </h4>
                      {conv.last_message_at && (
                        <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
                          {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {conv.last_message || 'Chưa có tin nhắn'}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Right pane: Chat Messages */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[var(--bg-border)] flex items-center justify-between bg-[var(--bg-elevated)]">
                <div className="flex items-center gap-3">
                  <Avatar name={activeConv.user?.full_name || 'Khách'} size="sm" />
                  <div>
                    <h3 className="font-bold text-[var(--text-primary)]">{activeConv.user?.full_name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-medium text-[var(--text-secondary)]">Đang trực tuyến</span>
                    </div>
                  </div>
                </div>
                <Badge variant={activeConv.status === 'open' ? 'success' : 'neutral'}>
                  {activeConv.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                </Badge>
              </div>

              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[var(--bg-subtle)]">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-[var(--accent-primary)]" size={32} />
                  </div>
                ) : (
                  <>
                    <div className="text-center py-4">
                      <Badge variant="neutral" className="px-4 py-1 text-[10px]">Cuộc hội thoại bắt đầu từ {formatDateTime(activeConv.created_at)}</Badge>
                    </div>
                    {messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id
                      return (
                        <div key={msg.id} className={cn('flex flex-col', isMe ? 'items-end' : 'items-start')}>
                          <div className={cn('flex items-end gap-3 max-w-[80%]', isMe ? 'flex-row-reverse' : 'flex-row')}>
                            <Avatar name={isMe ? user.full_name : (activeConv.user?.full_name || 'U')} size="sm" className="mb-1 border-none shadow-sm" />
                            <div className={cn(
                              'p-3.5 px-5 rounded-[24px] text-sm shadow-md transition-all hover:shadow-lg overflow-hidden',
                              isMe 
                                ? 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white rounded-tr-none' 
                                : 'bg-white text-[var(--text-primary)] rounded-tl-none border border-[var(--bg-border)]'
                            )}>
                              {msg.type === 'image' && msg.attachment_url && (
                                <div className="mb-2 -mx-1 -mt-1">
                                    <img 
                                      src={msg.attachment_url} 
                                      alt="Attachment" 
                                      className="w-full h-auto rounded-xl object-cover max-h-80 cursor-pointer"
                                      onClick={() => msg.attachment_url && window.open(msg.attachment_url, '_blank')}
                                    />
                                </div>
                              )}
                              {msg.type === 'file' && msg.attachment_url && (
                                <a 
                                  href={msg.attachment_url} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="flex items-center gap-2 p-2 bg-black/5 rounded-lg mb-2 hover:bg-black/10 transition-colors"
                                >
                                  <Paperclip size={16} />
                                  <span className="text-xs truncate">Tệp đính kèm</span>
                                </a>
                              )}
                              {msg.body && <div>{msg.body}</div>}
                            </div>
                          </div>
                          <div className={cn('flex items-center gap-1.5 mt-1.5 px-10', isMe ? 'flex-row-reverse' : 'flex-row')}>
                            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && <CheckCircle2 size={10} className="text-emerald-500" />}
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input area */}
              <div className="p-4 border-t border-[var(--bg-border)] bg-white">
                {previewUrl && (
                  <div className="mb-3 relative inline-block">
                    <img src={previewUrl} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-[var(--bg-border)] shadow-md" />
                    <button 
                      onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSend} className="flex gap-2 items-end">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--accent-primary)] transition-all"
                    title="Đính kèm tệp"
                  >
                    <Paperclip size={24} />
                  </button>
                  <div className="flex-1 relative">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      placeholder="Nhập phản hồi cho khách hàng..."
                      className="w-full pl-4 pr-4 py-3 bg-[var(--bg-elevated)] border border-[var(--bg-border)] rounded-2xl text-sm outline-none focus:border-[var(--accent-primary)] transition-all resize-none max-h-32 min-h-[48px]"
                      rows={1}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={(!message.trim() && !selectedFile) || sending}
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
                      (message.trim() || selectedFile) && !sending ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-sky-500/20 hover:scale-105 active:scale-95' : 'bg-[var(--bg-border)] text-[var(--text-muted)]'
                    )}
                  >
                    {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[var(--bg-subtle)]">
              <div className="w-20 h-20 bg-[var(--bg-elevated)] rounded-3xl flex items-center justify-center text-[var(--text-muted)] mb-6 shadow-sm border border-[var(--bg-border)]">
                <MessageSquare size={40} />
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">Trung tâm Hỗ trợ Khách hàng</h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm">
                Vui lòng chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu tư vấn cho khách hàng.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="p-4 bg-white rounded-2xl border border-[var(--bg-border)] flex items-center gap-3">
                  <Clock className="text-sky-500" size={20} />
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Phản hồi trung bình</p>
                    <p className="text-sm font-black text-[var(--text-primary)]">2 Phút</p>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-[var(--bg-border)] flex items-center gap-3">
                  <Headphones className="text-emerald-500" size={20} />
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Khách đang đợi</p>
                    <p className="text-sm font-black text-[var(--text-primary)]">{conversations.length} Cuộc</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageWrapper>
  )
}

export default Chat
