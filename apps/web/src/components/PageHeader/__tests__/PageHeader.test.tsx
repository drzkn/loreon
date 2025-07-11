import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  it('should render title and description correctly', () => {
    const title = '🔌 Test Title';
    const description = 'Test description';

    render(<PageHeader title={title} description={description} />);

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('should render header with correct structure', () => {
    const title = 'Test Title';
    const description = 'Test description';

    render(<PageHeader title={title} description={description} />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(title);
  });

  it('should handle empty title and description', () => {
    render(<PageHeader title="" description="" />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('should handle special characters in title and description', () => {
    const title = '🔌 Special & Characters <test>';
    const description = 'Description with "quotes" and special chars';

    render(<PageHeader title={title} description={description} />);

    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });
}); 