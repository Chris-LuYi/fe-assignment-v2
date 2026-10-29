import { Search, X } from 'lucide-react'

interface SearchInputProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  id: string
}

export function SearchInput({ label, placeholder, value, onChange, id }: SearchInputProps) {
  return (
    <div className="search">
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <Search aria-hidden="true" size={18} className="search__icon" />
      <input
        id={id}
        type="search"
        className="input search__input"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="search__clear"
          aria-label="Clear search text"
          onClick={() => onChange('')}
        >
          <X aria-hidden="true" size={18} />
        </button>
      )}
    </div>
  )
}
