import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  CLI,
  CommandSchema,
  CommandGroup,
  CommandFormValues,
  CommandOutputChunk,
} from '../types/command';
import { fetchCommandGroups, getCommandWebSocketUrl } from '../api/commands';

interface OutputLine {
  id: string;
  type: 'stdout' | 'stderr' | 'system';
  content: string;
  timestamp: Date;
}

interface CommandState {
  // CLI and command selection
  selectedCli: CLI;
  commandGroups: CommandGroup[];
  selectedCommand: CommandSchema | null;

  // Form state
  formValues: CommandFormValues;

  // Output state
  output: OutputLine[];
  executing: boolean;
  exitCode: number | null;

  // Loading states
  loading: boolean;
  error: string | null;

  // WebSocket connection
  ws: WebSocket | null;

  // Actions
  setSelectedCli: (cli: CLI) => void;
  setSelectedCommand: (command: CommandSchema | null) => void;
  setFormValue: (name: string, value: unknown) => void;
  setFormValues: (values: CommandFormValues) => void;
  clearForm: () => void;
  fetchCommands: () => Promise<void>;

  // Command execution
  executeCommand: () => void;
  cancelExecution: () => void;
  appendOutput: (chunk: OutputLine) => void;
  clearOutput: () => void;

  // Utility
  getCommandString: () => string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useCommandStore = create<CommandState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    selectedCli: 'filings',
    commandGroups: [],
    selectedCommand: null,
    formValues: {},
    output: [],
    executing: false,
    exitCode: null,
    loading: false,
    error: null,
    ws: null,

    // Actions
    setSelectedCli: (cli) => {
      set({ selectedCli: cli, selectedCommand: null, formValues: {} });
      get().fetchCommands();
    },

    setSelectedCommand: (command) => {
      // Initialize form values with defaults
      const formValues: CommandFormValues = {};
      if (command) {
        // Set defaults for options
        command.options.forEach((opt) => {
          if (opt.default !== undefined) {
            formValues[opt.name] = opt.default;
          } else if (opt.type === 'flag') {
            formValues[opt.name] = false;
          } else if (opt.type === 'multi_select') {
            formValues[opt.name] = [];
          }
        });
      }
      set({ selectedCommand: command, formValues, exitCode: null });
    },

    setFormValue: (name, value) => {
      set((state) => ({
        formValues: { ...state.formValues, [name]: value },
      }));
    },

    setFormValues: (values) => {
      set({ formValues: values });
    },

    clearForm: () => {
      const { selectedCommand } = get();
      if (selectedCommand) {
        get().setSelectedCommand(selectedCommand);
      } else {
        set({ formValues: {} });
      }
    },

    fetchCommands: async () => {
      const { selectedCli } = get();
      set({ loading: true, error: null });

      try {
        const groups = await fetchCommandGroups(selectedCli);
        set({ commandGroups: groups, loading: false });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to fetch commands';
        set({ error: message, loading: false });
      }
    },

    executeCommand: () => {
      const { selectedCli, selectedCommand, formValues, ws: existingWs } = get();

      if (!selectedCommand) {
        return;
      }

      // Close existing connection
      if (existingWs) {
        existingWs.close();
      }

      // Clear previous output
      set({ output: [], executing: true, exitCode: null, error: null });

      // Build the command payload
      const args: string[] = [];
      const options: Record<string, unknown> = {};

      // Collect arguments in order
      selectedCommand.arguments.forEach((arg) => {
        const value = formValues[arg.name];
        if (value !== undefined && value !== '' && value !== null) {
          args.push(String(value));
        }
      });

      // Collect options
      selectedCommand.options.forEach((opt) => {
        const value = formValues[opt.name];
        if (value !== undefined && value !== null) {
          // Skip false flags and empty values
          if (opt.type === 'flag' && value === false) {
            return;
          }
          if (value === '' || (Array.isArray(value) && value.length === 0)) {
            return;
          }
          options[opt.name] = value;
        }
      });

      const payload = {
        cli: selectedCli,
        command: selectedCommand.name,
        args,
        options,
      };

      // Connect via WebSocket
      const wsUrl = getCommandWebSocketUrl();
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        get().appendOutput({
          id: generateId(),
          type: 'system',
          content: `Executing: ${get().getCommandString()}`,
          timestamp: new Date(),
        });
        ws.send(JSON.stringify(payload));
      };

      ws.onmessage = (event) => {
        try {
          const data: CommandOutputChunk = JSON.parse(event.data);

          if (data.type === 'exit') {
            set({ executing: false, exitCode: data.exitCode ?? null });
            get().appendOutput({
              id: generateId(),
              type: 'system',
              content: `Process exited with code ${data.exitCode}`,
              timestamp: new Date(),
            });
            ws.close();
          } else if (data.data) {
            get().appendOutput({
              id: generateId(),
              type: data.type === 'stderr' ? 'stderr' : 'stdout',
              content: data.data,
              timestamp: new Date(),
            });
          }
        } catch {
          // Handle non-JSON messages
          get().appendOutput({
            id: generateId(),
            type: 'stdout',
            content: event.data,
            timestamp: new Date(),
          });
        }
      };

      ws.onerror = () => {
        set({ executing: false, error: 'WebSocket connection error' });
        get().appendOutput({
          id: generateId(),
          type: 'stderr',
          content: 'Connection error occurred',
          timestamp: new Date(),
        });
      };

      ws.onclose = () => {
        set((state) => ({
          ws: null,
          executing: state.exitCode === null ? false : state.executing,
        }));
      };

      set({ ws });
    },

    cancelExecution: () => {
      const { ws } = get();
      if (ws) {
        ws.close();
      }
      set({ executing: false, ws: null });
      get().appendOutput({
        id: generateId(),
        type: 'system',
        content: 'Execution cancelled',
        timestamp: new Date(),
      });
    },

    appendOutput: (chunk) => {
      set((state) => ({
        output: [...state.output, chunk],
      }));
    },

    clearOutput: () => {
      set({ output: [], exitCode: null });
    },

    getCommandString: () => {
      const { selectedCli, selectedCommand, formValues } = get();
      if (!selectedCommand) {
        return '';
      }

      const parts: string[] = [selectedCli, selectedCommand.name];

      // Add arguments
      selectedCommand.arguments.forEach((arg) => {
        const value = formValues[arg.name];
        if (value !== undefined && value !== '' && value !== null) {
          parts.push(String(value));
        }
      });

      // Add options
      selectedCommand.options.forEach((opt) => {
        const value = formValues[opt.name];
        if (value === undefined || value === null) return;

        if (opt.type === 'flag') {
          if (value === true) {
            parts.push(`--${opt.name}`);
          }
        } else if (Array.isArray(value)) {
          value.forEach((v) => {
            parts.push(`--${opt.name}`, String(v));
          });
        } else if (value !== '' && value !== opt.default) {
          parts.push(`--${opt.name}`, String(value));
        }
      });

      return parts.join(' ');
    },
  }))
);

// Initialize commands on store creation
useCommandStore.getState().fetchCommands();
