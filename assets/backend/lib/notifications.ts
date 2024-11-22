import * as cdk from 'aws-cdk-lib';
import { EmailSendingEvent } from 'aws-cdk-lib/aws-ses';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';
import * as fs from 'fs';
import { join } from 'path';

interface NotificationStackProps extends cdk.StackProps {
    envVars: { [key: string]: string }
}

export class NotificationStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: NotificationStackProps) {
        super(scope, id, props);

        const PREFIX = props.envVars.RESOURCE_PREFIX
        const AC = props.envVars.APP_CODE

        interface SnsConfig {
            [key: string]: {
                eventMap: { [key: string]: EmailSendingEvent },
            }
        }
        /**
         * We use SES Config sets to track email events.
         * For instance, we can track when an email sending event is accepted by SES (HTTP 200). 
         * But SES may fail to render the template - resulting in the email failing to send.
         * At this point an SES Config set will be triggered, it pass the RENDERING_FAILURE event to a specific SNS topic.
         */
        const sesConfigSetMappings: SnsConfig = {
            'sending': {
                eventMap: {
                    'send': cdk.aws_ses.EmailSendingEvent.SEND,
                    'rendering_failure': cdk.aws_ses.EmailSendingEvent.RENDERING_FAILURE,
                }
            },
            'delivery': {
                eventMap: {
                    'delivery': cdk.aws_ses.EmailSendingEvent.DELIVERY,
                    'delivery_delay': cdk.aws_ses.EmailSendingEvent.DELIVERY_DELAY,
                    'reject': cdk.aws_ses.EmailSendingEvent.REJECT,
                }
            },
            'bounce': {
                eventMap: {
                    'bounce': cdk.aws_ses.EmailSendingEvent.BOUNCE,
                }
            },
            'metrics': {
                eventMap: {
                    'open': cdk.aws_ses.EmailSendingEvent.OPEN,
                    'click': cdk.aws_ses.EmailSendingEvent.CLICK,
                },
            },
            'complaint': {
                eventMap: {
                    'complaint': cdk.aws_ses.EmailSendingEvent.COMPLAINT,
                }
            },
            'subscriptions': {
                eventMap: {
                    'subscription': cdk.aws_ses.EmailSendingEvent.SUBSCRIPTION,
                }
            },
        }

/*
        Object.keys(sesConfigSetMappings).forEach((key) => {
            //1. Create a new SES Configuration set based on the Key name
            const sesConfigSet = new cdk.aws_ses.ConfigurationSet(this, `${PREFIX}${key}ConfigSet`, {
                configurationSetName: `${PREFIX}${key}`,
            })

            //2. Create a new SNS Topic for each event based on the eventMaps key name.
            Object.keys(sesConfigSetMappings[key].eventMap).forEach((eventKey) => {

                // console.log(`\nCreating SNS Topic: ${eventKey}Topic`)

                const snsTopic = new cdk.aws_sns.Topic(this, `${PREFIX}${eventKey}Topic`, {
                    topicName: `${PREFIX}${eventKey}Topic`,
                })

                new cdk.aws_sns.Subscription(this, `${PREFIX}${eventKey}Subscription`, {
                    topic: snsTopic,
                    protocol: cdk.aws_sns.SubscriptionProtocol.EMAIL,
                    endpoint: `xxx@gmail.com`,
                })

                // console.log(`Adding the ${sesConfigSetMappings[key].eventMap[eventKey]} event to the ${key}ConfigSet`)

                //3. Add the event destination based on eventMap key value pairs
                sesConfigSet.addEventDestination(sesConfigSetMappings[key].eventMap[eventKey], {
                    destination: {
                        topic: snsTopic,
                    },
                    events: [sesConfigSetMappings[key].eventMap[eventKey]],
                })
            })

        })
*/
        if (AC.startsWith('P')) {

            const importedHostedZone = cdk.aws_route53.PublicHostedZone.fromPublicHostedZoneAttributes(this, 'hostedZone', {
                hostedZoneId: 'xxxx',
                zoneName: props!.envVars.DOMAINNAME,
            })

            // By Creating a domain we dont have to verify every email address
            new cdk.aws_ses.EmailIdentity(this, `SeSEmailID`, {
                identity: cdk.aws_ses.Identity.publicHostedZone(importedHostedZone),
                feedbackForwarding: true,
            })
        }

        // let html = fs.readFileSync((`${join()}/templates/out/${PREFIX}AssignmentTemplate.html`), 'utf8')
        // const assignmentTemplate = new cdk.aws_ses.CfnTemplate(this, 'Template', {
        //     template: {
        //         templateName: `${PREFIX}Template`,
        //         subjectPart: 'null',
        //         htmlPart: html,
        //         textPart: `Hello, Please Login to https://${props.envVars.FQDN} to find out more.`
        //     },
        // })
    }

}