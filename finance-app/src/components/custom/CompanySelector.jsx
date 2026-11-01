import { useState } from 'react';
import { TICKERS } from '../../constants/tickers.js';
import { normalizeSymbol, isValidSymbol } from '../../utils/symbols.js';
import styles from './CompanySelector.module.css';

/**
 * CompanySelector
 *
 * Ticker input for the custom-company panel. Validates the format (1–5
 * uppercase letters) and reports the result through callbacks; it holds no
 * global state itself.
 *
 * Props:
 *   onSubmit  {(symbol: string) => void}  - called with a valid, normalised symbol
 *   onClear   {() => void}                - called when the Clear button is pressed
 *   value     {string|null}               - currently selected symbol (shows Clear when set)
 */
export default function CompanySelector({ onSubmit, onClear, value = null }) {
  const [input, setInput] = useState(value ?? '');
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

  const handleClear = () => {
    setInput('');
    setFormError(null);
    onClear();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <label htmlFor="custom-symbol" className={styles.label}>Compare a company with IBM</label>
        <input
          id="custom-symbol"
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
        <button type="submit" className={styles.submit}>Compare</button>
        {value && (
          <button type="button" onClick={handleClear} className={styles.clear}>Clear</button>
        )}
      </form>
      {formError && <div role="alert" className={styles.error}>{formError}</div>}
    </div>
  );
}
