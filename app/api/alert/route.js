import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { ticker, divergence, hype, fundamentals, webhookUrl } = body;

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    const divNum = Number(divergence ?? 0);
    const hypeNum = Number(hype ?? 0);
    const fundNum = Number(fundamentals ?? 0);

    const isDiscord = webhookUrl && webhookUrl.includes('discord.com/api/webhooks');
    const isSlack = webhookUrl && webhookUrl.includes('hooks.slack.com') || (webhookUrl && webhookUrl.includes('slack.com'));

    let alertSent = false;
    let targetChannel = 'None';
    let responseText = '';

    if (webhookUrl) {
      try {
        let payload = {};

        if (isDiscord) {
          targetChannel = 'Discord Webhook';
          // Custom beautiful Discord embed card
          payload = {
            username: 'petals market polygraph',
            avatar_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=128&q=80',
            embeds: [
              {
                title: `🚨 Telemetry Alert: $${ticker.toUpperCase()}`,
                description: `A critical narrative divergence has been triggered for **$${ticker.toUpperCase()}**.`,
                color: divNum > 0 ? 0xc97880 : 0x7ac0c0, // Rose pink or Cyan-blue
                fields: [
                  {
                    name: 'Divergence Delta',
                    value: `\`${divNum > 0 ? '+' : ''}${divNum}\` points`,
                    inline: true
                  },
                  {
                    name: 'Reddit Hype',
                    value: `${hypeNum}/100`,
                    inline: true
                  },
                  {
                    name: 'Market Tape',
                    value: `${fundNum}/100`,
                    inline: true
                  },
                  {
                    name: 'Telemetry Diagnosis',
                    value: divNum > 0 
                      ? 'Social narrative volume runs far ahead of actual trading tape volume and price indices.' 
                      : 'Market tape prints heavy buying/selling activity with minimal social retail chatter.',
                    inline: false
                  }
                ],
                footer: {
                  text: 'petals Market Polygraph · closed-loop automation'
                },
                timestamp: new Date().toISOString()
              }
            ]
          };
        } else if (isSlack) {
          targetChannel = 'Slack Webhook';
          // Structured Slack block layout
          payload = {
            text: `🚨 *petals Telemetry Alert: $${ticker.toUpperCase()}*`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `🚨 *petals Narrative-Gap Telemetry Alert: $${ticker.toUpperCase()}*`
                }
              },
              {
                type: 'section',
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `*Divergence Delta:*\n${divNum > 0 ? '+' : ''}${divNum} points`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Reddit Hype:*\n${hypeNum}/100`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Market Tape:*\n${fundNum}/100`
                  },
                  {
                    type: 'mrkdwn',
                    text: `*System Verdict:*\n${divNum > 0 ? 'Narrative Overload' : 'Quiet Momentum'}`
                  }
                ]
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `petals Market Polygraph · Timestamp: ${new Date().toLocaleTimeString()}`
                  }
                ]
              }
            ]
          };
        } else {
          targetChannel = 'Generic Webhook';
          payload = {
            ticker,
            divergence: divNum,
            hype: hypeNum,
            fundamentals: fundNum,
            timestamp: new Date().toISOString()
          };
        }

        // Send real HTTP POST request to webhook url
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          alertSent = true;
          responseText = 'Successfully dispatched post to webhook.';
        } else {
          responseText = `Failed to post to webhook (status ${res.status})`;
        }
      } catch (err) {
        console.error('Failed to post to webhook:', err.message);
        responseText = `Connection failed: ${err.message}`;
      }
    }

    // Call simulated Wire task execution (mocking the POST /v1/wire/task catalog action)
    let wireTaskStatus = 'simulated';
    let wireTaskMessage = 'Wire action dispatched to notification channel catalog.';
    
    // Simulate Wire execution
    if (!alertSent) {
      wireTaskStatus = 'completed';
      wireTaskMessage = `[Simulation] Wire task executed. Post card generated for $${ticker}. Target: ${webhookUrl ? webhookUrl : 'Default Mock Webhook'}`;
    }

    return NextResponse.json({
      ticker,
      divergence: divNum,
      alertSent,
      targetChannel,
      responseText,
      wireTask: {
        status: wireTaskStatus,
        message: wireTaskMessage,
        action_id: 'act_wire_notification_dispatch'
      }
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
