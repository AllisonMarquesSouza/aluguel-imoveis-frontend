import { useId, useMemo, useState } from 'react';
import { filterCities, toggleCitySelection } from './city-selection.js';

export default function CityMultiSelect({ cities, label, hint, value, onChange, emptyMessage }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const searchId = `city-search-${id}`;
  const labelId = `city-label-${id}`;
  const hintId = `city-hint-${id}`;
  const optionsId = `city-options-${id}`;
  const selectedIds = Array.isArray(value) ? value.map(String) : [];
  const selectedSet = new Set(selectedIds);
  const cityById = useMemo(() => new Map(cities.map((city) => [String(city.id), city])), [cities]);
  const filteredCities = useMemo(() => filterCities(cities, query), [cities, query]);
  const selectedCities = selectedIds.map((cityId) => cityById.get(cityId) ?? {
    id: cityId,
    nome: `Cidade ${cityId}`,
    uf: '',
  });

  function updateSelection(cityId, checked) {
    onChange(toggleCitySelection(selectedIds, cityId, checked));
  }

  return (
    <div className="field city-picker-field span2">
      <span id={labelId}>{label}</span>
      <div className="city-picker">
        <label className="sr-only" htmlFor={searchId}>Buscar cidade por nome ou UF</label>
        <input
          id={searchId}
          className="city-picker__search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar cidade ou UF"
          autoComplete="off"
          aria-controls={optionsId}
        />

        <div className="city-picker__selection-bar">
          <p role="status" aria-live="polite">
            {selectedCities.length === 0
              ? 'Nenhuma cidade selecionada'
              : `${selectedCities.length} ${selectedCities.length === 1 ? 'cidade selecionada' : 'cidades selecionadas'}`}
          </p>
          {selectedCities.length > 0 && (
            <button type="button" className="ghost city-picker__clear" onClick={() => onChange([])}>
              Limpar seleção
            </button>
          )}
        </div>

        {selectedCities.length > 0 ? (
          <ul className="city-picker__selected" aria-label="Cidades selecionadas">
            {selectedCities.map((city) => {
              const cityId = String(city.id);
              const name = `${city.nome}${city.uf ? ` · ${city.uf}` : ''}`;
              return (
                <li className="city-picker__chip" key={cityId}>
                  <span>{name}</span>
                  <button
                    type="button"
                    className="city-picker__remove"
                    aria-label={`Remover ${name}`}
                    onClick={() => updateSelection(cityId, false)}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="city-picker__empty-selected">As cidades escolhidas aparecerão aqui.</p>
        )}

        <div className="city-picker__options">
          <fieldset id={optionsId} aria-labelledby={labelId} aria-describedby={hintId}>
            <legend className="sr-only">Opções de cidade</legend>
            {cities.length === 0 ? (
              <p className="city-picker__message" role="status">{emptyMessage}</p>
            ) : filteredCities.length === 0 ? (
              <p className="city-picker__message" role="status">Nenhuma cidade encontrada para essa busca.</p>
            ) : filteredCities.map((city) => {
              const cityId = String(city.id);
              return (
                <label className="city-picker__option" key={cityId}>
                  <input
                    type="checkbox"
                    checked={selectedSet.has(cityId)}
                    onChange={(event) => updateSelection(cityId, event.target.checked)}
                  />
                  <span>
                    <strong>{city.nome}</strong>
                    <small>{city.uf}</small>
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
