import * as path from "path";
import { promises as fs } from "fs";
import { ConfigService } from "./config";

export class ScaffoldingService {
  constructor(private config: ConfigService) {}

  async createNewContract(baseDir: string, name: string): Promise<string> {
    const projectDir = path.join(baseDir, name);
    
    // Check if directory exists
    try {
      await fs.access(projectDir);
      throw new Error(`Folder ${name} already exists`);
    } catch (e: any) {
      if (e.code !== "ENOENT") throw e;
    }

    // Create directories
    await fs.mkdir(path.join(projectDir, "src"), { recursive: true });
    await fs.mkdir(path.join(projectDir, "scripts"), { recursive: true });
    
    // Read and process templates
    const extPath = this.config.getExtensionPath();
    const cargo = await this.readTemplateFile(extPath, "Cargo.toml");
    const lib = await this.readTemplateFile(extPath, path.join("src", "lib.rs"));
    const build = await this.readTemplateFile(extPath, path.join("scripts", "build.sh"));
    // Add deploy script template
    const deploy = await this.readTemplateFile(extPath, path.join("scripts", "deploy_testnet.sh"));

    // Get default config values to inject
    const networkId = this.config.getNetworkId();
    const accountId = this.config.getAccountId() || "your-account.testnet";

    // Replace placeholders
    const cargoOut = cargo.replace(/\{\{crate_name\}\}/g, name);
    const libOut = lib.replace(/\{\{crate_name\}\}/g, name);
    // Inject crate name AND network/account settings into deploy script
    const deployOut = deploy
        .replace(/\{\{crate_name\}\}/g, name)
        .replace(/testnet/g, networkId) // simplistic replacement, but effective for the template default
        .replace(/your-account.testnet/g, accountId);
    
    // Write files
    await this.writeFile(path.join(projectDir, "Cargo.toml"), cargoOut);
    await this.writeFile(path.join(projectDir, "src", "lib.rs"), libOut);
    await this.writeFile(path.join(projectDir, "scripts", "build.sh"), build);
    await this.writeFile(path.join(projectDir, "scripts", "deploy_testnet.sh"), deployOut);

    // Make scripts executable
    await fs.chmod(path.join(projectDir, "scripts", "build.sh"), 0o755);
    await fs.chmod(path.join(projectDir, "scripts", "deploy_testnet.sh"), 0o755);

    return projectDir;
  }

  private async readTemplateFile(extPath: string, rel: string): Promise<string> {
    const full = path.join(extPath, "src", "templates", "rust-contract", rel);
    return fs.readFile(full, "utf8");
  }

  private async writeFile(filePath: string, content: string) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, { encoding: "utf8" });
  }
}
