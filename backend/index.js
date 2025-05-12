import express from 'express';
import { readFile } from 'fs/promises';
import fetch from 'node-fetch';

const {
    SNOWFLAKE_HOST,          // full Snowflake host
    SEARCH_SERVICE_PATH,     // e.g. INSURANCEDB.DATA.SUPPORT_DOCS_SEARCH
    SEMANTIC_MODEL_PATH,     // e.g. @INSURANCEDB.DATA.CLAIM_STORAGE/customer_semantic_model.yaml
    WAREHOUSE_NAME
  } = process.env;

const app = express();
app.use(express.json());

/* ---- helper: add search_service & semantic model ---- */
function enrichBody(original) {
    const body = { ...original };
    if (!body.tool_resources) body.tool_resources = {};
  
    if (SEARCH_SERVICE_PATH) {
      const search1 = body.tool_resources.search1 ?? {};
      body.tool_resources.search1 = {
        ...search1,
        search_service: SEARCH_SERVICE_PATH,
        max_results: search1.max_results ?? 10,
      };
    }

    /* ------ analyst semantic‑model path ------ */
    if (SEMANTIC_MODEL_PATH) {
      const analyst1 = body.tool_resources.analyst1 ?? {};
      body.tool_resources.analyst1 = {
        ...analyst1,
        semantic_model_file: SEMANTIC_MODEL_PATH,
      };
    }
    return body;
  }

app.post('/agent', async (req, res) => {
  try {
    const token = await readFile('/snowflake/session/token', 'utf-8');

    // 🔍 Log the request we are about to forward to Snowflake
    const bodyToSend = enrichBody(req.body);
    console.log('[proxy] /agent → Snowflake payload:', JSON.stringify(bodyToSend, null, 2));

    const cortexRes = await fetch(`https://${process.env.SNOWFLAKE_HOST}/api/v2/cortex/agent:run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify(enrichBody(req.body)),
    });

    // 🔽  New: if Snowflake returns 400/403/422 etc, log the body and forward it.
    if (!cortexRes.ok) {
        const errText = await cortexRes.text();
        console.error('Cortex error', cortexRes.status, errText);
        return res.status(cortexRes.status).json({ error: errText });
  }
    res.status(cortexRes.status);
    res.setHeader('Content-Type', 'text/event-stream');
    cortexRes.body.pipe(res);
  } catch (error) {
    console.error('Proxy error (agent):', error);
    res.status(500).json({ error: 'Failed to stream from Cortex agent' });
  }
});

app.post('/statements', async (req, res) => {
  try {
    const token = await readFile('/snowflake/session/token', 'utf-8');

    const warehouse = WAREHOUSE_NAME || DEFAULT_WAREHOUSE;
    if (!warehouse) {
      console.warn('[proxy] WAREHOUSE_NAME env var is missing; Snowflake will reject the request.');
    }
    // merge warehouse if caller didn't supply one
    const bodyToSend = {
        warehouse,
        ...req.body,
        };

    // 🔍 log payload we’re about to send
    console.log('[proxy] /statements payload:', JSON.stringify(req.body, null, 2));

    const sqlRes = await fetch(`https://${process.env.SNOWFLAKE_HOST}/api/v2/statements`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'SCS-Proxy/1.0',
        'X-Snowflake-Authorization-Token-Type': 'OAUTH'
      },
      body: JSON.stringify(bodyToSend),
    });

        if (!sqlRes.ok) {
              const errText = await sqlRes.text();
              console.error('Statements error', sqlRes.status, errText);
              return res.status(sqlRes.status).json({ error: errText });
            }

    const data = await sqlRes.json();
    res.status(sqlRes.status).json(data);
  } catch (error) {
    console.error('Proxy error (statements):', error);
    res.status(500).json({ error: 'Failed to call SQL statements API' });
  }
});

app.listen(3001, () => console.log('Proxy backend listening on port 3001'));