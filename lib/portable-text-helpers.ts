import type { PortableTextBlock } from '@/types'

/**
 * Converts multiline text with paragraphs / bullets into standard Portable Text blocks
 * compatible with Sanity's rich text schema and @portabletext/react rendering.
 */
export function stringToPortableText(text: string): PortableTextBlock[] {
  if (!text || !text.trim()) {
    return [
      {
        _type: 'block',
        _key: 'b_' + Math.random().toString(36).substring(2, 9),
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 's_' + Math.random().toString(36).substring(2, 9),
            text: '',
          },
        ],
      },
    ]
  }

  const rawParagraphs = text.split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean)
  if (rawParagraphs.length === 0) {
    return [
      {
        _type: 'block',
        _key: 'b_' + Math.random().toString(36).substring(2, 9),
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 's_' + Math.random().toString(36).substring(2, 9),
            text: text.trim(),
          },
        ],
      },
    ]
  }

  const blocks: PortableTextBlock[] = []

  for (const para of rawParagraphs) {
    const lines = para.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const allBullets = lines.length > 0 && lines.every((l) => l.startsWith('- ') || l.startsWith('* '))

    if (allBullets) {
      for (const line of lines) {
        blocks.push({
          _type: 'block',
          _key: 'b_' + Math.random().toString(36).substring(2, 9),
          style: 'normal',
          children: [
            {
              _type: 'span',
              _key: 's_' + Math.random().toString(36).substring(2, 9),
              text: line.replace(/^[-*]\s+/, ''),
            },
          ],
        })
      }
    } else {
      blocks.push({
        _type: 'block',
        _key: 'b_' + Math.random().toString(36).substring(2, 9),
        style: 'normal',
        children: [
          {
            _type: 'span',
            _key: 's_' + Math.random().toString(36).substring(2, 9),
            text: para,
          },
        ],
      })
    }
  }

  return blocks
}

/**
 * Converts Portable Text blocks back to plain editable markdown / text string
 */
export function portableTextToString(content: string | PortableTextBlock[] | undefined | null): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''

  return content
    .map((block) => {
      if (block._type !== 'block' || !block.children) return ''
      const lineText = block.children.map((c) => c.text || '').join('')
      return lineText
    })
    .filter(Boolean)
    .join('\n\n')
}
