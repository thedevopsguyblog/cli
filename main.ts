import chalk from "npm:chalk@5.3.0";
import { parseArgs } from "@std/cli/parse-args";
import type { IcliOptions } from "./helpers.ts";
import { copyDir, copyFile, logger, showHelp, successExitCli, npmInstall, cleanDir } from "./helpers.ts";

/**
 * Spawn a subprocess to run the NPX AWS CDK commands - "npx aws-cdk init app --generate-only --language typescript",
 */

export const ASSETS_DIR:string = `${import.meta.dirname}/assets`;
// console.log(import.meta.dirname);
// console.log(`${Deno.cwd()}/assets`);

async function initCdk(workspace: string): Promise<{initCdkSuccess: boolean}> {

  const cdkBin = async (): Promise<{ initBinSetup: boolean }> => {
    try {
      logger(`Setting up the bin directory...`, undefined, 'file_cabinet');
      Deno.removeSync(`${workspace}/bin`, { recursive: true });
      await copyDir(`${ASSETS_DIR}/bin`, `${workspace}/bin`);
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
      logger("Error in cdkBin function:", chalk.bgRed, 'red_circle');
      return { initBinSetup: false };
    }
  };

  // define command used to create the subprocess
  const command = new Deno.Command("npx", {
    args: [
      "aws-cdk",
      "init",
      "app",
      "--generate-only",
      "--language",
      "typescript",
    ],
    cwd: workspace,
  });

  const { code, stderr, success, stdout } = await command.output();

  if (success) {
    const {initBinSetup} = await cdkBin();
    if (initBinSetup) {
      return {initCdkSuccess: true}
    } else {
      logger(`Error setting up the bin directory.`, chalk.bgRed, 'red_circle');
      return {initCdkSuccess: false}
    }
  } else {
    logger(`Error initializing the CDK.`, chalk.red, 'construction')
    logger(`${new TextDecoder().decode(stderr)}`, chalk.bgRed, 'red_circle');
    return {initCdkSuccess: false}
  }

}

async function initNextJs(workspace: string):Promise<{initNextJsSuccess: boolean}> {
  logger(`Working on the Frontend...`, undefined, 'building_construction');

  const files = [{
    src: `${ASSETS_DIR}/template/userCtx.tsx`,
    target: `${workspace}/frontend/context/userCtx.tsx`,
  }, {
    src: `${ASSETS_DIR}/template/serverUtils.ts`,
    target: `${workspace}/frontend/_serverActions/serverUtils.ts`,
  }];
  /**
   * @description Copy the auxilliary files to the frontend directory
   * @todo Remove this function and use orgainseAssets() instead
   */
  const initAuxFile = async () => {
    files.forEach(async (file) => {
      try {
        logger(`Copying the file: ${file.src.split("/").pop()}`, undefined ,'file_cabinet');
        await Deno.mkdirSync(file.target.split("/").reverse().slice(1).reverse().join("/"));
        await Deno.copyFileSync(file.src, file.target);
      } catch (error) {
        logger(`Error copying the file: ${file.src.split("/").pop()}`, chalk.yellow, 'warning');
        console.error(error);
      }
    });
  };

  const command = new Deno.Command("npx", {
    args: [
      "create-next-app@latest",
      "frontend",
      "-e",
      "https://github.com/nextui-org/next-app-template",
      "--typescript",
      "--eslint",
      "--tailwind",
      "--src-dir",
      "--app",
    ],
    cwd: workspace,
  });

  const { code, stdout, stderr } = await command.output();

  if (code == 0) {
    logger(`Frontend created`, chalk.green, 'file_cabinet');
    await initAuxFile();
    return {initNextJsSuccess: true}
  } else {
    logger(`Error initializing Next.js`, chalk.bgRed, 'alert');
    return {initNextJsSuccess: false}
  }
}

/**
 * @description Recursive copy directories and files from the assets dir, then find and replace placeholders in the files
 * @param workspace The workspace path
 */
export async function orgainseAssets(workspace: string) {
  
  const templateDir = `${ASSETS_DIR}/template`;
  const folders = [...Deno.readDirSync(templateDir)];
  
  for (const dir of folders) {
    const fullSrcPath = `${templateDir}/${dir.name}`;
    const fullDestPath = `${workspace}/${dir.name}`;
    const stat = Deno.statSync(fullSrcPath);
    
    try {      
      if (stat.isDirectory) {
        await copyDir(fullSrcPath, fullDestPath);
      } else if (stat.isFile) {
        if (dir.name === "userCtx.tsx" || dir.name == "serverUtils.ts") {
          continue;
        } else {
          await copyFile(fullSrcPath, fullDestPath);
        }
      }
    } catch (error) {
      logger(`Error copying the file: ${dir.name}`, chalk.bgRed, 'warning');
    }
  }
}

/**
 * @description Find and replace placeholders in the files
 * @param workspace 
 * @param AppCode 
 * @param AppName 
 * @param DomainName 
 */
export async function templater(
  workspace: string,
  AppCode: string,
  AppName: string,
  DomainName: string
){

  const config = Deno.readDirSync(`${workspace}/config`);
  logger(`📄 Find + replace on...`, chalk.grey);
  for (const entry of config) {
    const filePath = `${workspace}/config/${entry.name}`;
    const file = await Deno.readTextFile(filePath);
    logger(`/config/${entry.name}`, chalk.grey);

    const replacedFile = file
      .replace("/%APP_CODE%/g", `"${AppCode}"`)
      .replace("/%APP_NAME%/g", `"${AppName}"`)
      .replace("/%DOMAINNAME%/g", `"${DomainName}"`);
    await Deno.writeTextFile(filePath, replacedFile);
  }
}

/**
 * @description Update package.json files in frontend and backend and trigger an install
 * @param workspace The workspace path
 * @param appCode The AppCode
 */
function updatePkgJson(workspace:string, appCode: string) {
  
  const iacPkgJsonPath = `${workspace}/package.json`;
  const frontendPkgJsonPath = `${workspace}/frontend/package.json`;

  const editIacPkgJson = () => {

    const iacDevDeps = {
      "@aws-cdk/aws-amplify-alpha": "^2.147.1-alpha.0",
      "aws-amplify": "^6.4.3",
      "@aws-appsync/utils": "^1.8.0",
      "@aws-sdk/client-cognito-identity-provider": "^3.654.0",
      "@aws-sdk/client-dynamodb": "^3.602.0",
      "@aws-sdk/client-sesv2": "^3.600.0",
      "@aws-sdk/client-sqs": "^3.651.1",
      "aws-sdk-client-mock": "^4.0.1",
      "@aws-sdk/client-appsync": "^3.600.0",
      "@aws-sdk/client-cloudformation": "^3.609.0",
    };

    const iacScripts = {
      "codegen": "cd api && npx @aws-amplify/cli codegen && cd ../frontend && npx @aws-amplify/cli codegen",
      "deploy:fe": `"cdk deploy ${appCode}-FE-Hosting"`,
      "dev:api": `"node api/build.mjs && npx aws-cdk deploy \"${appCode}-API\" -e true --hotswap true --require-approval never"`,
      "dev:fullstack": "node api/build.mjs && npx aws-cdk deploy D* --require-approval never --outputs-file ./frontend/amplifyconfiguration.json",
      "postdev:fullstack": "npx ts-node --prefer-ts-exts bin/frontend.ts",
      "build": "tsc",
      "watch": "tsc -w",
      "test": "jest",
      "cdk": "cdk",
    };

    logger(`📄 Updating IAC file... ${JSON.stringify(iacPkgJsonPath)}`, chalk.grey);
    try {
      const iacPkgFile = JSON.parse(Deno.readTextFileSync(iacPkgJsonPath));
      iacPkgFile.script = {...iacScripts}
      iacPkgFile.devDependencies = {...iacDevDeps}
      Deno.writeFileSync(iacPkgJsonPath, new TextEncoder().encode(JSON.stringify(iacPkgFile, null, 2)));
      return `📄 ${chalk.bgGray("Frontend package.json file updated")}`;
    } catch (error) {
      throw new Error(`🚨 ${chalk.bgRed("Error updating IAC package.json file\n", error)}`);
    }

  }

  const editfrontendPkgJson = () => {

    const frontendScripts = {
      "dev": "RESOURCE_PREFIX=D next dev --turbo",
      "build:frontend": "next build",
      "start": "next start",
      "lint": "eslint . --ext .ts,.tsx -c .eslintrc.json --fix",
      "codegen:api": "cd backend/api && npx @aws-amplify/cli codegen",
      "deploy:api":`"cd backend && npx aws-cdk deploy D${appCode}-API-DB --require-approval never"`,
      "predeploy:api": "node backend/api/build.mjs",
    };

    logger(`📄 Updating frontend file...", ${JSON.stringify(frontendPkgJsonPath)}`, chalk.grey)
    try {
      const frnPkgFile = JSON.parse(Deno.readTextFileSync(frontendPkgJsonPath));
      frnPkgFile.scripts = {...frontendScripts}
      Deno.writeFileSync(frontendPkgJsonPath, new TextEncoder().encode(JSON.stringify(frnPkgFile, null, 2)));
      return `📄 ${chalk.green("Frontend package.json file updated")}`;
    } catch (error) {
      throw new Error(`🚨 ${chalk.bgRed("Error updating IAC package.json file\n", error)}`);
    }

  }
  
  if ( editIacPkgJson() && editfrontendPkgJson() ) {
    logger(`📄 All package.json files updated.`, chalk.grey);
    logger(`📦 Installing dependencies...`, chalk.bgBlueBright);
  } else {
    logger(`🚨 Error updating package.json files`, chalk.bgRed);
  }

}

/**
 * Check args, check workspace and run the init functions
 */
async function init(options: IcliOptions) {
  const wusVersionNo = (JSON.parse(Deno.readTextFileSync(`./deno.json`)).version as string).includes("pre-release") ? "pre-release" : "stable";
  wusVersionNo === "pre-release" ? logger(`You are using a pre-release version of the WUS CLI.`, chalk.yellow, "warning") : "On the Stable Branch";

  logger(
    `${`Initializing application...
    AppCode: ${options.appCode},
    AppName: ${options.appName},
    DomainName: ${options.domainName}\n`}`,
    chalk.green,
    'rocket'
  );

  // prep workspace
  const workspace = `${Deno.cwd()}/${options.appCode}`;
  try {
    await Deno.mkdir(workspace);
  } catch (error) {
    if (error instanceof Deno.errors.AlreadyExists) {
      try {
        await cleanDir(workspace);
        await Deno.mkdir(workspace);
      } catch (error) {
        logger(`Error cleaning the workspace:\n ${error}`, chalk.bgRed, 'warning');
        Deno.exit(1);
      }
    } else {
      logger(`Error creating the Workspace:\n ${error}`,chalk.bgRed, 'warning');
      Deno.exit(1);
    }
  }

  const {initCdkSuccess} = await initCdk(workspace);
  if (initCdkSuccess){
    logger(`CDK initialized successfully`, chalk.green, 'next_track_button');
    if ((await initNextJs(workspace)).initNextJsSuccess === true) {
      await updatePkgJson(workspace, options.appCode);
      await orgainseAssets(workspace);
      await templater(workspace, options.appCode, options.appName, options.domainName);
      await npmInstall(`${workspace}/frontend`)
      await npmInstall(`${workspace}`);
      successExitCli();
    } else {
      logger(`Error initializing the Next.js app\n Exiting Script.`, chalk.bgRed, 'construction');
      Deno.exit(1);
    }
  } else {
    // TODO: I need a failExitCli()
    Deno.exit(1);
  }

}

const cliArgs = parseArgs(Deno.args, {
  alias: {
    h: "help",
    a: "APP_NAME",
    c: "APP_CODE",
    d: "DOMAINNAME",
  },
  string: ["APP_NAME", "APP_CODE", "DOMAINNAME"],
  default: {
    help: false,
  },
});

if (cliArgs.help) {
  showHelp();
  Deno.exit(0);
}

if (!cliArgs.APP_NAME || !cliArgs.APP_CODE || !cliArgs.DOMAINNAME) {
  logger("Please provide all the required arguments", chalk.yellow, 'warning');
  showHelp();
  Deno.exit(1);
}

cliArgs.help ? showHelp() : init({
  appCode: cliArgs.APP_CODE!,
  appName: cliArgs.APP_NAME!,
  domainName: cliArgs.DOMAINNAME!,
});
