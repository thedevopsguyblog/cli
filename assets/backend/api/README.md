# AppSync API + Backend Lambdas

This folder is where we keep the appsync resolvers, lambda functions executed by cognito and other services and the actual API "contract" `schema.graphql`.

`build.mjs` is the "glue", at build time, the .ts files are compiled into .js and executed by the runtimes (appsync JS resolvers/nodejs lambdas).

## Introduction

https://docs.aws.amazon.com/appsync/latest/devguide/resolver-reference-overview-js.html#test-resolvers
[Sample Page](https://github.com/aws-samples/aws-appsync-resolver-samples)

```bash
.
├── .graphqlconfig.yml     #Generated by "amplify configure codegen"
├── README.md
├── build                  
│   └── *.js
├── build.mjs              #Build file turning *.ts in to *.js files that AppSync can consume
├── schema.graphql         #GraphQL API Schema
└── src                    #"src/*" Auto generated files from "npm run codegen"
    ├── API.ts
    ├── graphql
    │   └── *.ts
    └── resolvers          # "resolvers/*.ts" are appsync unit-resolvers written in TS that are compiled into JS and placed into "./build/*js"
        └── *.ts
```

## Local Development

1. Auth with AWS
2. "npm run codegen" to generate api schema

>*There is a dependency order for BE and FE development.*
Work in the following order.

3. Update IAC `./lib/*.ts` and deploy.
4. Update API `schema.graphql` & API resolvers `./api/src/resolvers/*.ts`, then deploy.
5. In ./frontend run `npm run codegen`, begin working on frontend code