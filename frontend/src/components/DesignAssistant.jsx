import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Bot, Loader2 } from 'lucide-react'
import api from '../utils/api'

// E5 设计助手对话面板（Day 39 骨架）
// 前端：自然语言 → /api/assistant/design → 预测 + 解释
export default function DesignAssistant() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: '你好，我是设计助手。试着说：「帮我把效率提到 0.91，流量不低于 21」' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setMessages(m => [...m, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const { data } = await api.post('/api/assistant/design', { text })
      const pred = data.predictions
      const reply = [
        `📊 预测（基准设计）：效率 ${pred.Efficiency?.toFixed(4)} · 压比 ${pred.Compression_ratio?.toFixed(4)} · 流量 ${pred.Massflow?.toFixed(2)} kg/s`,
        ...(data.explanation || []).map(e => `💡 ${e}`),
      ].join('\n')
      setMessages(m => [...m, { role: 'bot', text: reply }])
    } catch (e) {
      const detail = e?.response?.data?.detail
      setMessages(m => [...m, { role: 'bot', text: `⚠️ ${detail || '请求失败，请稍后重试'}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <Bot className="w-5 h-5 text-indigo-500" />
        <span className="font-semibold">设计助手 Design Assistant</span>
        <span className="text-xs text-slate-400 ml-auto">E5 · MVP</span>
      </div>
      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] whitespace-pre-line rounded-xl px-3 py-2 text-sm ${
              m.role === 'user'
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
            }`}>{m.text}</div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> 正在设计…
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 p-3 border-t border-slate-200 dark:border-slate-700">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="描述你的设计目标…"
          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <button onClick={send} disabled={loading}
          className="rounded-lg bg-indigo-500 hover:bg-indigo-600 p-2 text-white disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
