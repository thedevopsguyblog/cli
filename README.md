# "wus" - A SaaS CLI 

Modern SaaS projects have many dependencies, using this CLI I've created a template for my preferered AWS Stack.

Backend: CDK, Appsync, SES, Lambda, S3 etc...  
Frontend: Amplify + NextJS 14.

This CLI was built using Deno 2.

## Example

"wus" takes 3x arguments...

- -a, --APP_NAME         The name of the application, eg: 'My SaaS App'

- -c, --APP_CODE         The code for the application, eg: 'MSA'

- -d, --DOMAINNAME       The domain name for the application, eg: 'my-saas-app.com'

```bash
wus -a MyUniCornSaaS -c UCS -d unicorn-saas.com
```
