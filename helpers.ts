import type { ChalkInstance } from "npm:chalk@5.3.0";
import chalk from "npm:chalk@5.3.0";
import * as emoji from "npm:node-emoji@2.1.3";
import unzipper from "npm:unzipper@^0.12.3";
import * as git from "npm:simple-git@3.27.0"

export interface IcliOptions {
  appName: string;
  appCode: string;
  domainName: string;
}

/**
 * 
 * @param cmd A command like 'npx' or 'git', we assume the package is already installed.
 * @param args Arguments for the command
 * @param cwd Current working directory, default is Deno.cwd()
 * @returns success: boolean, cp: Deno.ChildProcess
 * @example const { success, cp } = await spawner('npx', ['create-react-app', 'my-app'], Deno.cwd());
 */
export async function spawner(
  cmd: string,
  args: string[],
  cwd: string = Deno.cwd()
): Promise<{ success: boolean; cp: Deno.ChildProcess }> {

  const command = new Deno.Command(cmd, {
    args,
    cwd,
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
  });

  const childProcess = command.spawn();

  // Create a cleanup function that properly handles stream cleanup
  const cleanup = async () => {
    const cleanupStream = async (stream: ReadableStream) => {
      try {
        const reader = stream.getReader();
        try {
          await reader.cancel();
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        console.error(`Stream cleanup error: ${error}`);
      }
    };

    await Promise.allSettled([
      cleanupStream(childProcess.stdout),
      cleanupStream(childProcess.stderr),
      childProcess.stdin.close().catch(err =>
        console.error(`Error closing stdin: ${err}`)
      )
    ]);
  };

  // Improved stream processing function
  const processStream = async (
    stream: ReadableStream,
    onData: (chunk: string) => Promise<void>
  ) => {
    const reader = stream.getReader();
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          const chunk = new TextDecoder().decode(value, { stream: true });
          await onData(chunk);
        }
      }
    } finally {
      reader.releaseLock();
    }
  };

  // Process stdout with package installation prompts
  try {
    await processStream(childProcess.stdout, async (chunk) => {
      if (/\d+\.\d+\.\d+ \(build .+\)/.test(chunk)) {
        console.log(chunk);
      }
      if (chunk.includes("Need to install the following packages:")) {
        const userInput = prompt("yes or no: ");
        if (userInput !== null) {
          const writer = childProcess.stdin.getWriter();
          try {
            await writer.write(
              new TextEncoder().encode(userInput + "\n")
            );
          } finally {
            writer.releaseLock();
          }
        }
      }
    });
  } catch (error) {
    console.error(`Error processing stdout: ${error}`);
  }

  // Wait for process to complete
  const status = await childProcess.status;

  // Clean up resources
  await cleanup();

  // Return result
  if (!status.success) {
    console.error(`Process failed with code: ${status.code}`);
  }

  return { success: status.success, cp: childProcess };
}

/**
 * @description Git init the workspace
 * @param workspace 
 */
export async function gitInt(workspace: string): Promise<git.InitResult> {
  const init = await git.simpleGit(workspace).init();
  return init;
}

/**
 * 
 * @param workspace 
 * @returns success:boolean
 * @todo Add user confirmation before deleting the workspace
 */
export async function cleanDir(workspace: string): Promise<{ success: boolean }> {
  try {
    logger(`Removing the current CDK workspace`, undefined, 'file_cabinet');
    await Deno.removeSync(workspace, { recursive: true });
    return { success: true };
  } catch (error) {
    logger(`Error cleaning the workspace: ${error}`, chalk.bgYellow, 'warning');
    return { success: false };
  }
}

/**
 * @description Cleanup the support files
 * @param workspace 
 * @param appcode 
 * @returns void
 */
export function cleanupSupportFiles(workspace: string, appcode: string): Promise<void> {

  const regEx = new RegExp(`^${appcode}-assets-[a-zA-Z0-9]+$`);
  const zip = new RegExp(`^${appcode}.zip$`);

  Deno.removeSync(`${workspace}/lib/${appcode}-stack.ts`);

  for (const dir of Deno.readDirSync(workspace)) {
    if (dir.isDirectory && regEx.test(dir.name)) {
      Deno.removeSync(`${workspace}/${dir.name}`, { recursive: true });
      logger(`Removing the assets directory: ${dir.name}`, undefined, 'file_cabinet');
    }
  }

  for (const file of Deno.readDirSync(workspace)) {
    if (file.isFile && zip.test(file.name)) {
      Deno.removeSync(`${workspace}/${file.name}`);
      logger(`Removing the assets zip file: ${file.name}`, undefined, 'file_cabinet');
    }
  }

  logger(`Support files cleaned up`, chalk.green, 'file_cabinet');
  return Promise.resolve();

}

export async function cdkBin(workspace: string, ASSETS_SRC: string): Promise<{ initBinSetup: boolean }> {

  try {
    logger(`Setting up the bin directory...`, undefined, 'file_cabinet');
    Deno.removeSync(`${workspace}/bin`, { recursive: true });
    await copyDir(`${ASSETS_SRC}/bin`, `${workspace}/bin`);
    if (Deno.statSync(`${workspace}/bin`).isDirectory) {
      // Update the entry point in cdk.json and package.json
      try {
        const cdkFileContent = await Deno.readTextFile(`${workspace}/cdk.json`);
        const pkgFileContent = await Deno.readTextFile(`${workspace}/package.json`);
        const cdkJson = JSON.parse(cdkFileContent);
        const pkgJson = JSON.parse(pkgFileContent);
        const cdkentryPointContent = `npx ts-node --prefer-ts-exts bin/backend.ts`;
        const pkgentryPointContent = `bin/backend.js`;
        cdkJson.app = cdkentryPointContent;
        pkgJson.bin.pbs = pkgentryPointContent
        await Deno.writeTextFile(`${workspace}/cdk.json`, JSON.stringify(cdkJson, null, 2));
        await Deno.writeTextFile(`${workspace}/package.json`, JSON.stringify(pkgJson, null, 2));
        return { initBinSetup: true };
      } catch (error) {
        logger(`Error updating cdk.json:\n${error}`, chalk.bgRed, 'red_circle');
        return { initBinSetup: false };
      }
    }
    logger(`Bin directory setup complete`, chalk.green, 'file_cabinet');
    return { initBinSetup: false };
  } catch (error) {
    logger(`Error in cdkBin function:\n${error}`, chalk.bgRed, 'red_circle');
    return { initBinSetup: false };
  }
};

/**
 * @description Check if the user has network access
 */
export async function checkNetworkAccess(): Promise<boolean> {
  // Check network access
  const HOST = new URL("https://raw.githubusercontent.com/thedevopsguyblog/cli/refs/heads/main/assets/bin/backend.ts");
  if (await fetch(HOST.href).then((res) => res.ok)) {
    logger("Network Access OK", chalk.green, 'globe_with_meridians');
    return true;
  } else {
    logger("Network Error: Unable to access the internet", chalk.bgRed, 'no_entry');
    return false
  }

}

/**
 * @description Download, extract and prepare the assets for the CLI to edit.
 * @param workspace
 * @param appcode
 * @returns success:boolean and ASSETS_TRG:string
 */
export const ASSETS_SRC = async (workspace: string, appcode: string): Promise<{ sucess: boolean, ASSETS_TRG: string }> => {
  const ZIP = new URL(`https://github.com/thedevopsguyblog/cli/archive/refs/heads/main.zip`)
  let targetDir = ""

  const download = async (): Promise<{ success: boolean, filepath: string | null }> => {
    try {
      const response = await fetch(ZIP.href);
      const buffer = new Uint8Array(await response.arrayBuffer());
      const tmpDir = `${workspace}/${appcode}.zip`;
      await Deno.writeFile(tmpDir, buffer);
      logger(`Downloaded the CLI assets to ${tmpDir}`, chalk.green, 'inbox_tray');
      return { success: true, filepath: tmpDir }
    } catch (error) {
      console.error(`Error downloading the CLI assets: ${error}`);
      return { success: false, filepath: null }
    }
  }

  /**
   * 
   * @param fp "file path" to the .zip file 
   * @returns success:boolean
   */
  async function unzipAssets(fp: string, appcode: string): Promise<{ success: boolean }> {
    targetDir = Deno.makeTempDirSync({ prefix: `${appcode}-assets-`, dir: workspace, });
    logger(`Processing asset - ${fp}\n into ${targetDir}`, chalk.grey, 'memo');

    try {
      // Extract the .zip file
      const dir = await unzipper.Open.file(fp);
      await dir.extract({ path: targetDir });
    } catch (error) {
      console.error(`Error unzipping file: ${error}`);
    }

    if (Deno.statSync(targetDir).isDirectory) {
      return { success: true }
    } else {
      return { success: true }
    }
  }

  const { filepath, success } = await download();

  if (filepath && success) {
    const { success } = await unzipAssets(filepath, appcode);
    if (success) {
      return { sucess: true, ASSETS_TRG: `${targetDir}/cli-main/assets` };
    } else {
      return { sucess: false, ASSETS_TRG: "" };
    }
  } else {
    return { sucess: false, ASSETS_TRG: "" };
  }

}

/**
 * Install a package in the target directory
 * @param {string} targetDir Directory to install the package
 * @param {string} [pkgName] Name of the package to install
 * @returns {boolean} Success or failure of the installation
 * @example await npmInstall("./repo/my-app", "express@2.3")
 */
export async function npmInstall(
  targetDir: string,
  pkgName?: string,
): Promise<boolean> {

  const installAll = async (): Promise<boolean> => {
    const command = new Deno.Command("npm", {
      args: ["install"],
      cwd: targetDir,
    });

    const { status } = command.spawn();

    if ((await status).success) {
      console.log(`Successfully installed dependencies`, chalk.green);
      return true;
    } else {
      console.error(`Failed to install dependencies`, chalk.red);
      return false;
    }
  };

  const installPkg = async (pkgName: string): Promise<boolean> => {
    const command = new Deno.Command("npm", {
      args: [
        "install",
        pkgName,
      ],
      cwd: targetDir,

    });

    const { status } = command.spawn();

    if ((await status).success) {
      console.log(`Successfully installed ${pkgName}`, chalk.green);
      return true;
    } else {
      console.error(`Failed to install ${pkgName}`, chalk.red);
      return false;
    }
  };

  if (pkgName) {
    logger(`Installing ${pkgName} in ${targetDir}`, chalk.grey, 'package');
    return await installPkg(pkgName);
  } else {
    logger(`Installing all dependencies in ${targetDir}`, chalk.grey);
    return await installAll();
  }
}

/**
 * @description Copy a file from src to dest
 * @param src File path as a string
 * @param dest File path as a string
 */
export async function copyFile(src: string, dest: string) {
  // const from = src.split("/").pop();
  // const to = dest.split("/").slice(-3).join("/")
  // logger(`Copying File "${from}" to "./${to}"`, undefined, 'file_folder');
  await Deno.copyFile(src, dest);
}

/**
 * @description Creates the new destination dir, then copies a directory from src to dest
 * @param src Folder path as a string
 * @param dest Folder path as a string
 */
export async function copyDir(src: string, dest: string) {
  try {
    await Deno.mkdir(dest, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory: ${error}`);
  }

  try {
    for (const entry of Deno.readDirSync(src)) {
      const srcEntryPath = `${src}/${entry.name}`;
      const destEntryPath = `${dest}/${entry.name}`;

      if (entry.isDirectory) {
        await copyDir(srcEntryPath, destEntryPath); // Recursively copy subdirectories
      } else if (entry.isFile) {
        await copyFile(srcEntryPath, destEntryPath);
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      logger(`Error: ${error.name}`, chalk.bgRed);
      logger(
        `The is this correct: ${src}\nOr is this correct: ${dest}`,
        chalk.red,
      );
      logger(`${JSON.stringify(error, null, 2)}`, chalk.grey);
      Deno.exit(1);
    } else {
      throw new Error(`An unknown Error occured - exiting CLI: \n ${error}`);
    }
  }
}

/**
 * When incorrect values are passed we'll display the help message.
 * @param msg
 * @param color
 * @param emojiName https://unpkg.com/emojilib@4.0.0/dist/emoji-en-US.json
 */
export const logger = (
  msg: string,
  color: ChalkInstance = chalk.grey,
  emojiName?: string,
) => {
  const emojiIcon = emojiName ? emoji.get(emojiName) : "";
  const colorMsg = color(msg);
  console.info(`${emojiIcon} ${colorMsg}`);
};

export function showHelp(): void {
  console.info(`
  Welcome to the "Work-U SaaS" or "wus" CLI

  Usage: wus [ARGUMENTS]

Options:
  -h, --help          Show this help message and exit

Arguments:
  -a, --APP_NAME         The name of the application, eg: 'My-SaaS-App'
  -c, --APP_CODE         The code for the application, eg: 'MSA'
  -d, --DOMAINNAME       The domain name for the application, eg: 'my-saas-app.com'

Examples:
    
  This will bootstrap a new SaaS application with the name 'My-SaaS-App', code 'MSA' and domain 'my-saas-app.com'
    "deno run jsr:@work-u/saas-cli -a My-SaaS-App -c MSA -d my-saas-app.com"

Source Code: https://github.com/thedevopsguyblog/cli
`);
}

export const successExitCli = (targetDir: string) => {
  // new Deno.Command("node", {args:["api/build.mjs"], cwd: targetDir, stdin: "piped", stdout:"piped", stderr: "piped"}).spawn()
  logger(`All Done!.`, chalk.green, 'check_mark_button');
  logger(`You can start building your Serverless (AppSync) +  NextJS 14 Saas!`, chalk.green, 'man_technologist');
  Deno.exit(0);
};
