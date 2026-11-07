import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '../app/page';

test('Home renders the application heading', () => {
  render(<Home />);
  expect(
    screen.getByRole('heading', {
      level: 1,
      name: 'Real-Time Collaboration Tool',
    }),
  ).toBeInTheDocument();
});
