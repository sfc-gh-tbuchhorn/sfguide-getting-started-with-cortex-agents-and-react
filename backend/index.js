import express from 'express';
import { readFile } from 'fs/promises';
import fetch from 'node-fetch';

const {
    SNOWFLAKE_HOST,          // full Snowflake host
    SEARCH_SERVICE_PATH,     // e.g. INSURANCEDB.DATA.SUPPORT_DOCS_SEARCH
    SEMANTIC_MODEL_PATH,     // e.g. @INSURANCEDB.DATA.CLAIM_STORAGE/customer_semantic_model.yaml
    WAREHOUSE_NAME,
    MODEL_NAME              // e.g. llama3.1-70b
  } = process.env;

const app = express();
app.use(express.json());

/* ---- helper: add search_service & semantic model ---- */
function enrichBody(original) {
    const body = { ...original };
    if (!body.tool_resources) body.tool_resources = {};
  
    // Always set model name, using environment variable or default
    body.model = MODEL_NAME || 'llama3.1-70b';

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
    console.log('[proxy] Original request body:', JSON.stringify(req.body, null, 2));
    console.log('[proxy] Enriched request body:', JSON.stringify(bodyToSend, null, 2));
    console.log('[proxy] MODEL_NAME from env:', process.env.MODEL_NAME);

    const cortexRes = await fetch(`https://${process.env.SNOWFLAKE_HOST}/api/v2/cortex/agent:run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'User-Agent': 'SCS-Proxy/1.0',
        'X-Snowflake-Authorization-Token-Type': 'OAUTH'
      },
      body: JSON.stringify(enrichBody(req.body)),
    });

    // 🔽  New: if Snowflake returns 400/403/422 etc, log the body and forward it.
    if (!cortexRes.ok) {
        const errText = await cortexRes.text();
        console.error('Cortex error', cortexRes.status, errText);
        return res.status(cortexRes.status).json({ error: errText });
  }
    res.status(cortexRes.status);
    res.setHeader('Content-Type', 'text/event-stream');

/* ---- BEGIN ROBUST SSE LOGGER ---- */
  {
    let buffer = '';
  
    cortexRes.body.on('data', chunk => {
      buffer += chunk.toString();        // append new data
  
      // An SSE event ends with a blank line (\n\n)
      const blocks = buffer.split('\n\n');
  
      // Keep the last (possibly incomplete) block in buffer
      buffer = blocks.pop();
  
      blocks.forEach(block => {
        const trimmed = block.trim();
        if (!trimmed) return;                        // empty heartbeat
  
        // Remove leading colon (comment) or "event:" line if present
        const noComments = trimmed
          .split('\n')
          .filter(l => !l.startsWith(':') && !l.startsWith('event:'))
          .join('\n');
  
        // Extract payload: line that starts with "data:" or whole block
        const payloadLine = noComments.startsWith('data:')
          ? noComments.slice(5).trim()
          : noComments.trim();
  
        if (!payloadLine) return;
        if (payloadLine === '[DONE]') {
          console.log('[SSE] [DONE]');
          return;
        }
  
        let evt;
        try {
          evt = JSON.parse(payloadLine);
        } catch (e) {
          console.error('[SSE] JSON parse error', e, payloadLine);
          return;
        }
  
        (evt.delta?.content || []).forEach(c => {
          switch (c.type) {
            case 'tool_use':
              console.log('[SSE] tool_use →', c.tool_use?.name);
              break;
            case 'tool_results':
              console.log('[SSE] tool_results →',
                          c.tool_results?.tool_use_id ||
                          c.tool_results?.name);
              break;
            case 'chart':
              console.log('[SSE] chart');
              break;
            case 'table':
              console.log('[SSE] table');
              break;
            case 'text':
              console.log('[SSE] text');
              break;
            default:
              console.log('[SSE] unknown', JSON.stringify(c));
          }
        });
      });
    });
  }
  /* ---- END ROBUST SSE LOGGER ---- */
  
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

    // 🔍 log payload we're about to send
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