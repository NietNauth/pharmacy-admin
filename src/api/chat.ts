import axios from './axios'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'customer' | 'pharmacist' | 'admin'
  type: 'text' | 'image' | 'file'
  body: string
  attachment_url: string | null
  is_read: boolean
  created_at: string
  sender?: {
    id: string
    full_name: string
    role: string
  }
}

export interface Conversation {
  id: string
  user_id: string
  pharmacist_id: string | null
  status: 'open' | 'closed'
  last_message: string | null
  last_message_at: string | null
  created_at: string
  user?: {
    id: string
    full_name: string
  }
}

export const chatApi = {
  getConversations: () => axios.get('/chat'),
  getMessages: (id: string) => axios.get(`/chat/${id}`),
  sendMessage: (id: string, body?: string, file?: File) => {
    const formData = new FormData()
    if (body) formData.append('body', body)
    if (file) formData.append('attachment', file)
    return axios.post(`/chat/${id}/send`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}
