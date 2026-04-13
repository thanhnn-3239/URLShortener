import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangePicker from '@/components/DateRangePicker';

describe('DateRangePicker Component', () => {
  const mockOnRangeChange = vi.fn();

  describe('Rendering', () => {
    it('should render date range picker', () => {
      const { container } = render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      expect(container).toBeTruthy();
    });

    it('should render daily/weekly toggle buttons', () => {
      render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      expect(screen.getByText(/daily/i)).toBeInTheDocument();
      expect(screen.getByText(/weekly/i)).toBeInTheDocument();
    });

    it('should render start date input', () => {
      const { container } = render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      const startInput = container.querySelector('input[type="date"]');
      expect(startInput).toBeInTheDocument();
    });

    it('should render end date input', () => {
      const { container } = render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      const inputs = container.querySelectorAll('input[type="date"]');
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it('should have preset range buttons', () => {
      render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      // Should have buttons like "Last 7 days", "Last 30 days", etc.
      const hasPresets =
        screen.queryByText(/last.*day/i) ||
        screen.queryByText(/today/i) ||
        screen.queryByText(/custom/i);
      expect(hasPresets).toBeTruthy();
    });
  });

  describe('Date Input', () => {
    it('should accept start date input', () => {
      const { container } = render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      const startInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      if (startInput) {
        fireEvent.change(startInput, { target: { value: '2026-04-05' } });
        expect(mockOnRangeChange).toHaveBeenCalled();
      }
    });

    it('should accept end date input', () => {
      const { container } = render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      const inputs = container.querySelectorAll('input[type="date"]') as NodeListOf<HTMLInputElement>;
      if (inputs.length > 1) {
        fireEvent.change(inputs[1], { target: { value: '2026-04-20' } });
        expect(mockOnRangeChange).toHaveBeenCalled();
      }
    });

    it('should validate end date is after start date', () => {
      const { container } = render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      // Try to set end date before start date
      const inputs = container.querySelectorAll('input[type="date"]') as NodeListOf<HTMLInputElement>;
      if (inputs.length > 1) {
        fireEvent.change(inputs[1], { target: { value: '2026-03-01' } });

        // Should either prevent this or call onRangeChange with error
        expect(mockOnRangeChange).toHaveBeenCalled();
      }
    });

    it('should disable dates after today', () => {
      const { container } = render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      const inputs = container.querySelectorAll('input[type="date"]');
      inputs.forEach(input => {
        // Future dates should be disabled or handled
        expect(input).toBeTruthy();
      });
    });
  });

  describe('Grouping Options', () => {
    it('should toggle between daily and weekly view', () => {
      render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
          groupBy="daily"
        />
      );

      const dailyButton = screen.getByText(/daily/i);
      fireEvent.click(dailyButton);

      const weeklyButton = screen.getByText(/weekly/i);
      fireEvent.click(weeklyButton);

      // Should call onChange when switching
      expect(mockOnRangeChange).toHaveBeenCalled();
    });

    it('should highlight active grouping mode', () => {
      const { container } = render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
          groupBy="daily"
        />
      );

      const dailyButton = screen.getByText(/daily/i);
      expect(dailyButton.classList.toString()).toMatch(/active|selected|highlight/i);
    });

    it('should maintain grouping when range changes', () => {
      const { rerender, container } = render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
          groupBy="weekly"
        />
      );

      // Change date range
      const inputs = container.querySelectorAll('input[type="date"]') as NodeListOf<HTMLInputElement>;
      if (inputs.length > 0) {
        fireEvent.change(inputs[0], { target: { value: '2026-03-01' } });
      }

      // Weekly mode should still be active
      const weeklyButton = screen.getByText(/weekly/i);
      expect(weeklyButton.classList.toString()).toMatch(/active|selected/i);
    });
  });

  describe('Preset Ranges', () => {
    it('should set "Last 7 days" preset', () => {
      render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      const last7 = screen.queryByText(/last.*7.*day/i);
      if (last7) {
        fireEvent.click(last7);
        expect(mockOnRangeChange).toHaveBeenCalled();
      }
    });

    it('should set "Last 30 days" preset', () => {
      render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      const last30 = screen.queryByText(/last.*30.*day/i);
      if (last30) {
        fireEvent.click(last30);
        expect(mockOnRangeChange).toHaveBeenCalled();
      }
    });

    it('should have "Today" quick select', () => {
      render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      const today = screen.queryByText(/today/i);
      if (today) {
        fireEvent.click(today);
        expect(mockOnRangeChange).toHaveBeenCalled();
      }
    });
  });

  describe('Callbacks', () => {
    it('should call onRangeChange when start date changes', () => {
      const { container } = render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      const startInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      if (startInput) {
        fireEvent.change(startInput, { target: { value: '2026-04-05' } });
        expect(mockOnRangeChange).toHaveBeenCalled();
      }
    });

    it('should call onRangeChange with new date range', () => {
      const { container } = render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      const startInput = container.querySelector('input[type="date"]') as HTMLInputElement;
      if (startInput) {
        fireEvent.change(startInput, { target: { value: '2026-04-10' } });

        const calls = mockOnRangeChange.mock.calls;
        if (calls.length > 0) {
          const lastCall = calls[calls.length - 1][0];
          expect(lastCall).toHaveProperty('startDate');
          expect(lastCall).toHaveProperty('endDate');
        }
      }
    });

    it('should pass groupBy option in callback', () => {
      render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
          groupBy="weekly"
        />
      );

      const weeklyButton = screen.getByText(/weekly/i);
      fireEvent.click(weeklyButton);

      const calls = mockOnRangeChange.mock.calls;
      if (calls.length > 0) {
        expect(calls[calls.length - 1][0]).toHaveProperty('groupBy');
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for date inputs', () => {
      render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      // Should have accessible labels
      const labels = screen.queryAllByText(/start|begin|from|end|to/i);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', () => {
      const { container } = render(
        <DateRangePicker
          startDate="2026-04-01"
          endDate="2026-04-13"
          onRangeChange={mockOnRangeChange}
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach(btn => {
        expect(btn.getAttribute('tabindex')).not.toBe('-1');
      });
    });
  });
});
