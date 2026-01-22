
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { ScaffoldingService } from '../services/scaffolding';
import { ConfigService } from '../services/config';
import * as vscode from 'vscode';

// Mock vscode
jest.mock('vscode');

describe('ScaffoldingService', () => {
    let tempDir: string;
    let service: ScaffoldingService;

    beforeEach(async () => {
        tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'near-test-'));
        const context = { extensionPath: path.resolve(__dirname, '../../') } as vscode.ExtensionContext;
        const config = new ConfigService(context);
        // Mock getExtensionPath to return the real root so templates are found
        jest.spyOn(config, 'getExtensionPath').mockReturnValue(path.resolve(__dirname, '../../'));
        service = new ScaffoldingService(config);
    });

    afterEach(async () => {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
    });

    it('creates a new contract with expected files', async () => {
        const projectName = 'my-contract';
        const projectPath = await service.createNewContract(tempDir, projectName);

        expect(projectPath).toBe(path.join(tempDir, projectName));
        
        const cargoPath = path.join(projectPath, 'Cargo.toml');
        const libPath = path.join(projectPath, 'src', 'lib.rs');
        const deployPath = path.join(projectPath, 'scripts', 'deploy_testnet.sh');

        expect(fs.existsSync(cargoPath)).toBe(true);
        expect(fs.existsSync(libPath)).toBe(true);
        expect(fs.existsSync(deployPath)).toBe(true);

        const cargoContent = await fs.promises.readFile(cargoPath, 'utf8');
        expect(cargoContent).toContain('name = "my-contract"');

        const deployContent = await fs.promises.readFile(deployPath, 'utf8');
        expect(deployContent).toContain('NETWORK="testnet"');
    });
});
