# Post-hack polish

- [X] Fix Maurice's commits
- [ ] Check deployment
- [ ] Tidy up branches
- [ ] API 500 error should not result in infinite spinner

### Tidy up branches
Claude's survey:
```
Branch Survey (35 local branches, all mirrored on origin)

Branches ahead of main (7)

┌────────────────────────┬───────┬────────┬───────────────────────────────────────────┐
│         Branch         │ Ahead │ Behind │               What's ahead                │
├────────────────────────┼───────┼────────┼───────────────────────────────────────────┤
│ anthropic-backend      │ 1     │ 7      │ Attempted Anthropic backend integration   │
├────────────────────────┼───────┼────────┼───────────────────────────────────────────┤
│ deploy-listennotes-cli │ 3     │ 133    │ Deployment setup for the listennotes CLI  │
│                        │       │        │ tool                                      │
├────────────────────────┼───────┼────────┼───────────────────────────────────────────┤
│ feature/mock-service   │ 1     │ 124    │ Added a mock service                      │
├────────────────────────┼───────┼────────┼───────────────────────────────────────────┤
│                        │       │        │ Reduced sandbox timeout to 20s, better    │
│ fix-basics             │ 3     │ 29     │ error messages on agent timeout, fixed    │
│                        │       │        │ podcast-search bash tool prompt           │
├────────────────────────┼───────┼────────┼───────────────────────────────────────────┤
│ truly-two-way          │ 1     │ 30     │ Sends listening context to the agent when │
│                        │       │        │  the user submits a query                 │
├────────────────────────┼───────┼────────┼───────────────────────────────────────────┤
│ visual-identity        │ 1     │ 18     │ Added a powered-by logo strip below the   │
│                        │       │        │ homepage input                            │
├────────────────────────┼───────┼────────┼───────────────────────────────────────────┤
│                        │       │        │ Added a Voxtral transcription CLI,        │
│ voxtral-cli            │ 3     │ 32     │ switched from Bedrock to Mistral native   │
│                        │       │        │ API, capped transcription at ~5 min       │
└────────────────────────┴───────┴────────┴───────────────────────────────────────────┘

Branches only behind main (28)

Most are significantly behind (50-165 commits), suggesting they were feature branches
from earlier development that were either merged via squash/rebase or abandoned. Notable
ones that are only slightly behind: frozen-hack-demo (13 behind), fix/ollie-demo-items
(11 behind), and tts-by-vibe (29 behind).

Key takeaway

The 7 ahead branches contain unmerged work. fix-basics and voxtral-cli have the most
substantive unmerged changes. The remaining 28 branches are stale — candidates for
cleanup.
```

Goal should be to ensure that useful changes are merged and stale branches are deleted.

### API 500 error should not result in infinite spinner

In the following state the UI just shows the Thinking spinner instead of a definite error.

```
GET /app 200 in 7ms (compile: 4ms, render: 3ms)
Error submitting query: [Error [TimeoutError]: The operation timed out.] {
 code: 23,
 INDEX_SIZE_ERR: 1,
 DOMSTRING_SIZE_ERR: 2,
 HIERARCHY_REQUEST_ERR: 3,
 WRONG_DOCUMENT_ERR: 4,
 INVALID_CHARACTER_ERR: 5,
 NO_DATA_ALLOWED_ERR: 6,
 NO_MODIFICATION_ALLOWED_ERR: 7,
 NOT_FOUND_ERR: 8,
 NOT_SUPPORTED_ERR: 9,
 INUSE_ATTRIBUTE_ERR: 10,
 INVALID_STATE_ERR: 11,
 SYNTAX_ERR: 12,
 INVALID_MODIFICATION_ERR: 13,
 NAMESPACE_ERR: 14,
 INVALID_ACCESS_ERR: 15,
 VALIDATION_ERR: 16,
 TYPE_MISMATCH_ERR: 17,
 SECURITY_ERR: 18,
 NETWORK_ERR: 19,
 ABORT_ERR: 20,
 URL_MISMATCH_ERR: 21,
 QUOTA_EXCEEDED_ERR: 22,
 TIMEOUT_ERR: 23,
 INVALID_NODE_TYPE_ERR: 24,
 DATA_CLONE_ERR: 25
}
POST /api/query 500 in 15.0s (compile: 1425µs, render: 15.0s)
```
