export type TopicSlug = 'ai' | 'kinh-te' | 'vang' | 'cong-nghe'

export type Topic = {
  slug: TopicSlug
  name: string
  description: string
  keywords: string[]
}

export const TOPICS: Topic[] = [
  {
    slug: 'ai',
    name: 'Trí tuệ nhân tạo',
    description: 'AI, machine learning, tự động hóa',
    keywords: [
      'trí tuệ nhân tạo', 'chatgpt', 'gemini', 'openai', 'robot', 'tự động hóa',
      'machine learning', 'nvidia', 'chip ai', 'bán dẫn', 'deepseek', 'grok',
      'copilot', 'llm', 'mô hình ngôn ngữ', 'generative', 'claude', 'anthropic',
      'microsoft ai', 'google ai', 'meta ai',
    ],
  },
  {
    slug: 'vang',
    name: 'Vàng',
    description: 'Giá vàng, kim loại quý',
    keywords: ['vàng', 'sjc', 'kim loại quý', 'giá vàng', 'vàng miếng', 'vàng nhẫn', 'vàng thế giới', 'bạc', 'platinum'],
  },
  {
    slug: 'cong-nghe',
    name: 'Khoa học & Công nghệ',
    description: 'Startup, phần mềm, khoa học',
    keywords: [
      'công nghệ', 'startup', 'phần mềm', 'ứng dụng', 'điện thoại', 'smartphone',
      'blockchain', 'crypto', 'tiền điện tử', 'khoa học', 'nghiên cứu', 'vũ trụ',
      'nasa', 'fintech', 'thương mại điện tử', 'ecommerce', 'iphone', 'samsung',
      'apple', 'google', 'meta', 'amazon', 'tiktok', 'mạng xã hội',
    ],
  },
  {
    slug: 'kinh-te',
    name: 'Kinh tế Việt Nam',
    description: 'Kinh doanh, tài chính, thị trường',
    keywords: [],
  },
]

export function categorizeArticle(title: string, source: string): TopicSlug {
  const lower = (title + ' ' + source).toLowerCase()
  for (const topic of TOPICS) {
    if (topic.keywords.length === 0) continue
    if (topic.keywords.some((kw) => lower.includes(kw))) return topic.slug
  }
  return 'kinh-te'
}

export function getTopicBySlug(slug: string): Topic | undefined {
  return TOPICS.find((t) => t.slug === slug)
}
