import { useState } from 'react';
import Input from '../../../../shared/components/Input/index.js';
import Button from '../../../../shared/components/Button/index.js';

export interface Anderson2FormValue {
  name: string;
  description: string;
}

export interface Anderson2FormProps {
  initial?: Partial<Anderson2FormValue>;
  onSubmit?: (value: Anderson2FormValue) => void;
}

export default function Anderson2Form({
  initial = {},
  onSubmit
}: Anderson2FormProps) {
  const [name, setName] = useState(initial.name || '');
  const [description, setDescription] = useState(initial.description || '');

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.({ name, description });
      }}
    >
      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <Button type="submit">Save</Button>
    </form>
  );
}
