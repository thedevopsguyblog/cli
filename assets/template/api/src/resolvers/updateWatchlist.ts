import { Context, util } from '@aws-appsync/utils'
import * as ddb from '@aws-appsync/utils/dynamodb'
import { Watchlist, UpdateWatchlistMutationVariables, UpdateWatchlistInput } from '../API'

export function request(ctx: Context<UpdateWatchlistMutationVariables>) {
    
// const headers = {"x-forwarded-for":"212.129.76.55, 130.176.209.8","cloudfront-viewer-country":"IE","cloudfront-is-tablet-viewer":"false","x-amzn-requestid":"fc1c2f09-9687-4827-ad2a-00769ac5be5a","via":"1.1 e3f435228cbc8657d81bd707948f5910.cloudfront.net (CloudFront)","cloudfront-forwarded-proto":"https","content-length":"234","x-forwarded-proto":"https","accept-language":"","host":"fcpvd4i2hra3rp4yqddxej6yvu.appsync-api.ap-southeast-2.amazonaws.com","user-agent":"undici","cloudfront-is-mobile-viewer":"false","accept":"/*","cloudfront-viewer-asn":"15751","cloudfront-is-smarttv-viewer":"false","x-amzn-appsync-is-vpce-request":"false","accept-encoding":"br, gzip, deflate","x-amzn-remote-ip":"212.129.76.55","content-type":"application/json; charset=UTF-8","x-api-key":"da2-hiq4wwvu7zhtzfnqndgc6cxfb4","sec-fetch-mode":"cors","x-amz-cf-id":"mzxtUWDOStYBKAUJEWmsrUezSSR5u3b2F5LsGXNRaPFAB666P12Umg==","x-amzn-trace-id":"Root=1-66605aaa-4aa6b64f3ef7058317c3dfcb","x-amz-user-agent":"aws-amplify/6.3.4 api/1 framework/102","cloudfront-is-desktop-viewer":"true","x-forwarded-port":"443"}
type Headers = {
    "x-forwarded-for": string,
    "cloudfront-viewer-country": string,
    "cloudfront-is-tablet-viewer": string,
    "x-amzn-requestid": string,
    "via": string,
    "cloudfront-forwarded-proto": string,
    "content-length": string,
    "x-forwarded-proto": string,
    "accept-language": string,
    "host": string,
    "user-agent": string,
    "cloudfront-is-mobile-viewer": string,
    "accept": string,
    "cloudfront-viewer-asn": string,
    "cloudfront-is-smarttv-viewer": string,
    "x-amzn-appsync-is-vpce-request": string,
    "accept-encoding": string,
    "x-amzn-remote-ip": string,
    "content-type": string,
    "x-api-key": string,
    "sec-fetch-mode": string,
    "x-amz-cf-id": string,
    "x-amzn-trace-id": string,
    "x-amz-user-agent": string,
    "cloudfront-is-desktop-viewer": string,
    "x-forwarded-port": string
};

    const emailaddress = ctx.args.input.emailaddress
    const metadata = ctx.request.headers;
    const country = metadata["cloudfront-viewer-country"];
    const createdAt = util.time.nowISO8601()
    
    
    return ddb.put<UpdateWatchlistInput>({
        item:{
            emailaddress: emailaddress,
            metadata: metadata,
            createdAt: createdAt,
        },
        key:{
            emailaddress: emailaddress,
        },
        condition:{
            emailaddress: {ne: emailaddress}
        },
    })
}
    
export function response(ctx: Context) {
    // If AWS AppSync DynamoDB functions can determine that the current value in DynamoDB matches the desired result, it treats the operation as if it succeeded anyway.
    return ctx.result as Watchlist
}


