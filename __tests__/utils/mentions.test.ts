/**
 * Tests for mentions utility
 */

import { formatMentions, MAX_RENDERED_MENTIONS } from '../../src/utils/mentions';

describe('formatMentions', () => {
  it('should render a single user as a mention', () => {
    expect(formatMentions(['U1'])).toBe('<@U1>');
  });

  it('should join multiple mentions with commas', () => {
    expect(formatMentions(['U1', 'U2', 'U3'])).toBe('<@U1>, <@U2>, <@U3>');
  });

  it('should return an empty string for an empty list', () => {
    expect(formatMentions([])).toBe('');
  });

  it('should not append a suffix when list length equals the cap', () => {
    const ids = ['U1', 'U2', 'U3'];
    expect(formatMentions(ids, 3)).toBe('<@U1>, <@U2>, <@U3>');
  });

  it('should cap the rendered mentions and append a remainder suffix', () => {
    const ids = ['U1', 'U2', 'U3', 'U4', 'U5'];
    expect(formatMentions(ids, 2)).toBe('<@U1>, <@U2> …and 3 more');
  });

  it('should default the cap to MAX_RENDERED_MENTIONS', () => {
    expect(MAX_RENDERED_MENTIONS).toBe(20);

    const ids = Array.from({ length: 25 }, (_, i) => `U${i}`);
    const result = formatMentions(ids);

    expect(result).toContain('<@U19>');
    expect(result).not.toContain('<@U20>');
    expect(result).toContain('…and 5 more');
  });

  it('should render all mentions without a suffix when under the default cap', () => {
    const ids = Array.from({ length: 20 }, (_, i) => `U${i}`);
    const result = formatMentions(ids);

    expect(result).toContain('<@U19>');
    expect(result).not.toContain('more');
  });
});
