import { expect, test } from 'vitest'
import { Constants } from '@/types/supabase';

test('supabase constants', () => {
  expect(Constants.public.Enums.state).toContain('open');
  expect(Constants.public.Enums.state).toContain('reserved');
  expect(Constants.public.Enums.state).toContain('purchased');
});
