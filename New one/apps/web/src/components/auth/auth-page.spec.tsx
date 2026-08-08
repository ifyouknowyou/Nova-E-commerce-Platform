import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthShell, Field, ErrorBanner, SubmitButton } from './auth-page';

describe('auth primitives (a11y + forms)', () => {
  it('renders an accessible labelled field', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState('');
      return <Field label="Email" type="email" value={value} onChange={(v) => setValue(v)} autoComplete="email" />;
    }
    render(<Harness />);
    const input = screen.getByLabelText('Email');
    await user.type(input, 'a@b.co');
    expect(input).toHaveValue('a@b.co');
  });

  it('renders an alert role for the error banner', () => {
    render(<ErrorBanner message="Invalid credentials" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
  });

  it('renders nothing for an empty error banner', () => {
    render(<ErrorBanner message={null} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('disables the submit button and shows a busy label', () => {
    render(<SubmitButton busy>Sign in</SubmitButton>);
    const button = screen.getByRole('button', { name: 'Please wait…' });
    expect(button).toBeDisabled();
  });

  it('renders an AuthShell with heading and subtitle', () => {
    render(<AuthShell title="Welcome back" subtitle="Log in to continue"><p>form</p></AuthShell>);
    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByText('Log in to continue')).toBeInTheDocument();
  });
});