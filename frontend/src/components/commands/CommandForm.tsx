import { useCommandStore } from '../../store/commandStore';
import type { Argument, Option } from '../../types/command';
import { CommandPreview } from './CommandPreview';
import { TextField } from './fields/TextField';
import { NumberField } from './fields/NumberField';
import { DateField } from './fields/DateField';
import { CheckboxField } from './fields/CheckboxField';
import { SelectField } from './fields/SelectField';
import { MultiSelectField } from './fields/MultiSelectField';
import { TickerField } from './fields/TickerField';

function PlayIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

interface ArgumentFieldProps {
  argument: Argument;
  value: unknown;
  onChange: (value: unknown) => void;
}

function ArgumentField({ argument, value, onChange }: ArgumentFieldProps) {
  return (
    <TextField
      label={argument.name}
      value={String(value ?? '')}
      onChange={(v) => onChange(v)}
      placeholder={argument.description}
      required={argument.required}
      description={argument.description}
    />
  );
}

interface OptionFieldProps {
  option: Option;
  value: unknown;
  onChange: (value: unknown) => void;
}

function OptionField({ option, value, onChange }: OptionFieldProps) {
  switch (option.type) {
    case 'text':
    case 'path':
      return (
        <TextField
          label={option.name}
          value={String(value ?? '')}
          onChange={onChange}
          placeholder={option.description}
          description={option.description}
        />
      );

    case 'integer':
      return (
        <NumberField
          label={option.name}
          value={value as number | undefined}
          onChange={onChange}
          integer
          description={option.description}
        />
      );

    case 'float':
      return (
        <NumberField
          label={option.name}
          value={value as number | undefined}
          onChange={onChange}
          description={option.description}
        />
      );

    case 'date':
      return (
        <DateField
          label={option.name}
          value={value as string | undefined}
          onChange={onChange}
          description={option.description}
        />
      );

    case 'flag':
      return (
        <CheckboxField
          label={option.name}
          checked={Boolean(value)}
          onChange={onChange}
          description={option.description}
        />
      );

    case 'select':
      return (
        <SelectField
          label={option.name}
          value={String(value ?? '')}
          onChange={onChange}
          options={option.choices ?? []}
          description={option.description}
        />
      );

    case 'multi_select':
      return (
        <MultiSelectField
          label={option.name}
          value={(value as string[]) ?? []}
          onChange={onChange}
          options={option.choices ?? []}
          description={option.description}
        />
      );

    case 'ticker':
      return (
        <TickerField
          label={option.name}
          value={String(value ?? '')}
          onChange={onChange}
          description={option.description}
        />
      );

    default:
      return (
        <TextField
          label={option.name}
          value={String(value ?? '')}
          onChange={onChange}
          placeholder={option.description}
          description={option.description}
        />
      );
  }
}

export function CommandForm() {
  const {
    selectedCommand,
    formValues,
    setFormValue,
    clearForm,
    executeCommand,
    cancelExecution,
    executing,
  } = useCommandStore();

  if (!selectedCommand) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-secondary">Select a command from the list</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommand();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Command header */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          {selectedCommand.name}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {selectedCommand.description}
        </p>
      </div>

      {/* Arguments section */}
      {selectedCommand.arguments.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
            Arguments
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {selectedCommand.arguments.map((arg) => (
              <ArgumentField
                key={arg.name}
                argument={arg}
                value={formValues[arg.name]}
                onChange={(value) => setFormValue(arg.name, value)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Options section */}
      {selectedCommand.options.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-text-secondary">
            Options
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {selectedCommand.options.map((opt) => (
              <OptionField
                key={opt.name}
                option={opt}
                value={formValues[opt.name]}
                onChange={(value) => setFormValue(opt.name, value)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Command preview */}
      <CommandPreview />

      {/* Action buttons */}
      <div className="flex gap-3">
        {executing ? (
          <button
            type="button"
            onClick={cancelExecution}
            className="flex items-center gap-2 rounded-md bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-error/80"
          >
            <StopIcon />
            Cancel
          </button>
        ) : (
          <button
            type="submit"
            className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/80"
          >
            <PlayIcon />
            Run Command
          </button>
        )}

        <button
          type="button"
          onClick={clearForm}
          disabled={executing}
          className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-border disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshIcon />
          Reset
        </button>
      </div>
    </form>
  );
}

export default CommandForm;
