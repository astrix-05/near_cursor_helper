// @ts-nocheck
const config = {
    get: jest.fn((key) => {
        if (key === 'networkId') return 'testnet';
        if (key === 'accountId') return 'test.testnet';
        return undefined;
    }),
};

export const workspace = {
  getConfiguration: jest.fn().mockReturnValue(config),
  workspaceFolders: [{ uri: { fsPath: '/tmp/workspace' } }],
};

export const window = {
  createOutputChannel: jest.fn().mockReturnValue({
    append: jest.fn(),
    appendLine: jest.fn(),
    show: jest.fn(),
    clear: jest.fn(),
  }),
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  showInputBox: jest.fn(),
};

export const DiagnosticSeverity = {
  Error: 0,
  Warning: 1,
  Information: 2,
  Hint: 3,
};

export class Range {
    constructor(startLine, startChar, endLine, endChar) {
        this.start = new Position(startLine, startChar);
        this.end = new Position(endLine, endChar);
    }
}

export class Position {
    constructor(line, char) {
        this.line = line;
        this.character = char;
    }
}

export class Diagnostic {
    constructor(range, message, severity) {
        this.range = range;
        this.message = message;
        this.severity = severity;
    }
}

export const Uri = { file: jest.fn((f) => ({ fsPath: f, toString: () => f })) };

export const commands = {
    registerCommand: jest.fn(),
};

export const languages = {
    createDiagnosticCollection: jest.fn().mockReturnValue({
        clear: jest.fn(),
        set: jest.fn(),
    }),
};

export const ExtensionContext = jest.fn();
