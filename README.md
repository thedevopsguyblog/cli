# "wus" - Bootstrap your Fullstack SaaS.

A no install CLI, that bootstraps your workspace to build serverless (Appsync + DynamoDB + Amplify G1) apps with NextJS 14 (SSR) "auto-magically" ✨.

## About

Modern SaaS projects have many dependencies, using this CLI I've created a template for my preferred AWS Stack.

📋 Here are just some of the big features!

- ✅ [Separate Environemnts.](https://docs.aws.amazon.com/amplify/latest/userguide/team-workflows-with-amplify-cli-backend-environments.html#standard) 

- ✅ Fullstack CI/CD - On push to a specific branch, deploy the fullstack.
- ✅ Build time generation of [Amplify G1 config.](https://docs.aws.amazon.com/amplify/latest/userguide/amplify-config-autogeneration.html)
- ✅ TS AppSync Resolver [Bundling.](https://docs.aws.amazon.com/appsync/latest/devguide/additional-utilities.html#working-with-typescript)
- ✅ Extend your IAC using CDK.
- ✅ NextJS 14 App Router + NextUI + ServerActions.
- 🏗️ SES PROD Automation.
- 🏗️ More Frontend options (Install Radix UI or NextUI as CLI options).

## Stack

By default you get the following but this can be modified as needed.

### Backend

IAC uses the AWS CDK.

- Appsync - The `./api` directory will contain the resolvers, schema and build script to compile .TS to .JS

- Lambda, S3, Dynamodb, Cognito and other components are all included in the `./lib` directory.

### Hosting

The Frontend uses NextJS 14 + Amplify Client libs.

- NextJS 14 - The `./frontend` directory contains all frontend using the app router.

  - Server Actions.
  - AppSync codegen.
  - NextUI + Tailwind.

- Amplify - The frontend is hosted in Amplify with **SSR support**.

CI/CD is all handeled by Amplify.

## Environment Support

The CLI will deploy all resources in isolated environments.
This CLI was built using Deno 2.

### CLI TODO

- 🏗️ Optimise the CLI to handle spawning processes.
- 🏗️ Support bootstrapping SPA.
- 🏗️ WIP on CLI UI.

## Example

"wus" takes 3x arguments...

  🙋🏾‍♂️ Welcome to the "Work-U SaaS" or "wus" CLI

  Usage: wuss APP_NAME APP_CODE DOMAINNAME

Options:
  -h, --help          Show this help message and exit

Arguments:
  -a, --APP_NAME         The name of the application, eg: 'My-SaaS-App'
  -c, --APP_CODE         The code for the application, eg: 'MSA'
  -d, --DOMAINNAME       The domain name for the application, eg: 'my-saas-app.com'

Examples:

  This will bootstrap a new SaaS application with the name 'My-SaaS-App', code 'MSA' and domain 'my-saas-app.com'

```bash
deno run jsr:@work-u/saas-cli -a My-SaaS-App -c MSA -d my-saas-app.com
```
