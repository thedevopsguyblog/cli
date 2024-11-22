import * as fs from 'node:fs'
import {execFileSync, execSync} from 'node:child_process'
import {getEnvContext} from '../config'
import {type ResourcesConfig} from 'aws-amplify'
import * as yaml from 'yaml'

const currentBranch = process.env.AWS_BRANCH || execSync('git branch --show-current').toString().trim()

if (!currentBranch) {
	throw new Error(`No configuration found for branch: ${currentBranch}`)
} 

const envVars = getEnvContext(currentBranch)
console.log('Frontend:',envVars.RESOURCE_PREFIX)

const PREFIX = envVars.RESOURCE_PREFIX
const AC = envVars.APP_CODE
const FQDN = envVars.DOMAINNAME
const SRC_FILE = './frontend/amplifyconfiguration.json'

const graphqlconfigYml =`projects:
  Codegen Project:
    schemaPath: ../api/schema.graphql
    includes:
      - src/graphql/**/*.ts
    excludes:
      - ./amplify/**
      - src/API.ts
    extensions:
      amplify:
        codeGenTarget: typescript
        generatedFileName: src/API.ts
        docsFilePath: src/graphql
        region: ap-southeast-2
        apiId: crj3yt7ogrcxvnlmwss6wkhos4
        frontend: javascript
        framework: reat
        maxDepth: 2
extensions:
  amplify:
    version: 3
`

let parsedData = {} as any

async function injestJson():Promise<void>{
    
    try {
        console.info('Injesting JSON Amplify Configuration')
        const data = fs.readFileSync(SRC_FILE, 'utf8');
        parsedData = JSON.parse(data);
    } catch (err) {
        if (err instanceof Error) {
            console.log('Known Error')
            switch (err.message.split(':')[0]) {
                case 'ENOENT':
                    console.error("The 'amplifyconfiguration' File is missing - have you deployed your stack(s) yet?")
                    break;
                case 'SyntaxError':
                    console.error('Syntax Error in JSON, please check the file')
                    break;
                default:
                    console.error(err);
                    break;
            }
        } else {
            console.error(err);
        }
    }
}

// Write new aws-exports for Next JS
async function writeExports():Promise<{apiEndpoint:string|undefined}>{

    // Check the Env Prefix is the same
    if (JSON.stringify(parsedData).charAt(2) !== PREFIX) {
        const errorMessage = [
            `Mismatch between the target environment and the parsed data.`,
            `Current Environment: ${PREFIX}`,
            `Environment Prefix: ${JSON.stringify(parsedData).charAt(2)}`,
            `Please ensure the data corresponds to the current environment.`
        ].join('\n');
    
        throw new Error(errorMessage);
    }

    const authConfig = parsedData[`${PREFIX}${AC}-Auth`]
    const apiConfig = parsedData[`${PREFIX}${AC}-API`]
    const bucketConfig = parsedData[`${PREFIX}${AC}-Bucket`]

    // Check if the required data is present
    if (!authConfig || !apiConfig){
        throw new Error('Required config is missing in ParsedData');
    }


    // https://docs.amplify.aws/gen1/javascript/tools/libraries/configure-categories/
    let awsexports: ResourcesConfig = {}

    awsexports = {
        Auth: {
            Cognito: {
                userPoolClientId:authConfig.userPoolClientId,
                userPoolId:authConfig.userPoolId,
                allowGuestAccess: true,
                identityPoolId:authConfig.identityPoolId,
                signUpVerificationMethod: "code",
                loginWith: {
                    email: true,
                    oauth: {
                        domain: authConfig.userPoolDomainName,
                        providers: ["Google"],
                        scopes: [
                          'phone',
                          'email',            
                          'profile',
                          'openid',
                        ],
                        redirectSignIn: PREFIX === 'P' ? [`https://www.${FQDN}/`] : [ 'http://localhost:3000/', `https://testing.${FQDN}/`, `https://dev.${FQDN}/`],
                        redirectSignOut: PREFIX === 'P' ? [`https://www.${FQDN}/`] : [ 'http://localhost:3000/', `https://testing.${FQDN}/`, `https://dev.${FQDN}/`],
                        responseType: "code",
                    }
                }
            }
        },
        API: {
            GraphQL:{
                endpoint: apiConfig.endpoint,
                apiKey: apiConfig.apiKey,
                region: apiConfig.region,
                defaultAuthMode: 'userPool',
            }
        },
        Storage: {
            S3: {
                bucket: bucketConfig.BucketName,
                region: bucketConfig.BucketRegion,
            }
        }
    }

    try {
        await fs.writeFileSync('./frontend/aws-exports.ts', `import { type ResourcesConfig }from "aws-amplify"; \n export const awsExports: ResourcesConfig = ${JSON.stringify(awsexports, null, 2)}`)
        return {apiEndpoint:apiConfig.endpoint}
    } catch (error) {
        console.error('\nError Writing aws-exports file:\n',error)
        return {apiEndpoint:undefined}
    }
}

/**
 * @description A function to create the .graphqlconfig.yml file if they don't already exist.
 * @param newApiId 
 * @link https://www.apollographql.com/docs/devtools/apollo-config/
 */
async function createGqlConfigYml(path:string):Promise<void>{

        try {
            console.log(`Creating ${path}\n`)
            fs.writeFileSync(`${path}/.graphqlconfig.yml`, graphqlconfigYml)
        } catch (error) {
            console.error('\nError Creating .graphqlconfig.yml file:\n',error)
            process.exit(1)
        }
    

}
/**
 * @description A function to update the .graphqlconfig.yml file if they do already exist.
 * @param newApiId 
 */
async function updateGqlConfigYml(newApiId:string):Promise<void>{

    const gqlConfigFiles = [`${process.cwd()}/api`, `${process.cwd()}/frontend`]
    type ymlFile = {
        projects: {
          'Codegen Project': {
            schemaPath: '../api/schema.graphql',
            includes: any,
            excludes: any,
            extensions: {
                amplify: {
                    codeGenTarget:string,
                    generatedFileName:string,
                    docsFilePath:string,
                    region:string,
                    apiId:string,
                    frontend:string,
                    framework:string,
                    maxDepth: number
                }
            }
          }
        },
        extensions: { amplify: { version: 3 } }
      }

    for (const file of gqlConfigFiles){
        try {
            if (fs.existsSync(`${file}/.graphqlconfig.yml`) == false){
                await createGqlConfigYml(`${file}/.graphqlconfig.yml`)
            }   
            const parsedFile:ymlFile = yaml.parse(fs.readFileSync(`${file}/.graphqlconfig.yml`, 'utf8'))
            parsedFile.projects['Codegen Project'].extensions.amplify.apiId = newApiId
            fs.writeFileSync(`${file}/.graphqlconfig.yml`, yaml.stringify(parsedFile))
        } catch (error) {
            console.error('\nError Updating .graphqlconfig.yml file:\n',error)
            process.exit(1)
        }
    }
}

async function executeCodegen():Promise<void>{
    const dirs = ['frontend', 'api']
    try {
        console.info('Executing Codegen')
        for (const dir of dirs){
            execSync(`cd ${process.cwd()}/${dir} && npx @aws-amplify/cli codegen`)
        }
    } catch (error) {
        console.error('\nError Executing Codegen:\n',error)
    }
}

// Function to watch for changes in the amplifyconfiguration.json file then trigger my script 
async function init(){

    async function watchFile(){
        console.info(`Watching for amplifyconfiguration.json file`)
            fs.watch(SRC_FILE, () => {}).addListener('change', () => {
                console.info('File has changed')
                injestJson()
                writeExports()
            })
    }

    if (fs.existsSync(SRC_FILE) == false){
        console.error('File does not exist - begining watch mode')
        watchFile()
    } else {
        try {            
            await injestJson()
            const apiId = await writeExports()
            if (apiId.apiEndpoint){
                const getApiId = async ():Promise<string> => {
                    const idFromConfig:string = JSON.parse(fs.readFileSync(SRC_FILE, 'utf8'))[`${PREFIX}${AC}-API`].apiID;
                    if (!idFromConfig) {
                        throw new Error('API ID not found in Amplify Configuration')
                    }
                    console.log('API ID:',idFromConfig)
                    return idFromConfig
                }
                const newApiId = await getApiId()
                await updateGqlConfigYml(newApiId)
                await executeCodegen()
            } else {
                throw new Error ("The API Endpoint is not defined - exiting script.")
            }
        } catch (error) {
            console.error('Error in initilisation:\n',error)
        }
    }
}

init()