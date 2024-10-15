import chalk from "npm:chalk@5.3.0";
import { parseArgs } from "@std/cli/parse-args";
import type { IcliOptions } from "./helpers.ts";
import { copyDir, copyFile, logger, showHelp, successExitCli, npmInstall } from "./helpers.ts";

/**
 * Spawn a subprocess to run the NPX AWS CDK commands - "npx aws-cdk init app --generate-only --language typescript",
 */

export const ASSETS_DIR:string = `${Deno.cwd()}/assets`;

async function initCdk(workspace: string) {
  
  const cdkBin = async () => {
    await Deno.removeSync(`${workspace}/bin`, { recursive: true });
    await copyDir(`${ASSETS_DIR}/bin`, `${workspace}/bin`);
  }

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

  // create subprocess and collect output
  const { code, stdout, stderr, success, signal } = await command.output();

  
  console.assert(code === 0, "Failed to run command");
  // console.info(new TextDecoder().decode(stdout));
  console.info(new TextDecoder().decode(stderr));

  if (success) {
    await cdkBin();
    logger(`AWS CDK initialized`,chalk.green, 'cloud')
  } else {
    logger(`Error initializing AWS CDK`, chalk.bgRed, 'warning')
  }

}

async function initNextJs(workspace: string) {
  logger(`Working on the Frontend...`, chalk.green);

  const files = [{
    src: `${ASSETS_DIR}/template/userCtx.tsx`,
    target: `${workspace}/frontend/context/userCtx.tsx`,
  }, {
    src: `${ASSETS_DIR}/template/serverUtils.ts`,
    target: `${workspace}/frontend/_serverActions/serverUtils.ts`,
  }];

  const initAuxFile = async () => {
    files.forEach(async (file) => {
      try {
        logger(
          `📂 ${chalk.green(`Copying the file: ${file.src.split("/").pop()}`)}`,
          chalk.green,
        );
        await Deno.mkdirSync(
          file.target.split("/").reverse().slice(1).reverse().join("/"),
        );
        await Deno.copyFileSync(file.src, file.target);
      } catch (error) {
        logger(`🚨 Error copying the file: ${file.src.split("/").pop()}`, chalk.bgRed);
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

  console.assert(
    code === 0,
    logger(
      "🚨 \nFailed to Initialize the Next.js app. \n Is the target directory empty?",
      chalk.bgRed,
    ),
  );
  // console.info(new TextDecoder().decode(stdout));
  console.info(new TextDecoder().decode(stderr));

  if (code == 0) {
    logger(`📂 Frontend created`, chalk.green);
    await initAuxFile();
  }
}

/**
 * @description Recursive copy directories and files from the assets dir, then find and replace placeholders in the files
 * @param workspace The workspace path
 * @param AppCode The AppCode
 * @param AppName The AppName
 * @param DomainName The DomainName
 * 
 */
export async function orgainseAssets(
  workspace: string,
  AppCode: string,
  AppName: string,
  DomainName: string,
) {
  
  const templateDir = `${ASSETS_DIR}/template/`;
  const folders = [...Deno.readDirSync(templateDir)]

  for (const dir of folders) {
    
    const fullSrcPath = `${templateDir}${dir.name}`;
    const fullDestPath = `${workspace}/${dir.name}`;

    const stat = Deno.statSync(fullSrcPath);
    
    if (stat.isDirectory) {
      await copyDir(fullSrcPath, fullDestPath);
    } else if (stat.isFile) {
      await copyFile(fullSrcPath, fullDestPath);
    }
  }
}

export async function templater(
  workspace: string,
  AppCode: string,
  AppName: string,
  DomainName: string
){

  // Find and replace placeholders in the files
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
 * Update package.json files in frontend and backend and trigger na install
 */
function updatePkgJson(workspace:string, appCode: string, appName: string, domainName: string) {
  
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
  
  logger(
    `${`Initializing application...
    AppCode: ${options.appCode},
    AppName: ${options.appName},
    DomainName: ${options.domainName}\n`}`,
    chalk.green,
    'rocket'
  );

  // prep workspace
  let workspace = `${Deno.cwd()}/${options.appCode}`;
  try {
    await Deno.mkdir(`${workspace}`, { recursive: true });
    logger(`Workspace "${options.appName}" (aka:${options.appCode}) created.`, chalk.green, 'file_cabinet');
  } catch (error) {
    logger(`Error creating the Workspace:\n ${error}`,chalk.bgRed, 'warning');
  }

  await initCdk(workspace);
  await initNextJs(workspace);
  await orgainseAssets(workspace, options.appCode, options.appName, options.domainName)
  await templater(workspace, options.appCode, options.appName, options.domainName);
  await updatePkgJson(workspace, options.appCode, options.appName, options.domainName);
  await npmInstall(`${workspace}/frontend`)
  await npmInstall(`${workspace}`);

  // TODO: we always return a success - most of the time it's true but I need a failExitCli()
  successExitCli();
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

// logger(`Logs:\n${JSON.stringify(cliArgs, null, 2)}`, chalk.yellow)

if (cliArgs.help) {
  showHelp();
  Deno.exit(0);
}

if (!cliArgs.APP_NAME || !cliArgs.APP_CODE || !cliArgs.DOMAINNAME) {
  logger("Please provide all the required arguments", chalk.red, 'question');
  showHelp();
  Deno.exit(1);
}

cliArgs.help ? showHelp() : init({
  appCode: cliArgs.APP_CODE!,
  appName: cliArgs.APP_NAME!,
  domainName: cliArgs.DOMAINNAME!,
});
