import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VBarChart, LineChart, DonutChart } from './svg-charts';

describe('spatial SVG charts', () => {
  const series = [
    { label: 'Jan', value: 10 },
    { label: 'Feb', value: 20 },
  ];

  it('renders a labeled bar chart', () => {
    const { container } = render(<VBarChart data={series} />);
    expect(container.querySelectorAll('rect').length).toBe(series.length);
    expect(screen.getByLabelText('Bar chart')).toBeInTheDocument();
    expect(container.textContent).toContain('Jan');
  });

  it('renders a line chart with a title + series labels', () => {
    const { container } = render(<LineChart data={series} />);
    expect(container.querySelectorAll('path').length).toBeGreaterThan(0);
    expect(container.textContent).toContain('Jan');
  });

  it('renders a donut for a distribution', () => {
    const { container } = render(<DonutChart data={[{ label: 'A', value: 1 }, { label: 'B', value: 3 }]} colors={['#fff', '#000']} />);
    expect(container.querySelectorAll('circle').length).toBeGreaterThan(0);
  });

  it('handles an empty series without crashing', () => {
    const { container } = render(<VBarChart data={[]} />);
    expect(container.querySelectorAll('rect').length).toBe(0);
  });
});