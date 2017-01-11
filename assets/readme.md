# Hull + Slack

This Ship adds a Bot (@hull) to your Slack Team. The Bot can:

- Notify you when customers enter or leave specific segments and perform certain events.
- Retreive the entire set of data for any customer just by typing his email or his name.
- Add buttons that set values (like `send_emails` for instance) on a given user, opening the door to incredibly powerful control over your entire Stack in one click.

####  To install:

- Click the "Connect to Slack" button on the Dashboard page,
- Authorize Slack to access your account.

#### Usage

To get in-app help, invite it to a channel or start a conversation and type `@hull help`.

The bot can fetch information for a customer from his/her email, or his/her name, and display the latest events and all his/her properties.

#### Posting in Channels

Like a vampire, your bot needs to be invited in a channel to be able to post to it.
to do so, just type:  `/invite @hull` from the channel.

#### Conversations

- `@hull user@example.com`

> get data for the user with this email. You can filter what's displayed from the Ship's settings tab in your dashboard_

- `@hull user@example.com full` 

> get full data for the user with this email. Shows the entire profile_

- `@hull user@example.com <intercom>` 

> get `intercom` data for the user with this email. Replace with the service you want to display

- `@hull events user@example.com` 

> get latest events for the user with this email_


- `@hull help`

> Here to help!

#### Buttons

In the Slack Ship settings screen, you can add up to 3 buttons that will set a value on the User. You can use this to create `Enable Emails` and `Disable Emails` toggles for instance.
