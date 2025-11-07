import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

/**
 * Custom render function that wraps component with Router and Theme providers
 * @param {ReactElement} ui - Component to render
 * @param {object} options - Render options
 * @param {string[]} options.initialEntries - Initial router entries (default: ['/'])
 * @param {string} options.initialIndex - Initial router index
 * @returns {RenderResult} React Testing Library render result
 */
export function renderWithRouter(ui, {
  initialEntries = ['/'],
  initialIndex = 0,
  ...renderOptions
} = {}) {
  function Wrapper({ children }) {
    return (
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
          {children}
        </MemoryRouter>
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Intentionally only export helpers to avoid re-exporting non-component symbols
// (re-exports can trigger react-refresh/only-export-components ESLint rule).
