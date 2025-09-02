import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RichTextContent from './RichTextContent.vue'

describe('RichTextContent', () => {
  it('sanitizes dangerous HTML', () => {
    const wrapper = mount(RichTextContent, {
      props: {
        content: '<p>Hello</p><script>window.hacked=1</script>'
      }
    })
    const html = wrapper.html()
    expect(html).toContain('<p>Hello</p>')
    expect(html).not.toContain('<script')
  })

  it('renders Tiptap-like JSON content with links present', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Click ' },
            { type: 'text', text: 'here', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
          ],
        },
      ],
    }

    const wrapper = mount(RichTextContent, { props: { content: doc } })
    const a = wrapper.find('a')
    expect(a.exists()).toBe(true)
    expect(a.attributes('href')).toBe('https://example.com')
    // target/rel may be sanitized in JSON path; just ensure link exists
  })
})
