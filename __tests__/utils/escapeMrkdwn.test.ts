/**
 * Tests for escapeMrkdwn utility
 */

import { escapeMrkdwn } from '../../src/utils/escapeMrkdwn';

describe('escapeMrkdwn', () => {
  it('should return plain text unchanged', () => {
    expect(escapeMrkdwn('hello world')).toBe('hello world');
  });

  it('should escape ampersands', () => {
    expect(escapeMrkdwn('fish & chips')).toBe('fish &amp; chips');
  });

  it('should escape less-than signs', () => {
    expect(escapeMrkdwn('a < b')).toBe('a &lt; b');
  });

  it('should escape greater-than signs', () => {
    expect(escapeMrkdwn('a > b')).toBe('a &gt; b');
  });

  it('should escape all special characters together', () => {
    expect(escapeMrkdwn('<a & b>')).toBe('&lt;a &amp; b&gt;');
  });

  it('should escape every occurrence, not just the first', () => {
    expect(escapeMrkdwn('<<&&>>')).toBe('&lt;&lt;&amp;&amp;&gt;&gt;');
  });

  it('should neutralize user mention injection', () => {
    expect(escapeMrkdwn('<@U12345>')).toBe('&lt;@U12345&gt;');
  });

  it('should neutralize special command injection like <!everyone>', () => {
    expect(escapeMrkdwn('<!everyone>')).toBe('&lt;!everyone&gt;');
  });

  it('should neutralize link injection', () => {
    expect(escapeMrkdwn('<https://evil.example|click me>')).toBe(
      '&lt;https://evil.example|click me&gt;',
    );
  });

  it('should escape & before < and > (no double escaping)', () => {
    expect(escapeMrkdwn('&lt;')).toBe('&amp;lt;');
  });

  it('should handle empty string', () => {
    expect(escapeMrkdwn('')).toBe('');
  });
});
