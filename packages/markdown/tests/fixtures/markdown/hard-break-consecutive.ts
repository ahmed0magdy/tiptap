export const name = 'Consecutive Hard Breaks'

export const expectedInput = String.raw`one  
break

two  
\
breaks

three  
\
\
breaks

\
start

**bold**  
\
**text**

*italic*  
\
*text*`

const text = (value: string, marks?: { type: string }[]) =>
  marks ? { type: 'text', text: value, marks } : { type: 'text', text: value }

const hardBreak = { type: 'hardBreak' }

const paragraph = (...content: object[]) => ({ type: 'paragraph', content })

export const expectedOutput = {
  type: 'doc',
  content: [
    paragraph(text('one'), hardBreak, text('break')),
    paragraph(text('two'), hardBreak, hardBreak, text('breaks')),
    paragraph(text('three'), hardBreak, hardBreak, hardBreak, text('breaks')),
    paragraph(hardBreak, text('start')),
    paragraph(
      text('bold', [{ type: 'bold' }]),
      hardBreak,
      hardBreak,
      text('text', [{ type: 'bold' }]),
    ),
    paragraph(
      text('italic', [{ type: 'italic' }]),
      hardBreak,
      hardBreak,
      text('text', [{ type: 'italic' }]),
    ),
  ],
}

export const extensions = []
