
# Snowflake Agent API 

To get started navigate to the [Quickstart](https://quickstarts.snowflake.com/guide/getting_started_with_snowflake_agents_api_and_react/index.html)

To run this project, you will need to add the following environment variables to your .env file. \
Create an `.env` file in the root folder and then put the below keys in:

**Agent API parameters:**

`NEXT_PUBLIC_SNOWFLAKE_URL`
- Example: https://<account_details>.snowflakecomputing.com

`NEXT_PUBLIC_SEMANTIC_MODEL_PATH`
- Example: @<stage_name>/<semantic_model_name>.yaml

`NEXT_PUBLIC_SEARCH_SERVICE_PATH`
- Example: DATABASE.SCHEMA.SAMPLE_SEARCH_SERVICE

**Authentication:**

`SNOWFLAKE_ACCOUNT`
- Your account name only

`SNOWFLAKE_USER`
- User name only

`SNOWFLAKE_RSA_KEY`
- Private RSA Key for JWT token gen
- Alternatively, you can skip this env var and set a `rsa_key.p8` in the root folder only if you are running locally

`SNOWFLAKE_RSA_PASSPHRASE`
- Passphrase for RSA Key if it was encrypted.

**UI Rendering Props:**

Optionally, you can set an array of suggested queries you want for the initial load of the UI. If not specified, will default to below example:

`NEXT_PUBLIC_SUGGESTED_QUERIES=["How many claims are currently open? How many are \$10K or higher?","Create a chart from repair invoices by zipcodes for Austin.  Are there certain areas with higher repair charges?","List appraisal clauses related to snowmobiles across all our contracts?","Rental car"]`


---

If you haven't installed pnpm via npm or brew, run:

`npm i -g pnpm` or `brew install pnpm`

Install dependencies

```bash
  pnpm i
```

Start the app 

```bash
  pnpm dev
```

The app should be running on `http://localhost:3000`


## Enabling data2answer / data2chart tool for Agent API (Private Preview as of March 3rd 2025)

The data2answer / chart tool is in PrPr and disabled by default in the chatbot

In order to enable, follow these steps:

First, enable these parameters for your Snowflake account:

`ENABLE_DATA_TO_ANSWER` (controls core feature)

Then enable these two parameters:

`COPILOT_ORCHESTRATOR_PARAM_10` (enables data2answer)

`COPILOT_ORCHESTRATOR_PARAM_13` (enables data2chart)

Once you've flipped these params to enabled, add this variable to your .env file

`NEXT_PUBLIC_DATA_2_ANSWER_ENABLED=true`

Restart your app, then Cortex Analyst answers will now include data2answer and / or data2chart responses after the SQL query and table response.
Refer to `useAgentApiQuery` hook for more details



## For Agent API Integration to your app

Bulk of the logic is in `@/lib/agent-api`

In `page.tsx`, there's an example hook `useAgentApiQuery` built to handle Agent API and return state, history of messages, and `handleNewMessage` function to send a new message

The states returned from this hook is then rendered in the downstack components accordingly