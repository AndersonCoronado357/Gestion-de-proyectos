// Wrappers con state local para los componentes que en preview deben
// funcionar (Select, Checkbox, Switch, Input, Textarea, SearchInput,
// DateInput, ColorPicker). En modo EDITOR se renderean como readOnly
// (para no interferir con el drag/selección); en preview son totalmente
// funcionales y permiten al usuario probar la interacción.

import { useState, type ReactNode } from 'react';
import Select from '../../../shared/components/Select/index.js';
import Checkbox from '../../../shared/components/Checkbox/index.js';
import Switch from '../../../shared/components/Switch/index.js';
import Input from '../../../shared/components/Input/index.js';
import Textarea from '../../../shared/components/Textarea/index.js';
import SearchInput from '../../../shared/components/SearchInput/index.js';
import DateInput from '../../../shared/components/DateInput/index.js';
import ColorPicker from '../../../shared/components/ColorPicker/index.js';

interface SelectOpts {
  label?: ReactNode;
  placeholder?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  isEditing?: boolean;
}

export function InteractiveSelect({ label, placeholder, options, isEditing }: SelectOpts) {
  const [val, setVal] = useState<string | null>(null);
  if (isEditing) {
    return (
      <Select
        label={label}
        value={null}
        onChange={() => {}}
        options={options}
        placeholder={placeholder ?? 'Seleccionar'}
      />
    );
  }
  return (
    <Select
      label={label}
      value={val}
      onChange={(v) => setVal(v)}
      options={options}
      placeholder={placeholder ?? 'Seleccionar'}
    />
  );
}

interface CheckOpts {
  label?: ReactNode;
  initial?: boolean;
  isEditing?: boolean;
}

export function InteractiveCheckbox({ label, initial, isEditing }: CheckOpts) {
  const [checked, setChecked] = useState(!!initial);
  return (
    <Checkbox
      checked={checked}
      onChange={(v) => {
        if (isEditing) return;
        setChecked(v);
      }}
      label={label}
    />
  );
}

interface SwitchOpts {
  label?: ReactNode;
  options: ReadonlyArray<{ value: string; label: string }>;
  initial?: string;
  isEditing?: boolean;
}

export function InteractiveSwitch({ label, options, initial, isEditing }: SwitchOpts) {
  const [val, setVal] = useState<string>(initial ?? options[0]?.value ?? '');
  return (
    <Switch
      label={label}
      options={options}
      value={val}
      onChange={(v) => {
        if (isEditing) return;
        setVal(v);
      }}
      className="w-full"
    />
  );
}

// ── Wrappers de Input / Textarea / Search / Date / Color ──

interface InputOpts {
  label?: ReactNode;
  placeholder?: string;
  isEditing?: boolean;
}

export function InteractiveInput({ label, placeholder, isEditing }: InputOpts) {
  const [val, setVal] = useState('');
  if (isEditing) {
    return (
      <Input
        label={label}
        placeholder={placeholder}
        readOnly
        value=""
        onChange={() => {}}
      />
    );
  }
  return (
    <Input
      label={label}
      placeholder={placeholder}
      value={val}
      onChange={(e) => setVal(e.target.value)}
    />
  );
}

interface TextareaOpts {
  label?: ReactNode;
  placeholder?: string;
  isEditing?: boolean;
  wrapperClassName?: string;
  className?: string;
}

export function InteractiveTextarea({
  label,
  placeholder,
  isEditing,
  wrapperClassName,
  className
}: TextareaOpts) {
  const [val, setVal] = useState('');
  if (isEditing) {
    return (
      <Textarea
        label={label}
        placeholder={placeholder}
        readOnly
        value=""
        onChange={() => {}}
        wrapperClassName={wrapperClassName}
        className={className}
      />
    );
  }
  return (
    <Textarea
      label={label}
      placeholder={placeholder}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      wrapperClassName={wrapperClassName}
      className={className}
    />
  );
}

interface SearchOpts {
  placeholder?: string;
  isEditing?: boolean;
}

export function InteractiveSearch({ placeholder, isEditing }: SearchOpts) {
  const [val, setVal] = useState('');
  if (isEditing) {
    return <SearchInput value="" onChange={() => {}} placeholder={placeholder} />;
  }
  return (
    <SearchInput
      value={val}
      onChange={(e) => setVal(e.target.value)}
      placeholder={placeholder}
    />
  );
}

interface DateOpts {
  label?: ReactNode;
  isEditing?: boolean;
}

export function InteractiveDate({ label, isEditing }: DateOpts) {
  const [val, setVal] = useState<Date | null>(null);
  if (isEditing) {
    return <DateInput label={label} value={null} onChange={() => {}} />;
  }
  return <DateInput label={label} value={val} onChange={(v) => setVal(v)} />;
}

interface ColorOpts {
  initial?: string;
  isEditing?: boolean;
}

export function InteractiveColor({ initial, isEditing }: ColorOpts) {
  const [val, setVal] = useState(initial ?? '#295072');
  if (isEditing) {
    return (
      <ColorPicker value={initial ?? '#295072'} onChange={() => {}} showScale={false} />
    );
  }
  return <ColorPicker value={val} onChange={(v) => setVal(v)} showScale={false} />;
}
