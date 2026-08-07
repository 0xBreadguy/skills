# Device Authorization Handoff

Read this file completely before starting device authentication for `login`,
`create-key`, or `revoke`, or before presenting any device-auth QR or link. Use
the authorization-flow selection rules in `SKILL.md` before applying this
procedure.

Device auth polls the wallet API with PKCE until the wallet approves, rejects,
or lets the request expire. Human output prints a terminal QR for the
backend-supplied `verificationUriComplete`, including in a chat shell or other
non-TTY stream, and always provides the URL, user code, direct link, and expiry.
`--json` and `--terse` omit the terminal QR.

## Required execution order

The user cannot approve device auth until the handoff is visible. Treat the
handoff as a prerequisite, not a summary to provide after the command finishes:

1. In text chat, never invoke `mega moss ... --auth-flow device` directly as a
   foreground shell/tool call. Start it asynchronously in one persistent
   execution session that yields control while the process remains alive. The
   asynchronous boundary must be the execution tool call itself when the tool
   has a native background/session facility. Enable that facility on the tool
   invocation and retain the returned task or session ID. Do not simulate it
   with `setsid`, `nohup`, `disown`, or a trailing shell `&` inside a foreground
   tool call; a host may keep tracking descendants and withhold control.
2. Start the complete `mega moss ... --auth-flow device` command exactly once.
   If its launch does not return control, terminate that request when possible
   and report the limitation. Never create a second authorization merely
   because the first process is inaccessible.
3. Inspect the session output immediately. Continue reading based on output
   readiness until `Waiting for approval...` marks the end of a complete static
   prompt containing the QR plus the URL, user code, direct link, and expiry.
   Never use one blind fixed delay to guess when the prompt is ready. A short
   delay inside a bounded loop is acceptable only when every iteration checks
   the output marker and the completion/status file.
4. While the CLI is still polling, send the complete handoff in an
   assistant-visible message using the presentation rules below. Raw tool
   output, a background log, or a local file path is not user-visible chat.
5. Only after the user-visible message has been sent, resume waiting through
   that same native task/session facility for approval, rejection, or expiry.
   Use its completion event or exit status as authoritative. Do not start a new
   foreground shell loop using `kill -0`, guessed `grep` patterns, or sleeps to
   watch a native background task; such a loop can stall after the task has
   already finished. Never wait for `Waiting for approval...` to disappear from
   captured output; the CLI output is append-only and retains that line after
   completion.

A URL or QR first presented after approval or command completion is too late
and is not a successful device-auth handoff. The printable `Code:` field is the
user code. Never expose the backend device code, PKCE verifier, or other private
authorization material.

Use the native mechanism exposed by the agent's execution environment:

- In Claude Code, invoke the Bash tool with `run_in_background: true`, call
  `TaskOutput` with `block: false` to read the prompt without waiting for
  authorization, then call `TaskOutput` with `block: true` on the same task ID
  after the handoff is visible.
- In Codex, configure the execution call to yield promptly, retain the returned
  live session ID, and poll that same session for prompt and completion output.
- In another environment, use its equivalent native background task or
  persistent-session facility.

These are execution-tool options, not flags or shell syntax to append to the
`mega moss` command. The initial tool invocation must return while the original
authorization process is still waiting.

If the execution tool has no persistent-session mode, the equivalent portable
shell sequence below is permitted only after confirming that its foreground
tool call really returns while the child remains alive. If the host continues
tracking descendants, do not use this fallback and do not start device auth;
give the user the exact local command instead. If that behavior is unknown,
verify it with a harmless non-auth process rather than by creating an
authorization request.

The portable sequence is:

1. Create a private temporary directory and mode-`0600` output/status files.
2. Launch the complete `mega moss ... --auth-flow device` command once inside a
   background supervisor with both output streams redirected to the output
   file. After `mega moss` exits, the supervisor must write its exit status to a
   temporary file and atomically rename that file to the final completion path.
3. In that same tool call, use a bounded condition loop that returns as soon as
   the output contains `Waiting for approval...`, or fails if the child exits
   first according to the completion file. Do not wait a fixed number of
   seconds and then read the output file once.
4. Read only the completed static prompt, return control to the agent, and send
   it in assistant-visible chat.
5. In a later tool call, wait for the completion file, read the recorded exit
   status and final output, then remove the temporary files. Never use
   `kill -0` alone to detect completion: an exited background child can remain
   as a zombie and keep that check true indefinitely.

The launch/readiness tool call must finish before the authorization process.
The assistant message must occur between that readiness return and the later
completion wait.

## Text chat uses the terminal QR

For any text-capable chat, run device auth in human mode. Do not pass `--json`,
`--terse`, or `--qr-file`: all three prevent the CLI from emitting the terminal
QR. This is the standard agent handoff, including in non-TTY chat shells.

`--terse` means compact tab-delimited final output. It is not a headless, chat,
or QR-presentation mode. On device-auth commands, it suppresses the terminal QR
just like `--json`, while the direct link, code, and expiry remain on stderr.

Introduce every visible device-auth QR with exactly:

> Scan this QR code or open this link in a browser where your wallet is
> available.

Capture the complete static prompt before presenting any part of it. Strip ANSI
escape sequences and carriage returns, preserve every remaining space and line
break, and exclude polling or status lines. Present the neutral instruction and
QR once in a single fenced `text` block. Never forward partial QR chunks or
interleave “Waiting for approval” output. The chat client may still paint the
completed block progressively; the agent cannot guarantee atomic rendering.

After a QR presentation, repeat the CLI-supplied direct link as a clickable
link and include the user code and expiry outside the fenced block or image so
the user always has a reliable fallback.

## Advanced host image integration

Do not choose `--qr-file` autonomously. Use it only when the user or host
integration explicitly requests a PNG and a real attachment or display API has
already been verified. Shell access, the ability to create or read a file, and
a printed local path are not image-attachment capability. The CLI only creates
the file; it does not display or attach it.

For an explicit verified integration, choose a fresh absolute `.png` path and
add `--qr-file <absolute-path.png>`. Use the host API to attach or display that
PNG as one image, introduce the visible image with the neutral instruction
above, then show the clickable direct link, code, and expiry. Do not add
`--terse` merely because `--qr-file` is present; select the final output format
separately.

## Link-only fallback

If the interface cannot preserve preformatted text or terminal QR rendering
fails, provide only the direct link, code, and expiry. Use `--json` or `--terse`
when terminal QR suppression is intentional, write “Open this link in a browser
where your wallet is available,” and do not claim that a QR was shown. If the
user explicitly required a visible QR and no presentation channel works, state
that limitation instead of treating a local PNG path as success.

## Keep the request alive

Run the command in one persistent live execution session that streams stderr.
Configure that session to return initial output promptly instead of blocking
until process exit. Include every normal argument required by the command and
keep polling the same session until approval, rejection, or expiry. Poll based
on output or process state, never with a blind fixed sleep. Do not start another
authorization merely because the handoff has been presented.

Do not reuse old authorization URLs or edit their query parameters. If a
request expires or is interrupted, start one fresh request and use only its new
URL and code. Follow the shared rejection guidance in `SKILL.md` when the wallet
returns an actionable reason.

## Protect and clean up the QR

Never reflow a Unicode QR or present it until the complete static block has been
captured. Strip only ANSI escape sequences and carriage returns; preserve all
other whitespace exactly. Never reconstruct the QR or send its complete URL to
an external QR service.

`--qr-file` requires `--auth-flow device`. An explicit host integration may
combine it with `--json` or `--terse` because the auth prompt and path remain on
stderr, but neither mode displays the PNG and both suppress the terminal QR. It
writes a temporary mode-`0600` PNG containing only the soon-expired complete
verification URL. The CLI removes it when authorization ends normally. After a
forced termination, delete the PNG if it remains.
