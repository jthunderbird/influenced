import './QuantitySelector.css';

export default function QuantitySelector({ value, onChange, min = 1, max = 99, disabled = false }) {
  const handleDecrement = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };

  const handleChange = (e) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="quantity-selector">
      <button
        type="button"
        className="quantity-btn"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        -
      </button>
      <input
        type="number"
        className="quantity-input"
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        disabled={disabled}
      />
      <button
        type="button"
        className="quantity-btn"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
