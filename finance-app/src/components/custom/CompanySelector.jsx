import { useState } from 'react';
import { TICKERS } from '../../constants/tickers.js';
import { normalizeSymbol, isValidSymbol } from '../../utils/symbols.js';
import styles from './CompanySelector.module.css';

/**
 * CompanySelector
 *
 * One line of instruction, a ticker input and a Load button. Validates the
 * format (1–5 uppercase letters) and reports a valid symbol through
 * `onSubmit`; it holds no global state.
 *
 * Props:
 *   onSubmit  {(symbol: string) => void}  - called with a valid, normalised symbol
 */
export default function CompanySelector({ onSubmit }) {
  const [input, setInput] = useState('');
  const [formError, setFormError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const next = normalizeSymbol(input);
    if (!isValidSymbol(next)) {
      setFormError('Enter a ticker of 1–5 letters, for example NVDA.');
      return;
    }
    setFormError(null);
    setInput(next);
    onSubmit(next);
  };

  return (
    <div>
      <p id="custom-symbol-help" className={styles.help}>
        Enter a ticker symbol to load that company&apos;s quote and 30-day price chart.
      </p>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <input
          id="custom-symbol"
          aria-label="Ticker symbol"
          aria-describedby="custom-symbol-help"
          list="custom-symbol-options"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. NVDA"
          maxLength={8}
          autoComplete="off"
          className={styles.input}
          aria-invalid={Boolean(formError)}
        />
        <datalist id="custom-symbol-options">
          {TICKERS.map(({ symbol, name }) => (
            <option key={symbol} value={symbol}>{name}</option>
          ))}
        </datalist>
        <button type="submit" className={styles.submit}>Load</button>
      </form>
      {formError && <div role="alert" className={styles.error}>{formError}</div>}
    </div>
  );
}
