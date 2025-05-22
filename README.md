# Getting Started with Snowflake Cortex Agents API and React

## Overview

In this quickstart, you'll learn how to leverage Snowflake's Cortex Agents to orchestrate across both structured and unstructured data sources to deliver insights. This guide walks you through building a complete, functional chatbot application with Next.js that demonstrates the Cortex Agent API in action, combining Cortex Analyst for structured data queries and Cortex Search for unstructured data insights, along with LLMs for natural language understanding.

## Step-By-Step Guide

For prerequisites, environment setup, step-by-step guide and instructions, please refer to the [QuickStart Guide](https://quickstarts.snowflake.com/guide/getting_started_with_snowflake_agents_api_and_react/index.html?index=..%2F..index#0).

## Running this App from within SPCS

This version of the Quickstart can be run on Snowpark Container Services, rather than locally. To necessitate this, there has been changes to the code to seperate the services in to a frontend, and a backend. This removes CORS limitations

For this to run in SPCS, a few extra steps need to be conducted to set up the image registry, push the images to Snowflake, and create a Service.

1. We first need to create a role that will own this service. The service's owner role cannot be any of the privileged roles, such as ACCOUNTADMIN and SECURITYADMIN. Go to setup.sql and run in a worksheet up until "END of PART 1".

2. Push the images to the image repository. To do that, we need to first authenticate using snowcli, then build and push the frontend and backend

snow spcs image-registry login

docker buildx build --platform linux/amd64 -t {Host Name}.registry.snowflakecomputing.com/insurancedb/data/cortex_react_repo/cortex_chat_frontend:latest -f frontend/Dockerfile.frontend frontend --push

docker buildx build --platform linux/amd64 -t {Host Name}.registry.snowflakecomputing.com/insurancedb/data/cortex_react_repo/cortex_chat_backtend:latest -f backend/Dockerfile.backend backend --push

3. Return to setup.sql to create the service in SPCS
