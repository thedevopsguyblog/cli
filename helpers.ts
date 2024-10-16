import type { ChalkInstance } from "npm:chalk@5.3.0";
import chalk from "npm:chalk@5.3.0";
import * as emoji from "npm:node-emoji@2.1.3";

export interface IcliOptions {
  appName: string;
  appCode: string;
  domainName: string;
}

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
    console.log(`Installing ${pkgName} in ${targetDir}`, chalk.grey);
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
  // console.info(`Copying File ${src.split("/").pop()} to ../${truncatedPath}`);
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

export function showHelp():void {
  console.log(`
  🙋🏾‍♂️ Welcome to the "Work-U SaaS" or "wus" CLI

  Usage: wuss APP_NAME APP_CODE DOMAINNAME

Options:
  -h, --help          Show this help message and exit

Arguments:
  -a, --APP_NAME         The name of the application, eg: 'My SaaS App'
  -c, --APP_CODE         The code for the application, eg: 'MSA'
  -d, --DOMAINNAME       The domain name for the application, eg: 'my-saas-app.com'
`);
}

export const successExitCli = () => {
  logger(`✅ All Done!.`, chalk.green);
  logger(
    `🧑🏾‍💻 You can start building your Serverless (AppSync) +  NextJS 14 Saas!`,
    chalk.green,
  );
  Deno.exit(0);
};
