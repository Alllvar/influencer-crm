import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CreatorSummary, Deal } from '../../api/types';
import { renderWithApp } from '../../test/render';
import { PipelineBoard } from './PipelineBoard';

const deal = (id: string, name: string, stage: Deal['stage'], fee = 0): Deal<CreatorSummary> => ({
  creator: { id, name, handle: name.toLowerCase(), platform: 'instagram', followers: 10_000, engagementRate: 3 },
  stage,
  fee,
  deliverables: '1 reel',
  updatedAt: '2026-10-01',
});

const deals = [
  deal('a', 'Anna', 'invited'),
  deal('b', 'Bohdan', 'contracted', 1500),
  deal('c', 'Clara', 'contracted', 500),
];

describe('PipelineBoard', () => {
  it('puts each deal in its stage column with a count and total fee', () => {
    renderWithApp(<PipelineBoard deals={deals} onMove={vi.fn()} onEdit={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByText('2 · $2,000')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(4); // the four empty columns
  });

  it('moves a deal to another stage from the card menu', async () => {
    const onMove = vi.fn();
    renderWithApp(<PipelineBoard deals={deals} onMove={onMove} onEdit={vi.fn()} onRemove={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Actions for Anna' }));
    const menu = await screen.findByRole('menu');
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Negotiating' }));

    expect(onMove).toHaveBeenCalledWith(deals[0], 'negotiating');
  });
});
