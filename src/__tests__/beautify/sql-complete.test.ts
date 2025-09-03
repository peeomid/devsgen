import { describe, test, expect } from 'vitest';
import { beautify } from '../../lib/beautify/beautify';
import type { BeautifyOptions } from '../../types/beautify';

const opts: BeautifyOptions = {
  mode: 'structure',
  indent: 2,
  useTabs: false,
  newlineAfterComma: true,
  keepComments: true,
  conservative: false,
};

describe('SQL Complete Output', () => {
  test('formats SELECT with joins and where', () => {
    const input = `select u.id,u.name,o.id as oid from users u join orders o on u.id=o.user_id where o.status='paid' order by o.created_at desc`;
    const out = beautify(input, opts).output;
    const expected = `SELECT
  u.id,
  u.name,
  o.id AS oid
FROM
  users u
JOIN
  orders o
ON
  u.id = o.user_id
WHERE
  o.status = 'paid'
ORDER BY
  o.created_at desc
`;
    expect(out).toBe(expected);
  });
});

