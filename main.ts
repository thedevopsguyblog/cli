import chalk from "npm:chalk@5.3.0";
import { parseArgs } from "@std/cli/parse-args";
import type { IcliOptions } from "./helpers.ts";
import { 
  copyDir, 
  copyFile, 
  logger, 
  showHelp, 
  successExitCli, 
  npmInstall, 
  cleanDir, 
  ASSETS_SRC, 
  checkNetworkAccess, 
  cdkBin,
  cleanupSupportFiles,
  gitInt
} from "./helpers.ts";

/**
 * Spawn a subprocess to run the NPX AWS CDK commands - "npx aws-cdk init app --generate-only --language typescript",
 */

async function initCdk(workspace: string): Promise<{initCdkSuccess: boolean}> {


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
    return {initCdkSuccess: true}
  } else {
    logger(`Error initializing the CDK.`, chalk.red, 'construction')
    logger(`${new TextDecoder().decode(stderr)}`, chalk.bgRed, 'red_circle');
    return {initCdkSuccess: false}
  }

}

async function initNextJs(workspace: string, EAD:string):Promise<{initNextJsSuccess: boolean}> {
  logger(`Working on the Frontend...`, undefined, 'building_construction');
  console.log(EAD);
  const files = [{
    src: `${EAD}/template/userCtx.tsx`,
    target: `${workspace}/frontend/context/userCtx.tsx`,
  }, {
    src: `${EAD}/template/serverUtils.ts`,
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
 * @param workspace - The workspace path
 * @param EAD - The Extracted Assets Directory
 * @param domainName - The domain name
 * @example await orgainseAssets(workspace, EAD, options.domainName)
 */
export async function orgainseAssets(workspace: string, EAD:string, domainName: string): Promise<void>{
  
  const templateDir = `${EAD}/template`;
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

  if (domainName.includes("amplifyapp.com")) {
    await Deno.remove(`${workspace}/lib/notifications.ts`);
    const replaceInFile = async (filePath: string, searchValue: string, replaceValue: string) => {
      const file = Deno.readTextFileSync(filePath);
      const newFile = file.replace(searchValue, replaceValue);
      await Deno.writeTextFile(filePath, newFile);
    }

    replaceInFile(`${workspace}/bin/backend.ts`, "import { NotificationStack } from '../lib/notifications';", "");
    replaceInFile(`${workspace}/bin/backend.ts`, "apistack.addDependency(notificationsStack, 'We need the SNS topics to exists before we can create the API')", "");
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
): Promise<void>{

  const config = Deno.readDirSync(`${workspace}/config`);
  logger(`📄 Find + replace on...`, chalk.grey);
  for (const entry of config) {
    const filePath = `${workspace}/config/${entry.name}`;
    const file = await Deno.readTextFile(filePath);
    logger(`/config/${entry.name}`, chalk.grey);

    const replacedFile = file
      .replace("%APP_CODE%", `${AppCode}`)
      .replace("%APP_NAME%", `${AppName}`)
      .replace("%DOMAINNAME%", `${DomainName}`);
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
      "aws-cdk": "2.163.1",
      "esbuild": "^0.21.5",
      "esbuild-plugin-eslint": "^0.3.12",
      "glob": "^10.4.2",
      "jest": "^29.7.0",
      "ts-jest": "^29.2.5",
      "ts-node": "^10.9.2",
      "typescript": "~5.6.2",
      "aws-amplify": "^6.4.3",
      "aws-sdk-client-mock": "^4.0.1",
      "@aws-cdk/aws-amplify-alpha": "^2.147.1-alpha.0",
      "@aws-appsync/utils": "^1.8.0",
      "@aws-sdk/client-cognito-identity-provider": "^3.654.0",
      "@aws-sdk/client-dynamodb": "^3.602.0",
      "@aws-sdk/client-sesv2": "^3.600.0",
      "@aws-sdk/client-sqs": "^3.651.1",
      "@aws-sdk/client-appsync": "^3.600.0",
      "@aws-sdk/client-cloudformation": "^3.609.0",
      "@types/jest": "^29.5.12",
      "@types/node": "22.5.4",
    };

    const iacScripts = {
      "codegen": "cd api && npx @aws-amplify/cli codegen && cd ../frontend && npx @aws-amplify/cli codegen",
      "deploy:fe": `cdk deploy ${appCode}-FE-Hosting`,
      "dev:api": `node api/build.mjs && npx aws-cdk deploy D${appCode}-API -e true --hotswap true --require-approval never`,
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
      iacPkgFile.scripts = {...iacScripts}
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
      "deploy:api":`cd backend && npx aws-cdk deploy D${appCode}-API-DB --require-approval never`,
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

  await checkNetworkAccess() === true ? null : Deno.exit(1);

  logger(
    `${`Initializing application...
    AppCode: ${options.appCode},
    AppName: ${options.appName},
    DomainName: ${options.domainName}\n`}`,
    chalk.green,
    'rocket'
  );

  // Prep workspace
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

    // EAD = Extracted Assets Directory
    let EAD = "";
  const {initCdkSuccess} = await initCdk(workspace);
  if (initCdkSuccess) {
    const {ASSETS_TRG } = await ASSETS_SRC(workspace, options.appCode)
    EAD = ASSETS_TRG;
    if (ASSETS_TRG) {
      const {initBinSetup} = await cdkBin(workspace, EAD)
      if (initBinSetup) {
        logger(`CDK initialized successfully`, chalk.green, 'next_track_button');
      }
    }
  } else {
    logger(`Error initializing the CDK.`, chalk.red, 'construction')
    Deno.exit(1);
  }

  if ((await initNextJs(workspace, EAD)).initNextJsSuccess === true) {
    await updatePkgJson(workspace, options.appCode);
    await orgainseAssets(workspace, EAD, options.domainName);
    await templater(workspace, options.appCode, options.appName, options.domainName);
    await npmInstall(`${workspace}/frontend`)
    await npmInstall(`${workspace}`);
    await npmInstall(workspace)
    await cleanupSupportFiles(workspace, options.appCode);
    await gitInt(workspace);
    successExitCli(workspace);
  } else {
    logger(`Error initializing the Next.js app\n Exiting Script.`, chalk.bgRed, 'construction');
    Deno.exit(1);
  }
}

export const cliArgs = parseArgs(Deno.args, {
  alias: {
    h: "help",
    a: "APP_NAME",
    c: "APP_CODE",
    d: "DOMAINNAME",
    go: "GH_OWNER",
    gr: "GH_REPO"
  },
  string: ["APP_NAME", "APP_CODE", "DOMAINNAME", ],
  default: {
    help: false,
    DOMAINNAME: "*.amplifyapp.com",
    GH_OWNER: "null",
    GH_REPO: "null",
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

if (!cliArgs.GH_OWNER || !cliArgs.GH_REPO) {
  logger("Please provide the GitHub owner and repository", chalk.yellow, 'warning');
  logger("\"git@github.com:*GO*/*GR*.git\" -go *GO* -gr *GR*", chalk.grey, 'info');
  showHelp();
  Deno.exit(1);
}

cliArgs.help ? showHelp() : init({
  appCode: cliArgs.APP_CODE!,
  appName: cliArgs.APP_NAME!,
  domainName: cliArgs.DOMAINNAME!,
});
