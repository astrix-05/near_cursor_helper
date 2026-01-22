
import { BuildService } from '../services/build';
import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { Readable, Writable } from 'stream';
import { spawn } from 'child_process';

// Mock vscode
jest.mock('vscode');

// Mock child_process
jest.mock('child_process', () => ({
    spawn: jest.fn()
}));

const mockSpawn = spawn as jest.Mock;

describe('BuildService', () => {
    let service: BuildService;
    let mockOutputChannel: any;

    beforeEach(() => {
        mockOutputChannel = {
            append: jest.fn(),
            appendLine: jest.fn(),
            show: jest.fn(),
        };
        service = new BuildService(mockOutputChannel);
        mockSpawn.mockClear();
    });

    it('handles successful build', async () => {
        const mockChild = new EventEmitter() as any;
        mockChild.stdout = new EventEmitter();
        mockChild.stderr = new EventEmitter();
        mockSpawn.mockReturnValue(mockChild);

        const buildPromise = service.buildContract('/tmp/project');

        // Simulate JSON output from cargo
        const artifactMsg = JSON.stringify({
            reason: "compiler-artifact",
            target: { kind: ["cdylib"] },
            filenames: ["/tmp/project/target/wasm32-unknown-unknown/release/my_contract.wasm"]
        });
        
        mockChild.stdout.emit('data', Buffer.from(artifactMsg + '\n'));
        
        // Simulate exit
        setTimeout(() => {
            mockChild.emit('close', 0);
        }, 10);

        const result = await buildPromise;

        expect(result.success).toBe(true);
        expect(result.artifactPath).toContain('my_contract.wasm');
        expect(mockSpawn).toHaveBeenCalledWith(
            'cargo',
            expect.arrayContaining(['build', '--target', 'wasm32-unknown-unknown']),
            expect.any(Object)
        );
    });

    it('handles failing build', async () => {
        const mockChild = new EventEmitter() as any;
        mockChild.stdout = new EventEmitter();
        mockChild.stderr = new EventEmitter();
        mockSpawn.mockReturnValue(mockChild);

        const buildPromise = service.buildContract('/tmp/project');

        // Simulate error output
        const errorMsg = JSON.stringify({
            reason: "compiler-message",
            message: {
                level: "error",
                message: "syntax error",
                spans: []
            }
        });
        
        mockChild.stdout.emit('data', Buffer.from(errorMsg + '\n'));
        
        // Simulate exit failure
        setTimeout(() => {
            mockChild.emit('close', 101);
        }, 10);

        const result = await buildPromise;

        expect(result.success).toBe(false);
        expect(result.diagnosticsMap).toBeDefined();
    });
});
