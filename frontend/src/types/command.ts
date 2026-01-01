export type OptionType =
  | 'text'
  | 'integer'
  | 'float'
  | 'date'
  | 'flag'
  | 'select'
  | 'multi_select'
  | 'ticker'
  | 'path';

export interface Argument {
  name: string;
  required: boolean;
  description: string;
}

export interface Option {
  name: string;
  short?: string;
  type: OptionType;
  choices?: string[];
  default?: unknown;
  description: string;
}

export interface CommandSchema {
  name: string;
  description: string;
  group: string;
  arguments: Argument[];
  options: Option[];
}

export interface CommandGroup {
  name: string;
  commands: CommandSchema[];
}

export type CLI = 'filings' | 'transcripts';

export interface CommandFormValues {
  [key: string]: unknown;
}

export interface ExecuteCommandPayload {
  cli: CLI;
  command: string;
  args: string[];
  options: Record<string, unknown>;
}

export interface CommandOutputChunk {
  type: 'stdout' | 'stderr' | 'exit';
  data?: string;
  exitCode?: number;
}
