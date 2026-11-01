import { useState } from 'react';
import { TICKERS } from '../../constants/tickers.js';
import useDashboardStore from '../../store/dashboardStore.js';
import { normalizeSymbol, isValidSymbol } from '../../utils/symbols.js';
import styles from './CompanySelector.module.css';

/**
 * CompanySelector
 *
 * Ticker input for the custom-company panel. Validates the format, then
 * stores the symbol; fetching and no-data handling live in CustomSymbolPanel.
 */
export default function CompanySelector() {
  const customSymbol    = useDashboardStore((s) => s.customSymbol);
  const setCustomSymbol = useDashboardStore((s) => s.setCustomSymbol);
  const [input, setInput] = useState(customSymbol ?? '');
  const [formError, setFormError] = useState(null);

  const onSubmit = (e) => {
    e.preventDefault();
    const next = normalizeSymbol(input);
    if (!isValidSymbol(next)) {
      setFormError('Enter a valid ticker symbol (letters, digits, "." or "-", up to 10 characters).');
      return;
    }
    setFormError(null);
    setInput(next);
    setCustomSymbol(next);
  };

  return (
    <div>
      <form onSubmit={onSubmit} className={styles.form} noValidate>
        <label htmlFor="custom-symbol" className={styles.label}>Compare a company with IBM</label>
        <input
          id="custom-symbol"
          list="custom-symbol-options"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. NVDA"
          maxLength={11}
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
      </form>
      {formError && <div role="alert" className={styles.error}>{formError}</div>}
    </div>
  );
}
