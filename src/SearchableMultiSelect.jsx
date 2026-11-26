import { useId, useMemo, useState } from 'react';
import { filterOptions, toggleSelection } from './multi-select-data.js';

export default function SearchableMultiSelect({
  options,
  label,
  hint,
  value,
  onChange,
  emptyMessage,
  searchLabel,
  searchPlaceholder,
  singularLabel,
  pluralLabel,
  emptySelectionMessage,
  selectedListLabel,
}) {
  const id = useId();
  const [query, setQuery] = useState('');
  const searchId = `multi-select-search-${id}`;
  const labelId = `multi-select-label-${id}`;
  const hintId = `multi-select-hint-${id}`;
  const optionsId = `multi-select-options-${id}`;
  const selectedIds = Array.isArray(value) ? value.map(String) : [];
  const selectedSet = new Set(selectedIds);
  const optionById = useMemo(() => new Map(options.map((option) => [String(option.id), option])), [options]);
  const filteredOptions = useMemo(() => filterOptions(options, query), [options, query]);
  const selectedOptions = selectedIds.map((optionId) => optionById.get(optionId) ?? {
    id: optionId,
    label: `Opção ${optionId}`,
    detail: '',
  });

  function updateSelection(optionId, checked) {
    onChange(toggleSelection(selectedIds, optionId, checked));
  }

  return (
    <div className="field search-picker-field span2">
      <span id={labelId}>{label}</span>
      <div className="search-picker">
        <label className="sr-only" htmlFor={searchId}>{searchLabel}</label>
        <input
          id={searchId}
          className="search-picker__search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          autoComplete="off"
          aria-controls={optionsId}
        />

        <div className="search-picker__selection-bar">
          <p role="status" aria-live="polite">
            {selectedOptions.length === 0
              ? emptySelectionMessage
              : `${selectedOptions.length} ${selectedOptions.length === 1 ? singularLabel : pluralLabel} selecionada${selectedOptions.length === 1 ? '' : 's'}`}
          </p>
          {selectedOptions.length > 0 && (
            <button type="button" className="ghost search-picker__clear" onClick={() => onChange([])}>
              Limpar seleção
            </button>
          )}
        </div>

        {selectedOptions.length > 0 && (
          <ul className="search-picker__selected" aria-label={selectedListLabel}>
            {selectedOptions.map((option) => {
              const optionId = String(option.id);
              const name = `${option.label}${option.detail ? ` · ${option.detail}` : ''}`;
              return (
                <li className="search-picker__chip" key={optionId}>
                  <span>{name}</span>
                  <button
                    type="button"
                    className="search-picker__remove"
                    aria-label={`Remover ${name}`}
                    onClick={() => updateSelection(optionId, false)}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="search-picker__options">
          <fieldset id={optionsId} aria-labelledby={labelId} aria-describedby={hintId}>
            <legend className="sr-only">Opções disponíveis</legend>
            {options.length === 0 ? (
              <p className="search-picker__message" role="status">{emptyMessage}</p>
            ) : filteredOptions.length === 0 ? (
              <p className="search-picker__message" role="status">Nenhuma opção encontrada para essa busca.</p>
            ) : filteredOptions.map((option) => {
              const optionId = String(option.id);
              return (
                <label className="search-picker__option" key={optionId}>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(optionId)}
                    onChange={(event) => updateSelection(optionId, event.target.checked)}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    {option.detail && <small>{option.detail}</small>}
                  </span>
                </label>
              );
            })}
          </fieldset>
        </div>
      </div>
      <small id={hintId}>{hint}</small>
    </div>
  );
}
